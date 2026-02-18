'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { LRARow } from '@/types/lra'

interface ComparisonBarChartProps {
  data: LRARow[]
  metric: 'persenPendapatan' | 'persenBelanja'
  rataRata: number
  title: string
  subtitle: string
  kategori: string
}

const CustomTooltip = ({ active, payload, label, rataRata }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-value">Realisasi: <strong>{payload[0].value.toFixed(2)}%</strong></p>
      <p className="tooltip-avg">Rata-rata: {rataRata.toFixed(2)}%</p>
    </div>
  )
}

export default function ComparisonBarChart({
  data, metric, rataRata, title, subtitle, kategori
}: ComparisonBarChartProps) {
  // Filter & sort
  const valid  = data.filter(r => r[metric] > 0.05)
  const sorted = [...valid].sort((a, b) => b[metric] - a[metric])
  const combined = sorted.length > 40
    ? [...sorted.slice(0, 20), ...sorted.slice(-20)]
    : sorted

  const chartData = combined.map(r => ({
    name: r.daerah,
    value: parseFloat(r[metric].toFixed(2)),
    aboveAvg: r[metric] >= rataRata,
  }))

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <p className="chart-subtitle">{subtitle}</p>
        <p className="chart-avg">
          Rata-rata {kategori}: <strong>{rataRata.toFixed(2)}%</strong>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={440}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 60, left: 20, bottom: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#475569', fontFamily: 'Plus Jakarta Sans' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={(v) => `${v}%`}
            width={55}
          />
          <Tooltip
            content={<CustomTooltip rataRata={rataRata} />}
            cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          />
          <ReferenceLine
            y={rataRata}
            stroke="#f59e0b"
            strokeWidth={3}
            strokeDasharray="0"
            label={{
              value: `Rata-rata ${kategori}`,
              position: 'right',
              fontSize: 11,
              fill: '#0f2558',
              fontWeight: 700,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.aboveAvg ? '#10b981' : '#ef4444'}
                fillOpacity={0.9}
              />
            ))}
          </Bar>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>
            )}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend manual */}
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }} />
          Di atas rata-rata
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} />
          Di bawah rata-rata
        </span>
        <span className="legend-item">
          <span className="legend-line" style={{ background: '#f59e0b' }} />
          Rata-rata {kategori}
        </span>
      </div>
    </div>
  )
}
