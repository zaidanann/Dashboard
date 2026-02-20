'use client'

import { useMemo, useState } from 'react'
import { LRARow } from '@/types/lra'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'

interface Props {
  data: LRARow[]
}

// ── Helper ─────────────────────────────────────────────────────────────────
function toM(val: number) { return val / 1_000_000_000 }
function fmtM(val: number) {
  return toM(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M'
}

/**
 * Kelompokkan kab/kota ke provinsi berdasarkan urutan baris di data.
 * Setiap kali muncul baris Provinsi, kab/kota berikutnya dianggap milik provinsi itu
 * sampai muncul provinsi berikutnya.
 */
function groupByProvinsi(data: LRARow[]): Record<string, LRARow[]> {
  const groups: Record<string, LRARow[]> = {}
  let currentProv = ''

  for (const row of data) {
    if (row.jenis === 'Provinsi') {
      currentProv = row.daerah
      if (!groups[currentProv]) groups[currentProv] = []
    } else if (currentProv) {
      if (!groups[currentProv]) groups[currentProv] = []
      groups[currentProv].push(row)
    }
  }

  return groups
}

// ── Gauge mini ─────────────────────────────────────────────────────────────
function MiniGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const capped  = Math.min(value, 100)
  const r       = 54
  const circ    = 2 * Math.PI * r
  const offset  = circ - (capped / 100) * circ
  const display = value.toFixed(2) + '%'

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="90" viewBox="0 0 140 90">
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12"
          strokeDasharray={`${circ * 0.5} ${circ * 0.5}`}
          strokeDashoffset={-circ * 0.25}
          transform="rotate(0 70 70)"
        />
        {/* Value arc */}
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(capped / 100) * circ * 0.5} ${circ}`}
          strokeDashoffset={-circ * 0.25}
        />
        <text x="70" y="68" textAnchor="middle" fontSize="15" fontWeight="700" fill={color}>{display}</text>
      </svg>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: -8, fontWeight: 600 }}>{label}</p>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as LRARow
  return (
    <div style={{
      background: '#1e293b', borderRadius: 10, padding: '10px 14px',
      color: '#f1f5f9', fontSize: 12, maxWidth: 220, boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#93c5fd' }}>{d.daerah}</p>
      <p>Anggaran Pendapatan: <b>{fmtM(d.anggaranPendapatan)}</b></p>
      <p>Realisasi Pendapatan: <b>{fmtM(d.realisasiPendapatan)}</b></p>
      <p>% Pendapatan: <b style={{ color: d.persenPendapatan >= 75 ? '#4ade80' : '#f87171' }}>{d.persenPendapatan.toFixed(2)}%</b></p>
      <hr style={{ borderColor: '#334155', margin: '6px 0' }} />
      <p>Anggaran Belanja: <b>{fmtM(d.anggaranBelanja)}</b></p>
      <p>Realisasi Belanja: <b>{fmtM(d.realisasiBelanja)}</b></p>
      <p>% Belanja: <b style={{ color: d.persenBelanja >= 75 ? '#4ade80' : '#f87171' }}>{d.persenBelanja.toFixed(2)}%</b></p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProvinsiFilter({ data }: Props) {
  const [selectedProv, setSelectedProv] = useState<string>('')
  const [metric, setMetric]             = useState<'persenPendapatan' | 'persenBelanja'>('persenPendapatan')
  const [sortBy, setSortBy]             = useState<'nama' | 'persen' | 'nominal'>('persen')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')

  // Daftar provinsi dari data
  const provinsiList = useMemo(
    () => data.filter(r => r.jenis === 'Provinsi').map(r => r.daerah),
    [data]
  )

  // Kelompokkan kab/kota per provinsi
  const grouped = useMemo(() => groupByProvinsi(data), [data])

  // Data provinsi yang dipilih
  const provRow = useMemo(
    () => data.find(r => r.daerah === selectedProv),
    [data, selectedProv]
  )

  // Kab/kota dalam provinsi terpilih
  const kabkotaRows = useMemo(() => {
    if (!selectedProv) return []
    return grouped[selectedProv] ?? []
  }, [grouped, selectedProv])

  // Sort
  const sortedRows = useMemo(() => {
    const rows = [...kabkotaRows]
    rows.sort((a, b) => {
      let diff = 0
      if (sortBy === 'nama')    diff = a.daerah.localeCompare(b.daerah)
      if (sortBy === 'persen')  diff = a[metric] - b[metric]
      if (sortBy === 'nominal') diff = (
        metric === 'persenPendapatan'
          ? a.realisasiPendapatan - b.realisasiPendapatan
          : a.realisasiBelanja - b.realisasiBelanja
      )
      return sortDir === 'desc' ? -diff : diff
    })
    return rows
  }, [kabkotaRows, sortBy, sortDir, metric])

  // Rata-rata untuk reference line
  const rataRata = useMemo(() => {
    if (!sortedRows.length) return 0
    return sortedRows.reduce((s, r) => s + r[metric], 0) / sortedRows.length
  }, [sortedRows, metric])

  // Chart data (max 30 untuk keterbacaan)
  const chartData = useMemo(() => sortedRows.slice(0, 40), [sortedRows])

  const metricLabel = metric === 'persenPendapatan' ? 'Pendapatan' : 'Belanja'

  function toggleSort(col: 'nama' | 'persen' | 'nominal') {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }
  function sortIcon(col: 'nama' | 'persen' | 'nominal') {
    if (sortBy !== col) return ' ↕'
    return sortDir === 'desc' ? ' ↓' : ' ↑'
  }

  return (
    <section className="section">
      <h2 className="section-title">🔍 Analisis Per Provinsi</h2>

      {/* ── Pilih Provinsi ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <select
          value={selectedProv}
          onChange={e => setSelectedProv(e.target.value)}
          style={{
            flex: '1 1 280px',
            padding: '10px 14px',
            borderRadius: 10,
            border: '2px solid #1e40af',
            background: '#0f172a',
            color: '#f1f5f9',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <option value="">— Pilih Provinsi —</option>
          {provinsiList.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {selectedProv && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setMetric('persenPendapatan')}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: metric === 'persenPendapatan' ? '#1e40af' : '#1e293b',
                color: metric === 'persenPendapatan' ? '#fff' : '#94a3b8',
              }}
            >📈 Pendapatan</button>
            <button
              onClick={() => setMetric('persenBelanja')}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: metric === 'persenBelanja' ? '#0f2558' : '#1e293b',
                color: metric === 'persenBelanja' ? '#fff' : '#94a3b8',
              }}
            >💸 Belanja</button>
          </div>
        )}
      </div>

      {selectedProv && provRow && (
        <>
          {/* ── Info & Gauge Provinsi ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            border: '1px solid #1e40af', display: 'flex', gap: 24,
            alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ color: '#93c5fd', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                🏛️ {provRow.daerah}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Angg. Pendapatan</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmtM(provRow.anggaranPendapatan)}</span>
                <span style={{ color: '#94a3b8' }}>Real. Pendapatan</span>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{fmtM(provRow.realisasiPendapatan)}</span>
                <span style={{ color: '#94a3b8' }}>Angg. Belanja</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmtM(provRow.anggaranBelanja)}</span>
                <span style={{ color: '#94a3b8' }}>Real. Belanja</span>
                <span style={{ color: '#fb923c', fontWeight: 600 }}>{fmtM(provRow.realisasiBelanja)}</span>
                <span style={{ color: '#94a3b8' }}>Kab/Kota di bawahnya</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{kabkotaRows.length} daerah</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <MiniGauge value={provRow.persenPendapatan} label="Capaian Pendapatan" color="#1e40af" />
              <MiniGauge value={provRow.persenBelanja}    label="Capaian Belanja"    color="#f59e0b" />
            </div>
          </div>

          {kabkotaRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <p>Tidak ada data Kabupaten/Kota untuk provinsi ini.</p>
            </div>
          ) : (
            <>
              {/* ── Bar Chart ── */}
              <div style={{ background: '#0f172a', borderRadius: 16, padding: '20px 16px', marginBottom: 24, border: '1px solid #1e3a5f' }}>
                <h3 style={{ color: '#93c5fd', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                  📊 % Realisasi {metricLabel} — Kab/Kota di {provRow.daerah}
                </h3>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>
                  Garis merah = rata-rata ({rataRata.toFixed(2)}%) · Menampilkan {Math.min(chartData.length, 40)} dari {kabkotaRows.length} daerah
                </p>
                <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 28)}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                    <XAxis
                      type="number" domain={[0, 'auto']}
                      tickFormatter={v => `${v}%`}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      type="category" dataKey="daerah" width={160}
                      tick={{ fill: '#cbd5e1', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <ReferenceLine x={rataRata} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
                    <Bar dataKey={metric} radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {chartData.map((row, i) => (
                        <Cell
                          key={i}
                          fill={row[metric] >= rataRata ? '#1e40af' : '#0f2558'}
                          opacity={row[metric] >= rataRata ? 1 : 0.75}
                        />
                      ))}
                      <LabelList
                        dataKey={metric}
                        position="right"
                        formatter={(v: number) => `${v.toFixed(1)}%`}
                        style={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ── Tabel ── */}
              <div style={{ background: '#0f172a', borderRadius: 16, overflow: 'hidden', border: '1px solid #1e3a5f' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ color: '#93c5fd', fontSize: 14, fontWeight: 700, flex: 1 }}>
                    📋 Data Kab/Kota — Nominal dalam Miliaran (M)
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {sortedRows.length} daerah
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1e293b' }}>
                        <th style={thStyle}>#</th>
                        <th style={{ ...thStyle, textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleSort('nama')}>
                          Daerah{sortIcon('nama')}
                        </th>
                        <th style={thStyle}>Jenis</th>
                        <th style={thStyle}>Angg. Pendapatan (M)</th>
                        <th style={thStyle}>Real. Pendapatan (M)</th>
                        <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('persen')}>
                          % Pendapatan{sortIcon('persen')}
                        </th>
                        <th style={thStyle}>Angg. Belanja (M)</th>
                        <th style={thStyle}>Real. Belanja (M)</th>
                        <th style={thStyle}>% Belanja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((r, i) => (
                        <tr
                          key={r.daerah}
                          style={{ background: i % 2 === 0 ? '#0f172a' : '#111827' }}
                        >
                          <td style={tdCenter}>{i + 1}</td>
                          <td style={{ ...tdBase, color: '#e2e8f0', fontWeight: 600 }}>{r.daerah}</td>
                          <td style={tdCenter}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                              background: r.jenis === 'Kabupaten' ? '#1e3a8a22' : '#064e3b22',
                              color: r.jenis === 'Kabupaten' ? '#93c5fd' : '#6ee7b7',
                              border: `1px solid ${r.jenis === 'Kabupaten' ? '#1e40af44' : '#065f4644'}`,
                            }}>
                              {r.jenis}
                            </span>
                          </td>
                          <td style={tdNum}>{toM(r.anggaranPendapatan).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                          <td style={tdNum}>{toM(r.realisasiPendapatan).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                          <td style={{ ...tdCenter, fontWeight: 700, color: r.persenPendapatan >= 75 ? '#4ade80' : r.persenPendapatan >= 50 ? '#fbbf24' : '#f87171' }}>
                            {r.persenPendapatan.toFixed(2)}%
                          </td>
                          <td style={tdNum}>{toM(r.anggaranBelanja).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                          <td style={tdNum}>{toM(r.realisasiBelanja).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                          <td style={{ ...tdCenter, fontWeight: 700, color: r.persenBelanja >= 75 ? '#4ade80' : r.persenBelanja >= 50 ? '#fbbf24' : '#f87171' }}>
                            {r.persenBelanja.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer total */}
                    <tfoot>
                      <tr style={{ background: '#1e293b', borderTop: '2px solid #1e40af' }}>
                        <td colSpan={3} style={{ ...tdBase, fontWeight: 700, color: '#93c5fd', padding: '10px 16px' }}>
                          TOTAL / RATA-RATA
                        </td>
                        <td style={{ ...tdNum, fontWeight: 700, color: '#f1f5f9' }}>
                          {toM(sortedRows.reduce((s, r) => s + r.anggaranPendapatan, 0)).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...tdNum, fontWeight: 700, color: '#4ade80' }}>
                          {toM(sortedRows.reduce((s, r) => s + r.realisasiPendapatan, 0)).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...tdCenter, fontWeight: 800, color: '#93c5fd' }}>
                          {(sortedRows.reduce((s, r) => s + r.persenPendapatan, 0) / sortedRows.length).toFixed(2)}%
                        </td>
                        <td style={{ ...tdNum, fontWeight: 700, color: '#f1f5f9' }}>
                          {toM(sortedRows.reduce((s, r) => s + r.anggaranBelanja, 0)).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...tdNum, fontWeight: 700, color: '#fb923c' }}>
                          {toM(sortedRows.reduce((s, r) => s + r.realisasiBelanja, 0)).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ ...tdCenter, fontWeight: 800, color: '#93c5fd' }}>
                          {(sortedRows.reduce((s, r) => s + r.persenBelanja, 0) / sortedRows.length).toFixed(2)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedProv && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
          <p style={{ fontSize: 32 }}>🏛️</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>Pilih provinsi untuk melihat detail Kabupaten/Kota</p>
        </div>
      )}
    </section>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'center', color: '#94a3b8',
  fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
  borderBottom: '1px solid #1e3a5f',
}
const tdBase: React.CSSProperties = {
  padding: '8px 12px', color: '#cbd5e1', verticalAlign: 'middle',
  borderBottom: '1px solid #0f2040',
}
const tdCenter: React.CSSProperties = { ...tdBase, textAlign: 'center' }
const tdNum: React.CSSProperties    = { ...tdBase, textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }