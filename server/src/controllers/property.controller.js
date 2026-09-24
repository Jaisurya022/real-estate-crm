import { BOOKING_STATUS, UNIT_STATUS } from '../constants.js';
import { Booking, Building, Project, Unit } from '../models/index.js';
import { isAdmin } from '../services/lead.service.js';
import { ApiError } from '../utils/ApiError.js';
import { containsRegex, pagedResponse, paginate } from '../utils/query.js';

const emptyStats = () => ({ total: 0, available: 0, booked: 0, blocked: 0, startingPrice: null });

/** Groups units by `groupField` + status into { total, available, booked, blocked, startingPrice }. */
async function unitStatsBy(groupField, match = {}) {
  const rows = await Unit.aggregate([
    { $match: match },
    {
      $group: {
        _id: { key: `$${groupField}`, status: '$status' },
        count: { $sum: 1 },
        minPrice: { $min: '$price' },
      },
    },
  ]);

  const stats = new Map();
  for (const { _id, count, minPrice } of rows) {
    const key = String(_id.key);
    const entry = stats.get(key) ?? emptyStats();
    entry.total += count;
    entry[_id.status] = count;
    if (_id.status === UNIT_STATUS.AVAILABLE) entry.startingPrice = minPrice;
    stats.set(key, entry);
  }
  return stats;
}

// ---------- Projects ----------

export async function listProjects(_req, res) {
  const [projects, stats, buildingCounts] = await Promise.all([
    Project.find().sort({ createdAt: -1 }).lean(),
    unitStatsBy('project'),
    Building.aggregate([{ $group: { _id: '$project', count: { $sum: 1 } } }]),
  ]);

  const buildingsByProject = new Map(buildingCounts.map(({ _id, count }) => [String(_id), count]));

  res.json({
    items: projects.map((project) => ({
      ...project,
      buildingCount: buildingsByProject.get(String(project._id)) ?? 0,
      stats: stats.get(String(project._id)) ?? emptyStats(),
    })),
  });
}

export async function getProject(req, res) {
  const project = await Project.findById(req.valid.params.id).lean();
  if (!project) throw ApiError.notFound('Project');

  const [buildings, stats] = await Promise.all([
    Building.find({ project: project._id }).sort({ name: 1 }).lean(),
    unitStatsBy('building', { project: project._id }),
  ]);

  res.json({
    project,
    buildings: buildings.map((building) => ({
      ...building,
      stats: stats.get(String(building._id)) ?? emptyStats(),
    })),
  });
}

export async function createProject(req, res) {
  const project = await Project.create(req.valid.body);
  res.status(201).json({ project });
}

export async function updateProject(req, res) {
  const project = await Project.findByIdAndUpdate(req.valid.params.id, req.valid.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!project) throw ApiError.notFound('Project');
  res.json({ project });
}

// ---------- Buildings ----------

export async function createBuilding(req, res) {
  const project = await Project.exists({ _id: req.valid.params.id });
  if (!project) throw ApiError.notFound('Project');

  const building = await Building.create({ ...req.valid.body, project: req.valid.params.id });
  res.status(201).json({ building });
}

export async function updateBuilding(req, res) {
  const building = await Building.findById(req.valid.params.id);
  if (!building) throw ApiError.notFound('Building');

  const { totalFloors } = req.valid.body;
  if (totalFloors !== undefined) {
    const highest = await Unit.findOne({ building: building._id }).sort({ floor: -1 }).select('floor');
    if (highest && highest.floor > totalFloors) {
      throw ApiError.badRequest(`Floor ${highest.floor} already has units. Total floors can't be lower than that.`);
    }
  }

  building.set(req.valid.body);
  await building.save();
  res.json({ building });
}

// ---------- Units ----------

async function getBuildingOrThrow(id) {
  const building = await Building.findById(id);
  if (!building) throw ApiError.notFound('Building');
  return building;
}

function assertFloorFits(floor, building) {
  if (floor > building.totalFloors) {
    throw ApiError.badRequest(`${building.name} has ${building.totalFloors} floors.`, [
      { field: 'floor', message: `${building.name} has ${building.totalFloors} floors.` },
    ]);
  }
}

