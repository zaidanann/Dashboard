'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { LRARow } from '@/types/lra'

interface TrendChartProps {
  data: LRARow[]
  metric: 'persenPendapatan' | 'persenBelanja'
}

interface TrendPoint {
  bulan: string
  ta2025: number | null
  ta2026: number | null
  nilaiTriliun2025?: number | null
  nilaiTriliun2026?: number | null
}

interface TrendGroup {
  label: string
  jenis: string | null
  points: TrendPoint[]
}

/* ── Custom dot dengan label tanggal + nilai + % ── */
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, color } = props
  const val = payload[dataKey]
  if (val === null || val === undefined) return null

  const isTA2025 = dataKey === 'ta2025'
  const bulan    = payload.bulan
  const tril     = isTA2025 ? payload.nilaiTriliun2025 : payload.nilaiTriliun2026

  const tanggal = isTA2025
    ? (bulan === 'Januari' ? "31 Jan '25" : "28 Feb '25")
    : (bulan === 'Januari' ? "31 Jan '26" : "20 Feb '26")

  // TA2025 label di atas, TA2026 di bawah
  const baseY = isTA2025 ? cy - 48 : cy + 20

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={cx} y={baseY} textAnchor="middle" fontSize={10} fontWeight={700}
        fill={color} fontFamily="Arial, sans-serif">{tanggal}</text>
      {tril != null && (
        <text x={cx} y={baseY + 13} textAnchor="middle" fontSize={9.5} fontWeight={500}
          fill="#475569" fontFamily="Arial, sans-serif">{tril} T</text>
      )}
      <text x={cx} y={baseY + 26} textAnchor="middle" fontSize={11} fontWeight={800}
        fill={color} fontFamily="Arial, sans-serif">{val.toFixed(2)}%</text>
    </g>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <p style={{ fontWeight: 700, marginBottom: 6, borderBottom: '1px solid #334155', paddingBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '3px 0' }}>
          {p.dataKey === 'ta2025' ? 'TA 2025' : 'TA 2026'}: <strong>{p.value?.toFixed(2)}%</strong>
        </p>
      ))}
    </div>
  )
}

