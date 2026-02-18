import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, getAvailableSheets } from '@/lib/sheets'
import { extractLRAData } from '@/lib/utils'

// Matikan cache — wajib untuk realtime
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')
  const url    = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Parameter url diperlukan' }, { status: 400 })
  }

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
  const worksheetIndex  = parseInt(searchParams.get('sheetIndex')      ?? '0')
  const penerimaanAng   = parseInt(searchParams.get('penerimaanAng')   ?? '154')
  const penerimaanReal  = parseInt(searchParams.get('penerimaanReal')  ?? '155')
  const pengeluaranAng  = parseInt(searchParams.get('pengeluaranAng')  ?? '157')
  const pengeluaranReal = parseInt(searchParams.get('pengeluaranReal') ?? '158')

  try {
    const rawData = await getSheetData(url, worksheetIndex)
    const lraData = extractLRAData(rawData, {
      penerimaanAng,
      penerimaanReal,
      pengeluaranAng,
      pengeluaranReal,
    })

    return NextResponse.json({ data: lraData }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}