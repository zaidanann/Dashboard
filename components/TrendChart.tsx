'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
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
  nilaiTriliun2025: number | null
  nilaiTriliun2026: number | null
  isReal2026: boolean  // true = data asli sheet
  isReal2025: boolean
}

interface JenisData {
  jenis: string
  jan2025: { persenPendapatan: number; persenBelanja: number; nilaiPendapatanT: number; nilaiBelanjaTrilun: number } | null
  feb2025: { persenPendapatan: number; persenBelanja: number; nilaiPendapatanT: number; nilaiBelanjaTrilun: number } | null
  jan2026: { persenPendapatan: number; persenBelanja: number; nilaiPendapatanT: number; nilaiBelanjaTrilun: number } | null
  feb2026: { persenPendapatan: number; persenBelanja: number; nilaiPendapatanT: number; nilaiBelanjaTrilun: number } | null
}

/* ── Agregat dari LRARow[] lokal (Feb 2026 fallback) ── */
function agregatLokal(rows: LRARow[], metric: 'persenPendapatan' | 'persenBelanja') {
  if (!rows.length) return { persen: 0, triliun: 0 }
  const angKey  = metric === 'persenPendapatan' ? 'anggaranPendapatan'  : 'anggaranBelanja'
  const realKey = metric === 'persenPendapatan' ? 'realisasiPendapatan' : 'realisasiBelanja'
  const totalAng  = rows.reduce((s, r) => s + (r as any)[angKey],  0)
  const totalReal = rows.reduce((s, r) => s + (r as any)[realKey], 0)
  return {
    persen:  totalAng > 0 ? parseFloat(((totalReal / totalAng) * 100).toFixed(2)) : 0,
    triliun: parseFloat((totalReal / 1e12).toFixed(2)),
  }
}

/* ── Bangun TrendPoint dari API response atau lokal ── */
function buildPoints(
  jenisData: JenisData | null,
  localRows: LRARow[],
  jenis: string | null,
  metric: 'persenPendapatan' | 'persenBelanja'
): TrendPoint[] {
  const pctKey = metric === 'persenPendapatan' ? 'persenPendapatan' : 'persenBelanja'
  const valKey = metric === 'persenPendapatan' ? 'nilaiPendapatanT'  : 'nilaiBelanjaTrilun'

  // Feb 2026 — dari API atau lokal
  const feb26Api = jenisData?.feb2026
  const localFilt = jenis ? localRows.filter(r => r.jenis === jenis) : localRows
  const feb26Local = agregatLokal(localFilt, metric)

  const feb26Persen  = feb26Api ? feb26Api[pctKey] : feb26Local.persen
  const feb26Triliun = feb26Api ? feb26Api[valKey]  : feb26Local.triliun

  // Jan 2026 — dari API jika ada, else simulasi
  const jan26Api      = jenisData?.jan2026
  const jan26Persen   = jan26Api  ? jan26Api[pctKey]  : parseFloat((feb26Persen  * 0.58).toFixed(2))
  const jan26Triliun  = jan26Api  ? jan26Api[valKey]   : parseFloat((feb26Triliun * 0.58).toFixed(2))
  const jan26IsReal   = !!jan26Api

  // Feb 2025 — dari API jika ada, else simulasi
  const feb25Api      = jenisData?.feb2025
  const feb25Persen   = feb25Api  ? feb25Api[pctKey]  : parseFloat((feb26Persen  * 1.37).toFixed(2))
  const feb25Triliun  = feb25Api  ? feb25Api[valKey]   : parseFloat((feb26Triliun * 1.37).toFixed(2))
  const feb25IsReal   = !!feb25Api

  // Jan 2025 — dari API jika ada, else simulasi
  const jan25Api      = jenisData?.jan2025
  const jan25Persen   = jan25Api  ? jan25Api[pctKey]  : parseFloat((feb25Persen  * 0.72).toFixed(2))
  const jan25Triliun  = jan25Api  ? jan25Api[valKey]   : parseFloat((feb25Triliun * 0.72).toFixed(2))
  const jan25IsReal   = !!jan25Api

  return [
    {
      bulan: 'Januari',
      ta2025: jan25Persen, nilaiTriliun2025: jan25Triliun, isReal2025: jan25IsReal,
      ta2026: jan26Persen, nilaiTriliun2026: jan26Triliun, isReal2026: jan26IsReal,
    },
    {
      bulan: 'Februari',
      ta2025: feb25Persen, nilaiTriliun2025: feb25Triliun, isReal2025: feb25IsReal,
      ta2026: feb26Persen, nilaiTriliun2026: feb26Triliun, isReal2026: true, // selalu asli
    },
  ]
}

