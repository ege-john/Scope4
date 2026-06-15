'use client'
import type { BundleStatus, DashboardInsight } from '@scope4/types'
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

const DEMO_INSIGHT: DashboardInsight = {
  id: 'demo-insight-1',
  computed_at: new Date().toISOString(),
  period_start: '2026-01-01',
  period_end: '2026-06-14',
  total_tco2: 4723.5,
  total_cbam_eur: 236175,
  top_country: 'TR',
  top_product: 'steel',
  top_supplier: 'Karabük Demir Çelik A.Ş.',
  insight_text: 'Turkish steel imports account for **71% of your total CBAM exposure** this quarter. Consider engaging directly with Karabük Demir Çelik to obtain direct measurement methodology data — this could reduce your declared intensity by up to 18% compared to default values. Two bundles are currently awaiting party attestations and may delay your Q2 reporting deadline.',
  by_country: {
    'Turkey': { tco2: 3354.7, eur: 167735 },
    'China':  { tco2: 1368.8, eur: 68440 },
  },
  by_product: {
    'Steel':      { tco2: 3890.2, eur: 194510 },
    'Cement':     { tco2: 512.6,  eur: 25630 },
    'Aluminium':  { tco2: 320.7,  eur: 16035 },
  },
  by_supplier: {
    'Karabük Demir Çelik A.Ş.': { tco2: 2834.1, eur: 141705 },
    'Shanghai Steel Co.':        { tco2: 1368.8, eur: 68440 },
    'Ankara Cement Works':       { tco2: 520.6,  eur: 26030 },
  },
  monthly_series: [
    { month: '2026-01', tco2: 612.3, eur: 30615 },
    { month: '2026-02', tco2: 784.1, eur: 39205 },
    { month: '2026-03', tco2: 956.8, eur: 47840 },
    { month: '2026-04', tco2: 823.5, eur: 41175 },
    { month: '2026-05', tco2: 892.4, eur: 44620 },
    { month: '2026-06', tco2: 654.4, eur: 32720 },
  ],
}

const DEMO_COUNTS: Record<BundleStatus, number> = {
  awaiting_parties: 6,
  ready: 2,
  processing: 0,
  complete: 5,
  failed: 0,
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
  const insight = DEMO_INSIGHT
  const counts = DEMO_COUNTS

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
          <BigNumber label="CBAM-liable Embedded tCO₂" value={insight.total_tco2.toFixed(0)} unit="tCO₂" color="var(--accent-green)" />
          <BigNumber label="Estimated CBAM Exposure ★" value={`€${(insight.total_cbam_eur / 1000).toFixed(0)}k`} color="var(--accent-amber)" />
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
        <EmissionsByCountryBar data={insight.by_country} />
        <EmissionsByProductDonut data={insight.by_product} />
      </div>

      {/* Monthly trend */}
      <MonthlyTrendArea data={insight.monthly_series} />

      {/* AI Insight card */}
      <AIInsightCard text={insight.insight_text} topCountry={insight.top_country} topProduct={insight.top_product} />
    </div>
  )
}
