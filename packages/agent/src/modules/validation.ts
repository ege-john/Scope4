/**
 * ==============================================================================
 * @scope4/agent — validation.ts
 * Member C — AI + Analytics Lead
 *
 * ValidationAgent: deterministic cross-checking of the 3 actor inputs.
 * Pure function — no database or external calls. Fully testable offline.
 *
 * Checks performed:
 *   1. Product type consistency (seller vs importer)
 *   2. Quantity consistency within ±5% tolerance (importer vs logistics)
 *   3. Emissions intensity plausibility range by product
 *   4. Origin confirmation from logistics partner
 *   5. Route confirmation from logistics partner
 *   6. Methodology quality flag (default_value lowers confidence)
 * ==============================================================================
 */

import type {
  ComplianceBundle,
  SellerAttestation,
  TradeRecord,
  LogisticsAttestation,
  ValidationResult,
} from '@scope4/types'

// Plausible emissions intensity ranges by product (tCO₂/t)
// Source: EU CBAM technical guidance + IPCC AR6
const PLAUSIBLE_RANGES: Record<string, [number, number]> = {
  steel:       [0.5,  5.0],
  cement:      [0.3,  1.5],
  aluminium:   [3.0, 20.0],
  fertilisers: [0.5,  5.0],
  electricity: [0.1,  1.5],  // per MWh
}

export async function runValidation(
  _bundle: ComplianceBundle,
  seller: SellerAttestation,
  trade: TradeRecord,
  logistics: LogisticsAttestation
): Promise<ValidationResult> {
  const flags: string[] = []
  let confidence: 'high' | 'medium' | 'low' = 'high'

  // ── Check 1: Product type consistency ────────────────────────────────────────
  if (seller.product_type !== trade.product_type) {
    flags.push(
      `Product type mismatch: seller declared "${seller.product_type}", importer reported "${trade.product_type}"`
    )
    confidence = 'low'
  }

  // ── Check 2: Quantity consistency (±5% tolerance) ─────────────────────────
  const qtyDiff =
    Math.abs(trade.quantity_kg - logistics.quantity_confirmed_kg) / trade.quantity_kg
  if (qtyDiff > 0.05) {
    flags.push(
      `Quantity discrepancy: importer reported ${trade.quantity_kg}kg, ` +
      `logistics confirmed ${logistics.quantity_confirmed_kg}kg ` +
      `(${(qtyDiff * 100).toFixed(1)}% diff)`
    )
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // ── Check 3: Emissions intensity plausibility ──────────────────────────────
  const range = PLAUSIBLE_RANGES[seller.product_type]
  if (range) {
    const [min, max] = range
    if (
      seller.emissions_intensity_tco2_per_t < min ||
      seller.emissions_intensity_tco2_per_t > max
    ) {
      flags.push(
        `Seller intensity (${seller.emissions_intensity_tco2_per_t} tCO₂/t) is outside ` +
        `plausible range [${min}, ${max}] for ${seller.product_type}`
      )
      confidence = 'low'
    }
  }

  // ── Check 4: Origin confirmation ──────────────────────────────────────────
  if (!logistics.origin_confirmed) {
    flags.push('Logistics partner did not confirm origin country')
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // ── Check 5: Route confirmation ───────────────────────────────────────────
  if (!logistics.route_confirmed) {
    flags.push('Logistics partner did not confirm shipping route')
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // ── Check 6: Methodology quality ──────────────────────────────────────────
  if (seller.methodology === 'default_value') {
    flags.push(
      'Seller used default value methodology — direct measurement preferred for higher confidence'
    )
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // Validation fails only on hard discrepancies (mismatch, range violation)
  const passed = !flags.some(f =>
    f.includes('mismatch') ||
    f.includes('discrepancy') ||
    f.includes('outside plausible')
  )

  return { passed, flags, confidence }
}
