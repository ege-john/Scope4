import { Hono } from 'hono';
import { supabase } from '@scope4/db';

export const dashboardRouter = new Hono();

dashboardRouter.get('/summary', async (c) => {
  const { data: insightsData, error: insightsError } = await supabase
    .from('dashboard_insights')
    .select('*')
    .limit(1);

  if (insightsError) {
    return c.json({ error: insightsError.message }, 500);
  }

  // Count bundles by status
  const { data: bundlesData, error: bundlesError } = await supabase
    .from('compliance_bundles')
    .select('bundle_status');

  if (bundlesError) {
    return c.json({ error: bundlesError.message }, 500);
  }

  const bundle_counts = {
    awaiting_parties: 0,
    ready: 0,
    processing: 0,
    complete: 0,
    failed: 0,
  };

  if (bundlesData) {
    bundlesData.forEach((b: any) => {
      if (b.bundle_status in bundle_counts) {
        bundle_counts[b.bundle_status as keyof typeof bundle_counts]++;
      }
    });
  }

  const latest_insight = insightsData && insightsData.length > 0 ? insightsData[0] : null;
  return c.json({ latest_insight, bundle_counts });
});
