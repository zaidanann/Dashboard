'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface GaugeChartProps {
  value: number      // 0–100
  title: string
  color?: string
}

export default function GaugeChart({ value, title, color = '#1e40af' }: GaugeChartProps) {
  const clamped = Math.min(Math.max(value, 0), 100)
  const data = [{ value: clamped, fill: color }]

  const statusColor =
    clamped >= 75 ? '#16a34a' :
    clamped >= 50 ? '#d97706' : '#dc2626'

  return (
    <div className="gauge-wrapper">
      <p className="gauge-title">{title}</p>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%" cy="80%"
            innerRadius="60%" outerRadius="100%"
            startAngle={180} endAngle={0}
            data={data}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            {/* Track */}
            <RadialBar
              background={{ fill: '#e2e8f0' }}
              dataKey="value"
              cornerRadius={8}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="gauge-center">
        <span className="gauge-value" style={{ color: statusColor }}>
          {clamped.toFixed(2)}%
        </span>
        <span className="gauge-ref">dari 100%</span>
      </div>
    </div>
  )
}
