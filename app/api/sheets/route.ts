import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, getAvailableSheets } from '@/lib/sheets'
import { extractLRAData, autoDetectCols } from '@/lib/utils'

// ── Konfigurasi default — hardcoded (tidak di-export agar tidak konflik Next.js) ──
const DEFAULT_SHEET_URL  = 'https://docs.google.com/spreadsheets/d/13znDQlUkXtUvfkq7xpRSjKEcP5JAq-mKuz2SQKmPZGY/edit?usp=sharing'
const DEFAULT_SHEET_NAME = 'Rekap LRA 2026 (agregat)'

// Matikan cache — wajib untuk realtime
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')

  // Gunakan URL dari query atau fallback ke default
  const url = searchParams.get('url') ?? DEFAULT_SHEET_URL

  // ── List sheets ──────────────────────────────────────────────────────────
  if (action === 'sheets') {
    try {
      const sheets = await getAvailableSheets(url)
      return NextResponse.json({ sheets }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengambil daftar sheet'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ── Get data ─────────────────────────────────────────────────────────────
  try {
    // Resolve worksheet index
    let worksheetIndex = parseInt(searchParams.get('sheetIndex') ?? '-1')

    // Jika tidak ada sheetIndex dari query, cari berdasarkan nama sheet default
    if (worksheetIndex < 0 || !searchParams.get('sheetIndex')) {
      const sheetName = searchParams.get('sheetName') ?? DEFAULT_SHEET_NAME
      const sheets = await getAvailableSheets(url)
      const found  = sheets.find(s => s.title === sheetName)
      worksheetIndex = found?.index ?? 0
    }

    // Ambil raw data
    const rawData = await getSheetData(url, worksheetIndex)

    // ── Auto-detect kolom ────────────────────────────────────────────────
    let cols: { penerimaanAng: number; penerimaanReal: number; pengeluaranAng: number; pengeluaranReal: number }

    // Cek apakah user menyuplai kolom manual
    const manualAng   = searchParams.get('penerimaanAng')
    const manualReal  = searchParams.get('penerimaanReal')
    const manualAngB  = searchParams.get('pengeluaranAng')
    const manualRealB = searchParams.get('pengeluaranReal')

    if (manualAng && manualReal && manualAngB && manualRealB) {
      // Gunakan kolom dari user (mode manual sidebar)
      cols = {
        penerimaanAng:   parseInt(manualAng),
        penerimaanReal:  parseInt(manualReal),
        pengeluaranAng:  parseInt(manualAngB),
        pengeluaranReal: parseInt(manualRealB),
      }
    } else {
      // Auto-detect dari header spreadsheet
      const detected = autoDetectCols(rawData)
      if (!detected) {
        // Fallback ke kolom default jika auto-detect gagal
        cols = {
          penerimaanAng:   155,
          penerimaanReal:  156,
          pengeluaranAng:  158,
          pengeluaranReal: 159,
        }
      } else {
        cols = detected
      }
    }

    const lraData = extractLRAData(rawData, cols)

    return NextResponse.json(
      {
        data: lraData,
        detectedCols: cols,   // kirim balik kolom yang terdeteksi — untuk debugging
        worksheetIndex,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}