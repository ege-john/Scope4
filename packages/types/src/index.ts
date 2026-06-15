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
  embedded_tco2: number
  transport_tco2: number
  total_tco2: number
  cbam_exposure_eur: number
  confidence_level: ConfidenceLevel
  confidence_notes: string[]
  report_text: string
  llm_model_used: string
  generated_at: string
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
}

export interface DashboardInsight {
  id: string
  computed_at: string
  period_start: string
  period_end: string
  total_tco2: number
  total_cbam_eur: number
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
  // CBAM Reporting Layer (regulatory — production-embedded only)
  cbam_embedded_tco2: number
  cbam_exposure_eur: number

  // Business Intelligence Layer (internal analytics — never added to CBAM)
  transport_tco2: number
  portfolio_carbon_tco2: number

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
  audit_events: AuditEvent[]
}

export interface DashboardSummaryResponse {
  latest_insight: DashboardInsight | null
  bundle_counts: Record<BundleStatus, number>
}

// ── Agent module function signatures ─────────────────────────────────────────

export type RunValidationFn = (
  bundle: ComplianceBundle,
  seller: SellerAttestation,
  trade: TradeRecord,
  logistics: LogisticsAttestation,
) => Promise<ValidationResult>

export type CalculateCbamFn = (
  validationResult: ValidationResult,
  seller: SellerAttestation,
  trade: TradeRecord,
) => Promise<CalculationResult>
