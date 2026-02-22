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
  title: string
  subtitle: string
  kategori: string
}

// ── Rata-rata dihitung dari SEMUA data (termasuk 0 dan outlier) ──────────────
// Menggunakan total anggaran & realisasi agar lebih akurat daripada rata-rata persentase
function hitungRataRata(data: LRARow[], metric: 'persenPendapatan' | 'persenBelanja'): number {
  if (!data.length) return 0
  if (metric === 'persenPendapatan') {
    const totalAng  = data.reduce((s, r) => s + r.anggaranPendapatan,  0)
    const totalReal = data.reduce((s, r) => s + r.realisasiPendapatan, 0)
    return totalAng > 0 ? parseFloat(((totalReal / totalAng) * 100).toFixed(2)) : 0
  } else {
    const totalAng  = data.reduce((s, r) => s + r.anggaranBelanja,  0)
    const totalReal = data.reduce((s, r) => s + r.realisasiBelanja, 0)
    return totalAng > 0 ? parseFloat(((totalReal / totalAng) * 100).toFixed(2)) : 0
  }
}

const CustomTooltip = ({ active, payload, label, rataRata }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  if (!val) return null
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

const BarPercentLabel = (props: any) => {
  const { x, y, width, value, isAbove } = props
  if (!value) return null
  const cx = x + width / 2
  const ty = y - 4
  return (
    <text x={cx} y={ty} textAnchor="start" fontSize={9} fontWeight={700}
      fontFamily="Arial, sans-serif"
      fill={isAbove ? '#047857' : '#b91c1c'}
      transform={`rotate(-90, ${cx}, ${ty})`}>
      {value.toFixed(2)}%
    </text>
  )
}

const MinBar = (props: any) => {
  const { x, y, width, height, fill, fillOpacity } = props
  if (!fill || fill === 'transparent' || fillOpacity === 0) return null
  const MIN_H = 5
  const realH = Math.max(height ?? 0, MIN_H)
  const realY = y + (height ?? 0) - realH
  return <rect x={x} y={realY} width={width} height={realH} rx={2} fill={fill} fillOpacity={fillOpacity ?? 0.9} />
}

const GapLabel = (props: any) => {
  const { x, y, width, height, value } = props
  if (!value) return null
  const boxW = width * 4.2
  const boxX = x - boxW * 0.1
  const cx   = boxX + boxW / 2
  const midY = y + height / 2
  return (
    <g>
      <rect x={boxX} y={midY - 26} width={boxW} height={52} rx={8} fill="#1e40af" opacity={0.93} />
      <text x={cx} y={midY - 7} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}
        fontFamily="Arial, sans-serif">{value}</text>
      <text x={cx} y={midY + 11} textAnchor="middle" fill="#bfdbfe" fontSize={10} fontWeight={600}
        fontFamily="Arial, sans-serif">LAINNYA</text>
    </g>
  )
}

