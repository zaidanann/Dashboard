'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AnggaranItem {
  kodeRekening: string
  uraian: string
  anggaran: string
  realisasi: string
}

interface SearchEntry {
  provinsi: string
  kabkota: string
  matchText: string
}

const PROVINSI_LIST = [
  "Prov. Aceh","Prov. Sumatera Utara","Prov. Sumatera Barat","Prov. Riau",
  "Prov. Kep. Riau","Prov. Jambi","Prov. Bengkulu","Prov. Sumatera Selatan",
  "Prov. Kep. Bangka Belitung","Prov. Lampung","Prov. DKI Jakarta",
  "Prov. Jawa Barat","Prov. Banten","Prov. Jawa Tengah","Prov. DI Yogyakarta",
  "Prov. Jawa Timur","Prov. Bali","Prov. Kalimantan Barat","Prov. Kalimantan Tengah",
  "Prov. Kalimantan Selatan","Prov. Kalimantan Timur","Prov. Kalimantan Utara",
  "Prov. Sulawesi Barat","Prov. Sulawesi Utara","Prov. Gorontalo",
  "Prov. Sulawesi Tengah","Prov. Sulawesi Selatan","Prov. Sulawesi Tenggara",
  "Prov. Nusa Tenggara Barat","Prov. Nusa Tenggara Timur","Prov. Maluku",
  "Prov. Maluku Utara","Prov. Papua","Prov. Papua Barat","Prov. Papua Barat Daya",
  "Prov. Papua Tengah","Prov. Papua Pegunungan","Prov. Papua Selatan",
]

const KABUPATEN_KOTA: Record<string, string[]> = {
  "Prov. Aceh": ["Kab. Aceh Barat Daya","Kab. Aceh Barat","Kab. Aceh Besar","Kab. Aceh Jaya","Kab. Aceh Selatan","Kab. Aceh Singkil","Kab. Aceh Tamiang","Kab. Aceh Tengah","Kab. Aceh Tenggara","Kab. Aceh Timur","Kab. Aceh Utara","Kab. Bener Meriah","Kab. Bireun","Kab. Gayo Lues","Kab. Nagan Raya","Kab. Pidie Jaya","Kab. Pidie","Kab. Simeulue","Kota Langsa","Kota Banda Aceh","Kota Lhokseumawe","Kota Sabang","Kota Subulussalam"],
  "Prov. Sumatera Utara": ["Kab. Asahan","Kab. Batubara","Kab. Dairi","Kab. Deli Serdang","Kab. Humbang Hasundutan","Kab. Karo","Kab. Labuhanbatu","Kab. Labuhanbatu Selatan","Kab. Labuhanbatu Utara","Kab. Langkat","Kab. Mandailing Natal","Kab. Nias","Kab. Nias Barat","Kab. Nias Selatan","Kab. Nias Utara","Kab. Padang Lawas","Kab. Padang Lawas Utara","Kab. Pakpak Bharat","Kab. Samosir","Kab. Simalungun","Kab. Tapanuli Selatan","Kab. Tapanuli Tengah","Kab. Tapanuli Utara","Kab. Toba Samosir","Kab. Serdang Bedagai","Kota Binjai","Kota Gunung Sitoli","Kota Medan","Kota Padang Sidempuan","Kota Pematang Siantar","Kota Sibolga","Kota Tanjung Balai","Kota Tebing Tinggi"],
  "Prov. Sumatera Barat": ["Kab. Agam","Kab. Dharmasraya","Kab. Kep. Mentawai","Kab. Limapuluh Kota","Kab. Padang Pariaman","Kab. Pasaman","Kab. Pasaman Barat","Kab. Pesisir Selatan","Kab. Sijunjung","Kab. Solok","Kab. Solok Selatan","Kab. Tanah Datar","Kota Bukit Tinggi","Kota Padang","Kota Padang Panjang","Kota Pariaman","Kota Payakumbuh","Kota Sawahlunto","Kota Solok"],
  "Prov. Riau": ["Kab. Bengkalis","Kab. Indragiri Hilir","Kab. Indragiri Hulu","Kab. Kampar","Kab. Kep. Meranti","Kab. Kuantan Singingi","Kab. Pelalawan","Kab. Rokan Hilir","Kab. Rokan Hulu","Kab. Siak","Kota Dumai","Kota Pekanbaru"],
  "Prov. Kep. Riau": ["Kab. Bintan","Kab. Karimun","Kab. Kep. Anambas","Kab. Lingga","Kab. Natuna","Kota Batam","Kota Tanjung Pinang"],
  "Prov. Jambi": ["Kab. Batanghari","Kab. Bungo","Kab. Kerinci","Kab. Merangin","Kab. Muaro Jambi","Kab. Sarolangun","Kab. Tanjung Jabung Barat","Kab. Tanjung Jabung Timur","Kab. Tebo","Kota Jambi","Kota Sungai Penuh"],
  "Prov. Bengkulu": ["Kab. Bengkulu Selatan","Kab. Bengkulu Tengah","Kab. Bengkulu Utara","Kab. Kaur","Kab. Kepahiang","Kab. Lebong","Kab. Muko-Muko","Kab. Rejang Lebong","Kab. Seluma","Kota Bengkulu"],
  "Prov. Sumatera Selatan": ["Kab. Banyuasin","Kab. Empat Lawang","Kab. Lahat","Kab. Muara Enim","Kab. Musi Banyuasin","Kab. Musi Rawas","Kab. Musi Rawas Utara","Kab. Ogan Ilir","Kab. Ogan Komering Ilir","Kab. Ogan Komering Ulu","Kab. Ogan Komering Ulu Selatan","Kab. Ogan Komering Ulu Timur","Kab. Penukal Abab Lematang Ilir","Kota Lubuk Linggau","Kota Pagar Alam","Kota Palembang","Kota Prabumulih"],
  "Prov. Kep. Bangka Belitung": ["Kab. Bangka","Kab. Bangka Barat","Kab. Bangka Selatan","Kab. Bangka Tengah","Kab. Belitung","Kab. Belitung Timur","Kota Pangkalpinang"],
  "Prov. Lampung": ["Kab. Lampung Barat","Kab. Lampung Selatan","Kab. Lampung Tengah","Kab. Lampung Timur","Kab. Lampung Utara","Kab. Mesuji","Kab. Pesawaran","Kab. Pesisir Barat","Kab. Pringsewu","Kab. Tanggamus","Kab. Tulang Bawang","Kab. Tulang Bawang Barat","Kab. Way Kanan","Kota Bandar Lampung","Kota Metro"],
  "Prov. DKI Jakarta": [],
  "Prov. Jawa Barat": ["Kab. Bandung","Kab. Bandung Barat","Kab. Bekasi","Kab. Bogor","Kab. Ciamis","Kab. Cianjur","Kab. Cirebon","Kab. Garut","Kab. Indramayu","Kab. Karawang","Kab. Kuningan","Kab. Majalengka","Kab. Pangandaran","Kab. Purwakarta","Kab. Subang","Kab. Sukabumi","Kab. Sumedang","Kab. Tasikmalaya","Kota Bandung","Kota Banjar","Kota Bekasi","Kota Bogor","Kota Cimahi","Kota Cirebon","Kota Depok","Kota Sukabumi","Kota Tasikmalaya"],
  "Prov. Banten": ["Kab. Lebak","Kab. Pandeglang","Kab. Serang","Kab. Tangerang","Kota Cilegon","Kota Serang","Kota Tangerang","Kota Tangerang Selatan"],
  "Prov. Jawa Tengah": ["Kab. Banjarnegara","Kab. Banyumas","Kab. Batang","Kab. Blora","Kab. Boyolali","Kab. Brebes","Kab. Cilacap","Kab. Demak","Kab. Grobogan","Kab. Jepara","Kab. Karanganyar","Kab. Kebumen","Kab. Kendal","Kab. Klaten","Kab. Kudus","Kab. Magelang","Kab. Pati","Kab. Pekalongan","Kab. Pemalang","Kab. Purbalingga","Kab. Purworejo","Kab. Rembang","Kab. Semarang","Kab. Sragen","Kab. Sukoharjo","Kab. Tegal","Kab. Temanggung","Kab. Wonogiri","Kab. Wonosobo","Kota Magelang","Kota Pekalongan","Kota Salatiga","Kota Semarang","Kota Surakarta","Kota Tegal"],
  "Prov. DI Yogyakarta": ["Kab. Bantul","Kab. Gunung Kidul","Kab. Kulon Progo","Kab. Sleman","Kota Yogyakarta"],
  "Prov. Jawa Timur": ["Kab. Bangkalan","Kab. Banyuwangi","Kab. Blitar","Kab. Bojonegoro","Kab. Bondowoso","Kab. Gresik","Kab. Jember","Kab. Jombang","Kab. Kediri","Kab. Lamongan","Kab. Lumajang","Kab. Madiun","Kab. Magetan","Kab. Malang","Kab. Nganjuk","Kab. Ngawi","Kab. Pacitan","Kab. Pamekasan","Kab. Pasuruan","Kab. Ponorogo","Kab. Probolinggo","Kab. Sampang","Kab. Sidoarjo","Kab. Situbondo","Kab. Sumenep","Kab. Trenggalek","Kab. Tuban","Kab. Tulungagung","Kab. Mojokerto","Kota Batu","Kota Blitar","Kota Kediri","Kota Madiun","Kota Malang","Kota Mojokerto","Kota Pasuruan","Kota Probolinggo","Kota Surabaya"],
  "Prov. Bali": ["Kab. Badung","Kab. Bangli","Kab. Buleleng","Kab. Gianyar","Kab. Jembrana","Kab. Karang Asem","Kab. Klungkung","Kab. Tabanan","Kota Denpasar"],
  "Prov. Kalimantan Barat": ["Kab. Bengkayang","Kab. Kapuas Hulu","Kab. Kayong Utara","Kab. Ketapang","Kab. Kubu Raya","Kab. Landak","Kab. Melawi","Kab. Mempawah","Kab. Sambas","Kab. Sanggau","Kab. Sekadau","Kab. Sintang","Kota Pontianak","Kota Singkawang"],
  "Prov. Kalimantan Tengah": ["Kab. Barito Selatan","Kab. Barito Timur","Kab. Barito Utara","Kab. Gunung Mas","Kab. Kapuas","Kab. Katingan","Kab. Kotawaringin Barat","Kab. Kotawaringin Timur","Kab. Lamandau","Kab. Murung Raya","Kab. Pulang Pisau","Kab. Seruyan","Kab. Sukamara","Kota Palangkaraya"],
  "Prov. Kalimantan Selatan": ["Kab. Balangan","Kab. Banjar","Kab. Barito Kuala","Kab. Hulu Sungai Selatan","Kab. Hulu Sungai Tengah","Kab. Hulu Sungai Utara","Kab. Kotabaru","Kab. Tabalong","Kab. Tanah Bumbu","Kab. Tanah Laut","Kab. Tapin","Kota Banjar Baru","Kota Banjarmasin"],
  "Prov. Kalimantan Timur": ["Kab. Berau","Kab. Kutai Barat","Kab. Kutai Kertanegara","Kab. Kutai Timur","Kab. Mahakam Ulu","Kab. Paser","Kab. Penajam Paser Utara","Kota Balikpapan","Kota Bontang","Kota Samarinda"],
  "Prov. Kalimantan Utara": ["Kab. Bulungan","Kab. Malinau","Kab. Nunukan","Kab. Tana Tidung","Kota Tarakan"],
  "Prov. Sulawesi Barat": ["Kab. Majene","Kab. Mamasa","Kab. Mamuju","Kab. Mamuju Tengah","Kab. Pasangkayu","Kab. Polewali Mandar"],
  "Prov. Sulawesi Utara": ["Kab. Bolaang Mongondow","Kab. Bolaang Mongondow Selatan","Kab. Bolaang Mongondow Timur","Kab. Bolaang Mongondow Utara","Kab. Kep. Talaud","Kab. Minahasa","Kab. Minahasa Selatan","Kab. Minahasa Tenggara","Kab. Minahasa Utara","Kab. Siau Tagulandang Biaro","Kab. Kep. Sangihe","Kota Bitung","Kota Kotamobagu","Kota Manado","Kota Tomohon"],
  "Prov. Gorontalo": ["Kab. Boalemo","Kab. Bone Bolango","Kab. Gorontalo","Kab. Gorontalo Utara","Kab. Pohuwato","Kota Gorontalo"],
  "Prov. Sulawesi Tengah": ["Kab. Banggai","Kab. Banggai Kep.","Kab. Banggai Laut","Kab. Buol","Kab. Donggala","Kab. Morowali","Kab. Morowali Utara","Kab. Parigi Moutong","Kab. Poso","Kab. Sigi","Kab. Tojo Una-Una","Kab. Toli-Toli","Kota Palu"],
  "Prov. Sulawesi Selatan": ["Kab. Bantaeng","Kab. Barru","Kab. Bone","Kab. Bulu Kumba","Kab. Enrekang","Kab. Gowa","Kab. Jeneponto","Kab. Luwu","Kab. Luwu Timur","Kab. Luwu Utara","Kab. Maros","Kab. Pangkajene Kep.","Kab. Pinrang","Kab. Kep. Selayar","Kab. Sidenreng Rappang","Kab. Sinjai","Kab. Soppeng","Kab. Takalar","Kab. Tanatoraja","Kab. Toraja Utara","Kab. Wajo","Kota Makassar","Kota Palopo","Kota Pare-Pare"],
  "Prov. Sulawesi Tenggara": ["Kab. Bombana","Kab. Buton","Kab. Buton Selatan","Kab. Buton Tengah","Kab. Buton Utara","Kab. Kolaka","Kab. Kolaka Timur","Kab. Kolaka Utara","Kab. Konawe","Kab. Konawe Kep.","Kab. Konawe Selatan","Kab. Konawe Utara","Kab. Muna","Kab. Muna Barat","Kab. Wakatobi","Kota Bau-Bau","Kota Kendari"],
  "Prov. Nusa Tenggara Barat": ["Kab. Bima","Kab. Dompu","Kab. Lombok Barat","Kab. Lombok Timur","Kab. Lombok Utara","Kab. Sumbawa","Kab. Sumbawa Barat","Kab. Lombok Tengah","Kota Bima","Kota Mataram"],
  "Prov. Nusa Tenggara Timur": ["Kab. Alor","Kab. Belu","Kab. Ende","Kab. Flores Timur","Kab. Kupang","Kab. Lembata","Kab. Malaka","Kab. Manggarai","Kab. Manggarai Barat","Kab. Manggarai Timur","Kab. Nagekeo","Kab. Ngada","Kab. Rote Ndao","Kab. Sabu Raijua","Kab. Sikka","Kab. Sumba Barat","Kab. Sumba Barat Daya","Kab. Sumba Tengah","Kab. Sumba Timur","Kab. Timor Tengah Selatan","Kab. Timor Tengah Utara","Kota Kupang"],
  "Prov. Maluku": ["Kab. Buru","Kab. Buru Selatan","Kab. Kep. Aru","Kab. Maluku Barat Daya","Kab. Maluku Tengah","Kab. Maluku Tenggara","Kab. Kep. Tanimbar","Kab. Seram Bagian Barat","Kab. Seram Bagian Timur","Kota Ambon","Kota Tual"],
  "Prov. Maluku Utara": ["Kab. Halmahera Barat","Kab. Halmahera Selatan","Kab. Halmahera Tengah","Kab. Halmahera Timur","Kab. Halmahera Utara","Kab. Kep. Sula","Kab. Pulau Morotai","Kab. Pulau Taliabu","Kota Ternate","Kota Tidore Kep."],
  "Prov. Papua": ["Kab. Biak Numfor","Kab. Jayapura","Kab. Keerom","Kab. Kepulauan Yapen","Kab. Mamberamo Raya","Kab. Sarmi","Kab. Supiori","Kab. Waropen","Kota Jayapura"],
  "Prov. Papua Barat": ["Kab. Fakfak","Kab. Kaimana","Kab. Manokwari","Kab. Manokwari Selatan","Kab. Pegunungan Arfak","Kab. Teluk Bintuni","Kab. Teluk Wondama"],
  "Prov. Papua Barat Daya": ["Kab. Maybrat","Kab. Raja Ampat","Kab. Sorong","Kab. Sorong Selatan","Kab. Tambrauw","Kota Sorong"],
  "Prov. Papua Tengah": ["Kab. Deiyai","Kab. Dogiyai","Kab. Intan Jaya","Kab. Mimika","Kab. Nabire","Kab. Paniai","Kab. Puncak","Kab. Puncak Jaya"],
  "Prov. Papua Pegunungan": ["Kab. Jayawijaya","Kab. Lanny Jaya","Kab. Mamberamo Tengah","Kab. Nduga","Kab. Pegunungan Bintang","Kab. Tolikara","Kab. Yalimo","Kab. Yahukimo"],
  "Prov. Papua Selatan": ["Kab. Asmat","Kab. Boven Digoel","Kab. Mappi","Kab. Merauke"],
}

