import { Hono } from 'hono';
import { supabase } from '@scope4/db';

export const reportsRouter = new Hono();

reportsRouter.get('/:bundle_id', async (c) => {
  const bundleId = c.req.param('bundle_id');
  const { data, error } = await supabase
    .from('compliance_reports')
    .select('*')
    .eq('bundle_id', bundleId)
    .single();

  if (error) {
    return c.json({ error: error.message }, 404);
  }

  return c.json(data);
});
