/**
 * ==============================================================================
 * @scope4/agent — fixtures.ts
 * Member C — AI + Analytics Lead
 *
 * Pre-built fixture data for DEMO_MODE=true.
 * Used by the API middleware (fallback) and frontend for instant demo flows.
 *
 * CBAM/BI LAYER SEPARATION (V2):
 *   - cbam_embedded_tco2 / cbam_exposure_eur → CBAM Reporting Layer (regulatory)
 *   - transport_tco2 / portfolio_carbon_tco2 → BI Layer (analytics only)
 *   These MUST NOT be mixed. cbam_exposure_eur never includes transport.
 * ==============================================================================
 */

import type {
  ComplianceBundle,
  SellerAttestation,
  TradeRecord,
  LogisticsAttestation,
  ComplianceReport,
  BundleDetailResponse,
  DashboardSummaryResponse,
  DashboardInsight,
} from '@scope4/types'

// ─── Helper: pre-computed emission values ─────────────────────────────────────

function calcCbam(qty_kg: number, intensity: number) {
  const qty_t = qty_kg / 1000
  const cbam_embedded_tco2 = qty_t * intensity
  const cbam_exposure_eur = cbam_embedded_tco2 * 50 // €50/tCO₂ placeholder
  return { cbam_embedded_tco2, cbam_exposure_eur }
}

function calcTransport(qty_kg: number, distance_km: number) {
  const qty_t = qty_kg / 1000
  const factor = distance_km <= 3000 ? 0.000010 : 0.000012
  return qty_t * distance_km * factor
}

// ─── Demo scenario parameters ─────────────────────────────────────────────────

const DEMOS = [
  { trade_id: 'DEMO-TR-STEEL-001',  product: 'steel'       as const, country: 'TR' as const, qty: 500000,  intensity: 1.89, dist: 2200 },
  { trade_id: 'DEMO-TR-CEMENT-002', product: 'cement'      as const, country: 'TR' as const, qty: 800000,  intensity: 0.76, dist: 2200 },
  { trade_id: 'DEMO-CN-STEEL-003',  product: 'steel'       as const, country: 'CN' as const, qty: 1200000, intensity: 2.10, dist: 19800 },
  { trade_id: 'DEMO-CN-ALUMIN-004', product: 'aluminium'   as const, country: 'CN' as const, qty: 45000,   intensity: 14.2, dist: 19800 },
  { trade_id: 'DEMO-TR-FERTIL-005', product: 'fertilisers' as const, country: 'TR' as const, qty: 300000,  intensity: 2.10, dist: 2200 },
]

const SELLER_NAMES: Record<string, string> = {
  TR: 'Karabük Demir Çelik A.Ş.',
  CN: 'Baowu Steel Group',
}

// ─── Compliance Bundles ───────────────────────────────────────────────────────

export const bundles: ComplianceBundle[] = DEMOS.map((d, i) => ({
  id: `b${i + 1}`,
  trade_id: d.trade_id,
  seller_attestation_id: `s${i + 1}`,
  trade_record_id: `t${i + 1}`,
  logistics_attestation_id: `l${i + 1}`,
  bundle_status: 'complete',
  seller_attested_at:   new Date(Date.now() - 86400000 * 3).toISOString(),
  importer_attested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  logistics_attested_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  ready_at:          new Date(Date.now() - 86400000 * 1).toISOString(),
  ai_triggered_at:   new Date(Date.now() - 82800000).toISOString(),
  completed_at:      new Date(Date.now() - 79200000).toISOString(),
  solana_bundle_pda: `DEMO_BUNDLE_PDA_${i + 1}`,
  created_at:        new Date(Date.now() - 86400000 * 5).toISOString(),
}))

// Live bundle for interactive demo
export const liveDemoBundle: ComplianceBundle = {
  id: 'b-live',
  trade_id: 'DEMO-LIVE-001',
  seller_attestation_id: null,
  trade_record_id: null,
  logistics_attestation_id: null,
  bundle_status: 'awaiting_parties',
  seller_attested_at: null,
  importer_attested_at: null,
  logistics_attested_at: null,
  ready_at: null,
  ai_triggered_at: null,
  completed_at: null,
  solana_bundle_pda: null,
  created_at: new Date().toISOString(),
}

// ─── getBundleDetail — full fixture for any trade_id ─────────────────────────

