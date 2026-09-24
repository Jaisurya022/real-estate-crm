/**
 * Fills the database with realistic demo data.
 *
 *   npm run seed
 *
 * WARNING: clears the existing users, leads, properties and bookings first.
 */
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import {
  Activity,
  Booking,
  Building,
  Lead,
  Project,
  Unit,
  User,
} from '../src/models/index.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (offsetMs) => new Date(now + offsetMs);

const DEMO_PASSWORDS = { admin: 'Admin@123', sales: 'Sales@123' };

async function seedUsers() {
  const [adminHash, salesHash] = await Promise.all([
    User.hashPassword(DEMO_PASSWORDS.admin),
    User.hashPassword(DEMO_PASSWORDS.sales),
  ]);

  const [admin, arjun, priya, rahul] = await User.create([
    { name: 'Meera Iyer', email: 'admin@plotline.dev', password: adminHash, role: 'admin' },
    { name: 'Arjun Mehta', email: 'arjun@plotline.dev', password: salesHash, role: 'sales' },
    { name: 'Priya Nair', email: 'priya@plotline.dev', password: salesHash, role: 'sales' },
    { name: 'Rahul Verma', email: 'rahul@plotline.dev', password: salesHash, role: 'sales' },
  ]);
  return { admin, sales: [arjun, priya, rahul] };
}

/** Builds a tower's units: `layout` describes each position on a floor. */
function towerUnits({ project, building, floors, layout, startFloor = 1 }) {
  const units = [];
  for (let floor = startFloor; floor <= floors; floor += 1) {
    layout.forEach((spec, index) => {
      units.push({
        project: project._id,
        building: building._id,
        unitNumber: `${floor}${String(index + 1).padStart(2, '0')}`,
        floor,
        type: spec.type,
        areaSqft: spec.area,
        price: Math.round(spec.price + spec.floorRise * floor),
      });
    });
  }
  return units;
}

async function seedProperties() {
  const [palm, skyline, lakeview] = await Project.create([
    {
      name: 'Palm Grove Residences',
      city: 'Chennai',
      location: 'OMR, Thoraipakkam',
      status: 'Under construction',
      description: 'Two 14-storey towers with clubhouse and pool, 5 minutes from the IT corridor.',
    },
    {
      name: 'Skyline Heights',
      city: 'Bengaluru',
      location: 'Whitefield',
      status: 'Ready to move',
      description: 'Compact homes near the metro line. OC received.',
    },
    {
      name: 'Lakeview Villas',
      city: 'Hyderabad',
      location: 'Kokapet',
      status: 'Pre-launch',
      description: 'Gated community of independent villas facing the lake.',
    },
  ]);

  const [towerA, towerB, tower1, phase1] = await Building.create([
    { project: palm._id, name: 'Tower A', totalFloors: 12 },
    { project: palm._id, name: 'Tower B', totalFloors: 12 },
    { project: skyline._id, name: 'Tower 1', totalFloors: 10 },
    { project: lakeview._id, name: 'Phase 1', totalFloors: 1 },
  ]);

  const palmLayout = [
    { type: '3BHK', area: 1650, price: 11200000, floorRise: 60000 },
    { type: '2BHK', area: 1180, price: 7800000, floorRise: 45000 },
    { type: '2BHK', area: 1180, price: 7800000, floorRise: 45000 },
    { type: '3BHK', area: 1650, price: 11200000, floorRise: 60000 },
  ];
  const skylineLayout = [
    { type: '1BHK', area: 640, price: 4200000, floorRise: 25000 },
    { type: '2BHK', area: 1050, price: 6500000, floorRise: 35000 },
    { type: '2BHK', area: 1050, price: 6500000, floorRise: 35000 },
    { type: '1BHK', area: 640, price: 4200000, floorRise: 25000 },
  ];

  const villas = Array.from({ length: 10 }, (_, i) => ({
    project: lakeview._id,
    building: phase1._id,
    unitNumber: `V${String(i + 1).padStart(2, '0')}`,
    floor: 0,
    type: 'Villa',
    areaSqft: i < 6 ? 2800 : 3400,
    price: i < 6 ? 28500000 : 34000000,
  }));

  const units = await Unit.insertMany([
    ...towerUnits({ project: palm, building: towerA, floors: 12, layout: palmLayout }),
    ...towerUnits({ project: palm, building: towerB, floors: 12, layout: palmLayout }),
    ...towerUnits({ project: skyline, building: tower1, floors: 10, layout: skylineLayout }),
    ...villas,
  ]);

  // A few units held back by management (e.g. reserved for the landowner).
  const blocked = units.filter((u) => ['1201', '1204'].includes(u.unitNumber) && String(u.building) === String(towerB._id));
  await Unit.updateMany({ _id: { $in: blocked.map((u) => u._id) } }, { status: 'blocked' });

  const find = (building, unitNumber) =>
    units.find((u) => String(u.building) === String(building._id) && u.unitNumber === unitNumber);

  return {
    projects: { palm, skyline, lakeview },
    pick: {
      palmA0702: find(towerA, '702'),
      palmA1004: find(towerA, '1004'),
      palmB0503: find(towerB, '503'),
      sky0802: find(tower1, '802'),
      villa03: find(phase1, 'V03'),
    },
  };
}

