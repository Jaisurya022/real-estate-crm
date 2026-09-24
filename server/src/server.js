import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

try {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}`);
  });
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  process.exit(1);
}
