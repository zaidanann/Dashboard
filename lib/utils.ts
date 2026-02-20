import { LRARow, JenisDaerah, KategoriSummary, SummaryNasional } from '@/types/lra'

// ── Klasifikasi jenis daerah — return null jika bukan Prov/Kab/Kota ─────────
export function classifyDaerah(name: string): JenisDaerah | null {
  const upper = name.toUpperCase()
  if (upper.startsWith('KOTA ') || upper.startsWith('KOTA.')) return 'Kota'
  if (upper.includes('KAB.') || upper.includes('KAB ') || upper.startsWith('KABUPATEN')) return 'Kabupaten'
  if (upper.includes('PROV.') || upper.includes('PROV ') || upper.startsWith('PROVINSI')) return 'Provinsi'
  return null
}

// ── Parse nilai numerik dari string Google Sheets ─────────────────────────
export function parseNumeric(val: string | undefined | null): number {
  if (!val) return 0
  const cleaned = val.toString().trim()
  if (['', '-', 'none', '#value!', '#n/a', '0'].includes(cleaned.toLowerCase())) return 0

  let numeric = cleaned
    .replace(/\s/g, '')
    .replace(/rp/gi, '')
    .trim()

  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(numeric) || /^\d{1,3}(\.\d{3})+$/.test(numeric)) {
    numeric = numeric.replace(/\./g, '').replace(',', '.')
  } else if (/,/.test(numeric) && /\./.test(numeric)) {
    const lastDot   = numeric.lastIndexOf('.')
    const lastComma = numeric.lastIndexOf(',')
    if (lastComma > lastDot) {
      numeric = numeric.replace(/\./g, '').replace(',', '.')
    } else {
      numeric = numeric.replace(/,/g, '')
    }
  } else {
    numeric = numeric.replace(/,/g, '')
  }

  const result = parseFloat(numeric)
  return isNaN(result) ? 0 : result
}

// ── Cari baris header di raw data ─────────────────────────────────────────
export function findHeaderRow(rows: string[][]): number | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const rowStr = rows[i].join(' ').toUpperCase()
    if (rowStr.includes('DAERAH') && (rowStr.includes('NO.') || rowStr.includes('NO '))) {
      return i
    }
  }
  return null
}

// ── AUTO-DETECT kolom berdasarkan nama header ──────────────────────────────
export interface AutoDetectedCols {
  penerimaanAng: number   // 1-based
  penerimaanReal: number
  pengeluaranAng: number
  pengeluaranReal: number
}

/**
 * Mencari kolom secara otomatis dari baris-baris header (bisa multi-row header).
 * Strategi: scan beberapa baris pertama setelah header utama,
 * cari keyword yang relevan.
 */
