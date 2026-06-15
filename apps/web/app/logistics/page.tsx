'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { ComplianceBundle } from '@scope4/types'
import Badge from '@/components/ui/Badge'

export default function LogisticsPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<ComplianceBundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<ComplianceBundle[]>('/api/bundles')
      .then(setBundles)
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  const pending = bundles.filter(
    (b) => b.bundle_status === 'awaiting_parties' && b.logistics_attestation_id === null,
  )
  const completed = bundles.filter((b) => b.logistics_attestation_id !== null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-2xl font-bold">Logistics Portal</h1>
        <p className="text-secondary" style={{ marginTop: 4 }}>
          Review and confirm shipment details for pending bundles.
        </p>
      </div>

      {/* Pending attestations */}
      <div>
        <h2 className="text-lg font-semibold" style={{ marginBottom: 12 }}>
          Awaiting Your Confirmation
          {pending.length > 0 && (
            <span style={{
              marginLeft: 8, background: 'var(--accent-amber-dim)', color: 'var(--accent-amber)',
              padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700,
            }}>
              {pending.length}
            </span>
          )}
        </h2>
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32 }}>
              <div className="skeleton" style={{ height: 20, width: '50%' }} />
            </div>
          ) : pending.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p className="text-muted">No bundles awaiting logistics confirmation.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Trade ID</th>
                  <th>Created</th>
                  <th>Seller Attested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.trade_id}</td>
                    <td>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td>{b.seller_attested_at ? '✓' : '—'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => router.push(`/logistics/attest/${b.trade_id}`)}
                      >
                        Confirm Shipment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold" style={{ marginBottom: 12 }}>Confirmed</h2>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Trade ID</th>
                  <th>Status</th>
                  <th>Confirmed At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {completed.map((b) => (
                  <tr
                    key={b.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/bundles/${b.trade_id}`)}
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.trade_id}</td>
                    <td><Badge status={b.bundle_status} /></td>
                    <td>{b.logistics_attested_at ? new Date(b.logistics_attested_at).toLocaleString() : '—'}</td>
                    <td style={{ color: 'var(--accent-blue)', fontSize: 12 }}>View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
