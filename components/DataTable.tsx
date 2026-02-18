'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { LRARow } from '@/types/lra'
import { formatRupiah } from '@/lib/utils'

interface DataTableProps {
  data: LRARow[]
}

export default function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting]       = useState<SortingState>([])
  const [globalFilter, setGlobal]   = useState('')
  const [filterRealisasi, setFilter]= useState<'all' | 'hasData' | 'noData'>('all')

  const filtered = useMemo(() => {
    switch (filterRealisasi) {
      case 'hasData': return data.filter(r => r.realisasiPendapatan > 0)
      case 'noData':  return data.filter(r => r.realisasiPendapatan === 0)
      default:        return data
    }
  }, [data, filterRealisasi])

  const columns = useMemo<ColumnDef<LRARow>[]>(() => [
    {
      accessorKey: 'daerah',
      header: 'Daerah',
      cell: info => <span className="font-semibold text-navy-dark">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'jenis',
      header: 'Jenis',
      cell: info => {
        const jenis = info.getValue() as string
        const cls = jenis === 'Provinsi' ? 'badge-prov' : jenis === 'Kabupaten' ? 'badge-kab' : 'badge-kota'
        return <span className={`jenis-badge ${cls}`}>{jenis}</span>
      },
    },
    {
      accessorKey: 'anggaranPendapatan',
      header: 'Anggaran Pendapatan',
      cell: info => <span className="text-right block">{formatRupiah(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'realisasiPendapatan',
      header: 'Realisasi Pendapatan',
      cell: info => <span className="text-right block">{formatRupiah(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'persenPendapatan',
      header: '% Pend.',
      cell: info => {
        const val = info.getValue() as number
        const color = val >= 75 ? '#16a34a' : val >= 50 ? '#d97706' : '#dc2626'
        return <span style={{ color, fontWeight: 700 }}>{val.toFixed(2)}%</span>
      },
    },
    {
      accessorKey: 'anggaranBelanja',
      header: 'Anggaran Belanja',
      cell: info => <span className="text-right block">{formatRupiah(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'realisasiBelanja',
      header: 'Realisasi Belanja',
      cell: info => <span className="text-right block">{formatRupiah(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'persenBelanja',
      header: '% Bel.',
      cell: info => {
        const val = info.getValue() as number
        const color = val >= 75 ? '#16a34a' : val >= 50 ? '#d97706' : '#dc2626'
        return <span style={{ color, fontWeight: 700 }}>{val.toFixed(2)}%</span>
      },
    },
    {
      accessorKey: 'surplusDefisit',
      header: 'Surplus/Defisit',
      cell: info => {
        const val = info.getValue() as number
        return (
          <span style={{ color: val >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }} className="text-right block">
            {formatRupiah(val)}
          </span>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobal,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="table-wrapper">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="filter-group">
          {(['all', 'hasData', 'noData'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`filter-btn ${filterRealisasi === opt ? 'active' : ''}`}
            >
              {opt === 'all' ? '📊 Semua' : opt === 'hasData' ? '✅ Realisasi > 0' : '⚠️ Realisasi = 0'}
            </button>
          ))}
        </div>
        <input
          className="table-search"
          placeholder="🔍 Cari daerah..."
          value={globalFilter}
          onChange={e => setGlobal(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="lra-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={h.column.getCanSort() ? 'sortable' : ''}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <span className="table-info">
          Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filtered.length)} dari {filtered.length} daerah
        </span>
        <div className="page-buttons">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="page-btn">← Prev</button>
          <span className="page-num">Hal {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="page-btn">Next →</button>
        </div>
      </div>
    </div>
  )
}
