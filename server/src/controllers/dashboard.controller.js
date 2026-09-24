import { BOOKING_STATUS, CLOSED_STAGES, LEAD_STAGES, ROLES } from '../constants.js';
import { Booking, Lead, Project, Unit, User } from '../models/index.js';
import { BOOKING_POPULATE } from '../services/booking.service.js';
import { isAdmin, leadScope } from '../services/lead.service.js';
import { daysAgo, getDayBounds, startOfMonth } from '../utils/dates.js';
import { bookingScope } from './booking.controller.js';

const sumBookings = (match) =>
  Booking.aggregate([
    { $match: match },
    { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$agreedPrice' } } },
  ]).then(([row]) => ({ count: row?.count ?? 0, value: row?.value ?? 0 }));

/** Per-person workload for admins: open leads, overdue follow-ups and bookings. */
async function teamPerformance(todayStart) {
  const openAssigned = { stage: { $nin: CLOSED_STAGES }, assignedTo: { $ne: null } };
  const countByAssignee = (match) =>
    Lead.aggregate([{ $match: match }, { $group: { _id: '$assignedTo', count: { $sum: 1 } } }]);

  const [people, openRows, overdueRows, bookingRows] = await Promise.all([
    User.find({ role: ROLES.SALES, isActive: true }).select('name').lean(),
    countByAssignee(openAssigned),
    countByAssignee({ ...openAssigned, nextFollowUpAt: { $lt: todayStart } }),
    Booking.aggregate([
      { $match: { status: BOOKING_STATUS.CONFIRMED } },
      { $group: { _id: '$salesOwner', bookings: { $sum: 1 }, value: { $sum: '$agreedPrice' } } },
    ]),
  ]);

  const toMap = (rows) => new Map(rows.map((row) => [String(row._id), row]));
  const open = toMap(openRows);
  const overdue = toMap(overdueRows);
  const bookings = toMap(bookingRows);

  return people
    .map((person) => {
      const id = String(person._id);
      return {
        _id: person._id,
        name: person.name,
        openLeads: open.get(id)?.count ?? 0,
        overdue: overdue.get(id)?.count ?? 0,
        bookings: bookings.get(id)?.bookings ?? 0,
        value: bookings.get(id)?.value ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value || b.openLeads - a.openLeads);
}

async function inventoryByProject() {
  const [rows, projects] = await Promise.all([
    Unit.aggregate([{ $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } }]),
    Project.find().select('name city').lean(),
  ]);

  const byProject = new Map(
    projects.map((p) => [String(p._id), { _id: p._id, name: p.name, city: p.city, available: 0, booked: 0, blocked: 0 }]),
  );
  const totals = { available: 0, booked: 0, blocked: 0 };

  for (const { _id, count } of rows) {
    totals[_id.status] += count;
    const project = byProject.get(String(_id.project));
    if (project) project[_id.status] = count;
  }

  return { totals, projects: [...byProject.values()] };
}

export async function getDashboard(req, res) {
  const user = req.user;
  const admin = isAdmin(user);
  const scope = leadScope(user);
  const { start, end } = getDayBounds(req.tzOffset);
  const open = { stage: { $nin: CLOSED_STAGES } };
  const bookingFilter = { ...(await bookingScope(user)), status: BOOKING_STATUS.CONFIRMED };

  const [
    stageRows,
    newThisWeek,
    overdueCount,
    dueTodayCount,
    followUps,
    bookingsAllTime,
    bookingsThisMonth,
    recentBookings,
    inventory,
    team,
    noFollowUp,
    unassignedLeads,
  ] = await Promise.all([
    Lead.aggregate([{ $match: scope }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Lead.countDocuments({ ...scope, createdAt: { $gte: daysAgo(7) } }),
    Lead.countDocuments({ ...scope, ...open, nextFollowUpAt: { $lt: start } }),
    Lead.countDocuments({ ...scope, ...open, nextFollowUpAt: { $gte: start, $lt: end } }),
    Lead.find({ ...scope, ...open, nextFollowUpAt: { $ne: null, $lt: end } })
      .sort({ nextFollowUpAt: 1 })
      .limit(8)
      .select('name phone stage nextFollowUpAt assignedTo')
      .populate('assignedTo', 'name'),
    sumBookings(bookingFilter),
    sumBookings({ ...bookingFilter, createdAt: { $gte: startOfMonth(req.tzOffset) } }),
    Booking.find(bookingFilter).sort({ createdAt: -1 }).limit(5).populate(BOOKING_POPULATE),
    inventoryByProject(),
    admin ? teamPerformance(start) : null,
    // Open leads with no next step are the ones that quietly go cold.
    Lead.countDocuments({ ...scope, ...open, nextFollowUpAt: null }),
    // New enquiries nobody owns yet: only admins can act on these.
    admin ? Lead.countDocuments({ ...open, assignedTo: null }) : null,
  ]);

  const counts = Object.fromEntries(stageRows.map(({ _id, count }) => [_id, count]));
  const pipeline = LEAD_STAGES.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
  const totalLeads = pipeline.reduce((sum, row) => sum + row.count, 0);
  const openLeads = pipeline
    .filter((row) => !CLOSED_STAGES.includes(row.stage))
    .reduce((sum, row) => sum + row.count, 0);
  const closedLeads = (counts.Booked ?? 0) + (counts.Lost ?? 0);

  res.json({
    summary: {
      totalLeads,
      openLeads,
      newThisWeek,
      overdueFollowUps: overdueCount,
      followUpsToday: dueTodayCount,
      noFollowUp,
      unassignedLeads,
      bookings: bookingsAllTime,
      bookingsThisMonth,
      // Win rate among leads that reached a decision (Booked vs Lost).
      winRate: closedLeads ? Math.round(((counts.Booked ?? 0) / closedLeads) * 100) : null,
    },
    pipeline,
    followUps,
    recentBookings,
    inventory,
    team,
  });
}