/* ── Satu panel chart ── */
function MiniTrend({ points, title, height = 240 }: { points: TrendPoint[]; title?: string; height?: number }) {
  const yVals = points.flatMap(d => [d.ta2025, d.ta2026]).filter((v): v is number => v !== null)
  if (!yVals.length) return null
  const yMin = Math.max(0, Math.floor(Math.min(...yVals) / 2) * 2 - 2)
  const yMax = Math.ceil(Math.max(...yVals) / 2) * 2 + 4

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <div style={{ textAlign: 'center', background: '#1e3a8a', color: '#fff', borderRadius: '6px 6px 0 0', padding: '5px 10px', fontWeight: 700, fontSize: 12 }}>
          {title}
        </div>
      )}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: title ? '0 0 8px 8px' : 8, background: '#fff', padding: '8px 4px 4px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={points} margin={{ top: 52, right: 40, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`}
              domain={[yMin, yMax]} width={42} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="linear" dataKey="ta2025" stroke="#3b82f6" strokeWidth={2.5}
              dot={<CustomDot dataKey="ta2025" color="#3b82f6" />} activeDot={{ r: 6 }} connectNulls />
            <Line type="linear" dataKey="ta2026" stroke="#ef4444" strokeWidth={2.5}
              dot={<CustomDot dataKey="ta2026" color="#ef4444" />} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, paddingBottom: 8 }}>
          {[['#3b82f6', 'TA 2025'], ['#ef4444', 'TA 2026']].map(([color, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151', fontWeight: 600 }}>
              <svg width="28" height="10">
                <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2.5" />
                <circle cx="14" cy="5" r="4" fill={color} />
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Simulasi tren dari snapshot ── */
function simulate(data: LRARow[], jenis: string | null, metric: 'persenPendapatan' | 'persenBelanja'): TrendPoint[] {
  const rows   = jenis ? data.filter(r => r.jenis === jenis) : data
  const n      = rows.length || 1
  const avg    = rows.reduce((s, r) => s + r[metric], 0) / n
  const angKey = metric === 'persenPendapatan' ? 'anggaranPendapatan' : 'anggaranBelanja'
  const totalA = rows.reduce((s, r) => s + (r as any)[angKey], 0)
  const toT    = (pct: number) => parseFloat((totalA * pct / 100 / 1e12).toFixed(2))

  const feb26 = avg,          jan26 = avg * 0.58
  const feb25 = avg * 1.37,   jan25 = avg * 0.72

  return [
    { bulan: 'Januari', ta2025: parseFloat(jan25.toFixed(2)), ta2026: parseFloat(jan26.toFixed(2)), nilaiTriliun2025: toT(jan25), nilaiTriliun2026: toT(jan26) },
    { bulan: 'Februari', ta2025: parseFloat(feb25.toFixed(2)), ta2026: parseFloat(feb26.toFixed(2)), nilaiTriliun2025: toT(feb25), nilaiTriliun2026: toT(feb26) },
  ]
}

/* ═══════════════════════════════════════════════ */
export default function TrendChart({ data, metric }: TrendChartProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [fullscreen, setFullscreen]   = useState(false)
  const [groups, setGroups]           = useState<TrendGroup[] | null>(null)
  const [usingSimulation, setUsingSimulation] = useState(false)

  const metricLabel = metric === 'persenPendapatan' ? 'PENDAPATAN' : 'BELANJA'

  /* ── Fetch data tren (asli atau simulasi) ── */
  useEffect(() => {
    if (!data.length) return
    let cancelled = false

    async function loadTrend() {
      try {
        const res  = await fetch(`/api/sheets?action=trend`)
        const json = await res.json()

        if (cancelled) return

        if (json.hasTrendSheet && json.data?.length) {
          // ── Data asli dari sheet ──
          const raw: any[] = json.data
          const metricPct  = metric === 'persenPendapatan' ? 'persenPendapatan' : 'persenBelanja'
          const metricVal  = metric === 'persenPendapatan' ? 'nilaiPendapatanT'  : 'nilaiBelanjaTrilun'

          const buildGroup = (jenisFilter: string | null, label: string): TrendGroup => {
            const filtered = jenisFilter
              ? raw.filter(r => r.jenis?.toLowerCase() === jenisFilter.toLowerCase())
              : raw

            const bulanList = [...new Set(filtered.map(r => r.bulan))] as string[]
            const points: TrendPoint[] = bulanList.map(bulan => {
              const r25 = filtered.find(r => r.bulan === bulan && String(r.tahun) === '2025')
              const r26 = filtered.find(r => r.bulan === bulan && String(r.tahun) === '2026')
              return {
                bulan,
                ta2025: r25?.[metricPct] ?? null,
                ta2026: r26?.[metricPct] ?? null,
                nilaiTriliun2025: r25?.[metricVal] ?? null,
                nilaiTriliun2026: r26?.[metricVal] ?? null,
              }
            })
            return { label, jenis: jenisFilter, points }
          }

          setGroups([
            buildGroup(null,          'Provinsi, Kabupaten/Kota'),
            buildGroup('Provinsi',    'Provinsi'),
            buildGroup('Kabupaten',   'Kabupaten'),
            buildGroup('Kota',        'Kota'),
          ])
          setUsingSimulation(false)
        } else {
          throw new Error('no sheet')
        }
      } catch {
        // Fallback ke simulasi
        if (cancelled) return
        setGroups([
          { label: 'Provinsi, Kabupaten/Kota', jenis: null,        points: simulate(data, null,        metric) },
          { label: 'Provinsi',                 jenis: 'Provinsi',  points: simulate(data, 'Provinsi',  metric) },
          { label: 'Kabupaten',                jenis: 'Kabupaten', points: simulate(data, 'Kabupaten', metric) },
          { label: 'Kota',                     jenis: 'Kota',      points: simulate(data, 'Kota',      metric) },
        ])
        setUsingSimulation(true)
      }
    }

    loadTrend()
    return () => { cancelled = true }
  }, [data, metric])

  const handleDownload = useCallback(async () => {
    const el = printRef.current
    if (!el) return
    setDownloading(true)
    try {
      const h2c = (await import('html2canvas')).default
      const canvas = await h2c(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, width: el.offsetWidth, height: el.offsetHeight })
      const a = document.createElement('a')
      a.download = `Tren_Realisasi_${metricLabel}.jpg`
      a.href = canvas.toDataURL('image/jpeg', 0.95)
      a.click()
    } catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }, [metricLabel])

  const Buttons = ({ inModal = false }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={handleDownload} disabled={downloading || !groups} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1e3a8a', color: '#fff', fontWeight: 700, fontSize: 12, opacity: (downloading || !groups) ? 0.6 : 1 }}>
        {downloading ? '⏳' : '⬇️'} Unduh JPG
      </button>
      {!inModal
        ? <button onClick={() => setFullscreen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 12 }}>⛶ Fullscreen</button>
        : <button onClick={() => setFullscreen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 12 }}>✕ Tutup</button>
      }
    </div>
  )

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Baris atas: gabungan */}
      <MiniTrend points={groups![0].points} title={groups![0].label} height={260} />
      {/* Baris bawah: 3 kolom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {groups!.slice(1).map(g => (
          <MiniTrend key={g.label} points={g.points} title={g.label} height={220} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>
              📈 TREN PERSENTASE REALISASI{' '}
              <span style={{ background: '#fef08a', padding: '1px 5px', borderRadius: 3 }}>{metricLabel}</span>
            </h3>
            <p className="chart-subtitle" style={{ margin: '4px 0 0' }}>
              APBD PROVINSI, KABUPATEN DAN KOTA SE-INDONESIA TA 2025–2026
            </p>
            {usingSimulation && (
              <p style={{ fontSize: 11, color: '#f59e0b', margin: '4px 0 0', fontStyle: 'italic' }}>
                ⚠️ Data tren disimulasi — tambahkan sheet &quot;Tren LRA&quot; di spreadsheet untuk data asli
              </p>
            )}
          </div>
          <Buttons />
        </div>

        {!groups ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
            ⏳ Memuat data tren...
          </div>
        ) : (
          <div ref={printRef} style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                TREN PERSENTASE REALISASI{' '}
                <span style={{ background: '#fef08a', padding: '1px 5px', borderRadius: 3 }}>{metricLabel}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                APBD PROVINSI, KABUPATEN DAN KOTA SE-INDONESIA TA 2025–2026
              </div>
            </div>
            <Content />
          </div>
        )}
      </div>

      {fullscreen && groups && (
        <div onClick={e => { if (e.target === e.currentTarget) setFullscreen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '98vw', height: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>TREN PERSENTASE REALISASI {metricLabel}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>APBD PROVINSI, KABUPATEN DAN KOTA SE-INDONESIA TA 2025–2026</div>
              </div>
              <Buttons inModal />
            </div>
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
              <Content />
            </div>
          </div>
        </div>
      )}
    </>
  )
}