const SEARCH_INDEX: SearchEntry[] = []
PROVINSI_LIST.forEach(prov => {
  const kabList = KABUPATEN_KOTA[prov] || []
  if (kabList.length === 0) {
    SEARCH_INDEX.push({ provinsi: prov, kabkota: '', matchText: prov.toLowerCase().replace(/prov\.\s*/i, '') })
  } else {
    kabList.forEach(kk => {
      SEARCH_INDEX.push({
        provinsi: prov,
        kabkota: kk,
        matchText: (kk + ' ' + prov).toLowerCase().replace(/kab\.\s*/gi,'').replace(/kota\s*/gi,'').replace(/prov\.\s*/gi,''),
      })
    })
  }
})

interface SubItem { kode: string; uraian: string }
interface LRAItem { kode: string; uraian: string; subItems?: SubItem[] }
interface LRASection { kode: string; subKategori: string; items: LRAItem[] }
interface LRAKategori { kode: string; kategori: string; sections: LRASection[] }

const LRA_STRUCTURE: LRAKategori[] = [
  { kode: "4", kategori: "PENDAPATAN DAERAH", sections: [
    { kode: "4.1", subKategori: "PENDAPATAN ASLI DAERAH (PAD)", items: [
      { kode: "4.1.01", uraian: "Pajak Daerah" },
      { kode: "4.1.02", uraian: "Retribusi Daerah" },
      { kode: "4.1.03", uraian: "Hasil Pengelolaan Kekayaan Daerah yang Dipisahkan" },
      { kode: "4.1.04", uraian: "Lain-lain PAD yang Sah" },
    ]},
    { kode: "4.2", subKategori: "PENDAPATAN TRANSFER", items: [
      { kode: "4.2.01", uraian: "Pendapatan Transfer Pemerintah Pusat", subItems: [
        { kode: "4.2.01.01", uraian: "Dana Bagi Hasil" },
        { kode: "4.2.01.02", uraian: "Dana Alokasi Umum" },
        { kode: "4.2.01.03", uraian: "Dana Alokasi Khusus - Fisik" },
        { kode: "4.2.01.04", uraian: "Dana Alokasi Khusus - Non Fisik" },
        { kode: "4.2.01.05", uraian: "Dana Insentif Daerah" },
        { kode: "4.2.01.06", uraian: "Dana Otonomi Khusus" },
        { kode: "4.2.01.07", uraian: "Dana Keistimewaan" },
        { kode: "4.2.01.08", uraian: "Dana Desa" },
      ]},
      { kode: "4.2.02", uraian: "Pendapatan Transfer Antar Daerah", subItems: [
        { kode: "4.2.02.01", uraian: "Dana Bagi Hasil" },
        { kode: "4.2.02.02", uraian: "Bantuan Keuangan" },
      ]},
    ]},
    { kode: "4.3", subKategori: "LAIN-LAIN PENDAPATAN DAERAH YANG SAH", items: [
      { kode: "4.3.01", uraian: "Pendapatan Hibah" },
      { kode: "4.3.02", uraian: "Dana Darurat" },
      { kode: "4.3.03", uraian: "Lain-lain Pendapatan Sesuai dengan Ketentuan Peraturan Perundang-Undangan" },
    ]},
  ]},
  { kode: "5", kategori: "BELANJA DAERAH", sections: [
    { kode: "5.1", subKategori: "BELANJA OPERASI", items: [
      { kode: "5.1.01", uraian: "Belanja Pegawai" },
      { kode: "5.1.02", uraian: "Belanja Barang dan Jasa" },
      { kode: "5.1.03", uraian: "Belanja Bunga" },
      { kode: "5.1.04", uraian: "Belanja Subsidi" },
      { kode: "5.1.05", uraian: "Belanja Hibah" },
      { kode: "5.1.06", uraian: "Belanja Bantuan Sosial" },
    ]},
    { kode: "5.2", subKategori: "BELANJA MODAL", items: [
      { kode: "5.2.01", uraian: "Belanja Modal Tanah" },
      { kode: "5.2.02", uraian: "Belanja Modal Peralatan dan Mesin" },
      { kode: "5.2.03", uraian: "Belanja Modal Gedung dan Bangunan" },
      { kode: "5.2.04", uraian: "Belanja Modal Jalan, Jaringan, dan Irigasi" },
      { kode: "5.2.05", uraian: "Belanja Modal Aset Tetap Lainnya" },
      { kode: "5.2.06", uraian: "Belanja Modal Aset Lainnya" },
    ]},
    { kode: "5.3", subKategori: "BELANJA TIDAK TERDUGA", items: [
      { kode: "5.3.01", uraian: "Belanja Tidak Terduga" },
    ]},
    { kode: "5.4", subKategori: "BELANJA TRANSFER", items: [
      { kode: "5.4.01", uraian: "Belanja Bagi Hasil" },
      { kode: "5.4.02", uraian: "Belanja Bantuan Keuangan" },
    ]},
  ]},
  { kode: "6", kategori: "PEMBIAYAAN DAERAH", sections: [
    { kode: "6.1", subKategori: "Penerimaan Pembiayaan", items: [
      { kode: "6.1.01", uraian: "Sisa Lebih Perhitungan Anggaran Tahun Sebelumnya (SiLPA)" },
      { kode: "6.1.02", uraian: "Pencairan Dana Cadangan" },
      { kode: "6.1.03", uraian: "Hasil Penjualan Kekayaan Daerah yang Dipisahkan" },
      { kode: "6.1.04", uraian: "Penerimaan Pinjaman Daerah" },
      { kode: "6.1.05", uraian: "Penerimaan Kembali Pemberian Pinjaman Daerah" },
      { kode: "6.1.06", uraian: "Penerimaan Pembiayaan Lainnya" },
    ]},
    { kode: "6.2", subKategori: "Pengeluaran Pembiayaan", items: [
      { kode: "6.2.01", uraian: "Pembentukan Dana Cadangan" },
      { kode: "6.2.02", uraian: "Penyertaan Modal (Investasi) Pemerintah Daerah" },
      { kode: "6.2.03", uraian: "Pembayaran Pokok Utang" },
      { kode: "6.2.04", uraian: "Pemberian Pinjaman Daerah" },
    ]},
  ]},
]

