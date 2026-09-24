import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export async function login(req, res) {
  const { email, password } = req.valid.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact your admin.');
  }

  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  res.json({ token, user: user.toJSON() });
}

export function me(req, res) {
  res.json({ user: req.user });
}
