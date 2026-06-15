import type {
  ComplianceBundle,
  SellerAttestation,
  TradeRecord,
  LogisticsAttestation,
  ComplianceReport,
  BundleDetailResponse,
  DashboardSummaryResponse,
} from '@scope4/types'

// Pre-built fixture data for DEMO_MODE=true.
// Used by the API middleware and frontend until real data flows through.

export const bundles: ComplianceBundle[] = [
  {
    id: 'b1',
    trade_id: 'DEMO-TR-STEEL-001',
    bundle_status: 'complete',
    seller_attestation_id: 's1',
    trade_record_id: 't1',
    logistics_attestation_id: 'l1',
    seller_attested_at: '2026-06-11T10:00:00Z',
    importer_attested_at: '2026-06-11T11:00:00Z',
    logistics_attested_at: '2026-06-11T14:00:00Z',
    ready_at: '2026-06-11T14:00:00Z',
    ai_triggered_at: '2026-06-11T14:01:00Z',
    completed_at: '2026-06-11T14:03:00Z',
    solana_bundle_pda: 'DEMO_BUNDLE_PDA_001',
    created_at: '2026-06-11T09:00:00Z',
  },
  {
    id: 'b2',
    trade_id: 'DEMO-TR-CEMENT-002',
    bundle_status: 'complete',
    seller_attestation_id: 's2',
    trade_record_id: 't2',
    logistics_attestation_id: 'l2',
    seller_attested_at: '2026-06-12T09:00:00Z',
    importer_attested_at: '2026-06-12T10:00:00Z',
    logistics_attested_at: '2026-06-12T12:00:00Z',
    ready_at: '2026-06-12T12:00:00Z',
    ai_triggered_at: '2026-06-12T12:01:00Z',
    completed_at: '2026-06-12T12:04:00Z',
    solana_bundle_pda: 'DEMO_BUNDLE_PDA_002',
    created_at: '2026-06-12T08:00:00Z',
  },
  {
    id: 'b3',
    trade_id: 'DEMO-CN-STEEL-003',
    bundle_status: 'complete',
    seller_attestation_id: 's3',
    trade_record_id: 't3',
    logistics_attestation_id: 'l3',
    seller_attested_at: '2026-06-13T08:00:00Z',
    importer_attested_at: '2026-06-13T09:00:00Z',
    logistics_attested_at: '2026-06-13T11:00:00Z',
    ready_at: '2026-06-13T11:00:00Z',
    ai_triggered_at: '2026-06-13T11:01:00Z',
    completed_at: '2026-06-13T11:05:00Z',
    solana_bundle_pda: 'DEMO_BUNDLE_PDA_003',
    created_at: '2026-06-13T07:00:00Z',
  },
  {
    id: 'b4',
    trade_id: 'DEMO-LIVE-001',
    bundle_status: 'awaiting_parties',
    seller_attestation_id: null,
    trade_record_id: null,
    logistics_attestation_id: null,
    seller_attested_at: null,
    importer_attested_at: null,
    logistics_attested_at: null,
    ready_at: null,
    ai_triggered_at: null,
    completed_at: null,
    solana_bundle_pda: null,
    created_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'b5',
    trade_id: 'DEMO-LIVE-002',
    bundle_status: 'processing',
    seller_attestation_id: 's5',
    trade_record_id: 't5',
    logistics_attestation_id: 'l5',
    seller_attested_at: '2026-06-15T09:00:00Z',
    importer_attested_at: '2026-06-15T09:30:00Z',
    logistics_attested_at: '2026-06-15T10:00:00Z',
    ready_at: '2026-06-15T10:00:00Z',
    ai_triggered_at: '2026-06-15T10:01:00Z',
    completed_at: null,
    solana_bundle_pda: 'DEMO_BUNDLE_PDA_005',
    created_at: '2026-06-15T08:30:00Z',
  },
]

