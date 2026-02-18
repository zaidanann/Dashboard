import { LRARow, JenisDaerah, KategoriSummary, SummaryNasional } from '@/types/lra'

// ── Klasifikasi jenis daerah — return null jika bukan Prov/Kab/Kota ─────────
export function classifyDaerah(name: string): JenisDaerah | null {
  const upper = name.toUpperCase()

  // Kota — cek lebih dulu sebelum Kabupaten
  if (upper.startsWith('KOTA ') || upper.startsWith('KOTA.')) return 'Kota'

  // Kabupaten
  if (upper.includes('KAB.') || upper.includes('KAB ') || upper.startsWith('KABUPATEN')) return 'Kabupaten'

  // Provinsi
  if (upper.includes('PROV.') || upper.includes('PROV ') || upper.startsWith('PROVINSI')) return 'Provinsi'

  // Tidak teridentifikasi → skip
  return null
}

// ── Parse nilai numerik dari string Google Sheets ─────────────────────────
export function parseNumeric(val: string | undefined | null): number {
  if (!val) return 0
  const cleaned = val.toString().trim()
  if (['', '-', 'none', '#value!', '#n/a'].includes(cleaned.toLowerCase())) return 0
  const numeric = cleaned.replace(/,/g, '').replace(/\s/g, '').replace(/rp/gi, '')
  const result = parseFloat(numeric)
  return isNaN(result) ? 0 : result
}

// ── Cari baris header di raw data ─────────────────────────────────────────
export function findHeaderRow(rows: string[][]): number | null {
  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].join(' ').toUpperCase()
    if (rowStr.includes('DAERAH') && (rowStr.includes('NO.') || rowStr.includes('NO '))) {
      return i
    }
  }
  return null
}

// ── Extract & transform raw Sheets data → LRARow[] ────────────────────────
export function extractLRAData(
  rawData: string[][],
  cols: {
    penerimaanAng: number
    penerimaanReal: number
    pengeluaranAng: number
    pengeluaranReal: number
  }
): LRARow[] {
  const headerIdx = findHeaderRow(rawData)
  if (headerIdx === null) return []

  // Cari kolom DAERAH
  const headerRow = rawData[headerIdx]
  const daerahCol = headerRow.findIndex(c => c.toUpperCase().includes('DAERAH'))
  if (daerahCol === -1) return []

  const rows: LRARow[] = []

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i]
    const daerah = row[daerahCol]?.trim() ?? ''

    // Skip invalid rows
    if (
      !daerah ||
      ['', 'NO.', 'NO', 'DAERAH', 'TOTAL'].includes(daerah.toUpperCase()) ||
      daerah.replace(/\./g, '').match(/^\d+$/)
    ) continue

    const anggaranPendapatan  = parseNumeric(row[cols.penerimaanAng])
    const realisasiPendapatan = parseNumeric(row[cols.penerimaanReal])
    const anggaranBelanja     = parseNumeric(row[cols.pengeluaranAng])
    const realisasiBelanja    = parseNumeric(row[cols.pengeluaranReal])

    // Skip baris yang bukan Prov/Kab/Kota (TOTAL, JUMLAH, NASIONAL, dll)
    const jenis = classifyDaerah(daerah)
    if (jenis === null) continue

    rows.push({
      daerah,
      jenis,
      anggaranPendapatan,
      realisasiPendapatan,
      anggaranBelanja,
      realisasiBelanja,
      persenPendapatan: (anggaranPendapatan > 0 && isFinite(realisasiPendapatan / anggaranPendapatan))
        ? (realisasiPendapatan / anggaranPendapatan) * 100 : 0,
      persenBelanja: (anggaranBelanja > 0 && isFinite(realisasiBelanja / anggaranBelanja))
        ? (realisasiBelanja / anggaranBelanja) * 100 : 0,
      surplusDefisit:   realisasiPendapatan - realisasiBelanja,
    })
  }

  return rows
}

// ── Ringkasan nasional ─────────────────────────────────────────────────────
export function getSummaryNasional(data: LRARow[]): SummaryNasional {
  const totalAnggaranPendapatan  = data.reduce((s, r) => s + r.anggaranPendapatan,  0)
  const totalRealisasiPendapatan = data.reduce((s, r) => s + r.realisasiPendapatan, 0)
  const totalAnggaranBelanja     = data.reduce((s, r) => s + r.anggaranBelanja,     0)
  const totalRealisasiBelanja    = data.reduce((s, r) => s + r.realisasiBelanja,    0)
  return {
    totalAnggaranPendapatan,
    totalRealisasiPendapatan,
    totalAnggaranBelanja,
    totalRealisasiBelanja,
    persenPendapatan: totalAnggaranPendapatan > 0 ? (totalRealisasiPendapatan / totalAnggaranPendapatan) * 100 : 0,
    persenBelanja:    totalAnggaranBelanja     > 0 ? (totalRealisasiBelanja    / totalAnggaranBelanja)    * 100 : 0,
  }
}

