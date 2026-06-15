import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase, getBundleWithAll, markBundleProcessing, markBundleComplete, writeAuditEvent } from '@scope4/db';

// ── Gemini setup ─────────────────────────────────────────────────────────────
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── AI processing for a single ready bundle ──────────────────────────────────
async function processBundle(tradeId: string) {
  console.log(`[AI Worker] Processing bundle: ${tradeId}`);

  const data = await getBundleWithAll(tradeId);
  if (!data) {
    console.error(`[AI Worker] Bundle not found: ${tradeId}`);
    return;
  }

  const { bundle, seller, trade, logistics } = data;

  // Mark as processing so UI shows spinner
  await markBundleProcessing(tradeId);

  const prompt = `
You are a CBAM (Carbon Border Adjustment Mechanism) compliance AI assistant.
Analyze the following trade attestation data and generate a compliance report.

TRADE DETAILS:
- Trade ID: ${tradeId}
- Product: ${trade?.product_type ?? 'unknown'}
- Quantity: ${trade?.quantity_kg ?? 0} kg (${((trade?.quantity_kg ?? 0) / 1000).toFixed(1)} tonnes)
- Origin Country: ${trade?.origin_country ?? 'unknown'}
- Destination Country: ${trade?.destination_country ?? 'unknown'}
- Invoice Reference: ${trade?.invoice_ref ?? 'N/A'}

SELLER ATTESTATION:
- Company: ${seller?.seller_name ?? 'unknown'}
- Facility ID: ${seller?.facility_id ?? 'unknown'}
- Emissions Intensity: ${seller?.emissions_intensity_tco2_per_t ?? 0} tCO₂/t
- Methodology: ${seller?.methodology ?? 'unknown'}

LOGISTICS ATTESTATION:
- Company: ${logistics?.logistics_name ?? 'unknown'}
- Shipment Ref: ${logistics?.shipment_ref ?? 'N/A'}
- Quantity Confirmed: ${logistics?.quantity_confirmed_kg ?? 0} kg
- Origin Confirmed: ${logistics?.origin_confirmed ?? false}
- Route Confirmed: ${logistics?.route_confirmed ?? false}
- Dispatch Date: ${logistics?.dispatch_date ?? 'N/A'}

CBAM CONTEXT:
- Embedded emissions = emissions_intensity × quantity_in_tonnes
- Transport emissions = estimate based on route (e.g. TR->IT ship ~0.05 tCO2/t).
- The EU ETS carbon price is approximately 65 EUR/tCO₂.

Please respond ONLY with a valid JSON object matching this exact structure:
{
  "validation_passed": true,
  "validation_flags": ["Missing data"],
  "intensity_source": "seller_direct",
  "embedded_tco2": 100.5,
  "cbam_exposure_eur": 5000.0,
  "transport_tco2": 50.2,
  "total_tco2": 150.7,
  "confidence_level": "high",
  "confidence_notes": ["Good data"],
  "report_text": "Summary here."
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const report = JSON.parse(clean);

    console.log(`[AI Worker] Gemini report for ${tradeId}:`, report);

    // Save report to DB
    const { error: insertErr } = await supabase.from('compliance_reports').insert({
      bundle_id: bundle.id,
      validation_passed: report.validation_passed,
      validation_flags: report.validation_flags,
      intensity_source: report.intensity_source,
      embedded_tco2: report.embedded_tco2,
      total_embedded_tco2: report.embedded_tco2,           // alias required by schema
      cbam_exposure_eur: report.cbam_exposure_eur,
      cbam_certificates_required: report.embedded_tco2,   // certificates = tCO2 amount
      eu_carbon_price_eur_per_t: 65,                       // EU ETS price used in prompt
      transport_tco2: report.transport_tco2,
      total_transport_tco2: report.transport_tco2,         // alias required by schema
      total_tco2: report.total_tco2,
      confidence_level: report.confidence_level,
      confidence_notes: report.confidence_notes,
      report_text: report.report_text,
      llm_model_used: 'gemini-2.5-flash',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error(`[AI Worker] DB insert error: ${insertErr.message}`);
      await writeAuditEvent({
        trade_id: tradeId,
        event_type: 'ai_processing_failed',
        actor_type: 'system',
        actor_identity: 'ai_worker',
        payload: { error: insertErr.message, report }
      });
      await supabase.from('compliance_bundles')
        .update({ bundle_status: 'failed' })
        .eq('trade_id', tradeId);
      return;
    }

    // Mark bundle complete
    await markBundleComplete(bundle.id);
    console.log(`[AI Worker] Bundle ${tradeId} completed successfully.`);

  } catch (err: any) {
    console.error(`[AI Worker] Error processing ${tradeId}:`, err.message);
    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'ai_processing_failed',
      actor_type: 'system',
      actor_identity: 'ai_worker',
      payload: { error: err.message, stack: err.stack }
    });
    await supabase.from('compliance_bundles')
      .update({ bundle_status: 'failed' })
      .eq('trade_id', tradeId);
  }
}

// ── Polling loop — runs every 15 seconds ─────────────────────────────────────
export function startAIWorker() {
  console.log('[AI Worker] Started — polling every 15s for ready bundles.');

  async function poll() {
    try {
      const { data: readyBundles } = await supabase
        .from('compliance_bundles')
        .select('trade_id')
        .in('bundle_status', ['ready', 'ready_for_processing'])  // cover both possible status strings
        .is('ai_triggered_at', null);

      if (readyBundles && readyBundles.length > 0) {
        console.log(`[AI Worker] Found ${readyBundles.length} ready bundle(s).`);
        for (const { trade_id } of readyBundles) {
          await processBundle(trade_id);
        }
      }
    } catch (err: any) {
      console.error('[AI Worker] Poll error:', err.message);
    }
  }

  // Run immediately on startup, then every 15 seconds
  poll();
  setInterval(poll, 15_000);
}
