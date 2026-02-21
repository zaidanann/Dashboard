'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SheetInfo { title: string; index: number }

interface SidebarProps {
  onDataLoad: (url: string, sheetIndex: number, cols: ColConfig) => void
  onDemoMode: () => void
  isLoading: boolean
  isOpen: boolean
  onToggle: () => void
}

interface ColConfig {
  penerimaanAng: number
  penerimaanReal: number
  pengeluaranAng: number
  pengeluaranReal: number
}

const NAV_ITEMS = [
  {
    href: '/',
    icon: '▤',
    label: 'Dashboard LRA',
    desc: 'Monitoring & Visualisasi',
  },
  {
    href: '/form-lra',
    icon: '✎',
    label: 'Form Input LRA',
    desc: 'Input Data Realisasi',
    isNew: true,
  },
]

export default function Sidebar({ onDataLoad, onDemoMode, isLoading, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const [mode, setMode]               = useState<'demo' | 'sheets'>('demo')
  const [url, setUrl]                 = useState('')
  const [sheets, setSheets]           = useState<SheetInfo[]>([])
  const [selectedSheet, setSelected]  = useState(0)
  const [loadingSheets, setLoadingSheets] = useState(false)
  const [sheetError, setSheetError]   = useState('')
  const [cols, setCols] = useState<ColConfig>({
    penerimaanAng:   75,
    penerimaanReal:  76,
    pengeluaranAng:  133,
    pengeluaranReal: 134,
  })

  async function fetchSheetList() {
    if (!url) return
    setLoadingSheets(true)
    setSheetError('')
    try {
      const res  = await fetch(`/api/sheets?action=sheets&url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setSheets(json.sheets)
    } catch (e: any) {
      setSheetError(e.message ?? 'Gagal memuat daftar sheet')
    } finally {
      setLoadingSheets(false)
    }
  }

  function handleLoad() {
    if (mode === 'demo') { onDemoMode(); return }
    onDataLoad(url, selectedSheet, cols)
  }

  const isFormPage = pathname === '/form-lra'

  return (
    <aside className={`sidebar ${isOpen ? '' : 'sidebar-closed'}`}>

      <button className="sidebar-toggle-btn" onClick={onToggle} title={isOpen ? 'Sembunyikan' : 'Tampilkan'}>
        {isOpen ? '◀' : '▶'}
      </button>

      {isOpen && (
        <>
          <div className="sidebar-logo">
            <img
              src="/logokemendagri.png"
              alt="Logo Kemendagri"
              style={{
                width: '110px',
                height: '110px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto 8px auto'
              }}
            />
            <p className="sidebar-brand">KEMENDAGRI</p>
            <p className="sidebar-sub">Dashboard LRA</p>
          </div>

          <hr className="sidebar-divider" />

          {/* ── MENU NAVIGASI ── */}
          <div className="sidebar-section">
            <p className="sidebar-label">🗂️ MENU UTAMA</p>
            <nav className="snav">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className={`snav-item ${active ? 'snav-item--active' : ''}`}>
                    {/* Glow layer saat active */}
                    {active && <span className="snav-glow" />}

                    {/* Icon box */}
                    <span className={`snav-icon-box ${active ? 'snav-icon-box--active' : ''}`}>
                      {item.icon}
                    </span>

                    {/* Text */}
                    <span className="snav-text">
                      <span className="snav-label">{item.label}</span>
                      <span className="snav-desc">{item.desc}</span>
                    </span>

                    {/* Badge / arrow */}
                    <span className="snav-right">
                      {item.isNew && !active && (
                        <span className="snav-badge">Baru</span>
                      )}
                      {active && (
                        <span className="snav-arrow">›</span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* ── SUMBER DATA — hanya di dashboard ── */}
          {!isFormPage && (
            <>
              <hr className="sidebar-divider" />
              <div className="sidebar-section">
                <p className="sidebar-label">⚙️ SUMBER DATA</p>
                <div className="mode-toggle">
                  <button className={`mode-btn ${mode === 'demo' ? 'active' : ''}`} onClick={() => setMode('demo')}>
                    🧪 Demo
                  </button>
                  <button className={`mode-btn ${mode === 'sheets' ? 'active' : ''}`} onClick={() => setMode('sheets')}>
                    📊 Sheets
                  </button>
                </div>
              </div>

              {mode === 'sheets' && (
                <>
                  <hr className="sidebar-divider" />
                  <div className="sidebar-section">
                    <p className="sidebar-label">🔗 URL GOOGLE SHEETS</p>
                    <input
                      className="sidebar-input"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                    />
                    <button className="sidebar-btn-outline" onClick={fetchSheetList} disabled={loadingSheets || !url}>
                      {loadingSheets ? '⏳ Memuat...' : '🔍 Ambil Daftar Sheet'}
                    </button>
                    {sheetError && <p className="sidebar-error">{sheetError}</p>}

                    {sheets.length > 0 && (
                      <>
                        <p className="sidebar-label mt-3">📋 PILIH SHEET</p>
                        <select
                          className="sidebar-select"
                          value={selectedSheet}
                          onChange={e => setSelected(Number(e.target.value))}
                        >
                          {sheets.map(s => (
                            <option key={s.index} value={s.index}>{s.title}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>

                  <hr className="sidebar-divider" />
                  <div className="sidebar-section">
                    <p className="sidebar-label">🎯 NOMOR KOLOM</p>
                    <div className="col-grid">
                      {([
                        ['Penerimaan Anggaran',   'penerimaanAng'],
                        ['Penerimaan Realisasi',  'penerimaanReal'],
                        ['Pengeluaran Anggaran',  'pengeluaranAng'],
                        ['Pengeluaran Realisasi', 'pengeluaranReal'],
                      ] as [string, keyof ColConfig][]).map(([label, key]) => (
                        <div key={key}>
                          <p className="col-label">{label}</p>
                          <input
                            type="number"
                            className="sidebar-input"
                            value={cols[key]}
                            min={0}
                            onChange={e => setCols(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <hr className="sidebar-divider" />
              <div className="sidebar-section">
                <button className="sidebar-btn-primary" onClick={handleLoad} disabled={isLoading}>
                  {isLoading ? '⏳ Memuat...' : mode === 'demo' ? '🧪 Muat Data Demo' : '📊 Muat Data'}
                </button>
              </div>

              <hr className="sidebar-divider" />
              <div className="sidebar-section">
                <p className="sidebar-label">ℹ️ INFORMASI</p>
                <p className="sidebar-info">Dashboard menampilkan perbandingan realisasi pendapatan & belanja APBD dengan visualisasi 20 daerah tertinggi dan terendah per kategori.</p>
              </div>
            </>
          )}

          {isFormPage && (
            <>
              <hr className="sidebar-divider" />
              <div className="sidebar-section">
                <p className="sidebar-label">ℹ️ INFORMASI</p>
                <p className="sidebar-info">Input data LRA per kode rekening. Data akan dikirim langsung ke Google Sheets sesuai target sheet yang dipilih.</p>
              </div>
            </>
          )}
        </>
      )}

      <style jsx>{`
        /* ── Nav container ── */
        .snav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }

        /* ── Nav item ── */
        .snav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          overflow: hidden;
          transition: background 0.2s ease, transform 0.15s ease;
          border: 1px solid transparent;
        }

        .snav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .snav-item--active {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(100, 181, 246, 0.35);
          transform: translateX(0);
        }

        /* ── Glow background on active ── */
        .snav-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(100, 181, 246, 0.15) 0%, rgba(30, 64, 175, 0.1) 100%);
          border-radius: 12px;
          pointer-events: none;
        }

        /* ── Icon box ── */
        .snav-icon-box {
          position: relative;
          z-index: 1;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: background 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .snav-item:hover .snav-icon-box {
          background: rgba(255, 255, 255, 0.15);
        }

        .snav-icon-box--active {
          background: linear-gradient(135deg, #1e40af, #3b82f6) !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0,0,0,0.3);
          border-color: rgba(147, 197, 253, 0.4);
        }

        /* ── Text block ── */
        .snav-text {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .snav-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .snav-item--active .snav-label {
          color: #fff;
        }

        .snav-desc {
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .snav-item--active .snav-desc {
          color: rgba(147, 197, 253, 0.8);
        }

        /* ── Right side (badge / arrow) ── */
        .snav-right {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .snav-badge {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: #fff;
          padding: 3px 8px;
          border-radius: 20px;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
          animation: badgePop 2.5s ease-in-out infinite;
          text-transform: uppercase;
        }

        @keyframes badgePop {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(0.95); }
        }

        .snav-arrow {
          font-size: 18px;
          font-weight: 300;
          color: rgba(147, 197, 253, 0.9);
          line-height: 1;
          animation: arrowPulse 1.5s ease-in-out infinite;
        }

        @keyframes arrowPulse {
          0%, 100% { transform: translateX(0); opacity: 0.9; }
          50%       { transform: translateX(2px); opacity: 1; }
        }
      `}</style>
    </aside>
  )
}