/* ── Custom dot ── */
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey, color } = props
  const val = payload[dataKey]
  if (val === null || val === undefined) return null

  const isTA2025 = dataKey === 'ta2025'
  const bulan    = payload.bulan
  const tril     = isTA2025 ? payload.nilaiTriliun2025 : payload.nilaiTriliun2026
  const isReal   = isTA2025 ? payload.isReal2025 : payload.isReal2026

  const tanggal = isTA2025
    ? (bulan === 'Januari' ? "31 Jan '25" : "28 Feb '25")
    : (bulan === 'Januari' ? "31 Jan '26" : "20 Feb '26")

  const baseY = isTA2025 ? cy - 54 : cy + 18

  return (
    <g>
      {/* Dot: solid jika asli, outline jika simulasi */}
      <circle cx={cx} cy={cy} r={5} fill={isReal ? color : '#fff'} stroke={color} strokeWidth={2} />
      <text x={cx} y={baseY} textAnchor="middle" fontSize={10} fontWeight={700}
        fill={color} fontFamily="Arial, sans-serif">{tanggal}</text>
      {tril != null && (
        <text x={cx} y={baseY + 13} textAnchor="middle" fontSize={9.5} fontWeight={500}
          fill="#475569" fontFamily="Arial, sans-serif">{tril} T</text>
      )}
      <text x={cx} y={baseY + 27} textAnchor="middle" fontSize={12} fontWeight={800}
        fill={color} fontFamily="Arial, sans-serif">
        {val.toFixed(2)}%{isReal ? '' : '*'}
      </text>
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

/* ── Panel chart tunggal ── */
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
          <LineChart data={points} margin={{ top: 56, right: 44, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`}
              domain={[yMin, yMax]} width={44} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="linear" dataKey="ta2025" stroke="#3b82f6" strokeWidth={2.5}
              dot={<CustomDot dataKey="ta2025" color="#3b82f6" />} activeDot={{ r: 6 }} connectNulls />
            <Line type="linear" dataKey="ta2026" stroke="#ef4444" strokeWidth={2.5}
              dot={<CustomDot dataKey="ta2026" color="#ef4444" />} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
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

/* ═══════════════════════ Main ═══════════════════════ */
export default function TrendChart({ data, metric }: TrendChartProps) {
  const printRef  = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [fullscreen, setFullscreen]   = useState(false)
  const [apiData, setApiData]         = useState<JenisData[] | null>(null)
  const [sheetsFound, setSheetsFound] = useState<Record<string, string | null>>({})
  const [loadingTrend, setLoadingTrend] = useState(true)

  const metricLabel = metric === 'persenPendapatan' ? 'PENDAPATAN' : 'BELANJA'

  /* ── Fetch data tren dari API ── */
  useEffect(() => {
    if (!data.length) return
    let cancelled = false
    setLoadingTrend(true)
    fetch('/api/sheets?action=trend')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.data) {
          setApiData(json.data)
          setSheetsFound(json.sheetsFound ?? {})
        }
      })
      .catch(() => { /* gagal: tetap pakai lokal */ })
      .finally(() => { if (!cancelled) setLoadingTrend(false) })
    return () => { cancelled = true }
  }, [data])

  /* ── Bangun grup tren ── */
  const groups = useMemo(() => {
    const JENIS = [
      { label: 'Provinsi, Kabupaten/Kota', key: 'Semua',     filter: null },
      { label: 'Provinsi',                 key: 'Provinsi',  filter: 'Provinsi' },
      { label: 'Kabupaten',                key: 'Kabupaten', filter: 'Kabupaten' },
      { label: 'Kota',                     key: 'Kota',      filter: 'Kota' },
    ]
    return JENIS.map(j => ({
      label:  j.label,
      points: buildPoints(
        apiData?.find(d => d.jenis === j.key) ?? null,
        data, j.filter, metric
      ),
    }))
  }, [apiData, data, metric])

  /* Cek apakah ada data real yang berhasil diambil */
  const hasRealHistorical = Object.values(sheetsFound).some(v => v !== null)
  const realSheets = Object.entries(sheetsFound).filter(([, v]) => v).map(([k, v]) => `${k}: "${v}"`)

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
      <button onClick={handleDownload} disabled={downloading || loadingTrend} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1e3a8a', color: '#fff', fontWeight: 700, fontSize: 12, opacity: (downloading || loadingTrend) ? 0.6 : 1 }}>
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
      <MiniTrend points={groups[0].points} title={groups[0].label} height={270} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {groups.slice(1).map(g => (
          <MiniTrend key={g.label} points={g.points} title={g.label} height={230} />
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
            {loadingTrend && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>⏳ Memuat data historis...</p>
            )}
            {!loadingTrend && hasRealHistorical && (
              <p style={{ fontSize: 11, color: '#16a34a', margin: '4px 0 0' }}>
                ✅ Data historis ditemukan: {realSheets.join(', ')}
              </p>
            )}
            {!loadingTrend && !hasRealHistorical && (
              <p style={{ fontSize: 11, color: '#f59e0b', margin: '4px 0 0', fontStyle: 'italic' }}>
                ⚠️ Sheet historis tidak ditemukan — titik bertanda * adalah estimasi &nbsp;|&nbsp;
                <strong>Feb 2026</strong> = data asli
              </p>
            )}
          </div>
          <Buttons />
        </div>

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
          {loadingTrend
            ? <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Memuat data tren...</div>
            : <Content />
          }
        </div>
      </div>

      {fullscreen && !loadingTrend && (
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