export function getBundleDetail(trade_id: string): BundleDetailResponse {
  const demo = DEMOS.find(d => d.trade_id === trade_id) ?? DEMOS[0]
  const idx  = DEMOS.indexOf(demo)
  const bundle = bundles[idx]

  const sellerName  = SELLER_NAMES[demo.country]
  const { cbam_embedded_tco2, cbam_exposure_eur } = calcCbam(demo.qty, demo.intensity)
  const transport_tco2  = calcTransport(demo.qty, demo.dist)
  const portfolio_carbon_tco2 = cbam_embedded_tco2 + transport_tco2

  const seller: SellerAttestation = {
    id: `s${idx + 1}`,
    trade_id: demo.trade_id,
    seller_name: sellerName,
    seller_wallet: 'CYqiXwY1b5snxDpcyZWMyAHJHoL1HR6W5sZgaMiMF7sW',
    facility_id: `FAC-${demo.country}-00${idx + 1}`,
    product_type: demo.product,
    emissions_intensity_tco2_per_t: demo.intensity,
    methodology: 'direct_measure',
    supporting_doc_url: null,
    doc_bundle_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    solana_tx: `DEMO_SELLER_TX_${demo.trade_id}`,
    submitted_at: bundle.seller_attested_at!,
  }

  const trade: TradeRecord = {
    id: `t${idx + 1}`,
    trade_id: demo.trade_id,
    importer_name: 'Ferretti Imports S.r.l.',
    importer_wallet: 'Aac9ghUvsgMgDKMTKKjdR4s9rf5c8cs6C3oUocPZKbkd',
    seller_ref: sellerName,
    product_type: demo.product,
    quantity_kg: demo.qty,
    origin_country: demo.country,
    destination_country: 'IT',
    invoice_ref: `INV-${demo.trade_id}`,
    purchase_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    doc_bundle_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    solana_tx: `DEMO_TRADE_TX_${demo.trade_id}`,
    submitted_at: bundle.importer_attested_at!,
  }

  const logistics: LogisticsAttestation = {
    id: `l${idx + 1}`,
    trade_id: demo.trade_id,
    logistics_name: 'MSC Mediterranean Shipping',
    logistics_wallet: '8vkjdjQx2PS1HXhdNbfAcMjogKKPkDa6di5He62BCM1N',
    shipment_ref: `SHP-${demo.trade_id}`,
    quantity_confirmed_kg: demo.qty,
    origin_confirmed: true,
    route_confirmed: true,
    dispatch_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    solana_tx: `DEMO_LOGISTICS_TX_${demo.trade_id}`,
    attested_at: bundle.logistics_attested_at!,
  }

  const report: ComplianceReport = {
    id: `r${idx + 1}`,
    bundle_id: bundle.id,
    validation_passed: true,
    validation_flags: [],
    intensity_source: 'seller_direct',
    // ── CBAM Reporting Layer ────────────────────────────────────────────────
    embedded_tco2: parseFloat(cbam_embedded_tco2.toFixed(2)),
    total_embedded_tco2: parseFloat(cbam_embedded_tco2.toFixed(2)),  // UI alias
    cbam_exposure_eur: parseFloat(cbam_exposure_eur.toFixed(2)),
    cbam_certificates_required: parseFloat(cbam_embedded_tco2.toFixed(2)), // = embedded tCO₂
    eu_carbon_price_eur_per_t: 50, // €50/tCO₂ placeholder
    // ── BI Layer ────────────────────────────────────────────────────────────
    transport_tco2: parseFloat(transport_tco2.toFixed(3)),
    total_transport_tco2: parseFloat(transport_tco2.toFixed(3)),      // UI alias
    total_tco2: parseFloat(portfolio_carbon_tco2.toFixed(2)),
    // ── Metadata ────────────────────────────────────────────────────────────
    confidence_level: 'high',
    confidence_notes: [],
    report_text: `# CBAM Compliance Report — ${demo.trade_id}\n\n## CBAM Compliance\n> CBAM liability = production-embedded emissions only (EU Reg 2023/956).\n\n- **CBAM-liable embedded emissions**: ${cbam_embedded_tco2.toFixed(1)} tCO₂\n- **Estimated CBAM certificate obligation**: €${cbam_exposure_eur.toFixed(0)} _(€50/tCO₂ placeholder)_\n\n## Carbon Footprint Overview _(BI Layer — Not CBAM-Liable)_\n- **Transport emissions**: ${transport_tco2.toFixed(2)} tCO₂ _(internal analytics only)_\n- **Portfolio carbon footprint**: ${portfolio_carbon_tco2.toFixed(1)} tCO₂\n\n*All attestations recorded on Solana Devnet.*`,
    llm_model_used: 'gemini-1.5-flash',
    generated_at: bundle.completed_at!,
    created_at: bundle.completed_at!,
  }

  return { bundle, seller, trade, logistics, report, audit_events: [], audit_trail: [] }
}

