import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function getBundleWithAll(trade_id: string) {
  const { data: bundle } = await supabase
    .from('compliance_bundles')
    .select('*')
    .eq('trade_id', trade_id)
    .single()

  if (!bundle) return null

  const [{ data: seller }, { data: trade }, { data: logistics }, { data: report }] =
    await Promise.all([
      supabase.from('seller_attestations').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('trade_records').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('logistics_attestations').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('compliance_reports').select('*').eq('bundle_id', bundle.id).maybeSingle(),
    ])

  return { bundle, seller, trade, logistics, report }
}

export async function getReadyBundles() {
  const { data } = await supabase
    .from('compliance_bundles')
    .select('trade_id')
    .eq('bundle_status', 'ready')
    .is('ai_triggered_at', null)
  return data ?? []
}

export async function markBundleProcessing(trade_id: string) {
  await supabase
    .from('compliance_bundles')
    .update({ bundle_status: 'processing', ai_triggered_at: new Date().toISOString() })
    .eq('trade_id', trade_id)
}

export async function markBundleComplete(bundle_id: string) {
  await supabase
    .from('compliance_bundles')
    .update({ bundle_status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', bundle_id)
}

export async function writeAuditEvent(event: {
  trade_id: string
  event_type: string
  actor_type: string
  actor_identity: string
  solana_tx?: string
  payload?: Record<string, unknown>
}) {
  await supabase.from('audit_events').insert({
    ...event,
    occurred_at: new Date().toISOString(),
  })
}
