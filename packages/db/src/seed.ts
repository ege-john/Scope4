import { supabase } from './index'
import { randomUUID } from 'crypto'

const DEMO_BUNDLES = [
  { trade_id: 'DEMO-TR-STEEL-001', product: 'steel', country: 'TR', qty: 500000, intensity: 1.89 },
  { trade_id: 'DEMO-TR-CEMENT-002', product: 'cement', country: 'TR', qty: 800000, intensity: 0.76 },
  { trade_id: 'DEMO-CN-STEEL-003', product: 'steel', country: 'CN', qty: 1200000, intensity: 2.1 },
  { trade_id: 'DEMO-CN-ALUMIN-004', product: 'aluminium', country: 'CN', qty: 45000, intensity: 14.2 },
  { trade_id: 'DEMO-TR-FERTIL-005', product: 'fertilisers', country: 'TR', qty: 300000, intensity: 2.1 },
]

async function seed() {
  console.log('Seeding demo data...')

  for (const demo of DEMO_BUNDLES) {
    const bundleId = randomUUID()
    const sellerId = randomUUID()
    const tradeId = randomUUID()
    const logisticsId = randomUUID()
    const reportId = randomUUID()

    // ── CBAM Reporting Layer ───────────────────────────────────────────────────
    const cbam_embedded_tco2 = (demo.qty / 1000) * demo.intensity
    const cbam_exposure_eur = cbam_embedded_tco2 * 50  // €50/tCO₂ placeholder

    // ── Business Intelligence Layer (NOT added to CBAM exposure) ─────────────
    const distances: Record<string, number> = { TR: 2200, CN: 19800 }
    const transport_tco2 = (demo.qty / 1000) * (distances[demo.country] ?? 5000) * 0.000012
    const portfolio_carbon_tco2 = cbam_embedded_tco2 + transport_tco2

    // Insert complete bundle
    await supabase.from('compliance_bundles').insert({
      id: bundleId, trade_id: demo.trade_id,
      bundle_status: 'complete',
      seller_attested_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      importer_attested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      logistics_attested_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      ready_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      ai_triggered_at: new Date(Date.now() - 82800000).toISOString(),
      completed_at: new Date(Date.now() - 79200000).toISOString(),
    })

    await supabase.from('seller_attestations').insert({
      id: sellerId, trade_id: demo.trade_id,
      seller_name: demo.country === 'TR' ? 'Karabük Demir Çelik A.Ş.' : 'Baowu Steel Group',
      seller_wallet: 'DEMO_SELLER_WALLET',
      facility_id: `FAC-${demo.country}-001`,
      product_type: demo.product,
      emissions_intensity_tco2_per_t: demo.intensity,
      methodology: 'direct_measure',
      doc_bundle_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      solana_tx: `DEMO_SELLER_TX_${demo.trade_id}`,
    })

    await supabase.from('trade_records').insert({
      id: tradeId, trade_id: demo.trade_id,
      importer_name: 'Ferretti Imports S.r.l.',
      importer_wallet: 'DEMO_IMPORTER_WALLET',
      seller_ref: demo.country === 'TR' ? 'Karabük Demir Çelik A.Ş.' : 'Baowu Steel Group',
      product_type: demo.product,
      quantity_kg: demo.qty,
      origin_country: demo.country,
      destination_country: 'IT',
      invoice_ref: `INV-${demo.trade_id}`,
      purchase_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      doc_bundle_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
      solana_tx: `DEMO_TRADE_TX_${demo.trade_id}`,
    })

    await supabase.from('logistics_attestations').insert({
      id: logisticsId, trade_id: demo.trade_id,
      logistics_name: 'MSC Mediterranean Shipping',
      logistics_wallet: 'DEMO_LOGISTICS_WALLET',
      shipment_ref: `SHP-${demo.trade_id}`,
      quantity_confirmed_kg: demo.qty,
      origin_confirmed: true,
      route_confirmed: true,
      dispatch_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      solana_tx: `DEMO_LOGISTICS_TX_${demo.trade_id}`,
    })

    // Update bundle with foreign key references
    await supabase.from('compliance_bundles').update({
      seller_attestation_id: sellerId,
      trade_record_id: tradeId,
      logistics_attestation_id: logisticsId,
    }).eq('id', bundleId)

    await supabase.from('compliance_reports').insert({
      id: reportId, bundle_id: bundleId,
      validation_passed: true, validation_flags: [],
      intensity_source: 'seller_direct',
      // CBAM Reporting Layer
      cbam_embedded_tco2: parseFloat(cbam_embedded_tco2.toFixed(2)),
      cbam_exposure_eur: parseFloat(cbam_exposure_eur.toFixed(2)),
      // BI Layer
      transport_tco2: parseFloat(transport_tco2.toFixed(2)),
      portfolio_carbon_tco2: parseFloat(portfolio_carbon_tco2.toFixed(2)),
      confidence_level: 'high', confidence_notes: [],
      report_text: `# CBAM Compliance Report — ${demo.trade_id}\n\n## CBAM Reporting Layer\nEmbedded production emissions: **${cbam_embedded_tco2.toFixed(1)} tCO₂**. Estimated CBAM exposure: **€${cbam_exposure_eur.toFixed(0)}** (€50/tCO₂ estimate).\n\n## Carbon Footprint Overview (BI Layer)\nTransport emissions: ${transport_tco2.toFixed(2)} tCO₂. Full portfolio carbon footprint: ${portfolio_carbon_tco2.toFixed(1)} tCO₂. Note: transport emissions are not included in the CBAM liability calculation.`,
      llm_model_used: 'gemini-2.5-flash',
    })
  }

  // Seed one in-progress bundle for demo
  await supabase.from('compliance_bundles').insert({
    trade_id: 'DEMO-LIVE-001',
    bundle_status: 'awaiting_parties',
  })

  console.log('Seed complete.')
}

seed()