export async function listUnits(req, res) {
  const { project, building, status, type, minPrice, maxPrice, q, ...pageQuery } = req.valid.query;

  const filter = {};
  if (project) filter.project = project;
  if (building) filter.building = building;
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined && { $gte: minPrice }),
      ...(maxPrice !== undefined && { $lte: maxPrice }),
    };
  }
  if (q) filter.unitNumber = containsRegex(q);

  const page = paginate(pageQuery);
  const [items, total] = await Promise.all([
    Unit.find(filter)
      .sort({ project: 1, building: 1, floor: -1, unitNumber: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .populate('building', 'name')
      .populate('project', 'name city'),
    Unit.countDocuments(filter),
  ]);

  res.json(pagedResponse(items, total, page));
}

export async function getUnit(req, res) {
  const unit = await Unit.findById(req.valid.params.id)
    .populate('building', 'name totalFloors')
    .populate('project', 'name city');
  if (!unit) throw ApiError.notFound('Unit');

  let booking = null;
  if (unit.status === UNIT_STATUS.BOOKED) {
    booking = await Booking.findOne({ unit: unit._id, status: BOOKING_STATUS.CONFIRMED })
      .populate('lead', 'name phone assignedTo')
      .populate('bookedBy', 'name')
      .populate('salesOwner', 'name')
      .lean();

    // Sales colleagues see that a unit is taken, but not whose customer took it.
    const me = String(req.user._id);
    const ownsLead =
      booking && (String(booking.lead?.assignedTo) === me || String(booking.salesOwner?._id) === me);
    if (booking && !isAdmin(req.user) && !ownsLead) {
      booking = { _id: booking._id, createdAt: booking.createdAt, salesOwner: booking.salesOwner };
    }
  }

  res.json({ unit, booking });
}

export async function createUnit(req, res) {
  const building = await getBuildingOrThrow(req.valid.body.building);
  assertFloorFits(req.valid.body.floor, building);

  const unit = await Unit.create({ ...req.valid.body, project: building.project });
  res.status(201).json({ unit });
}

/**
 * Creates a block of units in one go, e.g. floors 1-12 with 4 units each.
 * Unit numbers follow the common "floor + position" pattern (1203 = floor 12, unit 3).
 * Existing unit numbers are skipped so the action is safe to repeat.
 */
export async function generateUnits(req, res) {
  const building = await getBuildingOrThrow(req.valid.params.id);
  const { fromFloor, toFloor, unitsPerFloor, type, areaSqft, basePrice, floorRise } = req.valid.body;
  assertFloorFits(toFloor, building);

  const existing = new Set(
    (await Unit.find({ building: building._id }).select('unitNumber').lean()).map((u) => u.unitNumber),
  );

  const units = [];
  for (let floor = fromFloor; floor <= toFloor; floor += 1) {
    for (let position = 1; position <= unitsPerFloor; position += 1) {
      const unitNumber = `${floor === 0 ? 'G' : floor}${String(position).padStart(2, '0')}`;
      if (existing.has(unitNumber)) continue;
      units.push({
        project: building.project,
        building: building._id,
        unitNumber,
        floor,
        type,
        areaSqft,
        price: Math.round(basePrice + floorRise * floor),
      });
    }
  }

  if (units.length) await Unit.insertMany(units);
  const requested = (toFloor - fromFloor + 1) * unitsPerFloor;
  res.status(201).json({ created: units.length, skipped: requested - units.length });
}

export async function updateUnit(req, res) {
  const unit = await Unit.findById(req.valid.params.id).populate('building', 'name totalFloors');
  if (!unit) throw ApiError.notFound('Unit');

  const data = req.valid.body;
  if (data.floor !== undefined) assertFloorFits(data.floor, unit.building);

  // A booked unit is what the customer signed up for, so it's read-only until
  // the booking is cancelled. The condition is part of the update itself, so an
  // admin can't edit or block a unit at the same moment someone books it.
  const updated = await Unit.findOneAndUpdate({ _id: unit._id, status: { $ne: UNIT_STATUS.BOOKED } }, data, {
    returnDocument: 'after',
    runValidators: true,
  })
    .populate('building', 'name')
    .populate('project', 'name city');

  if (!updated) {
    throw ApiError.conflict('This unit is booked. Cancel its booking before changing the unit.');
  }
  res.json({ unit: updated });
}