// ─── Dashboard summary fixture ────────────────────────────────────────────────

// Aggregate all demo bundles for the dashboard
const allCbam = DEMOS.reduce((acc, d) => {
  const { cbam_embedded_tco2, cbam_exposure_eur } = calcCbam(d.qty, d.intensity)
  return { tco2: acc.tco2 + cbam_embedded_tco2, eur: acc.eur + cbam_exposure_eur }
}, { tco2: 0, eur: 0 })

export const latestInsight: DashboardInsight = {
  id: 'ins1',
  computed_at: new Date().toISOString(),
  period_start: '2026-01-01',
  period_end: new Date().toISOString().split('T')[0],
  total_tco2: parseFloat(allCbam.tco2.toFixed(2)),
  total_cbam_eur: parseFloat(allCbam.eur.toFixed(2)),
  top_country: 'TR',
  top_product: 'steel',
  top_supplier: 'Karabük Demir Çelik A.Ş.',
  insight_text: 'Turkish steel imports account for 62% of your total CBAM exposure this quarter. Your largest contributor is Karabük Demir Çelik A.Ş. with 945 tCO₂ in embedded emissions. Consider exploring lower-intensity suppliers to reduce your estimated €47,250 certificate obligation.',
  by_country: {
    TR: { tco2: parseFloat(calcCbam(500000, 1.89).cbam_embedded_tco2.toFixed(1) + parseFloat(calcCbam(800000, 0.76).cbam_embedded_tco2.toFixed(1)) + parseFloat(calcCbam(300000, 2.10).cbam_embedded_tco2.toFixed(1))), eur: 0 },
    CN: { tco2: parseFloat((calcCbam(1200000, 2.10).cbam_embedded_tco2 + calcCbam(45000, 14.2).cbam_embedded_tco2).toFixed(1)), eur: 0 },
  },
  by_product: {
    steel:       { tco2: parseFloat((calcCbam(500000, 1.89).cbam_embedded_tco2 + calcCbam(1200000, 2.10).cbam_embedded_tco2).toFixed(1)), eur: 0 },
    cement:      { tco2: parseFloat(calcCbam(800000, 0.76).cbam_embedded_tco2.toFixed(1)), eur: 0 },
    aluminium:   { tco2: parseFloat(calcCbam(45000, 14.2).cbam_embedded_tco2.toFixed(1)),  eur: 0 },
    fertilisers: { tco2: parseFloat(calcCbam(300000, 2.10).cbam_embedded_tco2.toFixed(1)), eur: 0 },
    electricity: { tco2: 0, eur: 0 },
  },
  by_supplier: {
    'Karabük Demir Çelik A.Ş.': { tco2: parseFloat((calcCbam(500000, 1.89).cbam_embedded_tco2 + calcCbam(800000, 0.76).cbam_embedded_tco2 + calcCbam(300000, 2.10).cbam_embedded_tco2).toFixed(1)), eur: 0 },
    'Baowu Steel Group':         { tco2: parseFloat((calcCbam(1200000, 2.10).cbam_embedded_tco2 + calcCbam(45000, 14.2).cbam_embedded_tco2).toFixed(1)), eur: 0 },
  },
  monthly_series: [
    { month: '2026-01', tco2: 620,  eur: 31000 },
    { month: '2026-02', tco2: 740,  eur: 37000 },
    { month: '2026-03', tco2: 890,  eur: 44500 },
    { month: '2026-04', tco2: 960,  eur: 48000 },
    { month: '2026-05', tco2: 1080, eur: 54000 },
    { month: '2026-06', tco2: 533,  eur: 26650 },
  ],
}

// Fix eur values in by_country/by_product/by_supplier
latestInsight.by_country['TR']!.eur = parseFloat((latestInsight.by_country['TR']!.tco2 * 50).toFixed(2))
latestInsight.by_country['CN']!.eur = parseFloat((latestInsight.by_country['CN']!.tco2 * 50).toFixed(2))
Object.keys(latestInsight.by_product).forEach(k => {
  latestInsight.by_product[k]!.eur = parseFloat((latestInsight.by_product[k]!.tco2 * 50).toFixed(2))
})
Object.keys(latestInsight.by_supplier).forEach(k => {
  latestInsight.by_supplier[k]!.eur = parseFloat((latestInsight.by_supplier[k]!.tco2 * 50).toFixed(2))
})

export const dashboardSummary: DashboardSummaryResponse = {
  latest_insight: latestInsight,
  bundle_counts: {
    awaiting_parties: 1,
    ready: 0,
    processing: 0,
    complete: 5,
    failed: 0,
  },
}
