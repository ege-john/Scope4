'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import type { BundleDetailResponse } from '@scope4/types'
import SolanaLink from '@/components/ui/SolanaLink'
import Badge from '@/components/ui/Badge'

export default function LogisticsAttestPage() {
  const { trade_id } = useParams<{ trade_id: string }>()
  const router = useRouter()
  const [detail, setDetail] = useState<BundleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ solana_tx: string } | null>(null)
  const [form, setForm] = useState({
    logistics_name: 'MSC Mediterranean Shipping',
    logistics_wallet: '8vkjdjQx2PS1HXhdNbfAcMjogKKPkDa6di5He62BCM1N',
    shipment_ref: '',
    quantity_confirmed_kg: 0,
    origin_confirmed: false,
    route_confirmed: false,
    dispatch_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    apiGet<BundleDetailResponse>(`/api/bundles/${trade_id}`)
      .then((d) => {
        setDetail(d)
        if (d.trade) {
          setForm((f) => ({
            ...f,
            shipment_ref: `SHP-${trade_id}`,
            quantity_confirmed_kg: d.trade!.quantity_kg,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [trade_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = await apiPost<{ solana_tx: string }>('/api/attestations/logistics', {
        trade_id,
        ...form,
      })
      setResult(data)
    } catch (err) {
      alert('Submission failed — is the API running?\n' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 32, width: '40%' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
    )
  }

  if (result) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 className="text-xl font-bold text-green" style={{ marginBottom: 8 }}>
            Shipment Confirmed on Solana
          </h2>
          <p className="text-secondary" style={{ marginBottom: 16 }}>
            All three parties have attested. The AI agent will process this bundle shortly.
          </p>
          <SolanaLink tx={result.solana_tx} />
          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => router.push(`/bundles/${trade_id}`)}>
              Watch AI Processing →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="text-2xl font-bold">Confirm Shipment</h1>
        <p className="text-secondary" style={{ marginTop: 4 }}>
          Review the trade details and confirm what you can verify independently.
        </p>
      </div>

      {/* Read-only trade summary */}
      {detail && (
        <div className="card card-sm" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="text-sm font-semibold text-muted">Trade Summary</span>
            <Badge status={detail.bundle.bundle_status} />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <div className="text-muted text-xs">Trade ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{trade_id}</div>
            </div>
            {detail.trade && (
              <>
                <div>
                  <div className="text-muted text-xs">Product</div>
                  <div>{detail.trade.product_type}</div>
                </div>
                <div>
                  <div className="text-muted text-xs">Quantity</div>
                  <div>{(detail.trade.quantity_kg / 1000).toFixed(0)} t</div>
                </div>
                <div>
                  <div className="text-muted text-xs">Route</div>
                  <div>{detail.trade.origin_country} → {detail.trade.destination_country}</div>
                </div>
              </>
            )}
            {detail.seller && (
              <div>
                <div className="text-muted text-xs">Seller Intensity</div>
                <div className="text-green">{detail.seller.emissions_intensity_tco2_per_t} tCO₂/t</div>
              </div>
            )}
            {detail.trade?.solana_tx && (
              <div>
                <div className="text-muted text-xs">Importer TX</div>
                <SolanaLink tx={detail.trade.solana_tx} />
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Logistics Company Name</label>
          <input
            className="form-input"
            value={form.logistics_name}
            onChange={(e) => setForm((f) => ({ ...f, logistics_name: e.target.value }))}
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Shipment Reference</label>
            <input
              className="form-input"
              placeholder="e.g. SHP-TR-2026-001"
              value={form.shipment_ref}
              onChange={(e) => setForm((f) => ({ ...f, shipment_ref: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity Confirmed (kg)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={form.quantity_confirmed_kg}
              onChange={(e) => setForm((f) => ({ ...f, quantity_confirmed_kg: parseInt(e.target.value) }))}
              required
            />
            {detail?.trade && Math.abs(form.quantity_confirmed_kg - detail.trade.quantity_kg) / detail.trade.quantity_kg > 0.05 && (
              <small style={{ color: 'var(--accent-amber)', fontSize: 11 }}>
                ⚠ More than 5% difference from importer's declared quantity
              </small>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Dispatch Date</label>
          <input
            className="form-input"
            type="date"
            value={form.dispatch_date}
            onChange={(e) => setForm((f) => ({ ...f, dispatch_date: e.target.value }))}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.origin_confirmed}
              onChange={(e) => setForm((f) => ({ ...f, origin_confirmed: e.target.checked }))}
            />
            <span className="text-sm">I confirm the declared origin country matches the shipment</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.route_confirmed}
              onChange={(e) => setForm((f) => ({ ...f, route_confirmed: e.target.checked }))}
            />
            <span className="text-sm">I confirm the shipping route and destination</span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px 24px', marginTop: 4 }} disabled={submitting}>
          {submitting ? 'Recording on Solana…' : 'Confirm Shipment'}
        </button>
      </form>
    </div>
  )
}
