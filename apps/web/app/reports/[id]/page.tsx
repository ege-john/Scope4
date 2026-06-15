'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import type { BundleDetailResponse } from '@scope4/types'
import ReactMarkdown from 'react-markdown'
import Badge from '@/components/ui/Badge'
import SolanaLink from '@/components/ui/SolanaLink'
import styles from './page.module.css'

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<BundleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<BundleDetailResponse>(`/api/bundles/${id}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 36, width: '40%' }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
      </div>
    )
  }

  if (!data?.report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        {data?.bundle.bundle_status === 'processing' || data?.bundle.bundle_status === 'ready' ? (
          <>
            <p className="text-muted">Report is being generated…</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => router.push(`/bundles/${id}`)}>
              ← Watch AI Processing
            </button>
          </>
        ) : (
          <>
            <p className="text-muted">No report found for this bundle.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => router.back()}>
              ← Back
            </button>
          </>
        )}
      </div>
    )
  }

  const { bundle, seller, trade, logistics, report, audit_trail } = data

  const confidenceColor =
    report.confidence_level === 'high' ? 'var(--accent-green)' :
    report.confidence_level === 'medium' ? 'var(--accent-amber)' : 'var(--accent-red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }} onClick={() => router.push(`/bundles/${id}`)}>
            ← Back to Bundle
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="text-2xl font-bold">CBAM Compliance Report</h1>
            <Badge status={bundle.bundle_status} />
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {id} · Generated {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        {/* Confidence badge — Member C's design */}
        <div
          style={{
            border: `1px solid ${confidenceColor}`,
            color: confidenceColor,
            backgroundColor: `color-mix(in srgb, ${confidenceColor} 10%, transparent)`,
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          {report.confidence_level.toUpperCase()} CONFIDENCE
        </div>
      </div>

      {/* KPI row — Member B's 4-card layout */}
      <div className="grid-4">
        <div className="card card-sm">
          <div className="text-xs text-muted">Embedded Emissions</div>
          <div className="text-xl font-bold text-green" style={{ marginTop: 4 }}>
            {report.total_embedded_tco2.toFixed(2)} tCO₂
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>production only</div>
        </div>
        <div className="card card-sm">
          <div className="text-xs text-muted">Transport Emissions</div>
          <div className="text-xl font-bold" style={{ marginTop: 4, color: 'var(--accent-blue)' }}>
            {report.total_transport_tco2?.toFixed(2) ?? '—'} tCO₂
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>BI layer only</div>
        </div>
        <div className="card card-sm">
          <div className="text-xs text-muted">CBAM Certificates</div>
          <div className="text-xl font-bold" style={{ marginTop: 4, color: 'var(--accent-amber)' }}>
            {report.cbam_certificates_required.toFixed(2)}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>certificates required</div>
        </div>
        <div className="card card-sm">
          <div className="text-xs text-muted">EU Carbon Price</div>
          <div className="text-xl font-bold" style={{ marginTop: 4 }}>
            €{report.eu_carbon_price_eur_per_t.toFixed(0)}/t
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>
            est. liability: €{(report.cbam_certificates_required * report.eu_carbon_price_eur_per_t).toFixed(0)}
          </div>
        </div>
      </div>

      {/* CBAM / BI two-card row — Member C's visual separation design */}
      <div className="grid-2" style={{ gap: 24 }}>
        <div className={`card ${styles.cbamSection}`}>
          <div className={styles.sectionLabel}>CBAM Reporting Layer</div>
          <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>Regulatory scope (EU Reg 2023/956)</p>
          <div className={styles.metricsGrid}>
            <div>
              <div className="text-xs font-semibold text-secondary">Embedded Emissions</div>
              <div className="text-2xl font-bold">{report.embedded_tco2.toFixed(1)} <span className="text-sm">tCO₂</span></div>
            </div>
            <div>
              <div className="text-xs font-semibold text-secondary">Est. Exposure (€50/t)</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-amber)' }}>€{report.cbam_exposure_eur.toFixed(0)}</div>
            </div>
          </div>
        </div>
        <div className={`card ${styles.biSection}`}>
          <div className={styles.sectionLabel}>Business Intelligence Layer</div>
          <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>Internal analytics (Not CBAM-liable)</p>
          <div className={styles.metricsGrid}>
            <div>
              <div className="text-xs font-semibold text-secondary">Transport Emissions</div>
              <div className="text-2xl font-bold">{report.transport_tco2.toFixed(1)} <span className="text-sm">tCO₂</span></div>
            </div>
            <div>
              <div className="text-xs font-semibold text-secondary">Total tCO₂</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{report.total_tco2.toFixed(1)} <span className="text-sm">tCO₂</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Emissions breakdown table — Member B */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold text-muted">Emissions Breakdown</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {seller && (
              <tr>
                <td>Production Intensity</td>
                <td className="text-green">{seller.emissions_intensity_tco2_per_t}</td>
                <td>tCO₂/t</td>
                <td>{seller.methodology.replace('_', ' ')}</td>
              </tr>
            )}
            {trade && (
              <tr>
                <td>Quantity</td>
                <td>{(trade.quantity_kg / 1000).toFixed(1)}</td>
                <td>t</td>
                <td>Importer declaration</td>
              </tr>
            )}
            {logistics && (
              <tr>
                <td>Confirmed Quantity</td>
                <td>{(logistics.quantity_confirmed_kg / 1000).toFixed(1)}</td>
                <td>t</td>
                <td>Logistics attestation</td>
              </tr>
            )}
            <tr style={{ background: 'var(--bg-card-alt)' }}>
              <td><strong>Total Embedded</strong></td>
              <td className="text-green"><strong>{report.total_embedded_tco2.toFixed(3)}</strong></td>
              <td>tCO₂</td>
              <td>Calculated</td>
            </tr>
            {report.total_transport_tco2 != null && (
              <tr>
                <td>Transport (BI layer)</td>
                <td style={{ color: 'var(--accent-blue)' }}>{report.total_transport_tco2.toFixed(3)}</td>
                <td>tCO₂</td>
                <td>Logistics data</td>
              </tr>
            )}
            <tr style={{ background: 'var(--bg-card-alt)' }}>
              <td><strong>CBAM Certificates</strong></td>
              <td style={{ color: 'var(--accent-amber)' }}><strong>{report.cbam_certificates_required.toFixed(3)}</strong></td>
              <td>certificates</td>
              <td>EU ETS formula</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI-generated report — Member C's markdown styling */}
      {report.report_text && (
        <div className={`card ${styles.reportContent}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
              AI Analysis · {report.llm_model_used}
            </span>
          </div>
          <div className={styles.markdownBody}>
            <ReactMarkdown>{report.report_text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Sustainability impact context */}
      <div className="card" style={{ borderLeft: '3px solid var(--accent-green)', borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🌍</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--accent-green)', marginBottom: 6 }}>
              Why this compliance record matters
            </div>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.7, marginBottom: 10 }}>
              CBAM (EU Regulation 2023/956) ensures that carbon-intensive goods imported into the EU
              carry a fair carbon price — preventing carbon leakage and levelling the playing field for
              low-emission European producers. Every verified attestation on this report is an immutable,
              tamper-resistant record that protects both the importer and the planet.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {report.total_embedded_tco2 > 0 && (
                <div>
                  <div className="text-xs text-muted">Equivalent to</div>
                  <div className="text-sm font-semibold">
                    ~{Math.round(report.total_embedded_tco2 * 2).toLocaleString()} transatlantic flights
                  </div>
                </div>
              )}
              {report.total_embedded_tco2 > 0 && (
                <div>
                  <div className="text-xs text-muted">Now priced at</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--accent-amber)' }}>
                    ~€{(report.cbam_certificates_required * report.eu_carbon_price_eur_per_t).toLocaleString(undefined, { maximumFractionDigits: 0 })} CBAM obligation
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted">Verified by</div>
                <div className="text-sm font-semibold">3 independent parties · Solana blockchain</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit trail — Member B's table + Member C's per-attestation Solana links */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold text-muted">Solana Audit Trail</h2>
          <p className="text-xs text-secondary" style={{ marginTop: 4 }}>All attestations cryptographically verified on Solana Devnet</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Actor</th>
              <th>Party</th>
              <th>Timestamp</th>
              <th>Solana TX</th>
            </tr>
          </thead>
          <tbody>
            {seller && (
              <tr>
                <td>🏭 Seller</td>
                <td style={{ fontSize: 12 }}>{seller.seller_name}</td>
                <td style={{ fontSize: 12 }}>{new Date(seller.submitted_at).toLocaleString()}</td>
                <td><SolanaLink tx={seller.solana_tx} /></td>
              </tr>
            )}
            {trade && (
              <tr>
                <td>🏢 Importer</td>
                <td style={{ fontSize: 12 }}>{trade.importer_name}</td>
                <td style={{ fontSize: 12 }}>{new Date(trade.submitted_at).toLocaleString()}</td>
                <td><SolanaLink tx={trade.solana_tx} /></td>
              </tr>
            )}
            {logistics && (
              <tr>
                <td>🚢 Logistics</td>
                <td style={{ fontSize: 12 }}>{logistics.logistics_name}</td>
                <td style={{ fontSize: 12 }}>{new Date(logistics.attested_at).toLocaleString()}</td>
                <td><SolanaLink tx={logistics.solana_tx} /></td>
              </tr>
            )}
            {bundle.solana_bundle_pda && (
              <tr>
                <td>🤖 AI Agent</td>
                <td style={{ fontSize: 12 }}>Scope4 Compliance Agent</td>
                <td style={{ fontSize: 12 }}>{report.created_at ? new Date(report.created_at).toLocaleString() : '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>PDA: {bundle.solana_bundle_pda.slice(0, 12)}…</td>
              </tr>
            )}
            {/* Additional audit events if present */}
            {audit_trail && audit_trail.length > 0 && audit_trail.map((event) => (
              <tr key={event.id}>
                <td style={{ fontSize: 12 }}>{event.event_type}</td>
                <td style={{ fontSize: 12 }}>{event.actor_type}</td>
                <td style={{ fontSize: 12 }}>{new Date(event.created_at).toLocaleString()}</td>
                <td><SolanaLink tx={event.solana_tx ?? null} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
