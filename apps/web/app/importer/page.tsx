'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { truncateId } from '@/lib/format'
import type { ComplianceBundle } from '@scope4/types'
import Badge from '@/components/ui/Badge'

export default function ImporterPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<ComplianceBundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<ComplianceBundle[]>('/api/bundles')
      .then(setBundles)
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-2xl font-bold">Importer Portal</h1>
          <p className="text-secondary" style={{ marginTop: 4 }}>
            Manage your trade records and compliance bundles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/importer/trade/new')}>
          + New Trade Record
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 20, width: '50%' }} />
            <div className="skeleton" style={{ height: 20, width: '70%' }} />
            <div className="skeleton" style={{ height: 20, width: '40%' }} />
          </div>
        ) : bundles.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted">No trade records yet.</p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16 }}
              onClick={() => router.push('/importer/trade/new')}
            >
              Create your first trade record
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Completed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => (
                <tr
                  key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/bundles/${b.trade_id}`)}
                >
                  <td><span className="mono-id" title={b.trade_id}>{truncateId(b.trade_id)}</span></td>
                  <td><Badge status={b.bundle_status} /></td>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>{b.completed_at ? new Date(b.completed_at).toLocaleDateString() : '—'}</td>
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
