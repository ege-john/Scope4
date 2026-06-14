/**
 * ==============================================================================
 * @scope4/agent — report.ts
 * Member C — AI + Analytics Lead
 *
 * ReportGenerationAgent: uses Gemini 1.5 Flash to generate a professional
 * CBAM compliance report in Markdown from structured calculation results.
 *
 * Key design rules enforced via system prompt:
 *   - CBAM Compliance section uses ONLY cbam_embedded_tco2 and cbam_exposure_eur
 *   - Carbon Footprint Overview section uses transport_tco2 and portfolio_carbon_tco2
 *   - The two sections are NEVER mixed (EU Reg 2023/956 compliance)
 *   - A local fallback report is generated if the LLM call fails
 * ==============================================================================
 */

import type { ComplianceBundle, ValidationResult, CalculationResult } from '@scope4/types'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const SYSTEM_PROMPT = `You are a professional CBAM (Carbon Border Adjustment Mechanism) compliance analyst.
You receive a structured JSON object with verified shipment data and calculation results.
Your task is to write a professional, readable compliance report in Markdown.

CRITICAL LEGAL ACCURACY RULES:
1. Do NOT invent, estimate, or change any numerical values. Use ONLY the numbers provided.
2. Your report MUST have two clearly separated sections:
   a) "## CBAM Compliance" — covers ONLY production-embedded emissions and certificate obligation.
      This section must NOT mention transport or logistics emissions.
   b) "## Carbon Footprint Overview" — covers the broader carbon story including transport.
      Clearly label this as an internal analytics metric, not part of the CBAM obligation.
3. In the CBAM Compliance section:
   - Use cbam_embedded_tco2 as the CBAM certificate obligation base.
   - Use cbam_exposure_eur as the estimated certificate cost.
   - Always state that cbam_exposure_eur uses a placeholder certificate price and is an estimate.
4. In the Carbon Footprint Overview section:
   - Use transport_tco2 for logistics/shipping emissions.
   - Use portfolio_carbon_tco2 for the combined footprint.
   - Clearly label these as BI-layer analytics, NOT CBAM-liable amounts.
5. Do NOT add carbon-reduction recommendations unless directly calculable from the input data.
6. Identify which data came from the seller, importer, and logistics partner.
7. Flag any validation issues with ⚠️ warnings.
8. Use professional compliance language — this document may be shown to auditors and judges.
9. Keep the report 400-600 words.
10. Structure: Summary → Parties → ## CBAM Compliance → ## Carbon Footprint Overview → Data Quality → Audit Trail → Conclusion

Output only the Markdown report. No preamble or meta-commentary.`

export async function generateReport(
  bundle: ComplianceBundle,
  validation: ValidationResult,
  calc: CalculationResult
): Promise<string> {
  const inputPayload = {
    trade_id: bundle.trade_id,
    bundle_status: bundle.bundle_status,
    timestamps: {
      seller_attested:    bundle.seller_attested_at,
      importer_attested:  bundle.importer_attested_at,
      logistics_attested: bundle.logistics_attested_at,
      bundle_ready:       bundle.ready_at,
    },
    validation: {
      passed:     validation.passed,
      flags:      validation.flags,
      confidence: validation.confidence,
    },
    cbam_reporting_layer: {
      // These are the ONLY figures that belong in the CBAM certificate obligation
      cbam_embedded_tco2:              calc.cbam_embedded_tco2,
      cbam_exposure_eur_estimate:      calc.cbam_exposure_eur,
      certificate_price_used_eur_per_tco2: 50,
      price_note: 'Placeholder. Real CBAM uses EUA market price at time of declaration.',
    },
    business_intelligence_layer: {
      // These figures extend the picture but are NOT part of the CBAM obligation
      transport_tco2:        calc.transport_tco2,
      portfolio_carbon_tco2: calc.portfolio_carbon_tco2,
      distance_km:           calc.distance_km,
      note: 'Transport emissions shown for internal carbon-footprint analytics only.',
    },
    data_quality: {
      intensity_source:        calc.intensity_source,
      intensity_value_tco2_per_t: calc.intensity_value_used,
      confidence:              calc.confidence,
      confidence_notes:        calc.confidence_notes,
    },
    audit_note:
      'All attestations recorded on Solana Devnet. Tx signatures available on bundle detail page.',
  }

  const prompt = `${SYSTEM_PROMPT}\n\nInput data:\n\`\`\`json\n${JSON.stringify(inputPayload, null, 2)}\n\`\`\``

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    if (!text || text.length < 100) {
      throw new Error('LLM returned empty or too-short report')
    }
    return text
  } catch (err) {
    console.error('[ReportAgent] LLM call failed, using fallback:', err)
    return generateFallbackReport(bundle.trade_id, calc)
  }
}

// ─── Local fallback (used when Gemini API is unavailable) ─────────────────────

function generateFallbackReport(trade_id: string, calc: CalculationResult): string {
  return `# CBAM Compliance Report — ${trade_id}

## Summary
This report covers a shipment processed through the Scope4 compliance platform. All three parties (seller, importer, logistics) have attested their respective data on Solana Devnet.

## CBAM Compliance
> CBAM liability is based on **production-embedded emissions only**, per EU Regulation 2023/956.
> Transport and logistics emissions are not included in the certificate obligation.

- **CBAM-liable embedded emissions**: ${calc.cbam_embedded_tco2.toFixed(2)} tCO₂
  _(based on ${calc.intensity_source} intensity of ${calc.intensity_value_used} tCO₂/t)_
- **Estimated CBAM certificate obligation**: €${calc.cbam_exposure_eur.toFixed(2)}
  _(€50/tCO₂ placeholder — actual CBAM uses EUA market price at time of declaration)_

## Carbon Footprint Overview _(Internal Analytics — Not CBAM-Liable)_
- **Transport/logistics emissions**: ${calc.transport_tco2.toFixed(2)} tCO₂
  _(${calc.distance_km} km sea route @ ${calc.transport_factor_used} tCO₂/t·km — dashboard BI metric only)_
- **Full portfolio carbon footprint**: ${calc.portfolio_carbon_tco2.toFixed(2)} tCO₂
  _(embedded + transport, for internal carbon-story analytics only)_

## Data Quality
- Intensity source: **${calc.intensity_source}**
- Confidence: **${calc.confidence}**
${calc.confidence_notes.length > 0 ? calc.confidence_notes.map(n => `- ⚠️ ${n}`).join('\n') : '- No quality flags raised.'}

## Audit Trail
All attestations are immutably recorded on Solana Devnet. Verify transaction signatures on Solana Explorer using the Tx links on the bundle detail page.

## Conclusion
This compliance report has been automatically generated by the Scope4 AI agent pipeline. The CBAM certificate obligation is based on verified, multi-party attested data. For auditing purposes, all underlying data is traceable to its on-chain attestation record.

*Report generated by Scope4 AI agent (fallback mode). For audit purposes, verify transaction signatures on Solana Explorer.*`
}
