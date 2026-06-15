/**
 * ==============================================================================
 * @scope4/agent — analytics.ts
 * Member C — AI + Analytics Lead
 *
 * AnalyticsInsightAgent: aggregates all completed compliance reports into
 * a DashboardInsight record, then uses Gemini to generate a narrative summary.
 *
 * Design notes:
 *   - Aggregations use cbam_embedded_tco2 for CBAM-liable totals (never transport)
 *   - portfolio_carbon_tco2 is tracked separately for the dual-series chart
 *   - The LLM narrative is short (2-3 sentences) — it's a dashboard card, not a report
 *   - A full local fallback narrative is provided for quota/API failure scenarios
 *
 * This module requires @scope4/db (Supabase client) to be available at runtime.
 * During unit tests or DEMO_MODE, import fixtures.ts instead.
 * ==============================================================================
 */

import type { DashboardInsight } from '@scope4/types'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ─── Main entry point (called by agent orchestrator after each completed bundle) ─

export async function runAnalytics(supabase: any): Promise<DashboardInsight> {
  // 1. Fetch all completed reports with their linked trade and seller data
  const { data: reports, error } = await supabase
    .from('compliance_reports')
    .select(`
      *,
      compliance_bundles (
        trade_id,
        bundle_status,
        seller_attestations ( seller_name, product_type, emissions_intensity_tco2_per_t ),
        trade_records ( quantity_kg, origin_country, destination_country )
      )
    `)
    .eq('compliance_bundles.bundle_status', 'complete')

  if (error) {
    console.error('[AnalyticsAgent] Supabase query error:', error)
    return generateEmptyInsight()
  }

  if (!reports || reports.length === 0) {
    return generateEmptyInsight()
  }

  // 2. Aggregate by country, product, supplier, month ─────────────────────────
  const byCountry:  Record<string, { tco2: number; eur: number }> = {}
  const byProduct:  Record<string, { tco2: number; eur: number }> = {}
  const bySupplier: Record<string, { tco2: number; eur: number }> = {}
  const monthlyMap: Record<string, { tco2: number; eur: number; portfolio_tco2: number }> = {}
  let totalCbamTco2 = 0
  let totalCbamEur  = 0

  for (const r of reports as any[]) {
    const bundle      = r.compliance_bundles
    const tradeRecord = bundle?.trade_records
    const sellerAttest = bundle?.seller_attestations

    const country  = tradeRecord?.origin_country  || 'unknown'
    const product  = sellerAttest?.product_type   || 'unknown'
    const supplier = sellerAttest?.seller_name    || 'unknown'
    const month    = (r.generated_at as string)?.slice(0, 7) || '2026-06'

    // Use CBAM-liable embedded tCO₂ for regulatory aggregations
    const cbam_tco2 = (r.embedded_tco2 ?? r.cbam_embedded_tco2 ?? 0) as number
    const cbam_eur  = (r.cbam_exposure_eur ?? 0) as number
    // Full portfolio carbon for the dual-series chart
    const full_tco2 = (r.total_tco2 ?? r.portfolio_carbon_tco2 ?? cbam_tco2) as number

    totalCbamTco2 += cbam_tco2
    totalCbamEur  += cbam_eur

    byCountry[country] = {
      tco2: (byCountry[country]?.tco2 ?? 0) + cbam_tco2,
      eur:  (byCountry[country]?.eur  ?? 0) + cbam_eur,
    }
    byProduct[product] = {
      tco2: (byProduct[product]?.tco2 ?? 0) + cbam_tco2,
      eur:  (byProduct[product]?.eur  ?? 0) + cbam_eur,
    }
    bySupplier[supplier] = {
      tco2: (bySupplier[supplier]?.tco2 ?? 0) + cbam_tco2,
      eur:  (bySupplier[supplier]?.eur  ?? 0) + cbam_eur,
    }
    monthlyMap[month] = {
      tco2:           (monthlyMap[month]?.tco2          ?? 0) + cbam_tco2,
      eur:            (monthlyMap[month]?.eur            ?? 0) + cbam_eur,
      portfolio_tco2: (monthlyMap[month]?.portfolio_tco2 ?? 0) + full_tco2,
    }
  }

  const topCountry  = Object.entries(byCountry).sort((a, b) => b[1].tco2 - a[1].tco2)[0]?.[0]  ?? ''
  const topProduct  = Object.entries(byProduct).sort((a, b) => b[1].tco2 - a[1].tco2)[0]?.[0]  ?? ''
  const topSupplier = Object.entries(bySupplier).sort((a, b) => b[1].tco2 - a[1].tco2)[0]?.[0] ?? ''

  const monthly_series = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, vals]) => ({ month, tco2: vals.tco2, eur: vals.eur }))

  // 3. Generate LLM narrative (2-3 sentence dashboard card) ───────────────────
  const insight_text = await generateInsightNarrative(
    totalCbamTco2, totalCbamEur, topCountry, topProduct, topSupplier, byCountry
  )

  const insight: Omit<DashboardInsight, 'id'> = {
    computed_at:  new Date().toISOString(),
    period_start: '2026-01-01',
    period_end:   new Date().toISOString().split('T')[0],
    total_tco2:      parseFloat(totalCbamTco2.toFixed(2)),
    total_cbam_eur:  parseFloat(totalCbamEur.toFixed(2)),
    top_country:  topCountry,
    top_product:  topProduct,
    top_supplier: topSupplier,
    insight_text,
    by_country:   byCountry,
    by_product:   byProduct,
    by_supplier:  bySupplier,
    monthly_series,
  }

  // 4. Persist to dashboard_insights table ────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from('dashboard_insights')
    .insert(insight)
    .select()
    .single()

  if (insertError) {
    console.error('[AnalyticsAgent] Failed to persist insight:', insertError)
    return { id: 'error', ...insight }
  }

  return data as DashboardInsight
}

