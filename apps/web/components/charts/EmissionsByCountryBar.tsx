'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Record<string, { tco2: number; eur: number }>
}

const COUNTRY_LABELS: Record<string, string> = { TR: '🇹🇷 Turkey', CN: '🇨🇳 China' }

export default function EmissionsByCountryBar({ data }: Props) {
  const chartData = Object.entries(data).map(([country, vals]) => ({
    country: COUNTRY_LABELS[country] || country,
    tco2: parseFloat(vals.tco2.toFixed(1)),
    eur: parseFloat(vals.eur.toFixed(0)),
  }))

  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: 20 }}>Emissions by Origin Country</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={(v) => `${v}t`} tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <YAxis type="category" dataKey="country" tick={{ fill: '#8b9cb8', fontSize: 12 }} width={90} />
          <Tooltip
            contentStyle={{ background: '#0f1723', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#f0f4ff' }}
            formatter={(val: number) => [`${val.toFixed(1)} tCO₂`, 'Emissions']}
          />
          <Bar dataKey="tco2" fill="#00d992" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
