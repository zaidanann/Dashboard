'use client'

import { useRef, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell, LabelList
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

/* ── Tooltip ── */
const CustomTooltip = ({ active, payload, label, rataRata }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  if (val === null || val === undefined) return null
  const diff = (val - rataRata).toFixed(2)
  const isAbove = val >= rataRata
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-value">Realisasi: <strong>{val.toFixed(2)}%</strong></p>
      <p className="tooltip-avg">Rata-rata: {rataRata.toFixed(2)}%</p>
      <p style={{ fontSize: 11, color: isAbove ? '#16a34a' : '#dc2626', marginTop: 2 }}>
        {isAbove ? `▲ +${diff}%` : `▼ ${diff}%`} dari rata-rata
      </p>
    </div>
  )
}

/* ── Label % vertikal di atas bar ── */
const BarPercentLabel = (props: any) => {
  const { x, y, width, value, isTop } = props
  if (value === null || value === undefined || value === 0) return null
  const cx = x + width / 2
  const ty = y - 4
  return (
    <text
      x={cx} y={ty}
      textAnchor="start"
      fontSize={9} fontWeight={700}
      fontFamily="Plus Jakarta Sans, Arial, sans-serif"
      fill={isTop ? '#047857' : '#b91c1c'}
      transform={`rotate(-90, ${cx}, ${ty})`}
    >
      {value.toFixed(2)}%
    </text>
  )
}

/* ── Kotak biru "N LAINNYA" ── */
const GapLabel = (props: any) => {
  const { x, y, width, height, value } = props
  if (!value) return null
  const boxW = width * 4
  const boxX = x - 2
  const cx   = boxX + boxW / 2
  const midY = y + height / 2
  return (
    <g>
      <rect x={boxX} y={midY - 26} width={boxW} height={52} rx={8} fill="#1e40af" opacity={0.93} />
      <text x={cx} y={midY - 8} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}
        fontFamily="Plus Jakarta Sans, Arial, sans-serif">{value}</text>
      <text x={cx} y={midY + 10} textAnchor="middle" fill="#bfdbfe" fontSize={10} fontWeight={600}
        fontFamily="Plus Jakarta Sans, Arial, sans-serif">LAINNYA</text>
    </g>
  )
}

/* ── Bar dengan tinggi minimum ── */
const MinBar = (props: any) => {
  const { x, y, width, height, fill, fillOpacity, radius } = props
  if (!fill || fill === 'transparent' || fillOpacity === 0) return null
  const MIN_H = 6
  const realH = Math.max(height ?? 0, MIN_H)
  const realY = y + (height ?? 0) - realH
  const r     = Math.min(radius?.[0] ?? 3, realH / 2)
  return (
    <rect x={x} y={realY} width={width} height={realH}
      rx={r} ry={r} fill={fill} fillOpacity={fillOpacity ?? 0.9} />
  )
}

