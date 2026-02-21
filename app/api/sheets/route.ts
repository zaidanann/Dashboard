import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, getAvailableSheets } from '@/lib/sheets'
import { extractLRAData, autoDetectCols } from '@/lib/utils'

const DEFAULT_SHEET_URL  = 'https://docs.google.com/spreadsheets/d/13znDQlUkXtUvfkq7xpRSjKEcP5JAq-mKuz2SQKmPZGY/edit?usp=sharing'
const DEFAULT_SHEET_NAME = 'Rekap LRA 2026 (agregat)'

// Nama sheet yang dicari untuk data historis
// Cocokkan dengan nama sheet di spreadsheet Anda
const SHEET_PATTERNS = {
  jan2026:  ['jan 2026', 'januari 2026', 'rekap lra jan', 'lra jan 2026', 'lra 2026 jan'],
  feb2025:  ['feb 2025', 'februari 2025', 'rekap lra feb 2025', 'lra feb 2025', 'lra 2025 feb', '2025 (agregat)', 'rekap lra 2025'],
  jan2025:  ['jan 2025', 'januari 2025', 'rekap lra jan 2025', 'lra jan 2025', 'lra 2025 jan'],
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

/* ── Helper: cari sheet berdasarkan pattern ── */
function findSheet(sheets: { title: string; index: number }[], patterns: string[]) {
  return sheets.find(s =>
    patterns.some(p => s.title.toLowerCase().includes(p.toLowerCase()))
  ) ?? null
}

/* ── Helper: ambil & parse LRA dari sheet, hitung agregat ── */
async function fetchAgregat(
  url: string,
  sheetIndex: number,
  jenis: string | null
): Promise<{ persen: number; triliun: number } | null> {
  try {
    const raw  = await getSheetData(url, sheetIndex)
    const cols = autoDetectCols(raw) ?? { penerimaanAng: 75, penerimaanReal: 76, pengeluaranAng: 133, pengeluaranReal: 134 }
    const rows = extractLRAData(raw, cols)
    const filtered = jenis ? rows.filter(r => r.jenis === jenis) : rows
    if (!filtered.length) return null

    const totalAng  = filtered.reduce((s, r) => s + r.anggaranPendapatan, 0)
    const totalReal = filtered.reduce((s, r) => s + r.realisasiPendapatan, 0)
    const totalAngB = filtered.reduce((s, r) => s + r.anggaranBelanja, 0)
    const totalRealB = filtered.reduce((s, r) => s + r.realisasiBelanja, 0)

    return {
      persen:   totalAng  > 0 ? parseFloat(((totalReal  / totalAng)  * 100).toFixed(2)) : 0,
      triliun:  parseFloat((totalReal / 1e12).toFixed(2)),
      persenBelanja: totalAngB > 0 ? parseFloat(((totalRealB / totalAngB) * 100).toFixed(2)) : 0,
      triliunBelanja: parseFloat((totalRealB / 1e12).toFixed(2)),
    } as any
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')
  const url    = searchParams.get('url') ?? DEFAULT_SHEET_URL

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

  // ── Data tren: ambil dari sheet historis ─────────────────────────────────
  if (action === 'trend') {
    try {
      const sheets    = await getAvailableSheets(url)
      const sheetList = sheets.map(s => s.title)

      // Feb 2026 — sheet utama (sudah pasti ada)
      const mainSheet = sheets.find(s => s.title === DEFAULT_SHEET_NAME) ?? sheets[0]

      // Cari sheet historis
      const sheetJan26 = findSheet(sheets, SHEET_PATTERNS.jan2026)
      const sheetFeb25 = findSheet(sheets, SHEET_PATTERNS.feb2025)
      const sheetJan25 = findSheet(sheets, SHEET_PATTERNS.jan2025)

      // Jenis yang dibutuhkan
      const JENIS = [null, 'Provinsi', 'Kabupaten', 'Kota'] as const

      // Fetch Feb 2026 dari sheet utama
      const feb26Raw  = await getSheetData(url, mainSheet.index)
      const feb26Cols = autoDetectCols(feb26Raw) ?? { penerimaanAng: 75, penerimaanReal: 76, pengeluaranAng: 133, pengeluaranReal: 134 }
      const feb26Rows = extractLRAData(feb26Raw, feb26Cols)

      function getAgregat(rows: typeof feb26Rows, jenis: string | null) {
        const filtered = jenis ? rows.filter(r => r.jenis === jenis) : rows
        if (!filtered.length) return null
        const totalAngP  = filtered.reduce((s, r) => s + r.anggaranPendapatan,  0)
        const totalRealP = filtered.reduce((s, r) => s + r.realisasiPendapatan, 0)
        const totalAngB  = filtered.reduce((s, r) => s + r.anggaranBelanja,     0)
        const totalRealB = filtered.reduce((s, r) => s + r.realisasiBelanja,    0)
        return {
          persenPendapatan:   totalAngP > 0 ? parseFloat(((totalRealP / totalAngP) * 100).toFixed(2)) : 0,
          nilaiPendapatanT:   parseFloat((totalRealP / 1e12).toFixed(2)),
          persenBelanja:      totalAngB > 0 ? parseFloat(((totalRealB / totalAngB) * 100).toFixed(2)) : 0,
          nilaiBelanjaTrilun: parseFloat((totalRealB / 1e12).toFixed(2)),
        }
      }

      // Fetch sheet historis (parallel)
      const [jan26RowsRaw, feb25RowsRaw, jan25RowsRaw] = await Promise.all([
        sheetJan26 ? getSheetData(url, sheetJan26.index).then(r => extractLRAData(r, autoDetectCols(r) ?? feb26Cols)) : Promise.resolve(null),
        sheetFeb25 ? getSheetData(url, sheetFeb25.index).then(r => extractLRAData(r, autoDetectCols(r) ?? feb26Cols)) : Promise.resolve(null),
        sheetJan25 ? getSheetData(url, sheetJan25.index).then(r => extractLRAData(r, autoDetectCols(r) ?? feb26Cols)) : Promise.resolve(null),
      ])

      // Susun data per jenis
      const result = JENIS.map(jenis => ({
        jenis: jenis ?? 'Semua',
        jan2025: jan25RowsRaw ? getAgregat(jan25RowsRaw, jenis) : null,
        feb2025: feb25RowsRaw ? getAgregat(feb25RowsRaw, jenis) : null,
        jan2026: jan26RowsRaw ? getAgregat(jan26RowsRaw, jenis) : null,
        feb2026: getAgregat(feb26Rows, jenis), // selalu ada
      }))

      return NextResponse.json({
        sheetsFound: {
          jan2026: sheetJan26?.title ?? null,
          feb2025: sheetFeb25?.title ?? null,
          jan2025: sheetJan25?.title ?? null,
        },
        allSheets: sheetList,
        data: result,
      }, { headers: { 'Cache-Control': 'no-store' } })

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data tren'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ── Get data LRA utama ───────────────────────────────────────────────────
  try {
    let worksheetIndex = parseInt(searchParams.get('sheetIndex') ?? '-1')

    if (worksheetIndex < 0 || !searchParams.get('sheetIndex')) {
      const sheetName = searchParams.get('sheetName') ?? DEFAULT_SHEET_NAME
      const sheets    = await getAvailableSheets(url)
      const found     = sheets.find(s => s.title === sheetName)
      worksheetIndex  = found?.index ?? 0
    }

    const rawData = await getSheetData(url, worksheetIndex)

    const manualAng   = searchParams.get('penerimaanAng')
    const manualReal  = searchParams.get('penerimaanReal')
    const manualAngB  = searchParams.get('pengeluaranAng')
    const manualRealB = searchParams.get('pengeluaranReal')

    const cols = (manualAng && manualReal && manualAngB && manualRealB) ? {
      penerimaanAng:   parseInt(manualAng),
      penerimaanReal:  parseInt(manualReal),
      pengeluaranAng:  parseInt(manualAngB),
      pengeluaranReal: parseInt(manualRealB),
    } : (autoDetectCols(rawData) ?? { penerimaanAng: 75, penerimaanReal: 76, pengeluaranAng: 133, pengeluaranReal: 134 })

    const lraData = extractLRAData(rawData, cols)

    return NextResponse.json(
      { data: lraData, detectedCols: cols, worksheetIndex },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}