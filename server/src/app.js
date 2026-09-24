import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { timezone } from './middleware/timezone.js';
import routes from './routes/index.js';

const app = express();

// Behind Vercel/Render proxies: needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowed = !origin || env.clientUrls.includes('*') || env.clientUrls.includes(origin);
      callback(null, allowed);
    },
  }),
);
app.use(express.json({ limit: '100kb' }));
if (!env.isProduction) app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ name: 'Estate CRM API', health: '/api/health' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Connect lazily so the same app works as a long-running server and as a serverless function.
app.use('/api', async (_req, _res, next) => {
  await connectDB();
  next();
});
app.use('/api', timezone, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