const LEADS = [
  // name, phone, source, stage, budget, type, owner index (null = unassigned), created days ago, follow-up
  ['Karthik Subramanian', '9840011223', 'Website', 'New', 8500000, '2BHK', null, 1, null],
  ['Ananya Krishnan', '9884022334', 'Property portal', 'New', 12000000, '3BHK', null, 0, null],
  ['Vikram Singh', '9812345670', 'Social media', 'New', 6000000, '2BHK', 0, 2, 3 * HOUR],
  ['Divya Raghunathan', '9790033445', 'Website', 'New', 4500000, '1BHK', 1, 1, 26 * HOUR],
  ['Mohammed Irfan', '9876543210', 'Walk-in', 'New', 30000000, 'Villa', 2, 0, 5 * HOUR],
  ['Sneha Kulkarni', '9823456781', 'Property portal', 'New', 7000000, '2BHK', null, 3, null],
  ['Rohit Sharma', '9811122233', 'Referral', 'Contacted', 11500000, '3BHK', 0, 6, -1 * DAY],
  ['Lakshmi Venkatesh', '9840055667', 'Website', 'Contacted', 8000000, '2BHK', 1, 5, 4 * HOUR],
  ['Arvind Chandran', '9003344556', 'Channel partner', 'Contacted', 6800000, '2BHK', 2, 8, 2 * DAY],
  ['Pooja Agarwal', '9899988877', 'Social media', 'Contacted', 4300000, '1BHK', 0, 4, -2 * DAY],
  ['Suresh Babu', '9445566778', 'Walk-in', 'Contacted', 12500000, '3BHK', 1, 9, 3 * DAY],
  ['Nikhil Joshi', '9922334455', 'Property portal', 'Site Visit', 8200000, '2BHK', 0, 12, 6 * HOUR],
  ['Farah Sheikh', '9833445566', 'Referral', 'Site Visit', 31000000, 'Villa', 2, 10, 1 * DAY],
  ['Ganesh Murthy', '9741122334', 'Website', 'Site Visit', 6600000, '2BHK', 1, 11, -3 * DAY],
  ['Ritu Malhotra', '9810098765', 'Channel partner', 'Site Visit', 11800000, '3BHK', 2, 7, 2 * HOUR],
  ['Sanjay Reddy', '9848012345', 'Referral', 'Interested', 34000000, 'Villa', 2, 15, 1 * DAY],
  ['Meenakshi Sundaram', '9444123456', 'Walk-in', 'Interested', 8100000, '2BHK', 1, 14, 5 * HOUR],
  ['Amit Patel', '9825011122', 'Website', 'Interested', 4600000, '1BHK', 0, 13, 4 * DAY],
  ['Harini Balaji', '9962233445', 'Property portal', 'Interested', 12000000, '3BHK', 1, 16, -1 * DAY],
  ['Deepak Nair', '9895566778', 'Referral', 'Negotiation', 11600000, '3BHK', 0, 20, 2 * HOUR],
  ['Swati Deshpande', '9767788990', 'Channel partner', 'Negotiation', 6900000, '2BHK', 1, 18, 2 * DAY],
  ['Rajesh Khanna', '9811199887', 'Walk-in', 'Negotiation', 29000000, 'Villa', 2, 22, -1 * DAY],
  ['Aishwarya Menon', '9847001122', 'Referral', 'Booked', 8200000, '2BHK', 1, 28, null],
  ['Varun Kapoor', '9818123123', 'Website', 'Booked', 12000000, '3BHK', 0, 25, null],
  ['Kavitha Ramesh', '9840099887', 'Channel partner', 'Booked', 8000000, '2BHK', 2, 24, null],
  ['Imran Khan', '9885012121', 'Referral', 'Booked', 30000000, 'Villa', 2, 21, null],
  ['Neha Gupta', '9871234567', 'Social media', 'Lost', 5000000, '2BHK', 0, 19, null],
  ['Prakash Iyer', '9444987654', 'Property portal', 'Lost', 9000000, '3BHK', 1, 17, null],
];

const LOST_REASONS = {
  'Neha Gupta': 'Budget too low for available 2BHKs',
  'Prakash Iyer': 'Bought a resale flat in Adyar',
};

