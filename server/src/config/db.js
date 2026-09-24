import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Serverless platforms (Vercel) may reuse a warm process between requests,
 * so the connection is cached on `global` instead of reconnecting every time.
 */
const cache = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