// ─── LLM narrative helper ─────────────────────────────────────────────────────

async function generateInsightNarrative(
  totalTco2: number,
  totalEur: number,
  topCountry: string,
  topProduct: string,
  topSupplier: string,
  byCountry: Record<string, { tco2: number; eur: number }>
): Promise<string> {
  const prompt =
    `You are a CBAM compliance analyst. Write 2-3 concise, insightful sentences for a dashboard summary card.\n` +
    `Use ONLY these exact numbers: total CBAM-liable embedded emissions = ${totalTco2.toFixed(0)} tCO₂ ` +
    `and estimated CBAM exposure = €${totalEur.toFixed(0)}.\n` +
    `Top country: ${topCountry} (${byCountry[topCountry]?.tco2.toFixed(0) ?? 0} tCO₂). ` +
    `Top product: ${topProduct}. Top supplier: ${topSupplier}.\n` +
    `Do not make up any other numbers. Be specific and actionable.`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return (
      `Your portfolio has accumulated ${totalTco2.toFixed(0)} tCO₂ in embedded emissions, ` +
      `corresponding to an estimated €${totalEur.toFixed(0)} in CBAM certificate exposure. ` +
      `${topCountry} imports account for the largest share, primarily from ${topProduct} shipments sourced from ${topSupplier}.`
    )
  }
}

// ─── Empty state fallback ─────────────────────────────────────────────────────

function generateEmptyInsight(): DashboardInsight {
  return {
    id: 'empty',
    computed_at:  new Date().toISOString(),
    period_start: '2026-01-01',
    period_end:   new Date().toISOString().split('T')[0],
    total_tco2:     0,
    total_cbam_eur: 0,
    top_country:  '',
    top_product:  '',
    top_supplier: '',
    insight_text: 'No completed bundles yet. Submit your first shipment to generate insights.',
    by_country:   {},
    by_product:   {},
    by_supplier:  {},
    monthly_series: [],
  }
}
