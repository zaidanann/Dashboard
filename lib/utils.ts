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

  // Hapus karakter non-numerik kecuali titik, koma, dan minus
  // Format Indonesia: 1.383.511.332.957,00 → titik = pemisah ribuan, koma = desimal
  let numeric = cleaned
    .replace(/\s/g, '')
    .replace(/rp/gi, '')
    .trim()

  // Deteksi format Indonesia (ada titik ribuan + koma desimal)
  // Contoh: 1.383.511.332.957,00
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(numeric) || /^\d{1,3}(\.\d{3})+$/.test(numeric)) {
    // Format ribuan Indonesia: hapus titik, ganti koma jadi titik
    numeric = numeric.replace(/\./g, '').replace(',', '.')
  } else if (/,/.test(numeric) && /\./.test(numeric)) {
    // Ada keduanya — cek posisi mana yang terakhir
    const lastDot   = numeric.lastIndexOf('.')
    const lastComma = numeric.lastIndexOf(',')
    if (lastComma > lastDot) {
      // Koma adalah desimal (format Indonesia)
      numeric = numeric.replace(/\./g, '').replace(',', '.')
    } else {
      // Titik adalah desimal (format internasional)
      numeric = numeric.replace(/,/g, '')
    }
  } else {
    // Hanya ada koma → koma sebagai desimal atau ribuan
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

// ── Hitung persentase dengan batas wajar ──────────────────────────────────
function safePersen(realisasi: number, anggaran: number): number {
  if (anggaran <= 0 || !isFinite(anggaran)) return 0
  if (!isFinite(realisasi)) return 0

  const persen = (realisasi / anggaran) * 100

  // Jika persentase > 500% kemungkinan besar ada masalah satuan
  // Kembalikan 0 agar tidak merusak visualisasi
  if (!isFinite(persen) || persen < 0) return 0

  // Cap di 999.99% untuk menghindari outlier ekstrem merusak chart
  // (nilai nyata seharusnya 0-150% untuk realisasi normal)
  return Math.min(persen, 999.99)
}

// ── Extract & transform raw Sheets data → LRARow[] ────────────────────────
export function extractLRAData(
  rawData: string[][],
  cols: {
    penerimaanAng: number   // nomor kolom 1-based dari user input
    penerimaanReal: number
    pengeluaranAng: number
    pengeluaranReal: number
  }
): LRARow[] {
  const headerIdx = findHeaderRow(rawData)
  if (headerIdx === null) return []

  // Cari kolom DAERAH di baris header
  const headerRow = rawData[headerIdx]
  const daerahCol = headerRow.findIndex(c => c.toUpperCase().includes('DAERAH'))
  if (daerahCol === -1) return []

  // PENTING: User memasukkan nomor kolom 1-based (seperti di Excel/Sheets)
  // Konversi ke 0-based index untuk akses array
  const idxAng   = cols.penerimaanAng   - 1
  const idxReal  = cols.penerimaanReal  - 1
  const idxAngB  = cols.pengeluaranAng  - 1
  const idxRealB = cols.pengeluaranReal - 1

  const rows: LRARow[] = []

  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue

    const daerah = row[daerahCol]?.trim() ?? ''

    // Skip baris kosong / header ulang / total
    if (!daerah) continue
    if (['', 'NO.', 'NO', 'DAERAH', 'TOTAL', 'JUMLAH', 'NASIONAL', 'INDONESIA']
      .includes(daerah.toUpperCase())) continue
    // Skip baris yang isinya hanya angka (nomor urut)
    if (daerah.replace(/\./g, '').match(/^\d+$/)) continue

    const jenis = classifyDaerah(daerah)
    if (jenis === null) continue

    const anggaranPendapatan  = parseNumeric(row[idxAng])
    const realisasiPendapatan = parseNumeric(row[idxReal])
    const anggaranBelanja     = parseNumeric(row[idxAngB])
    const realisasiBelanja    = parseNumeric(row[idxRealB])

    // Skip baris di mana semua nilai 0 (data kosong)
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