function ChartContent({ chartData, rataRata, kategori, metricLabel, isProvinsi, TOP_N, BOTTOM_N, yMax, chartHeight }: any) {
  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} margin={{ top: 80, right: 80, left: 10, bottom: 140 }} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name"
            tick={{ fontSize: 8.5, fill: '#374151', fontFamily: 'Arial' }}
            angle={-50} textAnchor="end" interval={0} tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={v => `${v}%`} width={52}
            domain={[0, yMax]} axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip rataRata={rataRata} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <ReferenceLine y={rataRata} stroke="#eab308" strokeWidth={3}
            label={{ value: `Rata-rata ${kategori}`, position: 'right', fontSize: 10, fill: '#92400e', fontWeight: 700 }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={36} isAnimationActive={false} shape={<MinBar />}>
            {chartData.map((entry: any, i: number) => (
              <Cell key={i} fill={entry.color} fillOpacity={entry.color === 'transparent' ? 0 : 0.9} />
            ))}
            <LabelList dataKey="value" content={(props: any) => {
              const row = chartData[props.index]
              if (!row || row.color === 'transparent') return null
              return <BarPercentLabel {...props} isAbove={row.isAbove} />
            }} />
            <LabelList dataKey="value" content={(props: any) => {
              const row = chartData[props.index]
              if (!row?.isGap || !row.gapLabel) return null
              return <GapLabel {...props} value={row.gapLabel} />
            }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {!isProvinsi && (
        <div style={{ display: 'flex', gap: 0, marginTop: -4, paddingInline: 62 }}>
          <div style={{ flex: TOP_N, background: '#1e3a8a', color: '#fff', textAlign: 'center', padding: '9px 6px', borderRadius: '6px 0 0 6px', fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>
            {TOP_N} {kategori.toUpperCase()}<br />
            <span style={{ fontSize: 10, opacity: 0.85 }}>PERSENTASE REALISASI {metricLabel} TERBESAR</span>
          </div>
          <div style={{ flex: 1.5 }} />
          <div style={{ flex: BOTTOM_N, background: '#1e3a8a', color: '#fff', textAlign: 'center', padding: '9px 6px', borderRadius: '0 6px 6px 0', fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>
            {BOTTOM_N} {kategori.toUpperCase()}<br />
            <span style={{ fontSize: 10, opacity: 0.85 }}>PERSENTASE REALISASI {metricLabel} TERKECIL</span>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default function ComparisonBarChart({ data, metric, title, subtitle, kategori }: ComparisonBarChartProps) {
  const printRef   = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen]     = useState(false)
  const [downloading, setDownloading]   = useState(false)
  const [showOutliers, setShowOutliers] = useState(false)
  const [showZeroes, setShowZeroes]     = useState(false)

  const isProvinsi = kategori === 'Provinsi'

  // ── Rata-rata dari SEMUA data termasuk 0 dan outlier ─────────────────────
  const rataRata = hitungRataRata(data, metric)

  // ── Threshold outlier ─────────────────────────────────────────────────────
  const OUTLIER_THRESHOLD = Math.max(rataRata * 5, rataRata + 50)

  // ── Kelompokkan: 0/kosong | outlier terlalu tinggi | tampil di chart ──────
  const zeroes   = data.filter(r => r[metric] <= 0.05)
  const outliers = data.filter(r => r[metric] > OUTLIER_THRESHOLD)
  const forChart = data.filter(r => r[metric] > 0.05 && r[metric] <= OUTLIER_THRESHOLD)

  const sorted = [...forChart].sort((a, b) => b[metric] - a[metric])
  const TOP_N = 20, BOTTOM_N = 20

  type Row = { name: string; value: number; isAbove: boolean; color: string; isGap?: boolean; gapLabel?: string | null }

  let chartData: Row[]
  if (isProvinsi) {
    chartData = sorted.map(r => {
      const val = parseFloat(r[metric].toFixed(2))
      const above = val >= rataRata
      return { name: r.daerah, value: val, isAbove: above, color: above ? '#16a34a' : '#dc2626' }
    })
  } else {
    const top = sorted.slice(0, TOP_N)
    const bot = sorted.slice(-BOTTOM_N)
    chartData = [
      ...top.map(r => ({ name: r.daerah, value: parseFloat(r[metric].toFixed(2)), isAbove: true, color: '#16a34a' })),
      ...Array.from({ length: 4 }, (_, i) => ({
        name:     i === 0 ? ' ' : '\u00a0'.repeat(i + 1),
        value:    0,
        isAbove:  false,
        color:    'transparent',
        isGap:    i === 0,
        gapLabel: i === 0 ? String(Math.max(0, sorted.length - TOP_N - BOTTOM_N)) : null,
      })),
      ...bot.map(r => ({ name: r.daerah, value: parseFloat(r[metric].toFixed(2)), isAbove: false, color: '#dc2626' })),
    ]
  }

  const maxVal = sorted[0]?.[metric] ?? 20
  const yMax   = Math.ceil(maxVal / 2) * 2 + 2
  const metricLabel = metric === 'persenPendapatan' ? 'PENDAPATAN' : 'BELANJA'

  const sharedProps = { chartData, rataRata, kategori, metricLabel, isProvinsi, TOP_N, BOTTOM_N, yMax }

  const handleDownload = useCallback(async () => {
    const el = printRef.current
    if (!el) return
    setDownloading(true)
    try {
      const h2c = (await import('html2canvas')).default
      const canvas = await h2c(el, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false,
        scrollX: 0, scrollY: 0,
        width: el.offsetWidth, height: el.offsetHeight,
        windowWidth: el.offsetWidth, windowHeight: el.offsetHeight,
      })
      const a = document.createElement('a')
      a.download = `${title.replace(/\s+/g, '_')}_${kategori}.jpg`
      a.href = canvas.toDataURL('image/jpeg', 0.95)
      a.click()
    } catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }, [title, kategori])

  const Buttons = ({ inModal = false }) => (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <button onClick={handleDownload} disabled={downloading} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        borderRadius: 8, border: 'none', cursor: 'pointer',
        background: '#1e3a8a', color: '#fff', fontWeight: 700, fontSize: 12,
        opacity: downloading ? 0.7 : 1,
      }}>
        {downloading ? '⏳' : '⬇️'} Unduh JPG
      </button>
      {!inModal ? (
        <button onClick={() => setFullscreen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 12,
        }}>⛶ Fullscreen</button>
      ) : (
        <button onClick={() => setFullscreen(false)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 12,
        }}>✕ Tutup</button>
      )}
    </div>
  )

  const BadgeList = ({ items, showValue }: { items: LRARow[]; showValue: boolean }) => (
    <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((r, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          background: '#fde68a', border: '1px solid #f59e0b',
          fontSize: 11, fontWeight: 600, color: '#78350f',
        }}>
          {r.daerah}
          {showValue && (
            <span style={{
              background: '#dc2626', color: '#fff',
              borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
            }}>
              {r[metric].toFixed(2)}%
            </span>
          )}
        </span>
      ))}
    </div>
  )

  // ── Info box: outlier terlalu tinggi ──────────────────────────────────────
  const OutlierBox = () => {
    if (outliers.length === 0) return null
    return (
      <div style={{ marginTop: 8, borderRadius: 8, border: '1px solid #f59e0b', background: '#fffbeb', overflow: 'hidden' }}>
        <div
          onClick={() => setShowOutliers(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', cursor: 'pointer', background: '#fef3c7' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠️ {outliers.length} daerah tidak ditampilkan di grafik
            <span style={{ fontWeight: 400, color: '#b45309' }}>
              (realisasi &gt; {OUTLIER_THRESHOLD.toFixed(0)}% — kemungkinan anomali, tetap dihitung di rata-rata)
            </span>
          </span>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>
            {showOutliers ? '▲ Sembunyikan' : '▼ Lihat daftar'}
          </span>
        </div>
        {showOutliers && <BadgeList items={outliers.sort((a, b) => b[metric] - a[metric])} showValue />}
      </div>
    )
  }

  // ── Info box: nilai 0 ─────────────────────────────────────────────────────
  const ZeroBox = () => {
    if (zeroes.length === 0) return null
    return (
      <div style={{ marginTop: 8, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', overflow: 'hidden' }}>
        <div
          onClick={() => setShowZeroes(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', cursor: 'pointer', background: '#f1f5f9' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            ℹ️ {zeroes.length} daerah tidak ditampilkan di grafik
            <span style={{ fontWeight: 400, color: '#64748b' }}>
              (realisasi 0% atau tidak ada data, tetap dihitung di rata-rata)
            </span>
          </span>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>
            {showZeroes ? '▲ Sembunyikan' : '▼ Lihat daftar'}
          </span>
        </div>
        {showZeroes && <BadgeList items={zeroes} showValue={false} />}
      </div>
    )
  }

  const InfoBoxes = () => (
    <>{outliers.length > 0 && <OutlierBox />}{zeroes.length > 0 && <ZeroBox />}</>
  )

  const RataRataLabel = () => (
    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#1e3a8a', marginBottom: 4 }}>
      Rata-Rata {kategori} = <strong>{rataRata.toFixed(2)}%</strong>
      {(outliers.length > 0 || zeroes.length > 0) && (
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
          (dihitung dari {data.length} daerah termasuk yang tidak ditampilkan)
        </span>
      )}
    </div>
  )

  return (
    <>
      {/* ══ Tampilan normal ══ */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>{title}</h3>
            <p className="chart-subtitle" style={{ margin: '4px 0 0' }}>{subtitle}</p>
          </div>
          <Buttons />
        </div>

        {/* Area bersih untuk screenshot — TANPA info box */}
        <div ref={printRef} style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: 0.3 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{subtitle}</div>
          </div>
          <RataRataLabel />
          <ChartContent {...sharedProps} chartHeight={500} />
        </div>

        {/* Info box di luar area screenshot */}
        <InfoBoxes />
      </div>

      {/* ══ Fullscreen modal ══ */}
      {fullscreen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            width: '98vw', height: '95vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
              </div>
              <Buttons inModal />
            </div>

            {(outliers.length > 0 || zeroes.length > 0) && (
              <div style={{ padding: '6px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                <InfoBoxes />
              </div>
            )}

            <div style={{ flex: 1, padding: '12px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <RataRataLabel />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChartContent {...sharedProps} chartHeight="100%" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}