/**
 * ==============================================================================
 * @scope4/agent — calculation.test.ts
 * Member C — AI + Analytics Lead
 *
 * Unit tests for the EmissionsCalculationAgent (calculation.ts).
 * Run with: pnpm --filter @scope4/agent test
 *
 * Test groups:
 *   1. CBAM Layer — embedded tCO₂ and certificate cost
 *   2. CBAM Layer — layer independence (transport NEVER in CBAM exposure)
 *   3. CBAM Layer — intensity source priority logic
 *   4. BI Layer — transport tCO₂ and portfolio carbon
 *   5. Confidence level logic
 * ==============================================================================
 */

import { describe, it, expect } from 'vitest'
import { runCalculation } from './calculation'
import type { ValidationResult, SellerAttestation, TradeRecord } from '@scope4/types'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const validValidation: ValidationResult = { passed: true, flags: [], confidence: 'high' }

const failedValidation: ValidationResult = {
  passed: false,
  flags: ['Product type mismatch: seller declared "steel", importer reported "cement"'],
  confidence: 'low',
}

const turkeySteelSeller: SellerAttestation = {
  id: 'test-s1', trade_id: 'DEMO-TR-STEEL-001',
  seller_name: 'Karabük Demir Çelik A.Ş.', seller_wallet: 'DEMO_SELLER_WALLET',
  facility_id: 'FAC-TR-001', product_type: 'steel',
  emissions_intensity_tco2_per_t: 1.89, methodology: 'direct_measure',
  supporting_doc_url: null,
  doc_bundle_hash: 'abc123', solana_tx: null,
  submitted_at: new Date().toISOString(),
}

const turkeySteelTrade: TradeRecord = {
  id: 'test-t1', trade_id: 'DEMO-TR-STEEL-001',
  importer_name: 'Ferretti Imports S.r.l.', importer_wallet: 'DEMO_IMPORTER_WALLET',
  seller_ref: 'Karabük Demir Çelik A.Ş.', product_type: 'steel',
  quantity_kg: 500000,
  origin_country: 'TR', destination_country: 'IT',
  invoice_ref: 'INV-001', purchase_date: '2026-06-01',
  doc_bundle_hash: 'def456', solana_tx: null,
  submitted_at: new Date().toISOString(),
}

const chinaSteelTrade: TradeRecord = {
  ...turkeySteelTrade,
  origin_country: 'CN',
}

// ─── CBAM Layer Tests ─────────────────────────────────────────────────────────

describe('CBAM Reporting Layer', () => {

  it('calculates cbam_embedded_tco2 correctly for Turkish steel (500t × 1.89)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 500,000 kg / 1000 = 500 tonnes × 1.89 tCO₂/t = 945 tCO₂
    expect(result.cbam_embedded_tco2).toBeCloseTo(945, 1)
  })

  it('cbam_exposure_eur = cbam_embedded_tco2 × 50 (NOT total with transport)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 945 × 50 = €47,250 (transport_tco2 must NOT be added here)
    expect(result.cbam_exposure_eur).toBeCloseTo(47250, 0)
  })

  it('CRITICAL — cbam_exposure_eur NEVER includes transport_tco2 (layer independence)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // The correct CBAM figure uses embedded tCO₂ only
    const expectedFromEmbeddedOnly = result.cbam_embedded_tco2 * 50
    expect(result.cbam_exposure_eur).toBeCloseTo(expectedFromEmbeddedOnly, 1)
    // If this fails, transport is leaking into CBAM — fix immediately
    const wrongValueWithTransport = (result.cbam_embedded_tco2 + result.transport_tco2) * 50
    expect(result.cbam_exposure_eur).not.toBeCloseTo(wrongValueWithTransport, -1)
  })

  it('uses seller_direct intensity when validation passes and methodology is direct_measure', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    expect(result.intensity_source).toBe('seller_direct')
    expect(result.intensity_value_used).toBe(1.89)
  })

  it('falls back to seller_default when methodology is default_value', async () => {
    const sellerDefault = { ...turkeySteelSeller, methodology: 'default_value' as const }
    const result = await runCalculation(validValidation, sellerDefault, turkeySteelTrade)
    expect(result.intensity_source).toBe('seller_default')
    // Still uses seller's declared value, not the system default
    expect(result.intensity_value_used).toBe(1.89)
  })

  it('falls back to seller_default when methodology is national_grid', async () => {
    const sellerGrid = { ...turkeySteelSeller, methodology: 'national_grid' as const }
    const result = await runCalculation(validValidation, sellerGrid, turkeySteelTrade)
    expect(result.intensity_source).toBe('seller_default')
  })

  it('falls back to system_default when direct_measure but validation failed', async () => {
    const result = await runCalculation(failedValidation, turkeySteelSeller, turkeySteelTrade)
    // Validation failed, so direct_measure is not trusted — falls through to system_default
    expect(result.intensity_source).toBe('system_default')
    // System default for TR steel = 1.89 (same in this case, but source flag is different)
    expect(result.intensity_source).not.toBe('seller_direct')
  })

})

// ─── BI Layer Tests ───────────────────────────────────────────────────────────

describe('Business Intelligence Layer', () => {

  it('calculates transport_tco2 for TR→IT route (2200km, sea_short factor)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 500t × 2200km × 0.000010 tCO₂/t·km = 11.0 tCO₂ (sea_short ≤3000km)
    expect(result.transport_tco2).toBeCloseTo(11.0, 1)
    expect(result.distance_km).toBe(2200)
    expect(result.transport_factor_used).toBe(0.000010)
  })

  it('uses sea_medium factor for CN→IT route (19800km > 3000km)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, chinaSteelTrade)
    // 500t × 19800km × 0.000012 = 118.8 tCO₂
    expect(result.transport_tco2).toBeCloseTo(118.8, 1)
    expect(result.transport_factor_used).toBe(0.000012)
  })

  it('portfolio_carbon_tco2 = cbam_embedded_tco2 + transport_tco2 (BI only)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    const expected = result.cbam_embedded_tco2 + result.transport_tco2
    expect(result.portfolio_carbon_tco2).toBeCloseTo(expected, 2)
    // portfolio > embedded (always, because transport > 0)
    expect(result.portfolio_carbon_tco2).toBeGreaterThan(result.cbam_embedded_tco2)
  })

  it('portfolio_carbon_tco2 is NOT used in cbam_exposure_eur', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    const wrongCbamIfPortfolioUsed = result.portfolio_carbon_tco2 * 50
    expect(result.cbam_exposure_eur).not.toBeCloseTo(wrongCbamIfPortfolioUsed, 0)
  })

})

// ─── Confidence level tests ───────────────────────────────────────────────────

describe('Confidence level logic', () => {

  it('is high when validation passes and source is seller_direct with no flags', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    expect(result.confidence).toBe('high')
    expect(result.confidence_notes).toHaveLength(0)
  })

  it('is medium when seller uses default_value methodology', async () => {
    const sellerDefault = { ...turkeySteelSeller, methodology: 'default_value' as const }
    const result = await runCalculation(validValidation, sellerDefault, turkeySteelTrade)
    expect(result.confidence).toBe('medium')
    expect(result.confidence_notes.length).toBeGreaterThan(0)
  })

  it('is low when falling back to system_default', async () => {
    const result = await runCalculation(failedValidation, turkeySteelSeller, turkeySteelTrade)
    expect(result.confidence).toBe('low')
  })

})
