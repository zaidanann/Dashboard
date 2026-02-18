export type JenisDaerah = 'Provinsi' | 'Kabupaten' | 'Kota'

export interface LRARow {
  daerah: string
  jenis: JenisDaerah
  anggaranPendapatan: number
  realisasiPendapatan: number
  anggaranBelanja: number
  realisasiBelanja: number
  persenPendapatan: number
  persenBelanja: number
  surplusDefisit: number
}

export interface SummaryNasional {
  totalAnggaranPendapatan: number
  totalRealisasiPendapatan: number
  totalAnggaranBelanja: number
  totalRealisasiBelanja: number
  persenPendapatan: number
  persenBelanja: number
}

export interface KategoriSummary {
  rataRataPendapatan: number
  rataRataBelanja: number
  totalAnggaran: number
  totalRealisasi: number
  jumlahDaerah: number
}

export interface SheetConfig {
  spreadsheetUrl: string
  worksheetIndex: number
  penerimaanAngCol: number
  penerimaanRealCol: number
  pengeluaranAngCol: number
  pengeluaranRealCol: number
}

export interface SheetsApiResponse {
  data: LRARow[]
  error?: string
}
