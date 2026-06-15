import { supabase } from '@scope4/db';

async function run() {
  await supabase.from('compliance_bundles').update({ bundle_status: 'ready', ai_triggered_at: null }).eq('trade_id', 'TRD-1781504496558-057X');
  
  setTimeout(async () => {
    const { data: events, error } = await supabase.from('audit_events').select('*').order('occurred_at', { ascending: false }).limit(5);
    console.log('Error:', error);
    console.log('Recent audit events:');
    console.log(JSON.stringify(events, null, 2));
  }, 16000); // Wait for AI worker to run (runs every 15s)
}

run();
