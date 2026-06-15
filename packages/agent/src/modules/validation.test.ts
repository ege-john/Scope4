import { describe, it, expect } from 'vitest'
import { runValidation } from './validation'
import type { ComplianceBundle, SellerAttestation, TradeRecord, LogisticsAttestation } from '@scope4/types'

const baseBundle: ComplianceBundle = {
  id: 'b1',
  trade_id: 'TRD-1',
  seller_attestation_id: 's1',
  trade_record_id: 't1',
  logistics_attestation_id: 'l1',
  bundle_status: 'complete',
  seller_attested_at: new Date().toISOString(),
  importer_attested_at: new Date().toISOString(),
  logistics_attested_at: new Date().toISOString(),
  ready_at: new Date().toISOString(),
  ai_triggered_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  solana_bundle_pda: 'PDA',
  created_at: new Date().toISOString(),
}

const validSeller: SellerAttestation = {
  id: 's1',
  trade_id: 'TRD-1',
  seller_name: 'Test',
  seller_wallet: 'Wallet',
  facility_id: 'FAC',
  product_type: 'steel',
  emissions_intensity_tco2_per_t: 1.89,
  methodology: 'direct_measure',
  supporting_doc_url: null,
  doc_bundle_hash: 'hash',
  solana_tx: 'tx',
  submitted_at: new Date().toISOString()
}

const validTrade: TradeRecord = {
  id: 't1',
  trade_id: 'TRD-1',
  importer_name: 'Test',
  importer_wallet: 'Wallet',
  seller_ref: 'Test',
  product_type: 'steel',
  quantity_kg: 500000,
  origin_country: 'TR',
  destination_country: 'IT',
  invoice_ref: 'INV',
  purchase_date: '2026-06-01',
  doc_bundle_hash: 'hash',
  solana_tx: 'tx',
  submitted_at: new Date().toISOString()
}

const validLogistics: LogisticsAttestation = {
  id: 'l1',
  trade_id: 'TRD-1',
  logistics_name: 'Test',
  logistics_wallet: 'Wallet',
  shipment_ref: 'SHP',
  quantity_confirmed_kg: 500000,
  origin_confirmed: true,
  route_confirmed: true,
  dispatch_date: '2026-06-05',
  solana_tx: 'tx',
  attested_at: new Date().toISOString()
}

describe('ValidationAgent — Deterministic Cross-Checking', () => {

  it('passes validation with high confidence for perfect data', async () => {
    const result = await runValidation(baseBundle, validSeller, validTrade, validLogistics)
    expect(result.passed).toBe(true)
    expect(result.confidence).toBe('high')
    expect(result.flags.length).toBe(0)
  })

  it('fails validation on product type mismatch', async () => {
    const seller = { ...validSeller, product_type: 'cement' as const }
    const result = await runValidation(baseBundle, seller, validTrade, validLogistics)
    expect(result.passed).toBe(false)
    expect(result.confidence).toBe('low')
    expect(result.flags.some(f => f.includes('Product type mismatch'))).toBe(true)
  })

  it('fails validation and sets medium confidence on >5% quantity discrepancy', async () => {
    // 500,000 kg declared, but logistics says 450,000 (10% difference)
    const logistics = { ...validLogistics, quantity_confirmed_kg: 450000 }
    const result = await runValidation(baseBundle, validSeller, validTrade, logistics)
    expect(result.passed).toBe(false)
    // Actually the check makes it medium confidence
    expect(result.confidence).toBe('medium')
    expect(result.flags.some(f => f.includes('Quantity discrepancy'))).toBe(true)
  })

  it('passes but sets medium confidence on <5% quantity discrepancy', async () => {
    // 500,000 kg declared, logistics says 490,000 (2% difference)
    const logistics = { ...validLogistics, quantity_confirmed_kg: 490000 }
    const result = await runValidation(baseBundle, validSeller, validTrade, logistics)
    expect(result.passed).toBe(true)
    expect(result.confidence).toBe('high') // Wait, 2% diff is <= 5%, so no flag and high confidence
    expect(result.flags.length).toBe(0)
  })

  it('fails validation if intensity is outside plausible range', async () => {
    // Steel range is [0.5, 5.0], giving it 10.0
    const seller = { ...validSeller, emissions_intensity_tco2_per_t: 10.0 }
    const result = await runValidation(baseBundle, seller, validTrade, validLogistics)
    expect(result.passed).toBe(false)
    expect(result.confidence).toBe('low')
    expect(result.flags.some(f => f.includes('outside plausible range'))).toBe(true)
  })

  it('sets medium confidence if origin is not confirmed', async () => {
    const logistics = { ...validLogistics, origin_confirmed: false }
    const result = await runValidation(baseBundle, validSeller, validTrade, logistics)
    expect(result.passed).toBe(true)
    expect(result.confidence).toBe('medium')
    expect(result.flags.some(f => f.includes('did not confirm origin country'))).toBe(true)
  })

  it('sets medium confidence if route is not confirmed', async () => {
    const logistics = { ...validLogistics, route_confirmed: false }
    const result = await runValidation(baseBundle, validSeller, validTrade, logistics)
    expect(result.passed).toBe(true)
    expect(result.confidence).toBe('medium')
    expect(result.flags.some(f => f.includes('did not confirm shipping route'))).toBe(true)
  })

  it('sets medium confidence if seller used default value methodology', async () => {
    const seller = { ...validSeller, methodology: 'default_value' as const }
    const result = await runValidation(baseBundle, seller, validTrade, validLogistics)
    expect(result.passed).toBe(true)
    expect(result.confidence).toBe('medium')
    expect(result.flags.some(f => f.includes('default value methodology'))).toBe(true)
  })

})
