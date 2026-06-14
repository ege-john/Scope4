'use client'
import useSWR from 'swr'
import { apiGet } from '@/lib/api'
import type { DashboardSummaryResponse, BundleStatus } from '@scope4/types'
import EmissionsByCountryBar from '@/components/charts/EmissionsByCountryBar'
import EmissionsByProductDonut from '@/components/charts/EmissionsByProductDonut'
import MonthlyTrendArea from '@/components/charts/MonthlyTrendArea'
import AIInsightCard from '@/components/charts/AIInsightCard'
import styles from './page.module.css'

const STATUS_ORDER: BundleStatus[] = ['awaiting_parties', 'ready', 'processing', 'complete', 'failed']
const STATUS_LABELS: Record<BundleStatus, string> = {
  awaiting_parties: 'Awaiting', ready: 'Ready', processing: 'Processing',
  complete: 'Complete', failed: 'Failed'
}

function BigNumber({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="card">
      <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardSummaryResponse>(
    '/api/dashboard/summary',
    (url: string) => apiGet(url),
    { refreshInterval: 10000 }
  )

  if (isLoading || !data) {
    return <div className="grid-4" style={{ gap: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
    </div>
  }

  const insight = data.latest_insight
  const counts = data.bundle_counts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-3xl font-extrabold">Carbon Intelligence Dashboard</h1>
        <p className="text-secondary">Real-time CBAM compliance analytics for your import portfolio</p>
      </div>

      {/* ── CBAM Reporting Layer KPIs ── */}
      <div style={{ marginBottom: 4 }}>
        <div className="text-xs font-semibold" style={{ color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          ― CBAM Reporting Layer — Production-embedded emissions only (EU Reg 2023/956)
        </div>
        <div className="grid-4">
          <BigNumber label="CBAM-liable Embedded tCO₂" value={insight ? insight.total_tco2.toFixed(0) : '—'} unit="tCO₂" color="var(--accent-green)" />
          <BigNumber label="Estimated CBAM Exposure ★" value={insight ? `€${(insight.total_cbam_eur / 1000).toFixed(0)}k` : '—'} color="var(--accent-amber)" />
          <BigNumber label="Complete Bundles" value={String(counts.complete)} color="var(--accent-green)" />
          <BigNumber label="Pending" value={String(counts.awaiting_parties + counts.ready + counts.processing)} color="var(--accent-blue)" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          ★ Estimate only. Certificate price placeholder: €50/tCO₂. Real CBAM uses EUA market price at time of declaration.
        </p>
      </div>

      {/* ── Bundle pipeline ── */}
      <div className="card">
        <h3 className="text-lg font-semibold" style={{ marginBottom: 16 }}>Bundle Pipeline</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {STATUS_ORDER.map(s => (
            <div key={s} className={`badge badge-${s}`} style={{ fontSize: 13, padding: '8px 16px' }}>
              {STATUS_LABELS[s]} · {counts[s] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2">
        {insight && <EmissionsByCountryBar data={insight.by_country} />}
        {insight && <EmissionsByProductDonut data={insight.by_product} />}
      </div>

      {/* Monthly trend */}
      {insight && <MonthlyTrendArea data={insight.monthly_series} />}

      {/* AI Insight card */}
      {insight && <AIInsightCard text={insight.insight_text} topCountry={insight.top_country} topProduct={insight.top_product} />}
    </div>
  )
}