export function getBundleDetail(trade_id: string): BundleDetailResponse {
  const bundle = bundles.find((b) => b.trade_id === trade_id) ?? bundles[0]

  const seller: SellerAttestation = {
    id: 's1',
    trade_id: bundle.trade_id,
    seller_name: 'Karabük Demir Çelik A.Ş.',
    seller_wallet: 'CYqiXwY1b5snxDpcyZWMyAHJHoL1HR6W5sZgaMiMF7sW',
    facility_id: 'FAC-TR-KARBUK-01',
    product_type: 'steel',
    emissions_intensity_tco2_per_t: 1.89,
    methodology: 'direct_measure',
    supporting_doc_url: null,
    doc_bundle_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    solana_tx: `DEMO_SELLER_TX_${bundle.trade_id}`,
    submitted_at: bundle.seller_attested_at ?? new Date().toISOString(),
  }

  const trade: TradeRecord = {
    id: 't1',
    trade_id: bundle.trade_id,
    importer_name: 'Ferretti Imports S.r.l.',
    importer_wallet: 'Aac9ghUvsgMgDKMTKKjdR4s9rf5c8cs6C3oUocPZKbkd',
    seller_ref: 'Karabük Demir Çelik A.Ş.',
    product_type: 'steel',
    quantity_kg: 500000,
    origin_country: 'TR',
    destination_country: 'IT',
    invoice_ref: `INV-${bundle.trade_id}`,
    purchase_date: '2026-06-10',
    doc_bundle_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    solana_tx: `DEMO_TRADE_TX_${bundle.trade_id}`,
    submitted_at: bundle.importer_attested_at ?? new Date().toISOString(),
  }

  const logistics: LogisticsAttestation = {
    id: 'l1',
    trade_id: bundle.trade_id,
    logistics_name: 'MSC Mediterranean Shipping',
    logistics_wallet: '8vkjdjQx2PS1HXhdNbfAcMjogKKPkDa6di5He62BCM1N',
    shipment_ref: `SHP-${bundle.trade_id}`,
    quantity_confirmed_kg: 500000,
    origin_confirmed: true,
    route_confirmed: true,
    dispatch_date: '2026-06-09',
    solana_tx: `DEMO_LOGISTICS_TX_${bundle.trade_id}`,
    attested_at: bundle.logistics_attested_at ?? new Date().toISOString(),
  }

  const report: ComplianceReport = {
    id: 'r1',
    bundle_id: bundle.id,
    validation_passed: true,
    validation_flags: [],
    intensity_source: 'seller_direct',
    embedded_tco2: 945,
    transport_tco2: 13.2,
    total_tco2: 958.2,
    cbam_exposure_eur: 47250,
    confidence_level: 'high',
    confidence_notes: [],
    report_text:
      '# CBAM Compliance Report\n\n## CBAM Compliance\nEmbedded production emissions: **945 tCO₂**. Estimated CBAM exposure: **€47,250** (€50/tCO₂ placeholder).\n\n## Carbon Footprint Overview (BI Layer)\nTransport emissions: 13.2 tCO₂. Full portfolio carbon footprint: 958.2 tCO₂. Note: transport emissions are not included in the CBAM liability calculation.',
    llm_model_used: 'gemini-1.5-flash',
    generated_at: bundle.completed_at ?? new Date().toISOString(),
  }

  const hasSeller = bundle.seller_attestation_id !== null
  const hasTrade = bundle.trade_record_id !== null
  const hasLogistics = bundle.logistics_attestation_id !== null
  const hasReport = bundle.bundle_status === 'complete'

  return {
    bundle,
    seller: hasSeller ? seller : null,
    trade: hasTrade ? trade : null,
    logistics: hasLogistics ? logistics : null,
    report: hasReport ? report : null,
    audit_events: [],
  }
}

export const dashboardSummary: DashboardSummaryResponse = {
  latest_insight: {
    id: 'ins1',
    computed_at: new Date().toISOString(),
    period_start: '2026-05-01',
    period_end: '2026-06-15',
    total_tco2: 4823,
    total_cbam_eur: 241150,
    top_country: 'TR',
    top_product: 'steel',
    top_supplier: 'Karabük Demir Çelik A.Ş.',
    insight_text:
      'Turkish steel imports account for 62% of your total CBAM exposure this quarter. Consider exploring lower-intensity suppliers or alternative sourcing patterns to reduce estimated certificate costs.',
    by_country: {
      TR: { tco2: 2990, eur: 149500 },
      CN: { tco2: 1833, eur: 91650 },
    },
    by_product: {
      steel: { tco2: 3010, eur: 150500 },
      cement: { tco2: 608, eur: 30400 },
      aluminium: { tco2: 639, eur: 31950 },
      fertilisers: { tco2: 630, eur: 31500 },
      electricity: { tco2: 0, eur: 0 },
    },
    by_supplier: {
      'Karabük Demir Çelik A.Ş.': { tco2: 1890, eur: 94500 },
      'Baowu Steel Group': { tco2: 1050, eur: 52500 },
    },
    monthly_series: [
      { month: '2026-01', tco2: 620, eur: 31000 },
      { month: '2026-02', tco2: 740, eur: 37000 },
      { month: '2026-03', tco2: 890, eur: 44500 },
      { month: '2026-04', tco2: 960, eur: 48000 },
      { month: '2026-05', tco2: 1080, eur: 54000 },
      { month: '2026-06', tco2: 533, eur: 26650 },
    ],
  },
  bundle_counts: {
    awaiting_parties: 1,
    ready: 0,
    processing: 1,
    complete: 3,
    failed: 0,
  },
}
