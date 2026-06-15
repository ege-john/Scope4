import { serve } from '@hono/node-server';
// Force Railway Rebuild
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { bundlesRouter } from './routes/bundles';
import { attestationsRouter } from './routes/attestations';
import { reportsRouter } from './routes/reports';
import { dashboardRouter } from './routes/dashboard';
import { startAIWorker } from './aiWorker';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok', service: 'scope4-api' }));

// Mount routers
app.route('/api/bundles', bundlesRouter);
app.route('/api/attestations', attestationsRouter);
app.route('/api/reports', reportsRouter);
app.route('/api/dashboard', dashboardRouter);

// Start server
const port = parseInt(process.env.PORT || process.env.API_PORT || '3001', 10);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

// Start AI background worker (polls Supabase for ready bundles every 15s)
startAIWorker();
