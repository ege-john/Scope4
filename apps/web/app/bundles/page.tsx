'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { ComplianceBundle, BundleStatus } from '@scope4/types'
import Badge from '@/components/ui/Badge'

const ALL_STATUSES: BundleStatus[] = ['awaiting_parties', 'ready', 'processing', 'complete', 'failed']

export default function BundlesPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<ComplianceBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BundleStatus | 'all'>('all')

  useEffect(() => {
    apiGet<ComplianceBundle[]>('/api/bundles')
      .then(setBundles)
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  const counts: Record<BundleStatus | 'all', number> = {
    all: bundles.length,
    awaiting_parties: bundles.filter((b) => b.bundle_status === 'awaiting_parties').length,
    ready: bundles.filter((b) => b.bundle_status === 'ready').length,
    processing: bundles.filter((b) => b.bundle_status === 'processing').length,
    complete: bundles.filter((b) => b.bundle_status === 'complete').length,
    failed: bundles.filter((b) => b.bundle_status === 'failed').length,
  }

  const filtered = filter === 'all' ? bundles : bundles.filter((b) => b.bundle_status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-2xl font-bold">Compliance Bundles</h1>
        <p className="text-secondary" style={{ marginTop: 4 }}>
          All cross-border trade compliance packages across all parties.
        </p>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={filter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        {ALL_STATUSES.map((s) =>
          counts[s] > 0 ? (
            <button
              key={s}
              className={filter === s ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              onClick={() => setFilter(s)}
            >
              <Badge status={s} /> {counts[s]}
            </button>
          ) : null,
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 20 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p className="text-muted">No bundles match this filter.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Trade ID</th>
                <th>Status</th>
                <th>Seller</th>
                <th>Importer</th>
                <th>Created</th>
                <th>Completed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/bundles/${b.trade_id}`)}
                >
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.trade_id}</td>
                  <td><Badge status={b.bundle_status} /></td>
                  <td style={{ fontSize: 12 }}>{b.seller_attested_at ? '✓' : '—'}</td>
                  <td style={{ fontSize: 12 }}>{b.importer_attested_at ? '✓' : '—'}</td>
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
