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
    icon: '✏️',
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
          gap: 8px;
          margin-top: 10px;
        }

        /* ── Nav item ── */
        .snav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 14px;
          border-radius: 16px;
          text-decoration: none;
          overflow: hidden;
          cursor: pointer;

          /* Glassmorphism base */
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.07);

          /* Smooth multi-property transition */
          transition:
            background   0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
            border-color 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
            transform    0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow   0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .snav-item:hover {
          background: rgba(255, 255, 255, 0.10);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-color: rgba(147, 197, 253, 0.22);
          transform: translateX(4px) scale(1.012);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .snav-item--active {
          background: rgba(59, 130, 246, 0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-color: rgba(147, 197, 253, 0.40);
          transform: translateX(0) scale(1);
          box-shadow:
            0 6px 24px rgba(59, 130, 246, 0.22),
            0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* ── Shimmer / glow layer on active ── */
        .snav-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            rgba(147, 197, 253, 0.10) 0%,
            rgba(59, 130, 246, 0.14) 50%,
            rgba(30, 64, 175, 0.08) 100%
          );
          border-radius: 16px;
          pointer-events: none;
        }

        /* Subtle top-edge highlight */
        .snav-item--active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 14px;
          right: 14px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.6), transparent);
          border-radius: 1px;
        }

        /* Left accent bar */
        .snav-item--active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: linear-gradient(180deg, #60a5fa, #3b82f6, #1d4ed8);
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.7);
        }

        /* ── Icon box ── */
        .snav-icon-box {
          position: relative;
          z-index: 1;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.10);
          transition:
            background  0.35s ease,
            box-shadow  0.35s ease,
            transform   0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .snav-item:hover .snav-icon-box {
          background: rgba(255, 255, 255, 0.14);
          transform: scale(1.08) rotate(-3deg);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        }

        .snav-icon-box--active {
          background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%) !important;
          box-shadow:
            0 0 0 1px rgba(147, 197, 253, 0.35),
            0 0 16px rgba(59, 130, 246, 0.55),
            0 4px 12px rgba(0, 0, 0, 0.35);
          border-color: rgba(147, 197, 253, 0.45);
          transform: scale(1) rotate(0deg) !important;
        }

        /* ── Icon box khusus Form LRA (item ke-2, non-aktif) ── */
        .snav-item:nth-child(2) .snav-icon-box:not(.snav-icon-box--active) {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.20) 100%);
          border-color: rgba(251, 191, 36, 0.35);
          color: #fbbf24;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.7);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .snav-item:nth-child(2):hover .snav-icon-box:not(.snav-icon-box--active) {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.38) 0%, rgba(245, 158, 11, 0.30) 100%);
          box-shadow: 0 0 16px rgba(251, 191, 36, 0.40), inset 0 1px 0 rgba(255,255,255,0.15);
          border-color: rgba(251, 191, 36, 0.55);
        }

        /* ── Text block ── */
        .snav-text {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .snav-label {
          font-size: 13.5px;
          font-weight: 650;
          color: rgba(255, 255, 255, 0.82);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
          letter-spacing: 0.1px;
          transition: color 0.25s ease;
        }

        .snav-item:hover .snav-label {
          color: rgba(255, 255, 255, 0.97);
        }

        .snav-item--active .snav-label {
          color: #fff;
          text-shadow: 0 0 12px rgba(147, 197, 253, 0.5);
        }

        .snav-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.1px;
          transition: color 0.25s ease;
        }

        .snav-item:hover .snav-desc {
          color: rgba(255, 255, 255, 0.55);
        }

        .snav-item--active .snav-desc {
          color: rgba(147, 197, 253, 0.75);
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
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: #fff;
          padding: 3px 9px;
          border-radius: 20px;
          box-shadow:
            0 2px 8px rgba(239, 68, 68, 0.45),
            inset 0 1px 0 rgba(255,255,255,0.2);
          animation: badgePop 2.8s ease-in-out infinite;
          text-transform: uppercase;
        }

        @keyframes badgePop {
          0%, 100% { opacity: 1;    transform: scale(1);    }
          50%       { opacity: 0.8; transform: scale(0.93); }
        }

        .snav-arrow {
          font-size: 20px;
          font-weight: 300;
          color: rgba(147, 197, 253, 0.85);
          line-height: 1;
          animation: arrowPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes arrowPulse {
          0%, 100% { transform: translateX(0);   opacity: 0.75; }
          50%       { transform: translateX(3px); opacity: 1;    }
        }
      `}</style>
    </aside>
  )
}