export function autoDetectCols(rawData: string[][]): AutoDetectedCols | null {
  // Kandidat keyword untuk setiap kolom
  const KEYWORDS = {
    penerimaanAng:   ['ANGGARAN PENDAPATAN', 'ANGG. PENDAPATAN', 'PENDAPATAN ANGGARAN', 'ANGGARAN\nPENDAPATAN'],
    penerimaanReal:  ['REALISASI PENDAPATAN', 'REAL. PENDAPATAN', 'PENDAPATAN REALISASI', 'REALISASI\nPENDAPATAN'],
    pengeluaranAng:  ['ANGGARAN BELANJA', 'ANGG. BELANJA', 'BELANJA ANGGARAN', 'ANGGARAN\nBELANJA'],
    pengeluaranReal: ['REALISASI BELANJA', 'REAL. BELANJA', 'BELANJA REALISASI', 'REALISASI\nBELANJA'],
  }

  // Gabungkan beberapa baris header (row 0-15) menjadi satu "super row" per kolom
  // untuk menangani multi-row header (misal: "PENDAPATAN" di row 3, "ANGGARAN" di row 4)
  const scanRows = Math.min(rawData.length, 20)
  const maxCols  = Math.max(...rawData.slice(0, scanRows).map(r => r.length))

  // Buat representasi "kolom header" — gabungan teks dari semua baris header per kolom
  const colHeaders: string[] = Array(maxCols).fill('')
  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < rawData[r].length; c++) {
      colHeaders[c] += ' ' + (rawData[r][c] ?? '')
    }
  }

  // Normalize
  const normalized = colHeaders.map(h =>
    h.toUpperCase().replace(/\s+/g, ' ').trim()
  )

  const result: Partial<AutoDetectedCols> = {}

  for (const [key, keywords] of Object.entries(KEYWORDS) as [keyof AutoDetectedCols, string[]][]) {
    let found = -1

    for (const kw of keywords) {
      const idx = normalized.findIndex(h => h.includes(kw))
      if (idx !== -1) { found = idx; break }
    }

    if (found !== -1) {
      result[key] = found + 1  // konversi ke 1-based
    }
  }

  // Fallback: jika keyword spesifik tidak ketemu, coba strategi berbasis posisi relatif
  // Cari kolom "PENDAPATAN" dan ambil sub-kolom ANGGARAN + REALISASI
  if (!result.penerimaanAng || !result.penerimaanReal || !result.pengeluaranAng || !result.pengeluaranReal) {
    return fallbackDetect(rawData, normalized, result)
  }

  return result as AutoDetectedCols
}

/**
 * Fallback detection dengan strategi yang lebih fleksibel:
 * Cari pasangan ANGGARAN + REALISASI di bawah header PENDAPATAN dan BELANJA
 */
function fallbackDetect(
  rawData: string[][],
  normalized: string[],
  partial: Partial<AutoDetectedCols>
): AutoDetectedCols | null {
  // Strategi: scan baris per baris, cari kolom yang mengandung kata kunci
  for (let r = 0; r < Math.min(rawData.length, 20); r++) {
    const row = rawData[r].map(c => (c ?? '').toUpperCase().trim())

    // Cari "ANGGARAN" dan "REALISASI" sebagai sub-header
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]

      if (!partial.penerimaanAng && (cell.includes('ANGGARAN') || cell === 'APBD')) {
        // Cek apakah ada "PENDAPATAN" di baris sebelumnya untuk kolom yang sama
        let isPendapatan = false
        for (let pr = 0; pr < r; pr++) {
          const prev = (rawData[pr][c] ?? '').toUpperCase()
          if (prev.includes('PENDAPATAN') || prev.includes('PENERIMAAN')) {
            isPendapatan = true; break
          }
        }
        if (isPendapatan) partial.penerimaanAng = c + 1
      }

      if (!partial.penerimaanReal && (cell.includes('REALISASI') || cell.includes('REAL.'))) {
        let isPendapatan = false
        for (let pr = 0; pr < r; pr++) {
          const prev = (rawData[pr][c] ?? '').toUpperCase()
          if (prev.includes('PENDAPATAN') || prev.includes('PENERIMAAN')) {
            isPendapatan = true; break
          }
        }
        if (isPendapatan) partial.penerimaanReal = c + 1
      }

      if (!partial.pengeluaranAng && (cell.includes('ANGGARAN') || cell === 'APBD')) {
        let isBelanja = false
        for (let pr = 0; pr < r; pr++) {
          const prev = (rawData[pr][c] ?? '').toUpperCase()
          if (prev.includes('BELANJA') || prev.includes('PENGELUARAN')) {
            isBelanja = true; break
          }
        }
        if (isBelanja) partial.pengeluaranAng = c + 1
      }

      if (!partial.pengeluaranReal && (cell.includes('REALISASI') || cell.includes('REAL.'))) {
        let isBelanja = false
        for (let pr = 0; pr < r; pr++) {
          const prev = (rawData[pr][c] ?? '').toUpperCase()
          if (prev.includes('BELANJA') || prev.includes('PENGELUARAN')) {
            isBelanja = true; break
          }
        }
        if (isBelanja) partial.pengeluaranReal = c + 1
      }
    }
  }

  if (partial.penerimaanAng && partial.penerimaanReal && partial.pengeluaranAng && partial.pengeluaranReal) {
    return partial as AutoDetectedCols
  }

  return null
}

