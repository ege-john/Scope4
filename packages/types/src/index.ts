// ── Enums ────────────────────────────────────────────────────────────────────

export type ProductType = 'steel' | 'cement' | 'aluminium' | 'fertilisers' | 'electricity'
export type OriginCountry = 'TR' | 'CN'
export type DestinationCountry = 'IT' | 'DE' | 'FR' | 'ES' | 'NL'
export type Methodology = 'direct_measure' | 'default_value' | 'national_grid'
export type BundleStatus = 'awaiting_parties' | 'ready' | 'processing' | 'complete' | 'failed'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type IntensitySource = 'seller_direct' | 'seller_default' | 'system_default'
export type ActorType = 'seller' | 'importer' | 'logistics' | 'system'

// ── Core entities ─────────────────────────────────────────────────────────────

export interface SellerAttestation {
  id: string
  trade_id: string
  seller_name: string
  seller_wallet: string
  facility_id: string
  product_type: ProductType
  emissions_intensity_tco2_per_t: number
  methodology: Methodology
  supporting_doc_url: string | null
  doc_bundle_hash: string
  solana_tx: string | null
  submitted_at: string
}

export interface TradeRecord {
  id: string
  trade_id: string
  importer_name: string
  importer_wallet: string
  seller_ref: string
  product_type: ProductType
  quantity_kg: number
  origin_country: OriginCountry
  destination_country: DestinationCountry
  invoice_ref: string
  purchase_date: string
  doc_bundle_hash: string
  solana_tx: string | null
  submitted_at: string
}

export interface LogisticsAttestation {
  id: string
  trade_id: string
  logistics_name: string
  logistics_wallet: string
  shipment_ref: string
  quantity_confirmed_kg: number
  origin_confirmed: boolean
  route_confirmed: boolean
  dispatch_date: string
  solana_tx: string | null
  attested_at: string
}

export interface ComplianceBundle {
  id: string
  trade_id: string
  seller_attestation_id: string | null
  trade_record_id: string | null
  logistics_attestation_id: string | null
  bundle_status: BundleStatus
  seller_attested_at: string | null
  importer_attested_at: string | null
  logistics_attested_at: string | null
  ready_at: string | null
  ai_triggered_at: string | null
  completed_at: string | null
  solana_bundle_pda: string | null
  created_at: string
}

export interface ComplianceReport {
  id: string
  bundle_id: string
  validation_passed: boolean
  validation_flags: string[]
  intensity_source: IntensitySource
  // ── CBAM Reporting Layer ──────────────────────────────────────────────────
  embedded_tco2: number           // production-embedded tCO₂ (CBAM base)
  total_embedded_tco2: number     // alias for embedded_tco2 (used in UI)
  cbam_exposure_eur: number       // embedded_tco2 × carbon price estimate
  cbam_certificates_required: number // certificates needed (= embedded_tco2)
  eu_carbon_price_eur_per_t: number  // carbon price used for the estimate
  // ── BI Layer ─────────────────────────────────────────────────────────────
  transport_tco2: number          // logistics/shipping emissions (BI only)
  total_transport_tco2: number    // alias for transport_tco2 (used in UI)
  total_tco2: number              // embedded + transport (portfolio, BI only)
  // ── Metadata ─────────────────────────────────────────────────────────────
  confidence_level: ConfidenceLevel
  confidence_notes: string[]
  report_text: string
  llm_model_used: string
  generated_at: string
  created_at: string
}

export interface AuditEvent {
  id: string
  trade_id: string
  event_type: string
  actor_type: ActorType
  actor_identity: string
  solana_tx: string | null
  payload: Record<string, unknown>
  occurred_at: string
  created_at: string   // alias for occurred_at (used in frontend pages)
}

export interface DashboardInsight {
  id: string
  computed_at: string
  period_start: string
  period_end: string
  total_tco2: number           // CBAM-liable embedded tCO₂ aggregate
  total_cbam_eur: number       // estimated CBAM certificate exposure
  top_country: string
  top_product: string
  top_supplier: string
  insight_text: string
  by_country: Record<string, { tco2: number; eur: number }>
  by_product: Record<string, { tco2: number; eur: number }>
  by_supplier: Record<string, { tco2: number; eur: number }>
  monthly_series: Array<{ month: string; tco2: number; eur: number }>
}

// ── AI Agent types ────────────────────────────────────────────────────────────

export interface ValidationResult {
  passed: boolean
  flags: string[]
  confidence: ConfidenceLevel
}

export interface CalculationResult {
  // ── CBAM Reporting Layer (regulatory obligation) ──────────────────────────
  // CBAM under EU Reg 2023/956 = production-embedded emissions ONLY.
  // Transport is NOT included in the CBAM certificate obligation.
  cbam_embedded_tco2: number    // base for CBAM certificate calculation
  cbam_exposure_eur: number     // cbam_embedded_tco2 × price_placeholder (estimate)

  // ── Business Intelligence Layer (internal analytics only) ─────────────────
  // These figures are shown in the dashboard carbon-story section.
  // They are NEVER added to cbam_exposure_eur.
  transport_tco2: number          // logistics/shipping emissions
  portfolio_carbon_tco2: number   // cbam_embedded_tco2 + transport_tco2

  // ── Calculation metadata ──────────────────────────────────────────────────
  intensity_source: IntensitySource
  intensity_value_used: number
  distance_km: number
  transport_factor_used: number
  confidence: ConfidenceLevel
  confidence_notes: string[]
}

// ── API request / response types ──────────────────────────────────────────────

export interface CreateBundleRequest {
  importer_name: string
  importer_wallet: string
}

export interface SubmitSellerAttestationRequest {
  trade_id: string
  seller_name: string
  seller_wallet: string
  facility_id: string
  product_type: ProductType
  emissions_intensity_tco2_per_t: number
  methodology: Methodology
  doc_bundle_hash: string
}

export interface SubmitTradeRecordRequest {
  trade_id: string
  importer_name: string
  importer_wallet: string
  seller_ref: string
  product_type: ProductType
  quantity_kg: number
  origin_country: OriginCountry
  destination_country: DestinationCountry
  invoice_ref: string
  purchase_date: string
  doc_bundle_hash: string
}

export interface SubmitLogisticsAttestationRequest {
  trade_id: string
  logistics_name: string
  logistics_wallet: string
  shipment_ref: string
  quantity_confirmed_kg: number
  origin_confirmed: boolean
  route_confirmed: boolean
  dispatch_date: string
}

export interface BundleDetailResponse {
  bundle: ComplianceBundle
  seller: SellerAttestation | null
  trade: TradeRecord | null
  logistics: LogisticsAttestation | null
  report: ComplianceReport | null
  audit_events: AuditEvent[]   // canonical field name (API response key)
  audit_trail: AuditEvent[]    // alias used by frontend pages
}

export interface DashboardSummaryResponse {
  latest_insight: DashboardInsight | null
  bundle_counts: Record<BundleStatus, number>
}

// ── Agent module function signatures ─────────────────────────────────────────
// Member A calls these; Member C implements them.

export type RunValidationFn = (
  bundle: ComplianceBundle,
  seller: SellerAttestation,
  trade: TradeRecord,
  logistics: LogisticsAttestation,
) => Promise<ValidationResult>

// CalculateCbamFn and RunCalculationFn are the same type — both names are kept
// for backward compatibility (A uses CalculateCbamFn, C uses RunCalculationFn).
export type CalculateCbamFn = (
  validationResult: ValidationResult,
  seller: SellerAttestation,
  trade: TradeRecord,
) => Promise<CalculationResult>

export type RunCalculationFn = CalculateCbamFn
