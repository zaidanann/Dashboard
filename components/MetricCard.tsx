'use client'

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  caption?: string
  icon?: string
  small?: boolean
}

export default function MetricCard({
  label, value, delta, deltaPositive = true, caption, icon, small = false
}: MetricCardProps) {
  return (
    <div className={`metric-card group ${small ? 'metric-card-small' : ''}`}>
      {icon && <span className={small ? 'metric-icon-small' : 'metric-icon'}>{icon}</span>}
      <p className="metric-label">{label}</p>
      <p className={small ? 'metric-value-small' : 'metric-value'}>{value}</p>
      {delta && (
        <span className={`metric-delta ${deltaPositive ? 'delta-positive' : 'delta-negative'}`}>
          {delta}
        </span>
      )}
      {caption && <p className="metric-caption">{caption}</p>}
    </div>
  )
}