// ── Hitung persentase dengan batas wajar ──────────────────────────────────
function safePersen(realisasi: number, anggaran: number): number {
  if (anggaran <= 0 || !isFinite(anggaran)) return 0
  if (!isFinite(realisasi)) return 0
  const persen = (realisasi / anggaran) * 100
  if (!isFinite(persen) || persen < 0) return 0
  return Math.min(persen, 999.99)
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

  const headerRow = rawData[headerIdx]
  const daerahCol = headerRow.findIndex(c => c.toUpperCase().includes('DAERAH'))
  if (daerahCol === -1) return []

  const idxAng   = cols.penerimaanAng   - 1
  const idxReal  = cols.penerimaanReal  - 1
  const idxAngB  = cols.pengeluaranAng  - 1
  const idxRealB = cols.pengeluaranReal - 1

  const rows: LRARow[] = []

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue

    const daerah = row[daerahCol]?.trim() ?? ''

    if (!daerah) continue
    if (['', 'NO.', 'NO', 'DAERAH', 'TOTAL', 'JUMLAH', 'NASIONAL', 'INDONESIA']
      .includes(daerah.toUpperCase())) continue
    if (daerah.replace(/\./g, '').match(/^\d+$/)) continue

    const jenis = classifyDaerah(daerah)
    if (jenis === null) continue

    const anggaranPendapatan  = parseNumeric(row[idxAng])
    const realisasiPendapatan = parseNumeric(row[idxReal])
    const anggaranBelanja     = parseNumeric(row[idxAngB])
    const realisasiBelanja    = parseNumeric(row[idxRealB])

    if (anggaranPendapatan === 0 && realisasiPendapatan === 0 &&
        anggaranBelanja === 0 && realisasiBelanja === 0) continue

    rows.push({
      daerah,
      jenis,
      anggaranPendapatan,
      realisasiPendapatan,
      anggaranBelanja,
      realisasiBelanja,
      persenPendapatan: safePersen(realisasiPendapatan, anggaranPendapatan),
      persenBelanja:    safePersen(realisasiBelanja, anggaranBelanja),
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
    persenPendapatan: totalAnggaranPendapatan > 0
      ? safePersen(totalRealisasiPendapatan, totalAnggaranPendapatan) : 0,
    persenBelanja: totalAnggaranBelanja > 0
      ? safePersen(totalRealisasiBelanja, totalAnggaranBelanja) : 0,
  }
}

// ── Ringkasan per kategori ─────────────────────────────────────────────────
export function getKategoriSummary(data: LRARow[], jenis: JenisDaerah): KategoriSummary {
  const filtered = data.filter(r => r.jenis === jenis)
  const totalAnggaran    = filtered.reduce((s, r) => s + r.anggaranPendapatan,  0)
  const totalRealisasi   = filtered.reduce((s, r) => s + r.realisasiPendapatan, 0)
  const totalAngBelanja  = filtered.reduce((s, r) => s + r.anggaranBelanja,     0)
  const totalRealBelanja = filtered.reduce((s, r) => s + r.realisasiBelanja,    0)
  return {
    rataRataPendapatan: totalAnggaran   > 0 ? safePersen(totalRealisasi,   totalAnggaran)   : 0,
    rataRataBelanja:    totalAngBelanja > 0 ? safePersen(totalRealBelanja, totalAngBelanja) : 0,
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
    const real = ang * (0.03 + i * 0.025)
    const angB = ang + 20_000_000_000
    const realB = angB * (0.03 + i * 0.025)
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