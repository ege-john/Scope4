import { Hono } from 'hono';
import { supabase } from '@scope4/db';

export const dashboardRouter = new Hono();

dashboardRouter.get('/summary', async (c) => {
  const { data, error } = await supabase
    .from('dashboard_insights')
    .select('*');

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  // Assuming a single row for global summary, or aggregate them
  const summary = data.length > 0 ? data[0] : null;
  return c.json({ summary });
});
