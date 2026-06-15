/**
 * ==============================================================================
 * @scope4/agent — calculation.ts
 * Member C — AI + Analytics Lead
 *
 * EmissionsCalculationAgent: deterministic CBAM + BI layer calculation.
 * Pure function — no database or external calls. Fully testable offline.
 *
 * CBAM/BI LAYER SEPARATION (V2 — legally required):
 *
 *   CBAM Reporting Layer (EU Reg 2023/956):
 *     cbam_embedded_tco2 = quantity_t × intensity_tco2_per_t
 *     cbam_exposure_eur  = cbam_embedded_tco2 × 50  ← ONLY this, NEVER + transport
 *
 *   Business Intelligence Layer (internal analytics only):
 *     transport_tco2      = quantity_t × distance_km × transport_factor
 *     portfolio_carbon    = cbam_embedded_tco2 + transport_tco2
 *
 * Intensity source priority:
 *   1. seller_direct   — seller used direct_measure AND validation passed
 *   2. seller_default  — seller declared a value but used default/grid methodology
 *   3. system_default  — fallback to internal EU CBAM default dataset
 * ==============================================================================
 */

import type {
  SellerAttestation,
  TradeRecord,
  ValidationResult,
  CalculationResult,
} from '@scope4/types'

import factors from './data/emissions_factors.json' assert { type: 'json' }

type CountryFactors = Record<string, Record<string, { intensity_tco2_per_t?: number; intensity_tco2_per_mwh?: number }>>

export async function runCalculation(
  validationResult: ValidationResult,
  seller: SellerAttestation,
  trade: TradeRecord
): Promise<CalculationResult> {
  const quantity_t = trade.quantity_kg / 1000

  // ── Step 1: Determine emissions intensity source ───────────────────────────
  let intensity_tco2_per_t: number
  let intensity_source: 'seller_direct' | 'seller_default' | 'system_default'
  const confidenceNotes: string[] = [...validationResult.flags]

  if (seller.methodology === 'direct_measure' && validationResult.passed) {
    // Priority 1: Seller provided direct measurement and validation passed
    intensity_tco2_per_t = seller.emissions_intensity_tco2_per_t
    intensity_source = 'seller_direct'
  } else if (
    seller.methodology === 'default_value' ||
    seller.methodology === 'national_grid'
  ) {
    // Priority 2: Seller declared a value, but not direct measurement
    intensity_tco2_per_t = seller.emissions_intensity_tco2_per_t
    intensity_source = 'seller_default'
    confidenceNotes.push('Using seller-declared default value — not directly measured')
  } else {
    // Priority 3: Fallback to internal EU CBAM default dataset
    const countryFactors = (factors.countries as CountryFactors)[trade.origin_country]
    const productFactor = countryFactors?.[trade.product_type]
    intensity_tco2_per_t =
      productFactor?.intensity_tco2_per_t ??
      productFactor?.intensity_tco2_per_mwh ??
      2.0
    intensity_source = 'system_default'
    confidenceNotes.push(
      `Using EU CBAM default intensity for ${trade.product_type} from ${trade.origin_country}`
    )
  }

  // ── Step 2: CBAM Reporting Layer — embedded production emissions ───────────
  const cbam_embedded_tco2 = quantity_t * intensity_tco2_per_t
  // CBAM exposure = embedded ONLY. Transport is NEVER included here.
  const cbam_exposure_eur = cbam_embedded_tco2 * factors.cbam_certificate_price_eur_per_tco2

  // ── Step 3: BI Layer — transport emissions ────────────────────────────────
  const distanceKey = `${trade.origin_country}_${trade.destination_country}`
  const distance_km =
    (factors.distances_km as Record<string, number>)[distanceKey] ?? 5000

  // Choose sea transport factor based on route distance
  let transport_factor: number
  if (distance_km <= factors.transport.sea_short.max_km) {
    transport_factor = factors.transport.sea_short.tco2_per_tkm
  } else {
    transport_factor = factors.transport.sea_medium.tco2_per_tkm
  }

  const transport_tco2 = quantity_t * distance_km * transport_factor

  // ── Step 4: Portfolio carbon footprint (BI only, never used for CBAM) ──────
  const portfolio_carbon_tco2 = cbam_embedded_tco2 + transport_tco2

  // ── Step 5: Final confidence level ───────────────────────────────────────
  // seller_direct + no flags → high
  // seller_default (declared but not measured) → medium (at best)
  // system_default (EU fallback) → low
  // otherwise inherit from validation confidence (capped at medium)
  const confidence =
    intensity_source === 'system_default'
      ? 'low'
      : intensity_source === 'seller_default'
      ? 'medium'
      : confidenceNotes.length === 0
      ? 'high'
      : validationResult.confidence === 'high'
      ? 'medium'
      : validationResult.confidence

  return {
    // ── CBAM Reporting Layer
    cbam_embedded_tco2: parseFloat(cbam_embedded_tco2.toFixed(3)),
    cbam_exposure_eur:  parseFloat(cbam_exposure_eur.toFixed(2)),
    // ── BI Layer
    transport_tco2:         parseFloat(transport_tco2.toFixed(3)),
    portfolio_carbon_tco2:  parseFloat(portfolio_carbon_tco2.toFixed(3)),
    // ── Metadata
    intensity_source,
    intensity_value_used: intensity_tco2_per_t,
    distance_km,
    transport_factor_used: transport_factor,
    confidence,
    confidence_notes: confidenceNotes,
  }
}
