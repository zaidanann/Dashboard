'use client'

import { useCallback } from 'react'
import { LRARow } from '@/types/lra'

export interface ExportSection {
  id: string
  title: string
  type: 'chart' | 'table' | 'gauge' | 'summary'
}

function toM(v: number) {
  return (v / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

// ── Capture DOM element → base64 JPEG ─────────────────────────────────────
async function captureElement(el: HTMLElement, scale = 2): Promise<string> {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: '#0f172a',
    logging: false,
    allowTaint: true,
  })
  return canvas.toDataURL('image/jpeg', 0.92)
}

// ── Download data URL ──────────────────────────────────────────────────────
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

// ── Build PPTX using JSZip + raw XML (no node:fs dependency) ─────────────
async function buildPptx(
  sections: ExportSection[],
  data: LRARow[],
  selectedProv: string
): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // ── Helpers ──────────────────────────────────────────────────────────────
  const emu = (inches: number) => Math.round(inches * 914400)  // inches → EMU

  function rgb(hex: string) { return hex.replace('#', '') }

  function solidFill(hex: string) {
    return `<a:solidFill><a:srgbClr val="${rgb(hex)}"/></a:solidFill>`
  }

  function spTree(...shapes: string[]) {
    return `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
${shapes.join('\n')}</p:spTree>`
  }

  let shapeId = 100

  function rect(x: number, y: number, w: number, h: number, fillHex: string, opts: { r?: number } = {}) {
    const id = shapeId++
    const prst = opts.r ? 'roundRect' : 'rect'
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="s${id}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom>${solidFill(fillHex)}<a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`
  }

  function textBox(
    x: number, y: number, w: number, h: number,
    text: string, opts: {
      size?: number; bold?: boolean; color?: string; align?: 'l' | 'ctr' | 'r'
      italic?: boolean
    } = {}
  ) {
    const id = shapeId++
    const sz  = Math.round((opts.size ?? 14) * 100)
    const clr = opts.color ?? 'f1f5f9'
    const aln = opts.align ?? 'l'
    const b   = opts.bold ? 'b="1"' : ''
    const i   = opts.italic ? 'i="1"' : ''
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="t${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
<p:txBody><a:bodyPr wrap="square" anchor="ctr"/><a:lstStyle/>
<a:p><a:pPr algn="${aln}"/><a:r>
<a:rPr lang="id-ID" sz="${sz}" ${b} ${i} dirty="0"><a:solidFill><a:srgbClr val="${clr}"/></a:solidFill></a:rPr>
<a:t>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</a:t>
</a:r></a:p></p:txBody></p:sp>`
  }

  function imageShape(rId: string, x: number, y: number, w: number, h: number) {
    const id = shapeId++
    return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="img${id}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
<p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`
  }

  function slideXml(content: string, rels: string = '') {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:bg><p:bgPr>${solidFill('0f172a')}<a:effectLst/></p:bgPr></p:bg>
${content}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
  }

  function slideRelsXml(extras: string = '') {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
  Target="../slideLayouts/slideLayout1.xml"/>
${extras}</Relationships>`
  }

  // ── Collect slides ────────────────────────────────────────────────────────
  const slides: { xml: string; rels: string; images: { rId: string; data: string }[] }[] = []

  // ── Slide 1: Cover ────────────────────────────────────────────────────────
  shapeId = 100
  slides.push({
    xml: slideXml(spTree(
      rect(0, 0, 0.18, 5.625, '1e40af'),
      textBox(0.4, 1.2, 9.2, 0.7, 'LAPORAN REALISASI ANGGARAN', { size: 28, bold: true, color: 'f1f5f9' }),
      textBox(0.4, 1.9, 9.2, 0.6, 'PEMERINTAH DAERAH SE-INDONESIA', { size: 22, bold: true, color: '93c5fd' }),
      rect(0.4, 2.7, 3, 0.04, '1e40af'),
      textBox(0.4, 2.85, 9, 0.4, 'Tahun Anggaran 2026', { size: 13, color: '94a3b8' }),
      textBox(0.4, 3.25, 9, 0.4, 'Direktorat Jenderal Bina Keuangan Daerah', { size: 13, color: '94a3b8' }),
      textBox(0.4, 3.65, 9, 0.4, 'Kementerian Dalam Negeri Republik Indonesia', { size: 13, color: '94a3b8' }),
      textBox(0.4, 4.9, 9, 0.35, `Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, { size: 10, color: '475569' }),
    )),
    rels: slideRelsXml(),
    images: [],
  })

  // ── Slide 2: Ringkasan Nasional ───────────────────────────────────────────
  shapeId = 200
  const totalAngP  = data.reduce((s, r) => s + r.anggaranPendapatan, 0)
  const totalRealP = data.reduce((s, r) => s + r.realisasiPendapatan, 0)
  const totalAngB  = data.reduce((s, r) => s + r.anggaranBelanja, 0)
  const totalRealB = data.reduce((s, r) => s + r.realisasiBelanja, 0)
  const pctP = totalAngP > 0 ? (totalRealP / totalAngP * 100) : 0
  const pctB = totalAngB > 0 ? (totalRealB / totalAngB * 100) : 0
  const prov = data.filter(r => r.jenis === 'Provinsi').length
  const kab  = data.filter(r => r.jenis === 'Kabupaten').length
  const kota = data.filter(r => r.jenis === 'Kota').length

  slides.push({
    xml: slideXml(spTree(
      rect(0, 0, 10, 0.55, '1e40af'),
      textBox(0.3, 0.07, 9.4, 0.4, 'Ringkasan Nasional LRA TA 2026', { size: 18, bold: true, color: 'ffffff', align: 'l' }),
      // Card 4 kolom
      rect(0.2, 0.7, 2.2, 1.2, '1e3a8a'), textBox(0.2, 0.8, 2.2, 0.3, 'Angg. Pendapatan', { size: 9, color: '94a3b8', align: 'ctr' }),
      textBox(0.2, 1.1, 2.2, 0.5, toM(totalAngP) + ' M', { size: 14, bold: true, color: 'f1f5f9', align: 'ctr' }),
      rect(2.55, 0.7, 2.2, 1.2, '065f46'), textBox(2.55, 0.8, 2.2, 0.3, 'Real. Pendapatan', { size: 9, color: '94a3b8', align: 'ctr' }),
      textBox(2.55, 1.1, 2.2, 0.5, toM(totalRealP) + ' M', { size: 14, bold: true, color: '4ade80', align: 'ctr' }),
      rect(4.9, 0.7, 2.2, 1.2, '1e3a8a'), textBox(4.9, 0.8, 2.2, 0.3, 'Angg. Belanja', { size: 9, color: '94a3b8', align: 'ctr' }),
      textBox(4.9, 1.1, 2.2, 0.5, toM(totalAngB) + ' M', { size: 14, bold: true, color: 'f1f5f9', align: 'ctr' }),
      rect(7.25, 0.7, 2.55, 1.2, '7c2d12'), textBox(7.25, 0.8, 2.55, 0.3, 'Real. Belanja', { size: 9, color: '94a3b8', align: 'ctr' }),
      textBox(7.25, 1.1, 2.55, 0.5, toM(totalRealB) + ' M', { size: 14, bold: true, color: 'fb923c', align: 'ctr' }),
      // Persentase besar
      textBox(0.5, 2.15, 4.5, 0.7, `Capaian Pendapatan: ${pctP.toFixed(2)}%`, { size: 20, bold: true, color: '4ade80', align: 'ctr' }),
      textBox(5.2, 2.15, 4.5, 0.7, `Capaian Belanja: ${pctB.toFixed(2)}%`, { size: 20, bold: true, color: 'fb923c', align: 'ctr' }),
      rect(0.2, 3.1, 9.6, 0.06, '1e3a5f'),
      textBox(0.2, 3.3, 9.6, 0.4, `${prov} Provinsi  ·  ${kab} Kabupaten  ·  ${kota} Kota  ·  Total: ${data.length} Daerah`, { size: 12, color: '94a3b8', align: 'ctr' }),
      textBox(0.2, 5.25, 9.6, 0.3, 'Kemendagri RI — Dashboard LRA TA 2026', { size: 8, color: '334155', align: 'ctr' }),
    )),
    rels: slideRelsXml(),
    images: [],
  })

  // ── Slide 3+: Screenshot sections ─────────────────────────────────────────
  for (const section of sections) {
    const el = document.getElementById(section.id)
    if (!el) continue
    let imgData: string
    try { imgData = await captureElement(el as HTMLElement, 2) }
    catch { continue }

    // Strip data URL prefix → pure base64
    const base64 = imgData.replace(/^data:image\/jpeg;base64,/, '')
    const rId = 'rId2'
    shapeId = 300 + slides.length * 10

    slides.push({
      xml: slideXml(spTree(
        rect(0, 0, 10, 0.5, '1e40af'),
        textBox(0.3, 0.07, 9.4, 0.38, section.title, { size: 15, bold: true, color: 'ffffff' }),
        imageShape(rId, 0.15, 0.6, 9.7, 4.75),
        textBox(0.2, 5.35, 9.6, 0.25, 'Kemendagri RI — Dashboard LRA TA 2026', { size: 8, color: '334155', align: 'ctr' }),
      )),
      rels: slideRelsXml(
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/img${slides.length}.jpg"/>`
      ),
      images: [{ rId, data: base64 }],
    })
  }

  // ── Slide: Tabel kab/kota per provinsi ────────────────────────────────────
  if (selectedProv) {
    const provRows = (() => {
      const groups: Record<string, LRARow[]> = {}
      let cur = ''
      for (const r of data) {
        if (r.jenis === 'Provinsi') { cur = r.daerah; groups[cur] = [] }
        else if (cur) groups[cur].push(r)
      }
      return groups[selectedProv] ?? []
    })()

    const CHUNK = 18
    for (let page = 0; page < Math.ceil(provRows.length / CHUNK); page++) {
      const chunk = provRows.slice(page * CHUNK, (page + 1) * CHUNK)
      shapeId = 500 + page * 50
      const pageLabel = Math.ceil(provRows.length / CHUNK) > 1 ? ` (${page + 1}/${Math.ceil(provRows.length / CHUNK)})` : ''
      const colW  = [0.28, 2.1, 0.65, 1.32, 1.32, 0.58, 1.3, 1.3, 0.6]
      const colX  = colW.reduce<number[]>((acc, w, i) => [...acc, (acc[i - 1] ?? 0.1) + (i > 0 ? colW[i - 1] : 0)], [0.1])
      const hdrs  = ['#', 'Daerah', 'Jenis', 'Angg. Pend (M)', 'Real. Pend (M)', '%Pend', 'Angg. Bel (M)', 'Real. Bel (M)', '%Bel']

      const shapes: string[] = [
        rect(0, 0, 10, 0.48, '1e40af'),
        textBox(0.3, 0.05, 9.4, 0.38, `${selectedProv} — Data Kab/Kota (Miliaran)${pageLabel}`, { size: 13, bold: true, color: 'ffffff' }),
      ]

      // Header row
      hdrs.forEach((h, i) => {
        shapes.push(rect(colX[i], 0.55, colW[i], 0.28, '1e3a5f'))
        shapes.push(textBox(colX[i], 0.55, colW[i], 0.28, h, { size: 7, bold: true, color: '93c5fd', align: 'ctr' }))
      })

      // Data rows
      chunk.forEach((r, ri) => {
        const rowY  = 0.84 + ri * 0.265
        const rowBg = ri % 2 === 0 ? '0f172a' : '111827'
        const cells = [
          String(page * CHUNK + ri + 1),
          r.daerah.length > 24 ? r.daerah.slice(0, 23) + '…' : r.daerah,
          r.jenis,
          toM(r.anggaranPendapatan),
          toM(r.realisasiPendapatan),
          r.persenPendapatan.toFixed(1) + '%',
          toM(r.anggaranBelanja),
          toM(r.realisasiBelanja),
          r.persenBelanja.toFixed(1) + '%',
        ]
        cells.forEach((cell, ci) => {
          shapes.push(rect(colX[ci], rowY, colW[ci], 0.255, rowBg))
          const isGreenPct = (ci === 5 && r.persenPendapatan >= 75) || (ci === 8 && r.persenBelanja >= 75)
          const isRedPct   = (ci === 5 && r.persenPendapatan < 50)  || (ci === 8 && r.persenBelanja < 50)
          const clr = isGreenPct ? '4ade80' : isRedPct ? 'f87171' : 'cbd5e1'
          shapes.push(textBox(colX[ci], rowY, colW[ci], 0.255, cell, { size: 6.5, color: clr, align: ci <= 2 ? 'l' : 'r' }))
        })
      })

      shapes.push(textBox(0.2, 5.35, 9.6, 0.25, 'Kemendagri RI — Dashboard LRA TA 2026', { size: 8, color: '334155', align: 'ctr' }))

      slides.push({ xml: slideXml(spTree(...shapes)), rels: slideRelsXml(), images: [] })
    }
  }

  // ── Slide penutup ──────────────────────────────────────────────────────────
  shapeId = 900
  slides.push({
    xml: slideXml(spTree(
      rect(0, 0, 10, 5.625, '1e40af'),
      textBox(0.5, 1.5, 9, 0.7, 'KEMENTERIAN DALAM NEGERI', { size: 28, bold: true, color: 'ffffff', align: 'ctr' }),
      textBox(0.5, 2.2, 9, 0.55, 'REPUBLIK INDONESIA', { size: 20, color: 'bfdbfe', align: 'ctr' }),
      textBox(0.5, 3.0, 9, 0.45, 'Direktorat Jenderal Bina Keuangan Daerah', { size: 14, color: 'bfdbfe', align: 'ctr' }),
      textBox(0.5, 3.55, 9, 0.4, `Dashboard LRA TA 2026 — ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, { size: 12, color: '93c5fd', align: 'ctr' }),
    )),
    rels: slideRelsXml(),
    images: [],
  })

  // ── Build ZIP (PPTX) ──────────────────────────────────────────────────────
  const slideCount = slides.length

  // [Content_Types].xml
  const imageTypes = slides.flatMap((s, si) =>
    s.images.map((_, ii) => `<Override PartName="/ppt/media/img${si}.jpg" ContentType="image/jpeg"/>`)
  ).join('\n')

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="jpg" ContentType="image/jpeg"/>
${Array.from({ length: slideCount }, (_, i) =>
  `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
).join('\n')}
${imageTypes}
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
</Types>`)

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`)

  // ppt/presentation.xml
  const sldIdList = Array.from({ length: slideCount }, (_, i) =>
    `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`
  ).join('\n')
  const presRels = Array.from({ length: slideCount }, (_, i) =>
    `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join('\n')

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldSz cx="${emu(10)}" cy="${emu(5.625)}" type="screen16x9"/>
<p:notesSz cx="${emu(7.5)}" cy="${emu(10)}"/>
<p:sldIdLst>${sldIdList}</p:sldIdLst>
</p:presentation>`)

  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${presRels}
</Relationships>`)

  // Minimal slideMaster & slideLayout
  const minimalMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`

  const minimalLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`

  zip.file('ppt/slideMasters/slideMaster1.xml', minimalMaster)
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`)
  zip.file('ppt/slideLayouts/slideLayout1.xml', minimalLayout)
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`)

  // Slides + images
  slides.forEach((slide, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, slide.xml)
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, slide.rels)
    slide.images.forEach((img) => {
      zip.file(`ppt/media/img${i}.jpg`, img.data, { base64: true })
    })
  })

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useExport() {
  const downloadJpg = useCallback(async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId)
    if (!el) { alert('Elemen tidak ditemukan'); return }
    try {
      const dataUrl = await captureElement(el as HTMLElement)
      downloadDataUrl(dataUrl, filename + '.jpg')
    } catch (e) {
      alert('Gagal export JPG: ' + (e as Error).message)
    }
  }, [])

  const downloadPpt = useCallback(async (
    sections: ExportSection[],
    data: LRARow[],
    selectedProv: string,
    filename = 'Dashboard_LRA_2026'
  ) => {
    try {
      const blob = await buildPptx(sections, data, selectedProv)
      const url  = URL.createObjectURL(blob)
      downloadDataUrl(url, filename + '.pptx')
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      alert('Gagal export PPT: ' + (e as Error).message)
    }
  }, [])

  return { downloadJpg, downloadPpt }
}