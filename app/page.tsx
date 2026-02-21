'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import MetricCard from '@/components/MetricCard'
import GaugeChart from '@/components/GaugeChart'
import ComparisonBarChart from '@/components/BarChart'
import DataTable from '@/components/DataTable'
import ProvinsiFilter from '@/components/ProvinsiFilter'
import { LRARow, JenisDaerah } from '@/types/lra'
import {
  createDummyData,
  getSummaryNasional,
  getKategoriSummary,
  formatRupiah,
} from '@/lib/utils'

const JENIS: JenisDaerah[] = ['Provinsi', 'Kabupaten', 'Kota']
const JENIS_ICON: Record<JenisDaerah, string> = {
  Provinsi: '🏛️', Kabupaten: '🏘️', Kota: '🏙️'
}

const DEFAULT_URL        = 'https://docs.google.com/spreadsheets/d/13znDQlUkXtUvfkq7xpRSjKEcP5JAq-mKuz2SQKmPZGY/edit?usp=sharing'
const DEFAULT_SHEET_NAME = 'Rekap LRA 2026 (agregat)'

const REFRESH_OPTIONS = [
  { label: 'Off',     value: 0 },
  { label: '30 dtk',  value: 30 },
  { label: '1 mnt',   value: 60 },
  { label: '5 mnt',   value: 300 },
  { label: '10 mnt',  value: 600 },
]

export default function DashboardPage() {
  const [data, setData]               = useState<LRARow[]>([])
  const [isLoading, setLoading]       = useState(false)
  const [isRefreshing, setRefreshing] = useState(false)
  const [error, setError]             = useState('')
  const [isDemoMode, setDemo]         = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(0)
  const [countdown, setCountdown]     = useState(0)

  const lastParamsRef = useRef<{ url: string; sheetName: string }>({
    url: DEFAULT_URL, sheetName: DEFAULT_SHEET_NAME
  })
  const intervalRef  = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async (
    url: string, sheetName: string, isBackground = false
  ) => {
    if (isBackground) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ url, sheetName, _t: String(Date.now()) })
      const res  = await fetch(`/api/sheets?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data)
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData(DEFAULT_URL, DEFAULT_SHEET_NAME, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDemoMode = useCallback(() => {
    setData(createDummyData())
    setDemo(true)
    setError('')
    setLastUpdated(new Date())
    setRefreshInterval(0)
  }, [])

  const handleDataLoad = useCallback(async (
    url: string,
    sheetIndex: number,
    cols: { penerimaanAng: number; penerimaanReal: number; pengeluaranAng: number; pengeluaranReal: number }
  ) => {
    setDemo(false)
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        url,
        sheetIndex:      String(sheetIndex),
        penerimaanAng:   String(cols.penerimaanAng),
        penerimaanReal:  String(cols.penerimaanReal),
        pengeluaranAng:  String(cols.pengeluaranAng),
        pengeluaranReal: String(cols.pengeluaranReal),
        _t: String(Date.now()),
      })
      const res  = await fetch(`/api/sheets?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data)
      setLastUpdated(new Date())
      lastParamsRef.current = { url, sheetName: String(sheetIndex) }
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleManualRefresh = useCallback(() => {
    const { url, sheetName } = lastParamsRef.current
    fetchData(url, sheetName, true)
    if (refreshInterval > 0) setCountdown(refreshInterval)
  }, [fetchData, refreshInterval])

  useEffect(() => {
    if (intervalRef.current)  clearInterval(intervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    if (refreshInterval === 0) { setCountdown(0); return }

    setCountdown(refreshInterval)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? refreshInterval : prev - 1))
    }, 1000)
    intervalRef.current = setInterval(() => {
      const { url, sheetName } = lastParamsRef.current
      fetchData(url, sheetName, true)
    }, refreshInterval * 1000)

    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [refreshInterval, fetchData])

  // Cari baris ini (sekitar line 100):
const summary  = data.length ? getSummaryNasional(data) : null
const byJenis  = Object.fromEntries(JENIS.map(j => [j, data.filter(r => r.jenis === j)]))
const kategori = Object.fromEntries(JENIS.map(j => [j, getKategoriSummary(data, j)]))

