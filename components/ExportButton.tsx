'use client'

import { useState } from 'react'
import { useExport, ExportSection } from '@/hooks/useExport'
import { LRARow } from '@/types/lra'

interface ExportButtonProps {
  /** Mode 'jpg' = screenshot satu elemen, 'ppt' = export semua jadi PPT */
  mode: 'jpg' | 'ppt'
  elementId?: string       // untuk mode 'jpg'
  filename?: string
  sections?: ExportSection[]  // untuk mode 'ppt'
  data?: LRARow[]             // untuk mode 'ppt'
  selectedProv?: string       // untuk mode 'ppt'
  label?: string
  style?: React.CSSProperties
}

export default function ExportButton({
  mode, elementId, filename = 'export', sections = [], data = [], selectedProv = '', label, style
}: ExportButtonProps) {
  const { downloadJpg, downloadPpt } = useExport()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      if (mode === 'jpg' && elementId) {
        await downloadJpg(elementId, filename)
      } else if (mode === 'ppt') {
        await downloadPpt(sections, data, selectedProv, filename)
      }
    } finally {
      setLoading(false)
    }
  }

  const defaultLabel = mode === 'jpg' ? '📷 Download JPG' : '📊 Download PPT'

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={mode === 'jpg' ? 'Download sebagai gambar JPG' : 'Download semua sebagai PowerPoint'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 8,
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        fontWeight: 700,
        fontSize: 12,
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
        background: mode === 'jpg'
          ? 'linear-gradient(135deg, #0369a1, #0284c7)'
          : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        ...style,
      }}
    >
      {loading ? '⏳ Memproses...' : (label ?? defaultLabel)}
    </button>
  )
}