/* ════════════════════════════════════════ */
/* Inner chart — dipakai di normal & fullscreen */
/* ════════════════════════════════════════ */
function ChartInner({ chartData, rataRata, kategori, metricLabel, TOP_N, BOTTOM_N, yMax, height = 500 }: any) {
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 80, right: 60, left: 10, bottom: 130 }} barCategoryGap="10%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 8.5, fill: '#374151', fontFamily: 'Plus Jakarta Sans, Arial' }}
            angle={-50} textAnchor="end" interval={0} tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={v => `${v}%`} width={52}
            domain={[0, yMax]} axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip rataRata={rataRata} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <ReferenceLine y={rataRata} stroke="#eab308" strokeWidth={3}
            label={{ value: `Rata-rata ${kategori}`, position: 'right', fontSize: 10, fill: '#92400e', fontWeight: 700 }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={42} isAnimationActive={false} shape={<MinBar />}>
            {chartData.map((entry: any, i: number) => (
              <Cell key={i}
                fill={entry.isGap ? 'transparent' : entry.color}
                fillOpacity={entry.isGap ? 0 : 0.90}
              />
            ))}
            <LabelList dataKey="value" content={(props: any) => {
              const row = chartData[props.index]
              if (!row || row.isGap) return null
              return <BarPercentLabel {...props} isTop={row.isTop} />
            }} />
            <LabelList dataKey="value" content={(props: any) => {
              const row = chartData[props.index]
              if (!row?.isGap || !row.gapLabel) return null
              return <GapLabel {...props} value={row.gapLabel} />
            }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Label bawah */}
      <div style={{ display: 'grid', gridTemplateColumns: `${TOP_N}fr 1.2fr ${BOTTOM_N}fr`, marginTop: -4, paddingInline: 62 }}>
        <div style={{ background: '#1e3a8a', color: '#fff', textAlign: 'center', padding: '9px 6px', borderRadius: '6px 0 0 6px', fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>
          {TOP_N} {kategori.toUpperCase()}<br />
          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>PERSENTASE REALISASI {metricLabel} TERBESAR</span>
        </div>
        <div />
        <div style={{ background: '#1e3a8a', color: '#fff', textAlign: 'center', padding: '9px 6px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>
          {BOTTOM_N} {kategori.toUpperCase()}<br />
          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>PERSENTASE REALISASI {metricLabel} TERKECIL</span>
        </div>
      </div>

      {/* Legend hitam */}
      <div style={{ background: '#111827', borderRadius: 8, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, padding: '10px 20px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f9fafb', fontSize: 11, fontWeight: 700 }}>
          <span style={{ width: 14, height: 14, background: '#16a34a', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ width: 14, height: 14, background: '#dc2626', borderRadius: 2, display: 'inline-block' }} />
          PERSENTASE REALISASI {metricLabel}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f9fafb', fontSize: 11, fontWeight: 700 }}>
          <span style={{ width: 28, height: 3, background: '#eab308', display: 'inline-block', borderRadius: 2 }} />
          RATA-RATA {kategori.toUpperCase()}
        </span>
      </div>
    </>
  )
}

/* ════════════════════════════════════════ */
/* Main export                              */
/* ════════════════════════════════════════ */
export default function ComparisonBarChart({ data, metric, rataRata, title, subtitle, kategori }: ComparisonBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const valid  = data.filter(r => r[metric] > 0.05)
  const sorted = [...valid].sort((a, b) => b[metric] - a[metric])
  const TOP_N    = 20
  const BOTTOM_N = 20
  const top    = sorted.slice(0, TOP_N)
  const bottom = sorted.slice(-BOTTOM_N)
  const others = Math.max(0, sorted.length - TOP_N - BOTTOM_N)

  type ChartRow = { name: string; value: number | null; isTop: boolean; isGap: boolean; gapLabel: string | null; color: string }

  const chartData: ChartRow[] = [
    ...top.map(r => ({ name: r.daerah, value: parseFloat(r[metric].toFixed(2)), isTop: true, isGap: false, gapLabel: null, color: '#16a34a' })),
    ...(Array.from({ length: 4 }).map((_, i) => ({
      name: i === 0 ? ' ' : '\u00a0'.repeat(i + 1),
      value: null as number | null,
      isTop: false,
      isGap: i === 0,
      gapLabel: i === 0 && others > 0 ? String(others) : null,
      color: 'transparent',
    }))),
    ...bottom.map(r => ({ name: r.daerah, value: parseFloat(r[metric].toFixed(2)), isTop: false, isGap: false, gapLabel: null, color: '#dc2626' })),
  ]

  const maxVal = top[0] ? top[0][metric] : 20
  const yMax   = Math.ceil(maxVal / 2) * 2 + 2
  const metricLabel = metric === 'persenPendapatan' ? 'PENDAPATAN' : 'BELANJA'

  /* ── Download JPG ── */
  const handleDownload = useCallback(async () => {
    const target = fullscreen
      ? document.getElementById('chart-fullscreen-inner')
      : containerRef.current
    if (!target) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `${title.replace(/\s+/g, '_')}_${kategori}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } catch (e) {
      console.error('Download error', e)
    } finally {
      setDownloading(false)
    }
  }, [fullscreen, title, kategori])

  const sharedProps = { chartData, rataRata, kategori, metricLabel, TOP_N, BOTTOM_N, yMax }

  const ActionButtons = ({ inModal = false }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        title="Download JPG"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#1e3a8a', color: '#fff', fontWeight: 700, fontSize: 12,
          opacity: downloading ? 0.7 : 1, transition: 'opacity 0.2s',
        }}
      >
        {downloading ? '⏳' : '⬇️'} JPG
      </button>
      <button
        onClick={() => setFullscreen(f => !f)}
        title={inModal ? 'Tutup' : 'Fullscreen'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: inModal ? '#dc2626' : '#0f172a', color: '#fff', fontWeight: 700, fontSize: 12,
          transition: 'background 0.2s',
        }}
      >
        {inModal ? '✕ Tutup' : '⛶ Fullscreen'}
      </button>
    </div>
  )

  return (
    <>
      {/* ── Normal card ── */}
      <div className="chart-container" ref={containerRef}>
        <div className="chart-header" style={{ position: 'relative' }}>
          {/* Tombol aksi pojok kanan atas */}
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <ActionButtons />
          </div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
          <p style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#1e3a8a', marginTop: 4, paddingRight: 8 }}>
            Rata-Rata {kategori} = <strong>{rataRata.toFixed(2)}%</strong>
          </p>
        </div>
        <ChartInner {...sharedProps} height={500} />
      </div>

      {/* ── Fullscreen modal ── */}
      {fullscreen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setFullscreen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(4px)',
          }}
        >
          <div
            id="chart-fullscreen-inner"
            style={{
              background: '#fff', borderRadius: 16, padding: '24px 28px',
              width: '96vw', maxWidth: 1600,
              maxHeight: '94vh', overflowY: 'auto',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{subtitle}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', marginTop: 6 }}>
                  Rata-Rata {kategori} = <strong>{rataRata.toFixed(2)}%</strong>
                </p>
              </div>
              <ActionButtons inModal />
            </div>
            <ChartInner {...sharedProps} height={600} />
          </div>
        </div>
      )}
    </>
  )
}