// Tambahkan tepat di bawahnya:
if (data.length > 0) {
  const provList = data.filter(r => r.jenis === 'Provinsi')
  console.log('=== DEBUG PROVINSI ===')
  console.log('Jumlah provinsi:', provList.length)
  console.log('Daftar:', provList.map(r => r.daerah))
  console.log('Jumlah Kabupaten:', data.filter(r => r.jenis === 'Kabupaten').length)
  console.log('Jumlah Kota:', data.filter(r => r.jenis === 'Kota').length)
  console.log('Total semua daerah:', data.length)
}

  return (
    <div className="app-layout">
      <Sidebar
        onDataLoad={handleDataLoad}
        onDemoMode={handleDemoMode}
        isLoading={isLoading}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />

      <main className={`main-content${sidebarOpen ? '' : ' sidebar-hidden'}`}>

        <header className="dashboard-header">
          <img src="/logokemendagri.png" alt="Logo Kemendagri"
            style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
          <div className="header-text">
            <h1>KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA</h1>
            <p>📊 Dashboard Monitoring Laporan Realisasi Anggaran (LRA) Pemerintah Daerah</p>
            <p className="header-sub">Direktorat Jenderal Bina Keuangan Daerah — TA 2026</p>
          </div>
        </header>

        <div className="realtime-bar">
          <div className="realtime-left">
            <span className={`realtime-dot ${isRefreshing ? 'refreshing' : refreshInterval > 0 ? 'active' : 'idle'}`} />
            <span className="realtime-status">
              {isRefreshing ? 'Memperbarui...' : refreshInterval > 0 ? 'Auto-refresh aktif' : 'Auto-refresh mati'}
            </span>
            {lastUpdated && (
              <span className="realtime-time">· Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}</span>
            )}
            {refreshInterval > 0 && countdown > 0 && (
              <span className="realtime-countdown">· Refresh dalam {countdown}d</span>
            )}
            <span className="realtime-source" title={DEFAULT_URL}>· 📄 {DEFAULT_SHEET_NAME}</span>
          </div>
          <div className="realtime-right">
            <span className="realtime-label">🔄 Auto-refresh:</span>
            <div className="interval-group">
              {REFRESH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`interval-btn ${refreshInterval === opt.value ? 'active' : ''}`}
                  onClick={() => setRefreshInterval(opt.value)}
                >{opt.label}</button>
              ))}
            </div>
            <button
              className="refresh-now-btn"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isDemoMode}
            >{isRefreshing ? '⏳' : '🔃'} Refresh</button>
          </div>
        </div>

        {isDemoMode && <div className="banner banner-info">🧪 Mode Demo — menggunakan data contoh</div>}
        {error      && <div className="banner banner-error">❌ {error}</div>}
        {isLoading  && <div className="banner banner-loading">⏳ Memuat data — <strong>{DEFAULT_SHEET_NAME}</strong>...</div>}

        {data.length > 0 && summary && (
          <>
            {/* Ringkasan Nasional */}
            <section className="section">
              <h2 className="section-title">📊 Ringkasan Nasional</h2>
              <div className="metrics-grid">
                <MetricCard icon="💰" label="Anggaran Pendapatan"  value={formatRupiah(summary.totalAnggaranPendapatan)} />
                <MetricCard icon="✅" label="Realisasi Pendapatan" value={formatRupiah(summary.totalRealisasiPendapatan)} delta={`${summary.persenPendapatan.toFixed(2)}%`} />
                <MetricCard icon="💵" label="Anggaran Belanja"     value={formatRupiah(summary.totalAnggaranBelanja)} />
                <MetricCard icon="✅" label="Realisasi Belanja"    value={formatRupiah(summary.totalRealisasiBelanja)} delta={`${summary.persenBelanja.toFixed(2)}%`} />
              </div>
            </section>

            <section className="section">
              <div className="gauge-grid">
                <GaugeChart value={summary.persenPendapatan} title="📈 Capaian Pendapatan Daerah" color="#1e40af" />
                <GaugeChart value={summary.persenBelanja}    title="💸 Capaian Belanja Daerah"    color="#0f2558" />
              </div>
            </section>

            {/* Filter Per Provinsi — BARU */}
            <ProvinsiFilter data={data} />

            {/* Tabel Semua Daerah */}
            <section className="section">
              <h2 className="section-title">📋 Data Realisasi Per Daerah</h2>
              <DataTable data={data} />
            </section>

            {/* Analisis Per Kategori */}
            <section className="section">
              <h2 className="section-title">📊 Analisis Per Kategori Daerah</h2>
              <div className="metrics-grid">
                {JENIS.map(j => (
                  <MetricCard
                    key={j}
                    icon={JENIS_ICON[j]}
                    label={`Rata-rata ${j}`}
                    value={`${kategori[j].rataRataPendapatan.toFixed(2)}%`}
                    delta={`${kategori[j].jumlahDaerah} daerah`}
                    caption={`Anggaran: ${formatRupiah(kategori[j].totalAnggaran)}`}
                  />
                ))}
              </div>
            </section>

            {/* Per Jenis */}
            {JENIS.map(jenis => {
              const rows = byJenis[jenis] as LRARow[]
              if (!rows.length) return null
              const k = kategori[jenis]
              return (
                <section key={jenis} className="section">
                  <h2 className="section-title">{JENIS_ICON[jenis]} {jenis.toUpperCase()}</h2>

                  <h3 className="subsection-title">Persentase Realisasi Pendapatan APBD {jenis}</h3>
                  <ComparisonBarChart
                    data={rows} metric="persenPendapatan" rataRata={k.rataRataPendapatan}
                    title="PERSENTASE REALISASI PENDAPATAN"
                    subtitle={`APBD ${jenis.toUpperCase()} SE-INDONESIA TA 2026`}
                    kategori={jenis}
                  />
                  <div className="two-col">
                    <div>
                      <h4 className="rank-title rank-top">🟢 20 {jenis} Realisasi Pendapatan Terbesar</h4>
                      <RankTable rows={rows} metric="persenPendapatan" mode="top" />
                    </div>
                    <div>
                      <h4 className="rank-title rank-bot">🔴 20 {jenis} Realisasi Pendapatan Terkecil</h4>
                      <RankTable rows={rows} metric="persenPendapatan" mode="bottom" />
                    </div>
                  </div>

                  <h3 className="subsection-title mt-8">Persentase Realisasi Belanja APBD {jenis}</h3>
                  <ComparisonBarChart
                    data={rows} metric="persenBelanja" rataRata={k.rataRataBelanja}
                    title="PERSENTASE REALISASI BELANJA"
                    subtitle={`APBD ${jenis.toUpperCase()} SE-INDONESIA TA 2026`}
                    kategori={jenis}
                  />
                  <div className="two-col">
                    <div>
                      <h4 className="rank-title rank-top">🟢 20 {jenis} Realisasi Belanja Terbesar</h4>
                      <RankTable rows={rows} metric="persenBelanja" mode="top" />
                    </div>
                    <div>
                      <h4 className="rank-title rank-bot">🔴 20 {jenis} Realisasi Belanja Terkecil</h4>
                      <RankTable rows={rows} metric="persenBelanja" mode="bottom" />
                    </div>
                  </div>
                  <div className="section-divider" />
                </section>
              )
            })}
          </>
        )}

        {data.length === 0 && !isLoading && (
          <div className="empty-state">
            <p className="empty-icon">📊</p>
            <p className="empty-text">
              {error ? 'Gagal memuat data. Coba refresh atau gunakan data demo.' : 'Menghubungkan ke Google Sheets...'}
            </p>
            <button className="sidebar-btn-primary" onClick={handleManualRefresh}>🔃 Coba Lagi</button>
            <button className="sidebar-btn-outline" style={{ marginTop: 8 }} onClick={handleDemoMode}>🧪 Gunakan Data Demo</button>
          </div>
        )}

        <footer className="dashboard-footer">
          <p><strong>KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA</strong></p>
          <p>Direktorat Jenderal Bina Keuangan Daerah — Dashboard LRA TA 2026</p>
          <p>© 2026 Kemendagri RI | Visualisasi Data APBD Real-time</p>
        </footer>
      </main>
    </div>
  )
}

function RankTable({
  rows, metric, mode
}: { rows: LRARow[]; metric: 'persenPendapatan' | 'persenBelanja'; mode: 'top' | 'bottom' }) {
  const valid  = rows.filter(r => r[metric] > 0.05)
  const sorted = [...valid].sort((a, b) => b[metric] - a[metric])
  const list   = mode === 'top' ? sorted.slice(0, 20) : sorted.slice(-20).reverse()
  return (
    <div className="rank-table">
      <table>
        <thead>
          <tr><th>#</th><th>Daerah</th><th>% Realisasi</th></tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.daerah} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
              <td>{i + 1}</td>
              <td>{r.daerah}</td>
              <td style={{ color: r[metric] >= 75 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                {r[metric].toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}