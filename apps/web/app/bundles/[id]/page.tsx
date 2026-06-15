'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { BundleDetailResponse } from '@scope4/types'
import Badge from '@/components/ui/Badge'
import Timeline from '@/components/ui/Timeline'
import SolanaLink from '@/components/ui/SolanaLink'
import Spinner from '@/components/ui/Spinner'

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<BundleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function load() {
    return apiGet<BundleDetailResponse>(`/api/bundles/${id}`)
      .then((d) => {
        setData(d)
        return d
      })
      .catch(() => null)
  }

  useEffect(() => {
    load().then((d) => {
      setLoading(false)
      if (d && (d.bundle.bundle_status === 'processing' || d.bundle.bundle_status === 'ready')) {
        intervalRef.current = setInterval(async () => {
          const fresh = await load()
          if (fresh && fresh.bundle.bundle_status !== 'processing' && fresh.bundle.bundle_status !== 'ready') {
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        }, 5000)
      }
    })
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 36, width: '40%' }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <p className="text-muted">Bundle not found.</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => router.push('/bundles')}>
          ← Back to Bundles
        </button>
      </div>
    )
  }

  const { bundle, seller, trade, logistics, report } = data
  const isPolling = bundle.bundle_status === 'processing' || bundle.bundle_status === 'ready'

  const steps = [
    {
      label: 'Seller Attests',
      done: !!bundle.seller_attested_at,
      tx: seller?.solana_tx ?? null,
      timestamp: bundle.seller_attested_at ?? undefined,
    },
    {
      label: 'Importer Attests',
      done: !!bundle.importer_attested_at,
      tx: trade?.solana_tx ?? null,
      timestamp: bundle.importer_attested_at ?? undefined,
    },
    {
      label: 'Logistics Attests',
      done: !!bundle.logistics_attested_at,
      tx: logistics?.solana_tx ?? null,
      timestamp: bundle.logistics_attested_at ?? undefined,
    },
    {
      label: 'AI Processing',
      done: bundle.bundle_status === 'complete',
      tx: null,
      timestamp: bundle.completed_at ?? undefined,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 12 }}
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="text-2xl font-bold">Bundle</h1>
            <Badge status={bundle.bundle_status} />
            {isPolling && <Spinner size={16} />}
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {id}
          </p>
        </div>
        {report && (
          <button className="btn btn-primary" onClick={() => router.push(`/reports/${id}`)}>
            View Report →
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="text-sm font-semibold text-muted" style={{ marginBottom: 20 }}>Progress</h2>
        <Timeline steps={steps} />
      </div>

      {/* Attestation cards */}
      <div className="grid-3">
        {/* Seller card */}
        <div className={`card card-sm ${!seller ? 'opacity-50' : ''}`}>
          <div className="text-sm font-semibold text-muted" style={{ marginBottom: 12 }}>Seller Attestation</div>
          {seller ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div className="text-xs text-muted">Company</div>
                <div className="text-sm">{seller.seller_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Intensity</div>
                <div className="text-green font-semibold">{seller.emissions_intensity_tco2_per_t} tCO₂/t</div>
              </div>
              <div>
                <div className="text-xs text-muted">Methodology</div>
                <div className="text-sm">{seller.methodology.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Solana TX</div>
                <SolanaLink tx={seller.solana_tx} />
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm">Awaiting seller attestation.</p>
          )}
        </div>

        {/* Trade/Importer card */}
        <div className={`card card-sm ${!trade ? 'opacity-50' : ''}`}>
          <div className="text-sm font-semibold text-muted" style={{ marginBottom: 12 }}>Importer Trade Record</div>
          {trade ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div className="text-xs text-muted">Product</div>
                <div className="text-sm">{trade.product_type}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Quantity</div>
                <div className="text-sm">{(trade.quantity_kg / 1000).toFixed(0)} t</div>
              </div>
              <div>
                <div className="text-xs text-muted">Route</div>
                <div className="text-sm">{trade.origin_country} → {trade.destination_country}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Invoice</div>
                <div className="text-sm">{trade.invoice_ref}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Solana TX</div>
                <SolanaLink tx={trade.solana_tx} />
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm">Awaiting importer trade record.</p>
          )}
        </div>

        {/* Logistics card */}
        <div className={`card card-sm ${!logistics ? 'opacity-50' : ''}`}>
          <div className="text-sm font-semibold text-muted" style={{ marginBottom: 12 }}>Logistics Attestation</div>
          {logistics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div className="text-xs text-muted">Company</div>
                <div className="text-sm">{logistics.logistics_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Shipment Ref</div>
                <div className="text-sm">{logistics.shipment_ref}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Qty Confirmed</div>
                <div className="text-sm">{(logistics.quantity_confirmed_kg / 1000).toFixed(0)} t</div>
              </div>
              <div>
                <div className="text-xs text-muted">Dispatch</div>
                <div className="text-sm">{new Date(logistics.dispatch_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Solana TX</div>
                <SolanaLink tx={logistics.solana_tx} />
              </div>
            </div>
          ) : bundle.bundle_status === 'awaiting_parties' ? (
            <div>
              <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Awaiting logistics confirmation.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push(`/logistics/attest/${id}`)}
              >
                Confirm Shipment
              </button>
            </div>
          ) : (
            <p className="text-muted text-sm">Awaiting logistics attestation.</p>
          )}
        </div>
      </div>

      {/* AI status panel */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="text-sm font-semibold text-muted">AI Processing Status</h2>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <Spinner size={12} />
              Polling every 5s…
            </div>
          )}
        </div>

        {bundle.bundle_status === 'awaiting_parties' && (
          <p className="text-muted text-sm">Waiting for all three parties to attest before AI processing begins.</p>
        )}
        {bundle.bundle_status === 'ready' && (
          <p className="text-sm" style={{ color: 'var(--accent-amber)' }}>
            All attestations collected. AI agent will begin processing shortly…
          </p>
        )}
        {bundle.bundle_status === 'processing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Spinner size={20} />
            <p className="text-sm">Gemini AI agent is validating attestations and calculating CBAM obligations…</p>
          </div>
        )}
        {bundle.bundle_status === 'complete' && report && (
          <div>
            <p className="text-sm text-green" style={{ marginBottom: 12 }}>
              Processing complete. Compliance report generated.
            </p>
            <div className="grid-3" style={{ gap: 12 }}>
              <div className="card card-sm" style={{ background: 'var(--bg-card-alt)' }}>
                <div className="text-xs text-muted">Embedded Emissions</div>
                <div className="text-lg font-bold text-green">{report.total_embedded_tco2.toFixed(2)} tCO₂</div>
              </div>
              <div className="card card-sm" style={{ background: 'var(--bg-card-alt)' }}>
                <div className="text-xs text-muted">CBAM Certificates Required</div>
                <div className="text-lg font-bold" style={{ color: 'var(--accent-amber)' }}>
                  {report.cbam_certificates_required.toFixed(2)}
                </div>
              </div>
              <div className="card card-sm" style={{ background: 'var(--bg-card-alt)' }}>
                <div className="text-xs text-muted">EU Carbon Price (€/tCO₂)</div>
                <div className="text-lg font-bold">€{report.eu_carbon_price_eur_per_t.toFixed(0)}</div>
              </div>
            </div>
          </div>
        )}
        {bundle.bundle_status === 'failed' && (
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
            Processing failed. Please contact support or retry the bundle.
          </p>
        )}
      </div>
    </div>
  )
}