function collectAllCodes(): Record<string, AnggaranItem> {
  const d: Record<string, AnggaranItem> = {}
  LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
    d[item.kode] = { kodeRekening: item.kode, uraian: item.uraian, anggaran: "", realisasi: "" }
    item.subItems?.forEach(sub => { d[sub.kode] = { kodeRekening: sub.kode, uraian: sub.uraian, anggaran: "", realisasi: "" } })
  })))
  return d
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbws_2yABmIwhbiYWJaOIHynnw6dnJbRiDqwzXl0LFHTK_FhmOz8q7HtrDDc8_Y39SQS/exec"

const GROQ_API_KEY_DEFAULT = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"

function getAllValidCodes(): string {
  const codes: string[] = []
  LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
    if (item.subItems?.length) {
      item.subItems.forEach(sub => codes.push(`${sub.kode} | ${sub.uraian}`))
    } else {
      codes.push(`${item.kode} | ${item.uraian}`)
    }
  })))
  return codes.join('\n')
}

interface AIParseResult {
  daerah?: string
  provinsi?: string
  kabupatenKota?: string
  tahunAnggaran?: string
  items: Array<{
    kodeRekening: string
    anggaran: number
    realisasi: number
  }>
}

// ── Format nilai cents → tampilan Rupiah ──────────────────────────
function formatRupiahInput(value: string) {
  if (!value) return ""
  const num = parseFloat(value) / 100
  if (isNaN(num)) return ""
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}

// ── RupiahInput: komponen input yang bisa diketik bebas ───────────
function RupiahInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const [raw, setRaw] = useState("")
  const [focused, setFocused] = useState(false)

  // Saat tidak fokus: tampilkan format Rupiah; saat fokus: tampilkan angka mentah
  const displayValue = focused
    ? raw
    : value && value !== "0"
    ? formatRupiahInput(value)
    : ""

  const handleFocus = () => {
    // Ubah nilai tersimpan (cents) ke angka biasa untuk diedit
    const num = value ? Number(value) / 100 : 0
    setRaw(num > 0 ? num.toFixed(2) : "")
    setFocused(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya izinkan angka, titik, koma
    setRaw(e.target.value.replace(/[^\d.,]/g, ""))
  }

  const handleBlur = () => {
    setFocused(false)
    if (!raw.trim()) { onChange(""); return }

    // Normalisasi pemisah desimal (koma atau titik)
    let cleaned = raw.replace(/[^\d.,]/g, "")
    const lastComma = cleaned.lastIndexOf(",")
    const lastDot = cleaned.lastIndexOf(".")
    if (lastComma > lastDot) {
      // format Indonesia: 1.234.567,89
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      // format internasional: 1,234,567.89
      cleaned = cleaned.replace(/,/g, "")
    }

    const n = parseFloat(cleaned)
    onChange(!isNaN(n) && n > 0 ? Math.round(n * 100).toString() : "")
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{
        width: "100%",
        padding: 6,
        border: `2px solid ${focused ? "#1976d2" : "#ccc"}`,
        borderRadius: 4,
        textAlign: "right",
        fontFamily: "monospace",
        fontSize: 13,
        outline: "none",
        background: focused ? "#fffde7" : "#fff",
        boxSizing: "border-box",
        transition: "border-color 0.15s, background 0.15s",
      }}
    />
  )
}

function getKategoriColor(kode: string) {
  if (kode === "4") return { bg: "#17a2b8", text: "#fff" }
  if (kode === "5") return { bg: "#8bc34a", text: "#fff" }
  return { bg: "#66bb6a", text: "#fff" }
}

function HL({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return <>{text.slice(0,idx)}<mark style={{background:'#fef08a',color:'#0f2558',padding:0}}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>
}

async function extractTextFromPDF(file: File): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    if ((window as Window & { pdfjsLib?: unknown }).pdfjsLib) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat PDF.js'))
    document.head.appendChild(script)
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (window as any).pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = textContent.items.map((item: any) => item.str || '').join(' ')
    fullText += `\n--- Halaman ${i} ---\n${pageText}`
  }
  return fullText
}

async function extractTextFromExcel(rows: unknown[][]): Promise<string> {
  return rows.slice(0, 200)
    .map(r => (r as unknown[]).map(cell => String(cell ?? '').trim()).join('\t'))
    .join('\n')
}