// ── Ringkasan per kategori ─────────────────────────────────────────────────
export function getKategoriSummary(data: LRARow[], jenis: JenisDaerah): KategoriSummary {
  const filtered = data.filter(r => r.jenis === jenis)
  const totalAnggaran   = filtered.reduce((s, r) => s + r.anggaranPendapatan,  0)
  const totalRealisasi  = filtered.reduce((s, r) => s + r.realisasiPendapatan, 0)
  const totalAngBelanja = filtered.reduce((s, r) => s + r.anggaranBelanja,     0)
  const totalRealBelanja= filtered.reduce((s, r) => s + r.realisasiBelanja,    0)
  return {
    rataRataPendapatan: totalAnggaran   > 0 ? (totalRealisasi   / totalAnggaran)   * 100 : 0,
    rataRataBelanja:    totalAngBelanja > 0 ? (totalRealBelanja / totalAngBelanja) * 100 : 0,
    totalAnggaran,
    totalRealisasi,
    jumlahDaerah: filtered.length,
  }
}

// ── Format Rupiah ──────────────────────────────────────────────────────────
export function formatRupiah(value: number): string {
  if (!isFinite(value) || isNaN(value)) return 'Rp 0,00'
  return 'Rp ' + value.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ── Top / Bottom N daerah ─────────────────────────────────────────────────
export function getTopBottom(
  data: LRARow[],
  metric: 'persenPendapatan' | 'persenBelanja',
  n = 20
) {
  const valid = data.filter(r => r[metric] > 0.05)
  const sorted = [...valid].sort((a, b) => b[metric] - a[metric])
  if (sorted.length <= n * 2) return { top: sorted, bottom: [] }
  return {
    top:    sorted.slice(0, n),
    bottom: sorted.slice(-n),
  }
}

// ── Data dummy (fallback demo) ─────────────────────────────────────────────
export function createDummyData(): LRARow[] {
  const rows: LRARow[] = []

  for (let i = 1; i <= 34; i++) {
    const ang = 1_500_000_000_000 + i * 50_000_000_000
    const real = ang * (0.03 + i * 0.003)
    const angB = ang + 20_000_000_000
    const realB = angB * (0.03 + i * 0.003)
    rows.push({
      daerah: `Prov. Provinsi ${i}`,
      jenis: 'Provinsi',
      anggaranPendapatan: ang, realisasiPendapatan: real,
      anggaranBelanja: angB,  realisasiBelanja: realB,
      persenPendapatan: (real / ang) * 100,
      persenBelanja:    (realB / angB) * 100,
      surplusDefisit:   real - realB,
    })
  }
  for (let i = 1; i <= 100; i++) {
    const ang = 800_000_000_000 + i * 10_000_000_000
    const real = ang * (0.005 + i * 0.004)
    const angB = ang + 20_000_000_000
    const realB = angB * (0.005 + i * 0.004)
    rows.push({
      daerah: `Kab. Kabupaten ${i}`,
      jenis: 'Kabupaten',
      anggaranPendapatan: ang, realisasiPendapatan: real,
      anggaranBelanja: angB,  realisasiBelanja: realB,
      persenPendapatan: (real / ang) * 100,
      persenBelanja:    (realB / angB) * 100,
      surplusDefisit:   real - realB,
    })
  }
  for (let i = 1; i <= 44; i++) {
    const ang = 900_000_000_000 + i * 15_000_000_000
    const real = ang * (0.01 + i * 0.003)
    const angB = ang + 20_000_000_000
    const realB = angB * (0.01 + i * 0.003)
    rows.push({
      daerah: `Kota ${i}`,
      jenis: 'Kota',
      anggaranPendapatan: ang, realisasiPendapatan: real,
      anggaranBelanja: angB,  realisasiBelanja: realB,
      persenPendapatan: (real / ang) * 100,
      persenBelanja:    (realB / angB) * 100,
      surplusDefisit:   real - realB,
    })
  }
  return rows
}