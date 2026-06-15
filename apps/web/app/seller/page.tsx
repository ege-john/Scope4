'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { ComplianceBundle } from '@scope4/types'
import Badge from '@/components/ui/Badge'

export default function SellerPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<ComplianceBundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<ComplianceBundle[]>('/api/bundles')
      .then(setBundles)
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  const attested = bundles.filter((b) => b.seller_attestation_id !== null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-2xl font-bold">Seller Portal</h1>
          <p className="text-secondary" style={{ marginTop: 4 }}>
            Submit emissions declarations for your shipments.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/seller/attest/new')}>
          + New Attestation
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 20, width: '40%' }} />
            <div className="skeleton" style={{ height: 20, width: '60%' }} />
          </div>
        ) : attested.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted">No attestations submitted yet.</p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16 }}
              onClick={() => router.push('/seller/attest/new')}
            >
              Submit your first attestation
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Status</th>
                <th>Attested At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attested.map((b) => (
                <tr
                  key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/bundles/${b.trade_id}`)}
                >
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.trade_id}</td>
                  <td><Badge status={b.bundle_status} /></td>
                  <td>{b.seller_attested_at ? new Date(b.seller_attested_at).toLocaleString() : '—'}</td>
                  <td style={{ color: 'var(--accent-blue)', fontSize: 12 }}>View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
