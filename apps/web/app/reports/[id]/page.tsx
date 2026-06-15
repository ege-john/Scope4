'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { BundleDetailResponse } from '@scope4/types'
import ReactMarkdown from 'react-markdown'
import SolanaLink from '@/components/ui/SolanaLink'
import Badge from '@/components/ui/Badge'

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
      </div>

      {/* Emissions summary */}
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

      {/* Emissions breakdown table */}
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

      {/* AI-generated report text */}
      {report.report_text && (
        <div className="card">
          <h2 className="text-sm font-semibold text-muted" style={{ marginBottom: 16 }}>
            AI Analysis (Gemini)
          </h2>
          <div style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: 14,
          }}>
            <ReactMarkdown>{report.report_text}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Audit trail */}
      {audit_trail && audit_trail.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="text-sm font-semibold text-muted">Audit Trail</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Actor</th>
                <th>Timestamp</th>
                <th>Solana TX</th>
              </tr>
            </thead>
            <tbody>
              {audit_trail.map((event) => (
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
      )}
    </div>
  )
}
