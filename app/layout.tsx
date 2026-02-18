import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KEMENDAGRI',
  description: 'Dashboard Monitoring Laporan Realisasi Anggaran Pemerintah Daerah - Kemendagri RI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
