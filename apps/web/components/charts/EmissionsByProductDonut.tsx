'use client'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

interface Props {
  data: Record<string, { tco2: number; eur: number }>
}

const COLORS = ['#00d992', '#3d91ff', '#8b9cb8', '#f5a623', '#e03e2d'];

export default function EmissionsByProductDonut({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([_, vals]) => vals.tco2 > 0)
    .map(([product, vals]) => ({
      name: product.charAt(0).toUpperCase() + product.slice(1),
      value: parseFloat(vals.tco2.toFixed(1)),
      eur: parseFloat(vals.eur.toFixed(0)),
    }))

  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: 20 }}>Emissions by Product Type</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0f1723', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#f0f4ff' }}
            formatter={(val: number, name: string, props: any) => [`${val.toFixed(1)} tCO₂ (€${props.payload.eur})`, 'Emissions']}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8b9cb8' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