async function extractWithGroq(text: string, fileName: string, apiKey: string): Promise<AIParseResult> {
  const validCodes = getAllValidCodes()
  const truncatedText = text.length > 6000 ? text.substring(0, 6000) + '\n...[terpotong]' : text
  const prompt = `Kamu adalah asisten ekstraksi data LRA (Laporan Realisasi Anggaran) Pemerintah Daerah Indonesia.

Ekstrak data dari teks berikut dan kembalikan HANYA JSON valid tanpa markdown/backtick:
{
  "daerah": "nama kabupaten/kota atau provinsi jika ditemukan",
  "provinsi": "nama provinsi jika ditemukan",
  "kabupatenKota": "nama kabupaten/kota jika ditemukan",
  "tahunAnggaran": "tahun anggaran 4 digit jika ditemukan",
  "items": [
    {
      "kodeRekening": "kode rekening sesuai daftar valid",
      "anggaran": 123456789.00,
      "realisasi": 98765432.00
    }
  ]
}

DAFTAR KODE REKENING VALID (HANYA gunakan kode ini):
${validCodes}

ATURAN PENTING:
1. Nilai anggaran dan realisasi HARUS angka numerik murni (tanpa titik/koma pemisah ribuan)
2. Hanya sertakan items yang ada nilainya (bukan 0)
3. Cocokkan berdasarkan kode rekening ATAU nama/uraian akun
4. Nama file: ${fileName}

DATA DOKUMEN:
${truncatedText}

Kembalikan HANYA JSON, tidak ada teks lain sama sekali.`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 4096 })
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Groq API error: ${err?.error?.message || response.statusText}`)
  }
  const data = await response.json()
  const rawText = data?.choices?.[0]?.message?.content || ''
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  try {
    return JSON.parse(cleaned) as AIParseResult
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIParseResult
    throw new Error('Gagal mem-parsing respons JSON dari Groq')
  }
}

export default function FormLRAPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    provinsi: "", kabupatenKota: "", tahunAnggaran: "2024",
    namaPemohon: "", keterangan: "", targetSheet: "31 Januari 2025",
  })
  const [anggaranData, setAnggaranData] = useState<Record<string, AnggaranItem>>({})
  const [kabupatenOptions, setKabupatenOptions] = useState<string[]>([])
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [activePasteSection, setActivePasteSection] = useState<string | null>(null)
  const [sectionPasteText, setSectionPasteText] = useState<Record<string, string>>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [filePreview, setFilePreview] = useState("")
  const [groqApiKey, setGroqApiKey] = useState(GROQ_API_KEY_DEFAULT)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState("")
  const [aiResult, setAiResult] = useState<AIParseResult | null>(null)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [aiUploadedFile, setAiUploadedFile] = useState<File | null>(null)
  const aiFileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchEntry[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setAnggaranData(collectAllCodes()) }, [])
  useEffect(() => {
    setKabupatenOptions(formData.provinsi ? (KABUPATEN_KOTA[formData.provinsi] || []) : [])
  }, [formData.provinsi])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q); setActiveIdx(-1)
    if (q.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return }
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    const res = SEARCH_INDEX.filter(entry => tokens.every(t => entry.matchText.includes(t))).slice(0, 10)
    setSearchResults(res); setShowDropdown(res.length > 0)
  }

  const selectResult = (entry: SearchEntry) => {
    setFormData(prev => ({ ...prev, provinsi: entry.provinsi, kabupatenKota: entry.kabkota }))
    setKabupatenOptions(KABUPATEN_KOTA[entry.provinsi] || [])
    setSearchQuery(entry.kabkota || entry.provinsi)
    setShowDropdown(false); setActiveIdx(-1)
  }

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, searchResults.length-1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0) selectResult(searchResults[activeIdx]) }
    else if (e.key === "Escape") setShowDropdown(false)
  }

  const clearSearch = () => {
    setSearchQuery(""); setSearchResults([]); setShowDropdown(false)
    setFormData(prev => ({ ...prev, provinsi: "", kabupatenKota: "" }))
  }

  const applyAiResult = (result: AIParseResult) => {
    if (result.provinsi) {
      const matchProv = PROVINSI_LIST.find(p =>
        p.toLowerCase().includes(result.provinsi!.toLowerCase()) ||
        result.provinsi!.toLowerCase().includes(p.replace('Prov. ', '').toLowerCase())
      )
      if (matchProv) { setFormData(prev => ({ ...prev, provinsi: matchProv })); setKabupatenOptions(KABUPATEN_KOTA[matchProv] || []) }
    }
    if (result.kabupatenKota) {
      setSearchQuery(result.kabupatenKota)
      const found = SEARCH_INDEX.find(e =>
        e.matchText.includes(result.kabupatenKota!.toLowerCase().replace(/kab\.\s*/gi,'').replace(/kota\s*/gi,'').replace(/prov\.\s*/gi,'').trim())
      )
      if (found) {
        setFormData(prev => ({ ...prev, provinsi: found.provinsi, kabupatenKota: found.kabkota || found.provinsi }))
        setKabupatenOptions(KABUPATEN_KOTA[found.provinsi] || [])
        setSearchQuery(found.kabkota || found.provinsi)
      }
    }
    if (result.tahunAnggaran) {
      const yr = String(result.tahunAnggaran).replace(/\D/g, '').substring(0, 4)
      if (['2024','2025','2026'].includes(yr)) setFormData(prev => ({ ...prev, tahunAnggaran: yr }))
    }
    if (result.items?.length) {
      setAnggaranData(prev => {
        const nd = { ...prev }
        result.items.forEach(item => {
          if (!nd[item.kodeRekening]) return
          nd[item.kodeRekening] = {
            ...nd[item.kodeRekening],
            anggaran: item.anggaran > 0 ? Math.round(item.anggaran * 100).toString() : "",
            realisasi: item.realisasi > 0 ? Math.round(item.realisasi * 100).toString() : "",
          }
        })
        return nd
      })
    }
  }

  const handleAiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAiUploadedFile(file)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const apiKey = groqApiKey.trim()
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      setMessage("❌ Masukkan Groq API Key terlebih dahulu!"); setShowApiKeyInput(true); return
    }
    setIsAiProcessing(true); setAiProgress("🔄 Memulai analisis AI Groq..."); setAiResult(null); setMessage("")
    try {
      let result: AIParseResult
      if (ext === 'pdf') {
        setAiProgress("📖 Membaca teks dari PDF...")
        const pdfText = await extractTextFromPDF(file)
        setAiProgress("🤖 Mengirim ke Groq AI untuk analisis...")
        result = await extractWithGroq(pdfText, file.name, apiKey)
      } else if (['xlsx','xls'].includes(ext)) {
        setAiProgress("📊 Membaca file Excel...")
        const XLSX = await import('xlsx')
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as unknown[][]
        const excelText = await extractTextFromExcel(rows)
        setAiProgress("🤖 Mengirim data ke Groq AI...")
        result = await extractWithGroq(excelText, file.name, apiKey)
      } else if (ext === 'csv') {
        setAiProgress("📊 Membaca file CSV...")
        const csvText = await file.text()
        setAiProgress("🤖 Mengirim data ke Groq AI...")
        result = await extractWithGroq(csvText, file.name, apiKey)
      } else {
        throw new Error('Format tidak didukung. Gunakan PDF, XLSX, XLS, atau CSV.')
      }
      setAiProgress("✅ Analisis selesai! Menerapkan data ke form...")
      setAiResult(result); applyAiResult(result)
      setMessage(`✅ Groq AI berhasil mengekstrak ${result.items?.length || 0} item anggaran dari file!`)
      setAiProgress("")
    } catch (err) {
      setMessage(`❌ Gagal: ${err instanceof Error ? err.message : String(err)}`); setAiProgress("")
    } finally { setIsAiProcessing(false) }
  }

  function toggleExpand(kode: string) { setExpandedItems(prev => ({ ...prev, [kode]: !prev[kode] })) }

  function calcSubTotal(sk: string) {
    let a = 0, r = 0
    Object.entries(anggaranData).forEach(([k, v]) => {
      if (k.startsWith(sk + '.')) { a += Number(v.anggaran||0); r += Number(v.realisasi||0) }
    })
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcKatTotal(kk: string) {
    let a = 0, r = 0
    Object.entries(anggaranData).forEach(([k, v]) => {
      if (k.startsWith(kk + '.')) { a += Number(v.anggaran||0); r += Number(v.realisasi||0) }
    })
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcItemSubTotal(item: LRAItem) {
    if (!item.subItems?.length) return null
    let a = 0, r = 0
    item.subItems.forEach(sub => { const d = anggaranData[sub.kode]; a += Number(d?.anggaran||0); r += Number(d?.realisasi||0) })
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcTotal() {
    let a = 0, r = 0
    LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
      if (item.subItems?.length) {
        item.subItems.forEach(sub => { const d = anggaranData[sub.kode]; a += Number(d?.anggaran||0); r += Number(d?.realisasi||0) })
      } else { const d = anggaranData[item.kode]; a += Number(d?.anggaran||0); r += Number(d?.realisasi||0) }
    })))
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  const totals = calcTotal()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === "provinsi") setFormData(prev => ({ ...prev, [name]: value, kabupatenKota: "" }))
  }

  // ── DIPERBARUI: langsung simpan nilai dari RupiahInput (sudah dalam format cents) ──
  const handleAnggaranChange = (kode: string, field: "anggaran" | "realisasi", value: string) => {
    setAnggaranData(prev => ({ ...prev, [kode]: { ...prev[kode], [field]: value } }))
  }

  const cv = (v: string) => {
    if (!v || v==="-" || v==="0.00") return ""
    const c = v.replace(/[^\d.,]/g,"").replace(/\./g,"").replace(/,/g,".")
    return c && !isNaN(parseFloat(c)) ? Math.round(parseFloat(c)*100).toString() : ""
  }

  function applyPasteLines(lines: string[], nd: Record<string, AnggaranItem>) {
    lines.forEach(line => {
      const p = line.split("\t"); if (p.length < 2) return
      const kode = p[0].trim()
      const av = p.length >= 4 ? p[2]?.trim() : p[1]?.trim()
      const rv = p.length >= 4 ? p[3]?.trim() : p[2]?.trim()
      if (!nd[kode]) return
      nd[kode] = { ...nd[kode], anggaran: cv(av||""), realisasi: cv(rv||"") }
    })
  }

  const handlePasteData = () => {
    try {
      const nd = { ...anggaranData }; applyPasteLines(pasteText.trim().split("\n"), nd)
      setAnggaranData(nd); setPasteText(""); setPasteMode(false)
      setMessage("✅ Data berhasil di-paste!"); setTimeout(() => setMessage(""), 3000)
    } catch { setMessage("❌ Gagal parsing data") }
  }

  const handleSectionPaste = (sk: string) => {
    try {
      const nd = { ...anggaranData }; applyPasteLines((sectionPasteText[sk]||"").trim().split("\n"), nd)
      setAnggaranData(nd); setSectionPasteText(prev => ({ ...prev, [sk]: "" })); setActivePasteSection(null)
      setMessage("✅ Data berhasil di-paste!"); setTimeout(() => setMessage(""), 3000)
    } catch { setMessage("❌ Gagal parsing data") }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
if (!['xlsx','xls','csv'].includes(ext)) { setMessage("❌ Format tidak didukung"); return }
    setUploadedFile(file); setIsProcessingFile(true); setMessage("🔄 Memproses file...")
    try {
      if (ext === 'csv') {
        const rows = (await file.text()).split('\n').map(l => l.split(','))
        setFilePreview(rows.slice(0,10).map(r => r.join('\t')).join('\n') + '\n...')
        parseExcelRows(rows as unknown[][])
      } else {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as unknown[][]
        setFilePreview(rows.slice(0,10).map(r => (r as unknown[]).join('\t')).join('\n') + '\n...')
        parseExcelRows(rows)
      }
      setMessage("✅ File berhasil diproses!")
    } catch (err) { setMessage("❌ Gagal: " + (err instanceof Error ? err.message : "")) }
    finally { setIsProcessingFile(false) }
  }

  const parseExcelRows = (rows: unknown[][]) => {
    let kc=-1, ac=-1, rc=-1, hr=-1
    for (let i=0; i<Math.min(rows.length,30); i++) {
      const row = rows[i]; if (!row?.length) continue
      for (let j=0; j<row.length; j++) {
        const v = String(row[j]||'').toLowerCase().trim()
        if (v.includes('kode') && kc===-1) { kc=j; hr=i }
        if ((v.includes('anggaran')||v.includes('pagu')) && ac===-1) ac=j
        if (v.includes('realisasi') && rc===-1) rc=j
      }
      if (kc!==-1 && ac!==-1) break
    }
    if (kc===-1) { kc=0; ac=2; rc=3 }
    const nd = { ...anggaranData }
    const pn = (raw: unknown) => {
      if (raw==null) return ""
      const s = String(raw).trim(); if (!s||s==='-'||s==='0'||s==='0.00') return ""
      let c = s.replace(/[^\d.,]/g,'')
      const cc=(c.match(/,/g)||[]).length, dc=(c.match(/\./g)||[]).length
      if (cc===1&&dc>1) c=c.replace(/\./g,'').replace(',','.')
      else if (dc===1&&cc>1) c=c.replace(/,/g,'')
      else if (cc===1&&dc===0) c=c.replace(',','.')
      else if (dc>1) c=c.replace(/\./g,'')
      else c=c.replace(/,/g,'')
      const n=parseFloat(c); return !isNaN(n)&&n>0 ? Math.round(n*100).toString() : ""
    }
    for (let i=hr+1; i<rows.length; i++) {
      const row = rows[i]; if (!row?.length) continue
      const kode = String(row[kc]||'').trim()
      if (!kode||!/^\d+\.\d+/.test(kode)||!nd[kode]) continue
      nd[kode] = { ...nd[kode], anggaran: pn(row[ac]), realisasi: pn(row[rc]) }
    }
    setAnggaranData(nd)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.provinsi || !formData.kabupatenKota || !formData.namaPemohon) {
      setMessage("❌ Mohon lengkapi semua field yang wajib diisi"); return
    }
    setLoading(true); setMessage("")
    try {
      const t = calcTotal()
      const allItems: AnggaranItem[] = []
      LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
        if (item.subItems?.length) { item.subItems.forEach(sub => { const d=anggaranData[sub.kode]; if(d) allItems.push(d) }) }
        else { const d=anggaranData[item.kode]; if(d) allItems.push(d) }
      })))
      const payload = {
        action:"submitData", targetSheet:formData.targetSheet,
        daerah:formData.kabupatenKota||formData.provinsi, provinsi:formData.provinsi,
        kabupatenKota:formData.kabupatenKota, tahunAnggaran:formData.tahunAnggaran,
        namaPemohon:formData.namaPemohon, keterangan:formData.keterangan,
        items: allItems.map(item => ({
          kodeRekening:item.kodeRekening, uraian:item.uraian,
          anggaran:Number(item.anggaran||0)/100,
          realisasi:Number(item.realisasi||0)/100,
          sisa:(Number(item.anggaran||0)-Number(item.realisasi||0))/100,
          persentase:Number(item.anggaran||0)>0?((Number(item.realisasi||0)/Number(item.anggaran||0))*100).toFixed(2):"0",
        })),
        totals:{ totalAnggaran:t.a/100, totalRealisasi:t.r/100, sisa:t.sisa/100, persentase:t.pct },
        tanggalInput:new Date().toISOString(), status:"Pending",
      }
      const form = document.createElement('form')
      form.method='POST'; form.action=SCRIPT_URL; form.target='_blank'
      const input = document.createElement('input')
      input.type='hidden'; input.name='data'; input.value=JSON.stringify(payload)
      form.appendChild(input); document.body.appendChild(form); form.submit(); document.body.removeChild(form)
      setTimeout(() => { setMessage("✅ Data LRA berhasil dikirim!"); setTimeout(() => router.push('/'), 2000) }, 1000)
    } catch (err) { setMessage("❌ Gagal: " + (err instanceof Error ? err.message : "Unknown error")) }
    finally { setLoading(false) }
  }

  // ── Render baris tabel: pakai RupiahInput bukan <input> biasa ────
  function renderItemRow(item: LRAItem) {
    const d = anggaranData[item.kode] || { anggaran:"", realisasi:"" }
    const hasSubItems = !!item.subItems?.length
    const isExpanded = expandedItems[item.kode]

    if (hasSubItems) {
      const subTotal = calcItemSubTotal(item)!
      return (
        <React.Fragment key={item.kode}>
          <tr style={{ backgroundColor:"#f0f7ff" }}>
            <td style={{ padding:8, border:"1px solid #ddd", fontFamily:"monospace", fontSize:13 }}>
              <button type="button" onClick={() => toggleExpand(item.kode)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, padding:0, marginRight:4, color:"#1565c0" }}>
                {isExpanded?"▼":"▶"}
              </button>
              {item.kode}
            </td>
            <td style={{ padding:8, border:"1px solid #ddd", fontWeight:600, color:"#1565c0" }}>
              {item.uraian}<span style={{ fontSize:11, color:"#888", marginLeft:8 }}>({item.subItems!.length} rincian)</span>
            </td>
            <td style={{ padding:8, border:"1px solid #ddd", textAlign:"right", fontFamily:"monospace", fontWeight:600, color:"#1565c0" }}>
              {subTotal.a>0?formatRupiahInput(String(subTotal.a)):"—"}
            </td>
            <td style={{ padding:8, border:"1px solid #ddd", textAlign:"right", fontFamily:"monospace", fontWeight:600, color:"#1565c0" }}>
              {subTotal.r>0?formatRupiahInput(String(subTotal.r)):"—"}
            </td>
            <td style={{ padding:8, border:"1px solid #ddd", textAlign:"center", fontWeight:600, color:"#f57c00" }}>{subTotal.pct}%</td>
          </tr>
          {isExpanded && item.subItems!.map(sub => {
            const sd = anggaranData[sub.kode] || { anggaran:"", realisasi:"" }
            const sPct = Number(sd.anggaran||0)>0?((Number(sd.realisasi||0)/Number(sd.anggaran||0))*100).toFixed(2):"0"
            return (
              <tr key={sub.kode} className="sub-item-row" style={{ backgroundColor:"#fafcff" }}>
                <td style={{ padding:"6px 8px 6px 28px", border:"1px solid #ddd", fontFamily:"monospace", fontSize:12, color:"#555" }}>{sub.kode}</td>
                <td style={{ padding:6, border:"1px solid #ddd", fontSize:13, color:"#444", paddingLeft:16 }}>↳ {sub.uraian}</td>
                <td style={{ padding:4, border:"1px solid #ddd" }}>
                  {/* ✅ RupiahInput — bisa ketik bebas */}
                  <RupiahInput
                    value={sd.anggaran}
                    onChange={val => handleAnggaranChange(sub.kode, "anggaran", val)}
                  />
                </td>
                <td style={{ padding:4, border:"1px solid #ddd" }}>
                  <RupiahInput
                    value={sd.realisasi}
                    onChange={val => handleAnggaranChange(sub.kode, "realisasi", val)}
                  />
                </td>
                <td style={{ padding:8, border:"1px solid #ddd", textAlign:"center", fontWeight:600, color:Number(sPct)>100?"#d32f2f":"#2e7d32", fontSize:13 }}>{sPct}%</td>
              </tr>
            )
          })}
        </React.Fragment>
      )
    }

    const pct = Number(d.anggaran||0)>0?((Number(d.realisasi||0)/Number(d.anggaran||0))*100).toFixed(2):"0"
    return (
      <tr key={item.kode}>
        <td style={{ padding:8, border:"1px solid #ddd", fontFamily:"monospace", fontSize:13 }}>{item.kode}</td>
        <td style={{ padding:8, border:"1px solid #ddd" }}>{item.uraian}</td>
        <td style={{ padding:4, border:"1px solid #ddd" }}>
          {/* ✅ RupiahInput — bisa ketik bebas */}
          <RupiahInput
            value={d.anggaran}
            onChange={val => handleAnggaranChange(item.kode, "anggaran", val)}
          />
        </td>
        <td style={{ padding:4, border:"1px solid #ddd" }}>
          <RupiahInput
            value={d.realisasi}
            onChange={val => handleAnggaranChange(item.kode, "realisasi", val)}
          />
        </td>
        <td style={{ padding:8, border:"1px solid #ddd", textAlign:"center", fontWeight:600, color:Number(pct)>100?"#d32f2f":"#2e7d32" }}>{pct}%</td>
      </tr>
    )
  }

  return (
    <div className="main-content" style={{ padding:'24px' }}>
      <style>{`
        .info-card { transition: transform 0.2s, box-shadow 0.2s; }
        .info-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,37,88,0.15) !important; }
        .info-icon-box { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; background:linear-gradient(135deg,#0f2558,#1a3a7c); box-shadow:0 4px 12px rgba(15,37,88,0.2); }
        .field-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#64748b; margin-bottom:6px; }
        .field-input, .field-select { width:100%; padding:11px 14px; border:2px solid #e2e8f0; border-radius:10px; font-size:14px; font-family:inherit; outline:none; transition:border-color 0.2s, background 0.2s, box-shadow 0.2s; background:#fff; box-sizing:border-box; }
        .field-input:focus, .field-select:focus { border-color:#0f2558; background:#f8fafc; box-shadow:0 0 0 3px rgba(15,37,88,0.08); }
        .field-input::placeholder { color:#cbd5e1; }
        .field-select { cursor:pointer; }
        .field-select:disabled { background:#f1f5f9; cursor:not-allowed; opacity:0.6; }
        .sheet-selector { background:linear-gradient(135deg,#dbeafe,#e0f2fe); border:2px solid #0284c7 !important; font-weight:600; color:#0c4a6e; }
        .sheet-selector:focus { background:linear-gradient(135deg,#bfdbfe,#dbeafe); border-color:#0369a1 !important; box-shadow:0 0 0 3px rgba(2,132,199,0.15) !important; }
        tr.sub-item-row { animation:fadeIn 0.15s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .srch-wrap { position:relative; }
        .srch-box { display:flex; align-items:center; border:2px solid #6366f1; border-radius:10px; background:#fff; overflow:hidden; transition:box-shadow 0.2s; }
        .srch-box:focus-within { box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
        .srch-ico { padding:0 12px; font-size:16px; color:#6366f1; flex-shrink:0; }
        .srch-inp { flex:1; padding:11px 4px; border:none; outline:none; font-size:14px; font-family:inherit; background:transparent; }
        .srch-inp::placeholder { color:#c7d2fe; }
        .srch-clear { padding:0 12px; background:none; border:none; cursor:pointer; font-size:20px; color:#a5b4fc; line-height:1; transition:color 0.15s; }
        .srch-clear:hover { color:#ef4444; }
        .srch-dd { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border:2px solid #6366f1; border-radius:10px; box-shadow:0 12px 28px rgba(99,102,241,0.18); z-index:9999; max-height:300px; overflow-y:auto; }
        .srch-item { display:flex; align-items:center; gap:8px; padding:9px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9; font-size:13px; transition:background 0.1s; }
        .srch-item:last-child { border-bottom:none; border-radius:0 0 8px 8px; }
        .srch-item:first-child { border-radius:8px 8px 0 0; }
        .srch-item:hover, .srch-item.active { background:#eff6ff; }
        .srch-badge { display:inline-block; padding:1px 6px; border-radius:20px; font-size:10px; font-weight:700; flex-shrink:0; }
        .srch-badge.kab { background:#fef3c7; color:#92400e; }
        .srch-badge.kota { background:#dbeafe; color:#1e40af; }
        .srch-badge.prov { background:#d1fae5; color:#065f46; }
        .srch-name { font-weight:600; color:#1e293b; flex:1; }
        .srch-prov { font-size:11px; color:#94a3b8; white-space:nowrap; }
        .srch-empty { padding:14px; text-align:center; color:#94a3b8; font-size:13px; }
        .sel-badge { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#ede9fe,#dbeafe); border:1.5px solid #6366f1; border-radius:8px; padding:7px 14px; font-size:13px; color:#3730a3; font-weight:600; margin-top:10px; }
        .sel-badge-prov { font-size:11px; color:#7c3aed; font-weight:400; }
        .ai-panel { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 2px solid #7c3aed; box-shadow: 0 8px 32px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1); position:relative; overflow:hidden; }
        .ai-panel::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle at 30% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(99,102,241,0.1) 0%, transparent 50%); pointer-events:none; }
        .ai-title { font-size:20px; font-weight:800; color:#fff; margin:0 0 4px; display:flex; align-items:center; gap:10px; }
        .ai-subtitle { font-size:13px; color:#a78bfa; margin:0 0 20px; }
        .ai-badge { background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.5px; }
        .ai-upload-zone { border: 2px dashed rgba(167,139,250,0.5); border-radius:12px; padding:32px; text-align:center; cursor:pointer; transition:all 0.2s; background:rgba(255,255,255,0.03); position:relative; }
        .ai-upload-zone:hover { border-color:#a78bfa; background:rgba(124,58,237,0.1); }
        .ai-upload-icon { font-size:48px; margin-bottom:12px; }
        .ai-upload-text { color:#c4b5fd; font-size:15px; font-weight:600; margin-bottom:6px; }
        .ai-upload-sub { color:#7c6aa6; font-size:12px; }
        .ai-upload-formats { display:flex; gap:8px; justify-content:center; margin-top:12px; flex-wrap:wrap; }
        .ai-format-tag { background:rgba(124,58,237,0.2); border:1px solid rgba(167,139,250,0.3); color:#c4b5fd; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .ai-progress { background:rgba(0,0,0,0.3); border-radius:8px; padding:12px 16px; margin-top:12px; color:#a78bfa; font-size:13px; display:flex; align-items:center; gap:10px; }
        .ai-spin { display:inline-block; animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ai-result-card { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:12px 16px; margin-top:12px; }
        .ai-result-title { color:#6ee7b7; font-size:13px; font-weight:700; margin-bottom:8px; }
        .ai-result-item { display:flex; justify-content:space-between; font-size:12px; color:#a7f3d0; padding:2px 0; }
        .ai-apikey-input { width:100%; padding:10px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(167,139,250,0.4); border-radius:8px; color:#e2e8f0; font-size:13px; font-family:monospace; outline:none; box-sizing:border-box; }
        .ai-apikey-input:focus { border-color:#a78bfa; background:rgba(255,255,255,0.08); }
        .ai-apikey-input::placeholder { color:#4c3a6e; }
        .ai-btn { padding:12px 24px; background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:700; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s; box-shadow:0 4px 15px rgba(124,58,237,0.4); }
        .ai-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,0.5); }
        .ai-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .ai-btn-secondary { background:rgba(255,255,255,0.08); border:1px solid rgba(167,139,250,0.3); box-shadow:none; }
        .ai-btn-secondary:hover { background:rgba(255,255,255,0.12); box-shadow:none; }
        .ai-file-selected { background:rgba(124,58,237,0.15); border:1px solid rgba(167,139,250,0.4); border-radius:8px; padding:10px 14px; margin-top:10px; color:#c4b5fd; font-size:13px; display:flex; align-items:center; justify-content:space-between; }
        .ai-how { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; margin-top:16px; }
        .ai-how-title { color:#94a3b8; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
        .ai-step { display:flex; align-items:flex-start; gap:10px; margin-bottom:6px; font-size:12px; color:#7c6aa6; }
        .ai-step-num { background:rgba(124,58,237,0.3); color:#c4b5fd; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; flex-shrink:0; }
      `}</style>

      {/* HEADER */}
      <header style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <img src="/logokemendagri.png" alt="" style={{ width:64, height:64, objectFit:'contain', flexShrink:0 }} />
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#0f2558' }}>KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748b' }}>📋 Form Input Laporan Realisasi Anggaran (LRA) — Direktorat Jenderal Bina Keuangan Daerah</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>

        {/* AI GROQ PANEL */}
        <div className="ai-panel">
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <h2 className="ai-title">
                <span>✨</span>
                AI Groq — Baca &amp; Isi Otomatis
                <span className="ai-badge">BETA</span>
              </h2>
            </div>
            <p className="ai-subtitle">Upload file LRA (PDF atau Excel), Groq AI akan membaca dan mengisi form secara otomatis</p>

            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ color:'#a78bfa', fontSize:12, fontWeight:600 }}>🔑 Groq API Key</span>
                <button type="button" className="ai-btn ai-btn-secondary" style={{ padding:'4px 10px', fontSize:11 }}
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
                  {showApiKeyInput ? '🙈 Sembunyikan' : '⚙️ Atur API Key'}
                </button>
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:11, color:'#818cf8', textDecoration:'underline' }}>
                  Dapatkan API Key gratis di Groq ↗
                </a>
              </div>
              {showApiKeyInput && (
                <div>
                  <input type="password" className="ai-apikey-input"
                    placeholder="gsk_... (masukkan Groq API Key Anda)"
                    value={groqApiKey === 'YOUR_GROQ_API_KEY_HERE' ? '' : groqApiKey}
                    onChange={e => setGroqApiKey(e.target.value)} />
                  <p style={{ fontSize:11, color:'#6b5a8a', marginTop:6 }}>
                    API Key disimpan sementara di browser dan tidak dikirim ke server manapun selain Groq API.
                  </p>
                </div>
              )}
              {groqApiKey && groqApiKey !== 'YOUR_GROQ_API_KEY_HERE' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6ee7b7' }}>
                  <span>✅</span> API Key tersimpan
                </div>
              )}
            </div>

            <div className="ai-upload-zone" onClick={() => !isAiProcessing && aiFileInputRef.current?.click()}>
              <input ref={aiFileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv"
                style={{ display:'none' }} onChange={handleAiFileUpload} disabled={isAiProcessing} />
              {!isAiProcessing && !aiResult && (
                <>
                  <div className="ai-upload-icon">🤖</div>
                  <div className="ai-upload-text">Klik untuk upload file LRA ke Groq AI</div>
                  <div className="ai-upload-sub">AI akan membaca, memahami, dan mengisi form secara otomatis</div>
                  <div className="ai-upload-formats">
                    <span className="ai-format-tag">📄 PDF</span>
                    <span className="ai-format-tag">📊 Excel (.xlsx)</span>
                    <span className="ai-format-tag">📋 Excel (.xls)</span>
                    <span className="ai-format-tag">📝 CSV</span>
                  </div>
                </>
              )}
              {isAiProcessing && (
                <div style={{ color:'#c4b5fd', fontSize:15 }}>
                  <div style={{ fontSize:40, marginBottom:10 }}><span className="ai-spin">⚙️</span></div>
                  <div style={{ fontWeight:700 }}>AI sedang menganalisis...</div>
                </div>
              )}
              {aiResult && !isAiProcessing && (
                <div>
                  <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                  <div style={{ color:'#6ee7b7', fontWeight:700, fontSize:15 }}>Berhasil! {aiResult.items?.length || 0} item diekstrak</div>
                  <div style={{ color:'#a78bfa', fontSize:12, marginTop:4 }}>Klik untuk upload file baru</div>
                </div>
              )}
            </div>

            {aiProgress && (
              <div className="ai-progress">
                <span className="ai-spin">⚙️</span><span>{aiProgress}</span>
              </div>
            )}
            {aiUploadedFile && !isAiProcessing && (
              <div className="ai-file-selected">
                <span>📁 {aiUploadedFile.name}</span>
                <button type="button" onClick={() => { setAiUploadedFile(null); setAiResult(null) }}
                  style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:16 }}>×</button>
              </div>
            )}
            {aiResult && (
              <div className="ai-result-card">
                <div className="ai-result-title">📊 Hasil Ekstraksi Groq AI</div>
                {aiResult.daerah && <div className="ai-result-item"><span>🏛️ Daerah terdeteksi:</span><span style={{ fontWeight:700 }}>{aiResult.daerah}</span></div>}
                {aiResult.tahunAnggaran && <div className="ai-result-item"><span>📅 Tahun Anggaran:</span><span style={{ fontWeight:700 }}>{aiResult.tahunAnggaran}</span></div>}
                <div className="ai-result-item"><span>✅ Item berhasil diekstrak:</span><span style={{ fontWeight:700, color:'#34d399' }}>{aiResult.items?.length || 0} item</span></div>
                <div style={{ marginTop:8, fontSize:11, color:'#4ade80' }}>✨ Form telah diisi otomatis. Periksa dan sesuaikan jika perlu.</div>
              </div>
            )}
            <div className="ai-how">
              <div className="ai-how-title">⚡ Cara Kerja</div>
              <div className="ai-step"><div className="ai-step-num">1</div><div>Dapatkan <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{color:'#818cf8'}}>Groq API Key gratis</a> dari console.groq.com</div></div>
              <div className="ai-step"><div className="ai-step-num">2</div><div>Masukkan Groq API Key di atas, lalu upload file LRA (PDF/Excel/CSV)</div></div>
              <div className="ai-step"><div className="ai-step-num">3</div><div>Groq AI membaca dokumen, mengenali kode rekening, dan mengisi form otomatis</div></div>
              <div className="ai-step"><div className="ai-step-num">4</div><div>Periksa hasil dan koreksi jika diperlukan, lalu submit</div></div>
            </div>
          </div>
        </div>

        {/* INFO DAERAH */}
        <div style={{ background:'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', borderRadius:16, padding:24, marginBottom:24, border:'1px solid #e2e8f0', boxShadow:'0 4px 16px rgba(15,37,88,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div className="info-icon-box">📍</div>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#0f2558' }}>Informasi Daerah</h2>
              <p style={{ margin:'3px 0 0', fontSize:12, color:'#64748b' }}>Lengkapi data wilayah dan penanggung jawab laporan LRA</p>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'2px solid #6366f1', boxShadow:'0 2px 12px rgba(99,102,241,0.10)', marginBottom:18 }}>
            <div className="field-label" style={{ color:'#4f46e5' }}>🔍 Cari Kabupaten / Kota (Autocomplete)</div>
            <div className="srch-wrap" ref={searchRef}>
              <div className="srch-box">
                <span className="srch-ico">🔍</span>
                <input type="text" className="srch-inp"
                  placeholder="Ketik nama daerah... contoh: Bekasi, Medan, Sorong, Jayapura"
                  value={searchQuery} onChange={handleSearch} onKeyDown={handleSearchKey}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                  autoComplete="off" />
                {searchQuery && (
                  <button type="button" className="srch-clear" onClick={clearSearch} title="Hapus">×</button>
                )}
              </div>
              {showDropdown && (
                <div className="srch-dd">
                  {searchResults.length === 0
                    ? <div className="srch-empty">Tidak ditemukan: "{searchQuery}"</div>
                    : searchResults.map((entry, i) => {
                        const isKota = entry.kabkota.startsWith("Kota")
                        const bClass = entry.kabkota === "" ? "prov" : isKota ? "kota" : "kab"
                        const bLabel = entry.kabkota === "" ? "Provinsi" : isKota ? "Kota" : "Kab"
                        const displayName = entry.kabkota || entry.provinsi
                        return (
                          <div key={i} className={`srch-item${activeIdx===i?" active":""}`}
                            onMouseDown={() => selectResult(entry)} onMouseEnter={() => setActiveIdx(i)}>
                            <span className={`srch-badge ${bClass}`}>{bLabel}</span>
                            <span className="srch-name"><HL text={displayName} q={searchQuery} /></span>
                            <span className="srch-prov">{entry.provinsi.replace("Prov. ","")}</span>
                          </div>
                        )
                      })
                  }
                </div>
              )}
            </div>
            {(formData.kabupatenKota || formData.provinsi === "Prov. DKI Jakarta") && (
              <div className="sel-badge">
                <span>✅</span>
                <span>{formData.kabupatenKota || formData.provinsi}</span>
                {formData.kabupatenKota && <span className="sel-badge-prov">— {formData.provinsi.replace("Prov. ","")}</span>}
              </div>
            )}
            <p style={{ fontSize:11, color:'#6366f1', margin:'10px 0 0', display:'flex', alignItems:'center', gap:4 }}>
              <span>💡</span>Ketik min. 2 huruf untuk mencari. Pilih hasil untuk mengisi Provinsi &amp; Kab/Kota secara otomatis.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
            <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)' }}>
              <div className="field-label">🗺️ Provinsi</div>
              <select name="provinsi" value={formData.provinsi} onChange={handleChange} required className="field-select">
                <option value="">-- Pilih Provinsi --</option>
                {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)' }}>
              <div className="field-label">🏛️ Kabupaten/Kota</div>
              <select name="kabupatenKota" value={formData.kabupatenKota} onChange={handleChange} required disabled={!formData.provinsi} className="field-select">
                <option value="">-- Pilih Kabupaten/Kota --</option>
                {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)' }}>
              <div className="field-label">📅 Tahun Anggaran</div>
              <select name="tahunAnggaran" value={formData.tahunAnggaran} onChange={handleChange} required className="field-select">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)' }}>
              <div className="field-label">👤 Penanggung Jawab</div>
              <input name="namaPemohon" value={formData.namaPemohon} onChange={handleChange} placeholder="Nama lengkap" required className="field-input" />
            </div>
          </div>
          <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)', marginBottom:18 }}>
            <div className="field-label">📊 Target Sheet Pengiriman Data</div>
            <select name="targetSheet" value={formData.targetSheet} onChange={handleChange} required className="field-select sheet-selector">
              <option value="31 Januari 2025">31 Januari 2025</option>
              <option value="10 Januari 2025">10 Januari 2025</option>
              <option value="17 Januari 2025">17 Januari 2025</option>
              <option value="24 Januari 2025">24 Januari 2025</option>
            </select>
          </div>
          <div className="info-card" style={{ background:'#fff', padding:18, borderRadius:12, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,37,88,0.06)' }}>
            <div className="field-label">📝 Keterangan (Opsional)</div>
            <input name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Catatan atau informasi tambahan..." className="field-input" />
          </div>
        </div>

        {/* FILE UPLOAD (Manual) */}
        <div style={{ backgroundColor:"#e8f5e9", padding:15, borderRadius:8, marginBottom:20, border:"2px solid #4caf50" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <h3 style={{ margin:0, fontSize:16, color:"#2e7d32" }}>📁 Upload File Excel / CSV (Manual)</h3>
            {uploadedFile && (
              <button type="button" onClick={() => { setUploadedFile(null); setFilePreview("") }}
                style={{ padding:"6px 12px", backgroundColor:"#f44336", color:"white", border:"none", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:600 }}>🗑️ Hapus File</button>
            )}
          </div>
          <p style={{ margin:"0 0 10px 0", fontSize:13, color:"#666" }}><strong>📤 Upload file LRA</strong> format Excel (.xlsx, .xls) atau CSV — parsing berdasarkan kode rekening langsung.</p>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <label htmlFor="file-upload" style={{ padding:"10px 20px", backgroundColor:uploadedFile?"#ccc":"#4caf50", color:"white", borderRadius:6, cursor:uploadedFile?"not-allowed":"pointer", fontSize:14, fontWeight:600, display:"inline-block" }}>
              {uploadedFile ? "✅ File Terupload" : "📂 Pilih File"}
            </label>
            <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload}
              disabled={isProcessingFile||!!uploadedFile} style={{ display:"none" }} />
            {uploadedFile && <span style={{ fontSize:13, color:"#2e7d32", fontWeight:500 }}>📄 {uploadedFile.name}</span>}
          </div>
          {isProcessingFile && <div style={{ marginTop:10, padding:10, backgroundColor:"#fff3e0", borderRadius:4, fontSize:13, color:"#e65100" }}>⏳ Memproses...</div>}
          {filePreview && (
            <div style={{ marginTop:10, padding:10, backgroundColor:"#f5f5f5", borderRadius:4, maxHeight:150, overflowY:"auto" }}>
              <pre style={{ fontSize:11, margin:0, fontFamily:"monospace", whiteSpace:"pre-wrap" }}>{filePreview}</pre>
            </div>
          )}
        </div>

        {/* PASTE MODE */}
        <div style={{ backgroundColor:"#fff3e0", padding:15, borderRadius:8, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <h3 style={{ margin:0, fontSize:16, color:"#e65100" }}>📋 Copy-Paste dari Excel</h3>
            <button type="button" onClick={() => setPasteMode(!pasteMode)}
              style={{ padding:"8px 15px", backgroundColor:pasteMode?"#d32f2f":"#ff9800", color:"white", border:"none", borderRadius:4, cursor:"pointer", fontSize:13, fontWeight:600 }}>
              {pasteMode?"❌ Tutup":"📥 Aktifkan Paste"}
            </button>
          </div>
          {pasteMode && (
            <div>
              <p style={{ margin:"0 0 10px 0", fontSize:13, color:"#666" }}><strong>Format:</strong> Kode [TAB] Uraian [TAB] Anggaran [TAB] Realisasi — atau — Kode [TAB] Anggaran [TAB] Realisasi</p>
              <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
                placeholder="Paste data dari Excel di sini..."
                style={{ width:"100%", minHeight:150, padding:10, border:"2px solid #ff9800", borderRadius:6, fontSize:13, fontFamily:"monospace", marginBottom:10, boxSizing:"border-box" }} />
              <button type="button" onClick={handlePasteData} disabled={!pasteText.trim()}
                style={{ padding:"10px 20px", backgroundColor:pasteText.trim()?"#4caf50":"#ccc", color:"white", border:"none", borderRadius:4, cursor:pasteText.trim()?"pointer":"not-allowed", fontSize:14, fontWeight:600 }}>
                ✅ Terapkan Data Paste
              </button>
            </div>
          )}
        </div>

        {/* TABEL LRA */}
        <div style={{ overflowX:"auto" }}>
          {LRA_STRUCTURE.map((kg, idx) => {
            const kt = calcKatTotal(kg.kode), colors = getKategoriColor(kg.kode)
            return (
              <div key={idx} style={{ marginBottom:30 }}>
                <h3 style={{ backgroundColor:colors.bg, color:colors.text, padding:"12px 15px", borderRadius:6, margin:"0 0 15px 0", fontSize:15, fontWeight:600 }}>{kg.kode}. {kg.kategori}</h3>
                {kg.sections.map((section, sIdx) => {
                  const st = calcSubTotal(section.kode)
                  const isPaste = activePasteSection === section.kode
                  return (
                    <div key={sIdx} style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <h4 style={{ backgroundColor:"#e3f2fd", padding:"10px 15px", borderRadius:4, margin:0, fontSize:14, color:"#1565c0", fontWeight:600, flex:1 }}>{section.kode}. {section.subKategori}</h4>
                        <button type="button" onClick={() => setActivePasteSection(isPaste?null:section.kode)}
                          style={{ marginLeft:10, padding:"6px 12px", backgroundColor:isPaste?"#d32f2f":"#2196f3", color:"white", border:"none", borderRadius:4, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
                          {isPaste?"❌ Tutup":"📋 Paste Excel"}
                        </button>
                      </div>
                      {isPaste && (
                        <div style={{ backgroundColor:"#e3f2fd", padding:12, borderRadius:6, marginBottom:10, border:"2px solid #2196f3" }}>
                          <textarea value={sectionPasteText[section.kode]||""}
                            onChange={e=>setSectionPasteText(prev=>({...prev,[section.kode]:e.target.value}))}
                            placeholder={`Paste ${section.items.length} baris di sini...`}
                            style={{ width:"100%", minHeight:100, padding:8, border:"1px solid #2196f3", borderRadius:4, fontSize:12, fontFamily:"monospace", marginBottom:8, boxSizing:"border-box" }} />
                          <button type="button" onClick={() => handleSectionPaste(section.kode)}
                            disabled={!sectionPasteText[section.kode]?.trim()}
                            style={{ padding:"8px 16px", backgroundColor:sectionPasteText[section.kode]?.trim()?"#4caf50":"#ccc", color:"white", border:"none", borderRadius:4, cursor:sectionPasteText[section.kode]?.trim()?"pointer":"not-allowed", fontSize:13, fontWeight:600 }}>
                            ✅ Terapkan Data
                          </button>
                        </div>
                      )}
                      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:10, fontSize:14 }}>
                        <thead>
                          <tr style={{ backgroundColor:"#f5f5f5" }}>
                            <th style={{ padding:10, textAlign:"left", border:"1px solid #ddd", width:"15%" }}>Kode</th>
                            <th style={{ padding:10, textAlign:"left", border:"1px solid #ddd", width:"32%" }}>Uraian</th>
                            <th style={{ padding:10, textAlign:"center", border:"1px solid #ddd", width:"22%" }}>Anggaran (Rp)</th>
                            <th style={{ padding:10, textAlign:"center", border:"1px solid #ddd", width:"22%" }}>Realisasi (Rp)</th>
                            <th style={{ padding:10, textAlign:"center", border:"1px solid #ddd", width:"9%" }}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map(item => renderItemRow(item))}
                          <tr style={{ backgroundColor:"#fff9c4", fontWeight:600 }}>
                            <td style={{ padding:10, border:"1px solid #ddd", fontFamily:"monospace" }}><strong>{section.kode}</strong></td>
                            <td style={{ padding:10, border:"1px solid #ddd" }}><strong>Jumlah {section.subKategori}</strong></td>
                            <td style={{ padding:10, border:"1px solid #ddd", textAlign:"right", fontFamily:"monospace" }}>{formatRupiahInput(String(st.a))}</td>
                            <td style={{ padding:10, border:"1px solid #ddd", textAlign:"right", fontFamily:"monospace" }}>{formatRupiahInput(String(st.r))}</td>
                            <td style={{ padding:10, border:"1px solid #ddd", textAlign:"center", color:"#f57c00" }}>{st.pct}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )
                })}
                <div style={{ backgroundColor:"#f3e5f5", padding:"12px 15px", borderRadius:6, marginTop:15, marginBottom:10, border:"2px solid #9c27b0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#6a1b9a" }}>TOTAL {kg.kode}. {kg.kategori}</div>
                    <div style={{ display:"flex", gap:30, fontSize:14, fontFamily:"monospace" }}>
                      <div><span style={{ color:"#666", marginRight:8 }}>Anggaran:</span><span style={{ fontWeight:700, color:"#1565c0" }}>Rp {formatRupiahInput(String(kt.a))}</span></div>
                      <div><span style={{ color:"#666", marginRight:8 }}>Realisasi:</span><span style={{ fontWeight:700, color:"#2e7d32" }}>Rp {formatRupiahInput(String(kt.r))}</span></div>
                      <div><span style={{ color:"#666", marginRight:8 }}>%:</span><span style={{ fontWeight:700, color:"#7b1fa2" }}>{kt.pct}%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* GRAND TOTAL */}
        <div style={{ backgroundColor:"#e8f5e9", padding:15, borderRadius:8, marginTop:20, marginBottom:20, border:"3px solid #2e7d32" }}>
          <h3 style={{ margin:"0 0 15px 0", fontSize:16, color:"#2e7d32" }}>📊 RINGKASAN TOTAL KESELURUHAN</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:15 }}>
            {([["Total Anggaran",formatRupiahInput(String(totals.a)),"#1565c0"],["Total Realisasi",formatRupiahInput(String(totals.r)),"#2e7d32"],["Sisa",formatRupiahInput(String(totals.sisa)),"#f57c00"],["Persentase",totals.pct+"%","#7b1fa2"]] as [string,string,string][]).map(([label,val,color]) => (
              <div key={label}>
                <div style={{ fontSize:12, color:"#666", marginBottom:5 }}>{label}</div>
                <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"monospace" }}>{label!=="Persentase"?"Rp ":""}{val}</div>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div style={{ textAlign:"center", padding:12, backgroundColor:message.includes("✅")?"#d4edda":"#f8d7da", color:message.includes("✅")?"#155724":"#721c24", borderRadius:6, marginBottom:15, fontWeight:500 }}>
            {message}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button type="button" onClick={() => router.push('/')}
            style={{ backgroundColor:"#6c757d", padding:"12px 25px", color:"white", border:"none", borderRadius:6, cursor:"pointer", fontSize:14, fontWeight:600 }}>
            ← Kembali
          </button>
          <button type="submit" disabled={loading}
            style={{ padding:"12px 35px", backgroundColor:loading?"#ccc":"#28a745", color:"white", border:"none", borderRadius:6, cursor:loading?"not-allowed":"pointer", fontSize:14, fontWeight:600 }}>
            {loading?"⏳ Mengirim...":"💾 Simpan Semua Data"}
          </button>
        </div>
      </form>
    </div>
  )
}
