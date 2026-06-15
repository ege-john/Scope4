'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Array<{ month: string; tco2: number; eur: number }>
}

export default function MonthlyTrendArea({ data }: Props) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: 20 }}>Monthly tCO₂ Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tco2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d992" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d992" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <YAxis tickFormatter={v => `${v}t`} tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f1723', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            formatter={(v: number) => [`${v.toFixed(1)} tCO₂`, 'Emissions']}
          />
          <Area type="monotone" dataKey="tco2" stroke="#00d992" fill="url(#tco2Grad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