const NOTES_BY_STAGE = {
  Contacted: 'Spoke on phone. Wants a floor plan and price sheet on WhatsApp.',
  'Site Visit': 'Visited the site with family. Liked the east-facing units.',
  Interested: 'Comparing with one other project. Asked about home-loan tie-ups.',
  Negotiation: 'Asking for a waiver on the floor-rise charge. Discussed with manager.',
};

async function seedLeadsAndBookings({ admin, sales }, { pick }) {
  const leads = [];

  for (const [name, phone, source, stage, budget, preferredUnitType, owner, createdDaysAgo, followUp] of LEADS) {
    const assignee = owner === null ? null : sales[owner];
    const createdAt = at(-createdDaysAgo * DAY - 3 * HOUR);

    const lead = await Lead.create({
      name,
      phone,
      email: `${name.split(' ')[0].toLowerCase()}@example.com`,
      source,
      stage,
      budget,
      preferredUnitType,
      assignedTo: assignee?._id ?? null,
      nextFollowUpAt: followUp === null ? null : at(followUp),
      lastContactedAt: stage === 'New' ? null : at(-DAY),
      lostReason: LOST_REASONS[name],
      createdBy: assignee?._id ?? admin._id,
    });
    // Backdate so the demo has a realistic history.
    await Lead.collection.updateOne({ _id: lead._id }, { $set: { createdAt } });

    const actor = assignee ?? admin;
    const history = [
      { type: 'created', message: `Lead added from ${source}`, createdBy: actor._id, createdAt },
    ];
    if (assignee) {
      history.push({
        type: 'assignment',
        message: `Assigned to ${assignee.name}`,
        createdBy: admin._id,
        createdAt: new Date(createdAt.getTime() + HOUR),
      });
    }
    if (NOTES_BY_STAGE[stage]) {
      history.push({
        type: 'stage_change',
        message: `Moved from New to ${stage}`,
        meta: { from: 'New', to: stage },
        createdBy: actor._id,
        createdAt: at(-2 * DAY),
      });
      history.push({ type: 'note', message: NOTES_BY_STAGE[stage], createdBy: actor._id, createdAt: at(-DAY) });
    }
    if (stage === 'Lost') {
      history.push({
        type: 'stage_change',
        message: `Marked as Lost: ${LOST_REASONS[name]}`,
        meta: { from: 'Interested', to: 'Lost' },
        createdBy: actor._id,
        createdAt: at(-DAY),
      });
    }
    await Activity.insertMany(history.map((entry) => ({ ...entry, lead: lead._id })));

    leads.push(lead);
  }

  const byName = (name) => leads.find((lead) => lead.name === name);
  const bookingsToCreate = [
    { lead: byName('Aishwarya Menon'), unit: pick.palmA0702, discount: 150000, amount: 500000, daysAgo: 9 },
    { lead: byName('Varun Kapoor'), unit: pick.palmA1004, discount: 250000, amount: 1000000, daysAgo: 4 },
    { lead: byName('Kavitha Ramesh'), unit: pick.sky0802, discount: 0, amount: 300000, daysAgo: 2 },
    { lead: byName('Imran Khan'), unit: pick.villa03, discount: 500000, amount: 2500000, daysAgo: 12 },
  ];

  for (const { lead, unit, discount, amount, daysAgo } of bookingsToCreate) {
    const createdAt = at(-daysAgo * DAY);
    const booking = await Booking.create({
      lead: lead._id,
      unit: unit._id,
      project: unit.project,
      agreedPrice: unit.price - discount,
      bookingAmount: amount,
      bookedBy: lead.assignedTo,
      salesOwner: lead.assignedTo,
    });
    await Booking.collection.updateOne({ _id: booking._id }, { $set: { createdAt } });
    await Unit.updateOne({ _id: unit._id }, { status: 'booked' });
    await Activity.create({
      lead: lead._id,
      type: 'booking',
      message: `Booked unit ${unit.unitNumber} after negotiation`,
      meta: { bookingId: booking._id, from: 'Negotiation', to: 'Booked' },
      createdBy: lead.assignedTo,
    });
  }

  return leads.length;
}

async function main() {
  await connectDB();
  console.log('Connected. Clearing existing data...');

  await Promise.all(
    [Activity, Booking, Lead, Unit, Building, Project, User].map((model) => model.deleteMany({})),
  );
  await Promise.all(
    [Activity, Booking, Lead, Unit, Building, Project, User].map((model) => model.syncIndexes()),
  );

  const users = await seedUsers();
  const properties = await seedProperties();
  const leadCount = await seedLeadsAndBookings(users, properties);

  console.log(`Seeded ${leadCount} leads, 3 projects and demo bookings.`);
  console.log('\nSign in with:');
  console.log(`  Admin  admin@plotline.dev / ${DEMO_PASSWORDS.admin}`);
  console.log(`  Sales  arjun@plotline.dev / ${DEMO_PASSWORDS.sales}  (also priya@, rahul@)`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
