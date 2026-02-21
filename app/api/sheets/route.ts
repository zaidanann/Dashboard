import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, getAvailableSheets } from '@/lib/sheets'
import { extractLRAData, autoDetectCols } from '@/lib/utils'

const DEFAULT_SHEET_URL  = 'https://docs.google.com/spreadsheets/d/13znDQlUkXtUvfkq7xpRSjKEcP5JAq-mKuz2SQKmPZGY/edit?usp=sharing'
const DEFAULT_SHEET_NAME = 'Rekap LRA 2026 (agregat)'

// Sheet khusus tren — opsional, jika tidak ada pakai simulasi
const TREND_SHEET_NAMES = [
  'Tren LRA',
  'Trend LRA',
  'Tren Realisasi',
  'Data Tren',
]

export const revalidate = 0
export const dynamic = 'force-dynamic'

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

  // ── Data tren historis ───────────────────────────────────────────────────
  if (action === 'trend') {
    try {
      const sheets = await getAvailableSheets(url)

      // Cari sheet tren berdasarkan nama-nama yang mungkin
      const trendSheet = sheets.find(s =>
        TREND_SHEET_NAMES.some(name =>
          s.title.toLowerCase().includes(name.toLowerCase())
        )
      )

      if (!trendSheet) {
        // Tidak ada sheet tren — kembalikan flag agar client pakai simulasi
        return NextResponse.json(
          { hasTrendSheet: false, data: null },
          { headers: { 'Cache-Control': 'no-store' } }
        )
      }

      // Ada sheet tren — ambil data
      const rawTrend = await getSheetData(url, trendSheet.index)

      // Parse: baris pertama = header, baris berikutnya = data
      // Format yang diharapkan di sheet:
      // Bulan | Tahun | Jenis | PersenPendapatan | NilaiPendapatanTriliun | PersenBelanja | NilaiBelanjaTrilun
      const headers = rawTrend[0]?.map((h: string) => h?.toString().toLowerCase().trim()) ?? []

      const findCol = (keywords: string[]) =>
        headers.findIndex((h: string) => keywords.some(k => h.includes(k)))

      const colBulan   = findCol(['bulan', 'month', 'periode'])
      const colTahun   = findCol(['tahun', 'year', 'ta'])
      const colJenis   = findCol(['jenis', 'kategori', 'type'])
      const colPctPend = findCol(['persen_pendapatan', 'pct_pendapatan', '% pendapatan', 'realisasi pendapatan'])
      const colValPend = findCol(['nilai_pendapatan', 'pendapatan_t', 'pendapatan triliun'])
      const colPctBel  = findCol(['persen_belanja', 'pct_belanja', '% belanja', 'realisasi belanja'])
      const colValBel  = findCol(['nilai_belanja', 'belanja_t', 'belanja triliun'])

      const trendRows = rawTrend.slice(1)
        .filter((row: any[]) => row[colBulan])
        .map((row: any[]) => ({
          bulan:               row[colBulan]   ?? '',
          tahun:               row[colTahun]   ?? '',
          jenis:               row[colJenis]   ?? 'Semua',
          persenPendapatan:    parseFloat(row[colPctPend]) || 0,
          nilaiPendapatanT:    parseFloat(row[colValPend]) || null,
          persenBelanja:       parseFloat(row[colPctBel])  || 0,
          nilaiBelanjaTrilun:  parseFloat(row[colValBel])  || null,
        }))

      return NextResponse.json(
        { hasTrendSheet: true, sheetName: trendSheet.title, data: trendRows },
        { headers: { 'Cache-Control': 'no-store' } }
      )
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
      const sheets = await getAvailableSheets(url)
      const found  = sheets.find(s => s.title === sheetName)
      worksheetIndex = found?.index ?? 0
    }

    const rawData = await getSheetData(url, worksheetIndex)

    let cols: { penerimaanAng: number; penerimaanReal: number; pengeluaranAng: number; pengeluaranReal: number }

    const manualAng   = searchParams.get('penerimaanAng')
    const manualReal  = searchParams.get('penerimaanReal')
    const manualAngB  = searchParams.get('pengeluaranAng')
    const manualRealB = searchParams.get('pengeluaranReal')

    if (manualAng && manualReal && manualAngB && manualRealB) {
      cols = {
        penerimaanAng:   parseInt(manualAng),
        penerimaanReal:  parseInt(manualReal),
        pengeluaranAng:  parseInt(manualAngB),
        pengeluaranReal: parseInt(manualRealB),
      }
    } else {
      const detected = autoDetectCols(rawData)
      cols = detected ?? {
        penerimaanAng:   75,
        penerimaanReal:  76,
        pengeluaranAng:  133,
        pengeluaranReal: 134,
      }
    }

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