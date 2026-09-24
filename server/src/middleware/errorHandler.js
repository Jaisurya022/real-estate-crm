import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** Friendly messages for unique-index violations, keyed by MongoDB index name. */
const DUPLICATE_MESSAGES = {
  email_1: 'An account with this email already exists.',
  phone_1: 'A lead with this phone number already exists.',
  name_1: 'A project with this name already exists.',
  project_1_name_1: 'A building with this name already exists in this project.',
  building_1_unitNumber_1: 'This unit number already exists in the building.',
  unit_1: 'This unit has already been booked.',
};

function duplicateKeyMessage(err) {
  const fromMessage = err.message?.match(/index: (\S+)/)?.[1];
  const fromPattern = Object.keys(err.keyPattern ?? {}).map((key) => `${key}_1`).join('_');
  const indexName = fromMessage ?? fromPattern;
  return DUPLICATE_MESSAGES[indexName] ?? 'This record already exists.';
}

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl}`));
}

// Express recognises error handlers by their four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let error = err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest(details[0]?.message || 'Invalid data.', details);
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}.`);
  } else if (err?.code === 11000) {
    error = ApiError.conflict(duplicateKeyMessage(err));
  } else if (err?.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Request body is not valid JSON.');
  }

  if (!(error instanceof ApiError)) {
    console.error(err);
    error = new ApiError(500, env.isProduction ? 'Something went wrong on our side.' : err.message);
  }

  res.status(error.status).json({
    message: error.message,
    ...(error.details && { details: error.details }),
  });
}
