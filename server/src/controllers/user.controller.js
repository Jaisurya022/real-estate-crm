import { CLOSED_STAGES, ROLES } from '../constants.js';
import { Activity, Lead, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function listUsers(req, res) {
  const { role, active } = req.valid.query;
  const filter = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.isActive = active;

  const [users, openLeads] = await Promise.all([
    User.find(filter).sort({ isActive: -1, name: 1 }),
    Lead.aggregate([
      { $match: { stage: { $nin: CLOSED_STAGES }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]),
  ]);

  const openByUser = new Map(openLeads.map(({ _id, count }) => [String(_id), count]));
  res.json({
    items: users.map((user) => ({ ...user.toJSON(), openLeads: openByUser.get(String(user._id)) ?? 0 })),
  });
}

export async function createUser(req, res) {
  const { password, ...data } = req.valid.body;
  const user = await User.create({ ...data, password: await User.hashPassword(password) });
  res.status(201).json({ user });
}

export async function updateUser(req, res) {
  const { id } = req.valid.params;
  const data = { ...req.valid.body };
  const isSelf = String(id) === String(req.user._id);

  if (isSelf && (data.isActive === false || (data.role && data.role !== req.user.role))) {
    throw ApiError.badRequest("You can't deactivate your own account or change your own role.");
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User');

  const wasSelling = user.isActive && user.role === ROLES.SALES;
  if (data.password) data.password = await User.hashPassword(data.password);
  user.set(data);
  await user.save();

  // Someone who is deactivated, or moved out of sales, can't follow up on
  // anything any more, so their open leads go back to the "Unassigned" queue
  // where an admin will see them.
  let unassignedLeads = 0;
  const stillSelling = user.isActive && user.role === ROLES.SALES;
  if (wasSelling && !stillSelling) {
    const why = user.isActive ? `${user.name} moved out of sales` : `${user.name} was deactivated`;
    const leadIds = await Lead.find({ assignedTo: user._id, stage: { $nin: CLOSED_STAGES } }).distinct('_id');
    if (leadIds.length) {
      await Lead.updateMany({ _id: { $in: leadIds } }, { assignedTo: null });
      await Activity.insertMany(
        leadIds.map((lead) => ({
          lead,
          type: 'assignment',
          message: `Moved to unassigned because ${why}`,
          meta: { to: null },
          createdBy: req.user._id,
        })),
      );
    }
    unassignedLeads = leadIds.length;
  }

  res.json({ user, unassignedLeads });
}
