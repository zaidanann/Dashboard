'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// KONFIGURASI UKURAN LOGO — sesuaikan di sini
// ============================================================
const LOGO_CONFIG = {
  // Logo di header utama (kiri header biru)
  header: {
    width: 80,   // px — lebar logo
    height: 80,  // px — tinggi logo
  },
  // Logo di card "Informasi Daerah" (header card biru)
  infoDaerah: {
    width: 44,   // px — lebar logo
    height: 44,  // px — tinggi logo
  },
}
// ============================================================

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
  {
    kode: "4", kategori: "PENDAPATAN DAERAH",
    sections: [
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
  {
    kode: "5", kategori: "BELANJA DAERAH",
    sections: [
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
  {
    kode: "6", kategori: "PEMBIAYAAN DAERAH",
    sections: [
      { kode: "6.1", subKategori: "Penerimaan Pembiayaan", items: [
        { kode: "6.1", uraian: "Jumlah Penerimaan Pembiayaan" },
      ]},
      { kode: "6.2", subKategori: "Pengeluaran Pembiayaan", items: [
        { kode: "6.2", uraian: "Jumlah Pengeluaran Pembiayaan" },
      ]},
    ]},
]

function collectAllCodes(): Record<string, AnggaranItem> {
  const d: Record<string, AnggaranItem> = {}
  LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
    d[item.kode] = { kodeRekening: item.kode, uraian: item.uraian, anggaran: "", realisasi: "" }
    item.subItems?.forEach(sub => {
      d[sub.kode] = { kodeRekening: sub.kode, uraian: sub.uraian, anggaran: "", realisasi: "" }
    })
  })))
  return d
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGEb9E9MUAp-mnMcrYVgdl15YFI7Zdi_Y_Qv7tQ3oIg4de-hAt313GaZIyuYHRrhxZ/exec"
const GROQ_API_KEY_DEFAULT = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"

function getAllValidCodes(): string {
  const codes: string[] = []
  LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
    if (item.subItems?.length) {
      codes.push(`${item.kode} | ${item.uraian} (total)`)
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
  items: Array<{ kodeRekening: string; anggaran: number; realisasi: number }>
}

function formatRupiahInput(value: string) {
  if (!value) return ""
  const num = parseFloat(value) / 100
  if (isNaN(num)) return ""
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}

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

  const displayValue = focused ? raw : value && value !== "0" ? formatRupiahInput(value) : ""

  const handleFocus = () => {
    const num = value ? Number(value) / 100 : 0
    setRaw(num > 0 ? num.toFixed(2) : "")
    setFocused(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value.replace(/[^\d.,]/g, ""))
  }

  const handleBlur = () => {
    setFocused(false)
    if (!raw.trim()) { onChange(""); return }
    let cleaned = raw.replace(/[^\d.,]/g, "")
    const lastComma = cleaned.lastIndexOf(",")
    const lastDot = cleaned.lastIndexOf(".")
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      cleaned = cleaned.replace(/,/g, "")
    }
    const n = parseFloat(cleaned)
    onChange(!isNaN(n) && n > 0 ? Math.round(n * 100).toString() : "")
  }

  return (
    <input
      type="text"
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="rupiah-input"
    />
  )
}

function getKategoriTheme(kode: string) {
  if (kode === "4") return { accent: "#0d6b9a", light: "#e8f4fb", border: "#4fa8d0", label: "PENDAPATAN" }
  if (kode === "5") return { accent: "#1a6b3c", light: "#e8f5ee", border: "#4daa77", label: "BELANJA" }
  return { accent: "#7a4e00", light: "#fef6e8", border: "#d4a045", label: "PEMBIAYAAN" }
}

function HL({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return <>{text.slice(0,idx)}<mark style={{ background:"#fde68a", padding:0, borderRadius:2 }}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>
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
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
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
    { "kodeRekening": "kode rekening sesuai daftar valid", "anggaran": 123456789.00, "realisasi": 98765432.00 }
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
    provinsi: "",
    kabupatenKota: "",
    tahunAnggaran: "2024",
    namaPemohon: "",
    keterangan: "",
    targetSheet: "31 Januari 2025",
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

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (matchProv) {
        setFormData(prev => ({ ...prev, provinsi: matchProv }))
        setKabupatenOptions(KABUPATEN_KOTA[matchProv] || [])
      }
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
    } finally {
      setIsAiProcessing(false)
    }
  }

  function toggleExpand(kode: string) {
    setExpandedItems(prev => ({ ...prev, [kode]: !prev[kode] }))
  }

  function calcSubTotal(sk: string) {
    let a = 0, r = 0
    LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => {
      if (s.kode === sk) {
        s.items.forEach(item => {
          const d = anggaranData[item.kode]
          if (d) { a += Number(d.anggaran||0); r += Number(d.realisasi||0) }
          item.subItems?.forEach(sub => {
            const sd = anggaranData[sub.kode]
            if (sd) { a += Number(sd.anggaran||0); r += Number(sd.realisasi||0) }
          })
        })
      }
    }))
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcKatTotal(kk: string) {
    let a = 0, r = 0
    LRA_STRUCTURE.forEach(kg => {
      if (kg.kode !== kk) return
      kg.sections.forEach(s => s.items.forEach(item => {
        const d = anggaranData[item.kode]
        if (d) { a += Number(d.anggaran||0); r += Number(d.realisasi||0) }
        item.subItems?.forEach(sub => {
          const sd = anggaranData[sub.kode]
          if (sd) { a += Number(sd.anggaran||0); r += Number(sd.realisasi||0) }
        })
      }))
    })
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcItemSubTotal(item: LRAItem) {
    if (!item.subItems?.length) return null
    let a = 0, r = 0
    item.subItems.forEach(sub => {
      const d = anggaranData[sub.kode]; a += Number(d?.anggaran||0); r += Number(d?.realisasi||0)
    })
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  function calcTotal() {
    let a = 0, r = 0
    LRA_STRUCTURE.forEach(kg => kg.sections.forEach(s => s.items.forEach(item => {
      const d = anggaranData[item.kode]
      if (d) { a += Number(d.anggaran||0); r += Number(d.realisasi||0) }
      item.subItems?.forEach(sub => {
        const sd = anggaranData[sub.kode]
        if (sd) { a += Number(sd.anggaran||0); r += Number(sd.realisasi||0) }
      })
    })))
    return { a, r, sisa: a-r, pct: a > 0 ? ((r/a)*100).toFixed(2) : "0" }
  }

  const totals = calcTotal()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === "provinsi") setFormData(prev => ({ ...prev, [name]: value, kabupatenKota: "" }))
  }

  const handleAnggaranChange = (kode: string, field: "anggaran" | "realisasi", value: string) => {
    setAnggaranData(prev => ({ ...prev, [kode]: { ...prev[kode], [field]: value } }))
  }

  const cv = (v: string): string => {
    if (!v || v==="-" || v==="0.00") return ""
    const c = v.replace(/[^\d.,]/g,"")
    if (!c) return ""
    const lastDot = c.lastIndexOf(".")
    const lastComma = c.lastIndexOf(",")
    let normalized = c
    if (lastComma > lastDot) {
      normalized = c.replace(/\./g, "").replace(",", ".")
    } else if (lastDot > lastComma) {
      normalized = c.replace(/,/g, "")
    } else {
      normalized = c.replace(/[,.]/g, "")
    }
    const n = parseFloat(normalized)
    return !isNaN(n) && n > 0 ? Math.round(n * 100).toString() : ""
  }

  function splitByKodeAndValues(line: string): string[] {
    const kodeMatch = line.match(/^(\d+(?:\.\d+){0,3})/)
    if (!kodeMatch) {
      return line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
    }
    const kode = kodeMatch[1]
    const rest = line.slice(kode.length).trim()
    const rupiahPattern = /\d[\d.,]*\d|\d{3,}/g
    const matches: string[] = []
    let m: RegExpExecArray | null
    while ((m = rupiahPattern.exec(rest)) !== null) {
      const val = m[0].replace(/[.,]$/, "")
      const digitCount = (val.match(/\d/g) || []).length
      if (digitCount >= 3) matches.push(val)
    }
    if (matches.length === 0) return [kode]
    if (matches.length === 1) return [kode, matches[0]]
    if (matches.length === 2) return [kode, matches[0], matches[1]]
    return [kode, matches[0], matches[1]]
  }

  function applyPasteLines(lines: string[], nd: Record<string, AnggaranItem>) {
    lines.forEach(line => {
      if (!line.trim()) return
      let p: string[]
      if (line.includes("\t")) {
        p = line.split("\t").map(s => s.trim())
      } else {
        p = splitByKodeAndValues(line)
      }
      if (p.length < 2) return
      const kode = p[0].trim()
      if (!nd[kode]) return
      let av = "", rv = ""
      if (p.length >= 4) {
        const numericCols = p.slice(1).filter(x => /[\d]/.test(x))
        if (numericCols.length >= 2) {
          av = numericCols[numericCols.length - 2]
          rv = numericCols[numericCols.length - 1]
        } else if (numericCols.length === 1) {
          av = numericCols[0]
        }
      } else if (p.length === 3) {
        av = p[1]?.trim() || ""
        rv = p[2]?.trim() || ""
      } else if (p.length === 2) {
        av = p[1]?.trim() || ""
      }
      nd[kode] = { ...nd[kode], anggaran: cv(av), realisasi: cv(rv) }
    })
  }

  const handlePasteData = () => {
    try {
      const nd = { ...anggaranData }
      applyPasteLines(pasteText.trim().split("\n"), nd)
      setAnggaranData(nd); setPasteText(""); setPasteMode(false)
      setMessage("✅ Data berhasil di-paste!"); setTimeout(() => setMessage(""), 3000)
    } catch {
      setMessage("❌ Gagal parsing data")
    }
  }

  const handleSectionPaste = (sk: string) => {
    try {
      const nd = { ...anggaranData }
      applyPasteLines((sectionPasteText[sk]||"").trim().split("\n"), nd)
      setAnggaranData(nd); setSectionPasteText(prev => ({ ...prev, [sk]: "" })); setActivePasteSection(null)
      setMessage("✅ Data berhasil di-paste!"); setTimeout(() => setMessage(""), 3000)
    } catch {
      setMessage("❌ Gagal parsing data")
    }
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
    } catch (err) {
      setMessage("❌ Gagal: " + (err instanceof Error ? err.message : ""))
    } finally {
      setIsProcessingFile(false)
    }
  }

  const parseExcelRows = (rows: unknown[][]) => {
    let kc=-1, ac=-1, rc=-1, hr=-1
    for (let i=0; i<Math.min(10,rows.length); i++) {
      const row = rows[i] as unknown[]
      for (let j=0; j<row.length; j++) {
        const cell = String(row[j]||"").toLowerCase()
        if (cell.includes("kode") && kc===-1) kc=j
        if ((cell.includes("anggaran") || cell.includes("pagu")) && ac===-1) ac=j
        if ((cell.includes("realisasi") || cell.includes("terealisir")) && rc===-1) rc=j
      }
      if (kc!==-1 && (ac!==-1 || rc!==-1)) { hr=i; break }
    }
    const parseVal = (raw: unknown): string => {
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
      const row = rows[i] as unknown[]
      const kode = kc>=0 ? String(row[kc]||"").trim() : String(row[0]||"").trim()
      if (!kode || !anggaranData[kode]) continue
      const angg = ac>=0 ? parseVal(row[ac]) : ""
      const real = rc>=0 ? parseVal(row[rc]) : ""
      if (angg||real) {
        setAnggaranData(prev => ({ ...prev, [kode]: { ...prev[kode], anggaran: angg, realisasi: real } }))
      }
    }
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
        const pd = anggaranData[item.kode]; if(pd) allItems.push(pd)
        item.subItems?.forEach(sub => { const d=anggaranData[sub.kode]; if(d) allItems.push(d) })
      })))
      const payload = {
        action:"submitData",
        targetSheet:formData.targetSheet,
        daerah:formData.kabupatenKota||formData.provinsi,
        provinsi:formData.provinsi,
        kabupatenKota:formData.kabupatenKota,
        tahunAnggaran:formData.tahunAnggaran,
        namaPemohon:formData.namaPemohon,
        keterangan:formData.keterangan,
        items: allItems.map(item => ({
          kodeRekening:item.kodeRekening,
          uraian:item.uraian,
          anggaran:Number(item.anggaran||0)/100,
          realisasi:Number(item.realisasi||0)/100,
          sisa:(Number(item.anggaran||0)-Number(item.realisasi||0))/100,
          persentase:Number(item.anggaran||0)>0?((Number(item.realisasi||0)/Number(item.anggaran||0))*100).toFixed(2):"0",
        })),
        totals:{
          totalAnggaran:t.a/100,
          totalRealisasi:t.r/100,
          sisa:t.sisa/100,
          persentase:t.pct
        },
        tanggalInput:new Date().toISOString(),
        status:"Pending",
      }
      const form = document.createElement('form')
      form.method='POST'; form.action=SCRIPT_URL; form.target='_blank'
      const input = document.createElement('input')
      input.type='hidden'; input.name='data'; input.value=JSON.stringify(payload)
      form.appendChild(input); document.body.appendChild(form); form.submit(); document.body.removeChild(form)
      setTimeout(() => {
        setMessage("✅ Data LRA berhasil dikirim!")
        setTimeout(() => router.push('/'), 2000)
      }, 1000)
    } catch (err) {
      setMessage("❌ Gagal: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  function renderItemRowMobile(item: LRAItem) {
    const d = anggaranData[item.kode] || { anggaran:"", realisasi:"" }
    const hasSubItems = !!item.subItems?.length
    const isExpanded = expandedItems[item.kode]

    if (hasSubItems) {
      const subTotal = calcItemSubTotal(item)!
      const parentPct = Number(d.anggaran||0) > 0
        ? ((Number(d.realisasi||0) / Number(d.anggaran||0)) * 100).toFixed(2)
        : subTotal.pct
      return (
        <div key={item.kode} className="mobile-card mobile-card--group">
          <div onClick={() => toggleExpand(item.kode)} className="mobile-card__header mobile-card__header--expandable">
            <div>
              <span className="kode-badge kode-badge--blue">{item.kode}</span>
              <div className="mobile-card__title">{item.uraian} <span className="mobile-card__count">({item.subItems!.length} rincian)</span></div>
            </div>
            <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
          </div>
          <div className="mobile-card__body">
            <div className="field-label field-label--blue">Input Total Langsung {item.kode}</div>
            <div className="field-group">
              <div className="field-label">Anggaran (Rp)</div>
              <RupiahInput value={d.anggaran||""} onChange={val => handleAnggaranChange(item.kode, "anggaran", val)} />
            </div>
            <div className="field-group">
              <div className="field-label">Realisasi (Rp)</div>
              <RupiahInput value={d.realisasi||""} onChange={val => handleAnggaranChange(item.kode, "realisasi", val)} />
            </div>
            <div className={`pct-badge ${Number(parentPct)>100?"pct-badge--over":Number(d.anggaran||0)>0?"pct-badge--ok":"pct-badge--zero"}`}>{parentPct}%</div>
          </div>
          {isExpanded && item.subItems!.map(sub => {
            const sd = anggaranData[sub.kode] || { anggaran:"", realisasi:"" }
            const sPct = Number(sd.anggaran||0)>0 ? ((Number(sd.realisasi||0)/Number(sd.anggaran||0))*100).toFixed(2) : "0"
            return (
              <div key={sub.kode} className="mobile-card__sub">
                <span className="kode-badge kode-badge--gray">{sub.kode}</span>
                <div className="mobile-card__sub-title">↳ {sub.uraian}</div>
                <div className="field-group">
                  <div className="field-label">Anggaran (Rp)</div>
                  <RupiahInput value={sd.anggaran||""} onChange={val => handleAnggaranChange(sub.kode, "anggaran", val)} />
                </div>
                <div className="field-group">
                  <div className="field-label">Realisasi (Rp)</div>
                  <RupiahInput value={sd.realisasi||""} onChange={val => handleAnggaranChange(sub.kode, "realisasi", val)} />
                </div>
                <div className={`pct-badge ${Number(sPct)>100?"pct-badge--over":"pct-badge--ok"}`}>{sPct}%</div>
              </div>
            )
          })}
        </div>
      )
    }

    const pct = Number(d.anggaran||0)>0?((Number(d.realisasi||0)/Number(d.anggaran||0))*100).toFixed(2):"0"
    return (
      <div key={item.kode} className="mobile-card">
        <span className="kode-badge kode-badge--gray">{item.kode}</span>
        <div className="mobile-card__title" style={{ marginTop:6, marginBottom:10 }}>{item.uraian}</div>
        <div className="field-group">
          <div className="field-label">Anggaran (Rp)</div>
          <RupiahInput value={d.anggaran||""} onChange={val => handleAnggaranChange(item.kode, "anggaran", val)} />
        </div>
        <div className="field-group">
          <div className="field-label">Realisasi (Rp)</div>
          <RupiahInput value={d.realisasi||""} onChange={val => handleAnggaranChange(item.kode, "realisasi", val)} />
        </div>
        <div className={`pct-badge ${Number(pct)>100?"pct-badge--over":"pct-badge--ok"}`}>{pct}%</div>
      </div>
    )
  }

  function renderItemRow(item: LRAItem) {
    const d = anggaranData[item.kode] || { anggaran:"", realisasi:"" }
    const hasSubItems = !!item.subItems?.length
    const isExpanded = expandedItems[item.kode]

    if (hasSubItems) {
      const subTotal = calcItemSubTotal(item)!
      const parentPct = Number(d.anggaran||0) > 0
        ? ((Number(d.realisasi||0) / Number(d.anggaran||0)) * 100).toFixed(2)
        : subTotal.pct
      const pctColor = Number(parentPct) > 100 ? "var(--danger)" : Number(d.anggaran||0) > 0 ? "var(--success)" : "var(--warning)"
      return (
        <React.Fragment key={item.kode}>
          <tr className="tr-group-parent">
            <td className="td-kode">
              <button onClick={() => toggleExpand(item.kode)} className="expand-btn">
                {isExpanded ? "▼" : "▶"}
              </button>
              {item.kode}
            </td>
            <td className="td-uraian">
              <div className="uraian-main">{item.uraian}</div>
              <div className="uraian-hint">{item.subItems!.length} rincian — isi total langsung di sini</div>
            </td>
            <td className="td-input">
              <RupiahInput value={d.anggaran||""} onChange={val => handleAnggaranChange(item.kode, "anggaran", val)} placeholder="Total anggaran" />
              {subTotal.a > 0 && <div className="subtotal-hint">Sub: {formatRupiahInput(String(subTotal.a))}</div>}
            </td>
            <td className="td-input">
              <RupiahInput value={d.realisasi||""} onChange={val => handleAnggaranChange(item.kode, "realisasi", val)} placeholder="Total realisasi" />
              {subTotal.r > 0 && <div className="subtotal-hint">Sub: {formatRupiahInput(String(subTotal.r))}</div>}
            </td>
            <td className="td-pct" style={{ color: pctColor }}>{parentPct}%</td>
          </tr>
          {isExpanded && item.subItems!.map(sub => {
            const sd = anggaranData[sub.kode] || { anggaran: "", realisasi: "" }
            const sPct = Number(sd.anggaran||0) > 0 ? ((Number(sd.realisasi||0) / Number(sd.anggaran||0)) * 100).toFixed(2) : "0"
            return (
              <tr key={sub.kode} className="tr-sub">
                <td className="td-kode td-kode--sub">{sub.kode}</td>
                <td className="td-uraian td-uraian--sub">↳ {sub.uraian}</td>
                <td className="td-input"><RupiahInput value={sd.anggaran||""} onChange={val => handleAnggaranChange(sub.kode, "anggaran", val)} /></td>
                <td className="td-input"><RupiahInput value={sd.realisasi||""} onChange={val => handleAnggaranChange(sub.kode, "realisasi", val)} /></td>
                <td className="td-pct" style={{ color: Number(sPct) > 100 ? "var(--danger)" : "var(--success)" }}>{sPct}%</td>
              </tr>
            )
          })}
        </React.Fragment>
      )
    }

    const pct = Number(d.anggaran||0)>0?((Number(d.realisasi||0)/Number(d.anggaran||0))*100).toFixed(2):"0"
    return (
      <tr key={item.kode} className="tr-item">
        <td className="td-kode">{item.kode}</td>
        <td className="td-uraian">{item.uraian}</td>
        <td className="td-input"><RupiahInput value={d.anggaran||""} onChange={val => handleAnggaranChange(item.kode, "anggaran", val)} /></td>
        <td className="td-input"><RupiahInput value={d.realisasi||""} onChange={val => handleAnggaranChange(item.kode, "realisasi", val)} /></td>
        <td className="td-pct" style={{ color: Number(pct)>100?"var(--danger)":"var(--success)" }}>{pct}%</td>
      </tr>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --primary: #0f4c75;
          --primary-mid: #1b6ca8;
          --primary-light: #e8f2fb;
          --primary-border: #9dc4e8;
          --success: #15803d;
          --success-light: #dcfce7;
          --success-border: #86efac;
          --warning: #b45309;
          --warning-light: #fef3c7;
          --danger: #b91c1c;
          --danger-light: #fee2e2;
          --ai-primary: #6d28d9;
          --ai-light: #f5f3ff;
          --ai-border: #c4b5fd;
          --surface: #ffffff;
          --surface-2: #f8fafc;
          --surface-3: #f1f5f9;
          --border: #e2e8f0;
          --border-mid: #cbd5e1;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --radius: 10px;
          --radius-sm: 6px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow: 0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
          --shadow-md: 0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05);
        }

        * { box-sizing: border-box; }

        .lra-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 20px 60px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f0f4f8;
          min-height: 100vh;
          color: var(--text-primary);
        }

        /* ── HEADER ── */
        .page-header {
          background: linear-gradient(135deg, #0b3d6b 0%, #0f4c75 35%, #1b6ca8 70%, #2980b9 100%);
          border-radius: 14px;
          padding: 0;
          margin-bottom: 24px;
          color: #fff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(11,61,107,0.38), 0 2px 6px rgba(0,0,0,0.15);
          border-bottom: 3px solid #f1c40f;
        }
        .page-header__bg-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }
        .page-header__bg-circle--1 { width: 280px; height: 280px; top: -100px; right: -60px; }
        .page-header__bg-circle--2 { width: 160px; height: 160px; bottom: -60px; left: 60px; background: rgba(255,255,255,0.03); }
        .page-header__bg-circle--3 { width: 100px; height: 100px; top: 20px; right: 240px; background: rgba(241,196,15,0.06); }

        .page-header__inner {
          display: flex;
          align-items: center;
          gap: 0;
          position: relative;
          z-index: 1;
          padding: 0;
        }

        .page-header__logo-wrap {
          padding: 22px 24px 22px 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.12);
        }
        .page-header__logo-svg {
          display: block;
        }

        .page-header__identity {
          padding: 22px 28px 22px 24px;
          border-right: 1px solid rgba(255,255,255,0.12);
          flex-shrink: 0;
        }
        .page-header__ministry-name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #fff;
          line-height: 1.2;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }
        .page-header__ministry-sub {
          font-size: 11.5px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.75);
          margin-top: 2px;
          font-weight: 600;
        }
        .page-header__divider {
          width: 40px;
          height: 2px;
          background: #f1c40f;
          margin: 10px 0;
          border-radius: 2px;
        }
        .page-header__ditjen {
          font-size: 11.5px;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
          font-style: italic;
          max-width: 220px;
          line-height: 1.4;
        }

        .page-header__doc {
          flex: 1;
          padding: 22px 32px;
          text-align: right;
        }
        .page-header__doc-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #f1c40f;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .page-header__title {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.2;
          margin: 0;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .page-header__doc-abbr {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          margin-top: 6px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .page-header__inner { flex-wrap: wrap; }
          .page-header__logo-wrap { padding: 16px 20px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); width: 100%; justify-content: flex-start; gap: 14px; }
          .page-header__logo-svg { width: 56px; height: 56px; }
          .page-header__identity { display: none; }
          .page-header__doc { text-align: left; padding: 16px 20px; }
          .page-header__title { font-size: 17px; }
          /* Show ministry name inside logo wrap on mobile */
          .page-header__logo-wrap::after {
            content: attr(data-ministry);
            color: white;
            font-size: 13px;
            font-weight: 700;
          }
        }

        /* ── INFO DAERAH HEADER ── */
        .info-daerah-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          margin: -24px -24px 20px -24px;
          background: linear-gradient(135deg, #0f4c75 0%, #1b6ca8 100%);
          border-radius: 10px 10px 0 0;
          position: relative;
          overflow: hidden;
        }
        .info-daerah-header::after {
          content: '';
          position: absolute;
          right: -30px; top: -30px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .info-daerah-header__logo {
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .info-daerah-header__text {
          flex: 1;
          min-width: 0;
        }
        .info-daerah-header__title {
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          margin-bottom: 3px;
        }
        .info-daerah-header__desc {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          font-weight: 400;
          line-height: 1.4;
        }
        .info-daerah-header__stamp {
          flex-shrink: 0;
        }
        .info-daerah-header__stamp-inner {
          border: 2px solid rgba(241,196,15,0.8);
          border-radius: 6px;
          padding: 5px 10px;
          text-align: center;
          background: rgba(241,196,15,0.1);
        }
        .info-daerah-header__stamp-line1 {
          font-size: 9px;
          font-weight: 800;
          color: #f1c40f;
          letter-spacing: 0.1em;
        }
        .info-daerah-header__stamp-line2 {
          font-size: 11px;
          font-weight: 800;
          color: #f1c40f;
          letter-spacing: 0.06em;
        }

        @media (max-width: 600px) {
          .info-daerah-header { padding: 14px 16px; margin: -18px -16px 16px -16px; }
          .info-daerah-header__stamp { display: none; }
        }

        /* ── CARD ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }
        .card--ai {
          border-color: var(--ai-border);
          background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
          box-shadow: 0 2px 12px rgba(109,40,217,0.08);
        }
        .card--warning {
          border-color: #fed7aa;
          background: #fffbf5;
        }

        .card__header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .card__icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .card__icon--blue { background: var(--primary-light); }
        .card__icon--ai { background: #ede9fe; }
        .card__icon--orange { background: #fff7ed; }
        .card__icon--green { background: var(--success-light); }
        .card__title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .card__desc {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* ── AI PANEL ── */
        .ai-badge {
          background: var(--ai-primary);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .ai-link {
          font-size: 12px;
          color: var(--ai-primary);
          text-decoration: none;
          font-weight: 600;
          display: inline-flex; align-items: center; gap: 3px;
        }
        .ai-link:hover { text-decoration: underline; }

        .api-key-input {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid var(--ai-border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-family: 'DM Mono', monospace;
          background: #fff;
          color: var(--text-primary);
          transition: border-color 0.15s;
        }
        .api-key-input:focus {
          outline: none;
          border-color: var(--ai-primary);
          box-shadow: 0 0 0 3px rgba(109,40,217,0.1);
        }

        .ai-drop-zone {
          border: 2px dashed var(--ai-border);
          border-radius: var(--radius);
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          background: rgba(109,40,217,0.02);
          transition: all 0.2s;
        }
        .ai-drop-zone:hover {
          border-color: var(--ai-primary);
          background: rgba(109,40,217,0.05);
        }
        .ai-drop-zone__icon { font-size: 36px; margin-bottom: 10px; }
        .ai-drop-zone__title { font-weight: 700; color: #5b21b6; font-size: 14px; margin-bottom: 6px; }
        .ai-drop-zone__desc { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
        .file-chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .file-chip {
          background: #ede9fe;
          color: #5b21b6;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .ai-progress {
          margin-top: 12px;
          padding: 10px 14px;
          background: #ede9fe;
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: #5b21b6;
          font-weight: 500;
          display: flex; align-items: center; gap: 8px;
        }

        .uploaded-file-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px;
          background: #f0fdf4;
          border: 1px solid var(--success-border);
          border-radius: var(--radius-sm);
          margin-top: 10px;
        }
        .uploaded-file-bar__name { font-size: 13px; color: var(--success); flex: 1; font-weight: 500; }

        .ai-result-box {
          margin-top: 14px;
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1px solid var(--success-border);
          border-radius: var(--radius);
        }
        .ai-result-box__title { font-weight: 700; color: var(--success); margin-bottom: 10px; font-size: 13px; }
        .ai-result-row { font-size: 13px; margin-bottom: 6px; color: var(--text-secondary); }
        .ai-result-row b { color: var(--text-primary); }

        .ai-steps {
          margin-top: 16px;
          padding: 14px 16px;
          background: rgba(109,40,217,0.04);
          border-radius: var(--radius);
          border: 1px solid rgba(109,40,217,0.1);
        }
        .ai-steps__title { font-weight: 700; font-size: 13px; color: #5b21b6; margin-bottom: 12px; }
        .ai-steps__grid { display: flex; gap: 12px; flex-wrap: wrap; }
        .ai-step { display: flex; gap: 10px; align-items: flex-start; flex: 1 1 200px; }
        .ai-step__num {
          background: var(--ai-primary);
          color: #fff;
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0; margin-top: 1px;
        }
        .ai-step__text { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

        /* ── FORM FIELDS ── */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .form-field label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--surface);
          color: var(--text-primary);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--primary-mid);
          box-shadow: 0 0 0 3px rgba(27,108,168,0.1);
        }

        /* ── SEARCH ── */
        .search-wrap { position: relative; }
        .search-box {
          display: flex; align-items: center;
          border: 2px solid var(--primary-mid);
          border-radius: var(--radius-sm);
          background: var(--surface);
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .search-box:focus-within { box-shadow: 0 0 0 3px rgba(27,108,168,0.12); }
        .search-icon { padding: 0 12px; color: var(--primary-mid); font-size: 15px; }
        .search-input {
          flex: 1;
          padding: 11px 0;
          border: none !important;
          outline: none !important;
          font-size: 14px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .search-clear {
          padding: 0 12px;
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 4px); left: 0; right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          z-index: 1000;
          max-height: 290px;
          overflow-y: auto;
        }
        .search-empty { padding: 14px 16px; color: var(--text-muted); font-size: 13px; }
        .search-item {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid var(--surface-3);
          display: flex; align-items: center; gap: 10px;
          transition: background 0.1s;
        }
        .search-item:hover, .search-item--active { background: var(--primary-light); }
        .search-item:last-child { border-bottom: none; }
        .region-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 20px;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.04em;
        }
        .search-item__name { font-weight: 600; font-size: 13.5px; }
        .search-item__prov { font-size: 11.5px; color: var(--text-muted); margin-top: 1px; }

        .selected-region {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 8px; padding: 6px 12px;
          background: var(--success-light);
          border: 1px solid var(--success-border);
          border-radius: 20px;
          font-size: 13px; font-weight: 600; color: var(--success);
        }
        .search-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

        /* ── RUPIAH INPUT ── */
        .rupiah-input {
          width: 100%;
          padding: 8px 10px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-family: 'DM Mono', monospace;
          text-align: right;
          background: var(--surface);
          color: var(--text-primary);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .rupiah-input:focus {
          outline: none;
          border-color: var(--primary-mid);
          box-shadow: 0 0 0 3px rgba(27,108,168,0.1);
        }
        .rupiah-input::placeholder { color: var(--text-muted); }

        /* ── BUTTONS ── */
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          border: none; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
        }
        .btn--primary { background: var(--primary-mid); color: #fff; }
        .btn--primary:hover { background: var(--primary); }
        .btn--success { background: #16a34a; color: #fff; }
        .btn--success:hover { background: #15803d; }
        .btn--danger { background: #dc2626; color: #fff; }
        .btn--danger:hover { background: #b91c1c; }
        .btn--gray { background: #6b7280; color: #fff; }
        .btn--gray:hover { background: #4b5563; }
        .btn--orange { background: #f59e0b; color: #fff; }
        .btn--orange:hover { background: #d97706; }
        .btn--ai { background: var(--ai-primary); color: #fff; }
        .btn--ai:hover { background: #5b21b6; }
        .btn--outline-ai {
          background: transparent; color: var(--ai-primary);
          border: 1.5px solid var(--ai-primary);
        }
        .btn--outline-ai:hover { background: var(--ai-light); }
        .btn--outline-blue {
          background: transparent; color: var(--primary-mid);
          border: 1.5px solid var(--primary-mid);
        }
        .btn--outline-blue:hover { background: var(--primary-light); }
        .btn--disabled { background: #e2e8f0 !important; color: var(--text-muted) !important; cursor: not-allowed !important; }
        .btn--large { padding: 12px 28px; font-size: 14px; }

        /* ── KATEGORI HEADER ── */
        .kat-header {
          padding: 13px 18px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-size: 14px; font-weight: 700;
          display: flex; align-items: center; gap: 10px;
          color: #fff;
        }
        .kat-header--pendapatan { background: linear-gradient(90deg, #0d6b9a, #1b6ca8); }
        .kat-header--belanja { background: linear-gradient(90deg, #1a6b3c, #2d9b58); }
        .kat-header--pembiayaan { background: linear-gradient(90deg, #7a4e00, #c07a10); }

        /* ── SECTION HEADER ── */
        .section-header-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px; flex-wrap: wrap; gap: 8px;
        }
        .section-title {
          background: var(--primary-light);
          border-left: 4px solid var(--primary-mid);
          padding: 9px 14px;
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          font-size: 13.5px; font-weight: 700; color: var(--primary);
          flex: 1;
        }

        /* ── LRA TABLE ── */
        .lra-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          margin-bottom: 10px;
          background: var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .lra-table thead tr {
          background: var(--surface-3);
        }
        .lra-table th {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 2px solid var(--border);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .lra-table th:last-child { text-align: center; }

        .td-kode {
          padding: 9px 12px;
          border-bottom: 1px solid var(--border);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          white-space: nowrap;
          color: var(--text-secondary);
          width: 14%;
        }
        .td-kode--sub { padding-left: 28px; color: var(--text-muted); }
        .td-uraian {
          padding: 9px 12px;
          border-bottom: 1px solid var(--border);
          width: 32%;
        }
        .td-uraian--sub { color: var(--text-secondary); font-size: 13px; }
        .td-input {
          padding: 6px 10px;
          border-bottom: 1px solid var(--border);
          width: 21%;
        }
        .td-pct {
          padding: 9px 12px;
          border-bottom: 1px solid var(--border);
          text-align: center;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          width: 10%;
        }

        .tr-item:hover { background: #fafbfc; }
        .tr-group-parent { background: #f0f7ff; }
        .tr-group-parent:hover { background: #e8f2fb; }
        .tr-sub { background: #fafafa; }
        .tr-sub:hover { background: #f5f5f5; }

        .uraian-main { font-weight: 600; color: var(--primary); }
        .uraian-hint { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .subtotal-hint { font-size: 11px; color: var(--text-muted); text-align: right; margin-top: 3px; font-family: 'DM Mono', monospace; }

        .expand-btn {
          background: none; border: none; cursor: pointer;
          font-size: 11px; padding: 0; margin-right: 6px;
          color: var(--primary-mid);
        }

        /* ── TOTALS ROW ── */
        .tr-total {
          background: #fffaeb;
          font-weight: 700;
        }
        .tr-total td {
          padding: 10px 12px;
          border-bottom: 2px solid #fde68a;
          border-top: 2px solid #fde68a;
          font-size: 13px;
        }
        .tr-total .td-input { text-align: right; font-family: 'DM Mono', monospace; color: var(--primary); }
        .tr-total .td-pct { color: var(--warning) !important; }

        /* ── KATEGORI TOTAL ── */
        .kat-total {
          background: var(--surface-3);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius);
          padding: 14px 18px;
          margin-top: 12px;
          margin-bottom: 8px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
        }
        .kat-total__label { font-weight: 800; font-size: 13.5px; color: var(--text-primary); }
        .kat-total__values { display: flex; gap: 24px; flex-wrap: wrap; }
        .kat-total__stat { text-align: right; }
        .kat-total__stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .kat-total__stat-val { font-size: 14px; font-weight: 700; font-family: 'DM Mono', monospace; }

        /* ── GRAND TOTAL ── */
        .grand-total {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 2px solid #4ade80;
          border-radius: var(--radius);
          padding: 20px 24px;
          margin-top: 24px; margin-bottom: 24px;
        }
        .grand-total__title { font-size: 15px; font-weight: 800; color: var(--success); margin: 0 0 16px 0; }
        .grand-total__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .grand-total__stat-label { font-size: 11.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .grand-total__stat-val { font-size: 20px; font-weight: 800; font-family: 'DM Mono', monospace; }

        /* ── PASTE ZONE ── */
        .paste-zone {
          background: #fffbf2;
          border: 2px solid #fed7aa;
          border-radius: var(--radius-sm);
          padding: 14px;
          margin-bottom: 12px;
        }
        .paste-zone textarea {
          width: 100%;
          min-height: 120px;
          padding: 10px;
          border: 1.5px solid #fed7aa;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-family: 'DM Mono', monospace;
          margin-bottom: 10px;
          background: #fff;
          color: var(--text-primary);
          resize: vertical;
        }
        .paste-zone textarea:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
        .paste-hint { font-size: 12px; color: var(--text-secondary); margin: 0 0 10px; line-height: 1.6; }

        /* ── FILE UPLOAD CARD ── */
        .file-upload-label {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          background: var(--primary-mid); color: #fff;
          border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .file-upload-label:hover { background: var(--primary); }
        .file-preview {
          margin-top: 12px;
          background: var(--surface-3);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          font-family: 'DM Mono', monospace;
          overflow-x: auto;
          max-height: 150px;
          overflow-y: auto;
          color: var(--text-secondary);
        }

        /* ── MESSAGE ── */
        .message-bar {
          text-align: center;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-weight: 600; font-size: 13.5px;
        }
        .message-bar--success { background: var(--success-light); color: var(--success); border: 1px solid var(--success-border); }
        .message-bar--error { background: var(--danger-light); color: var(--danger); border: 1px solid #fca5a5; }

        /* ── ACTIONS ── */
        .form-actions {
          display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;
          padding-top: 8px;
        }

        /* ── API KEY STATUS ── */
        .api-key-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: #059669; font-weight: 600;
          margin-bottom: 12px;
        }

        /* ── MOBILE CARDS ── */
        .mobile-card {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          margin-bottom: 10px;
          padding: 12px 14px;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }
        .mobile-card--group { padding: 0; overflow: hidden; }
        .mobile-card__header {
          padding: 12px 14px;
          background: var(--primary-light);
          border-bottom: 1px solid var(--primary-border);
        }
        .mobile-card__header--expandable {
          cursor: pointer;
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .mobile-card__body { padding: 12px 14px; background: #fafcff; border-bottom: 1px solid var(--border); }
        .mobile-card__sub { padding: 12px 14px; background: var(--surface); border-top: 1px solid var(--border); }
        .mobile-card__title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .mobile-card__count { font-size: 11px; color: var(--text-muted); font-weight: 400; }
        .mobile-card__sub-title { font-size: 12.5px; color: var(--text-secondary); margin: 4px 0 10px; }
        .expand-icon { font-size: 11px; color: var(--primary-mid); flex-shrink: 0; margin-top: 2px; }

        .kode-badge {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
        }
        .kode-badge--blue { background: var(--primary-light); color: var(--primary); border: 1px solid var(--primary-border); }
        .kode-badge--gray { background: var(--surface-3); color: var(--text-secondary); border: 1px solid var(--border); }

        .field-group { margin-bottom: 8px; }
        .field-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .field-label--blue { font-size: 11px; color: var(--primary); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }

        .pct-badge {
          text-align: right;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          margin-top: 4px;
        }
        .pct-badge--ok { color: var(--success); }
        .pct-badge--over { color: var(--danger); }
        .pct-badge--zero { color: var(--warning); }

        /* ── MOBILE TOTAL ── */
        .mobile-total {
          background: #fffaeb;
          border: 2px solid #fde68a;
          border-radius: var(--radius);
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        .mobile-total__title { font-weight: 700; font-size: 13px; color: var(--warning); margin-bottom: 8px; }
        .mobile-total__grid { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; font-size: 13px; }
        .mobile-total__key { color: var(--text-muted); }
        .mobile-total__val { font-family: 'DM Mono', monospace; font-weight: 600; }

        /* ── SECTION PASTE ── */
        .section-paste-zone {
          background: var(--primary-light);
          border: 2px solid var(--primary-border);
          border-radius: var(--radius-sm);
          padding: 12px;
          margin-bottom: 12px;
        }
        .section-paste-zone textarea {
          width: 100%;
          min-height: 90px;
          padding: 8px 10px;
          border: 1.5px solid var(--primary-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-family: 'DM Mono', monospace;
          margin-bottom: 8px;
          background: #fff;
          resize: vertical;
        }
        .section-paste-zone textarea:focus { outline: none; border-color: var(--primary-mid); box-shadow: 0 0 0 3px rgba(27,108,168,0.1); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .lra-table-desktop { display: none !important; }
          .lra-cards-mobile { display: block !important; }
          .lra-page { padding: 16px 12px 40px; }
          .card { padding: 18px 16px; }
          .grand-total { padding: 16px; }
          .grand-total__stat-val { font-size: 16px; }
        }
        @media (min-width: 769px) {
          .lra-cards-mobile { display: none !important; }
        }
        .lra-cards-mobile { display: none; }
      `}</style>

      <div className="lra-page">
        {/* HEADER */}
        <div className="page-header">
          {/* Decorative background shapes */}
          <div className="page-header__bg-circle page-header__bg-circle--1" />
          <div className="page-header__bg-circle page-header__bg-circle--2" />
          <div className="page-header__bg-circle page-header__bg-circle--3" />

          <div className="page-header__inner">
            {/* Logo Kemendagri dari /public/logokemendagri.png */}
            <div className="page-header__logo-wrap">
              <img
                src="/logokemendagri.png"
                alt="Logo Kementerian Dalam Negeri"
                style={{ width: LOGO_CONFIG.header.width, height: LOGO_CONFIG.header.height, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
              />
            </div>

            {/* Text identity */}
            <div className="page-header__identity">
              <div className="page-header__ministry-name">
                KEMENTERIAN DALAM NEGERI
              </div>
              <div className="page-header__ministry-sub">
                REPUBLIK INDONESIA
              </div>
              <div className="page-header__divider" />
              <div className="page-header__ditjen">
                Direktorat Jenderal Bina Keuangan Daerah
              </div>
            </div>

            {/* Right: document title */}
            <div className="page-header__doc">
              <div className="page-header__doc-label">FORMULIR INPUT</div>
              <h1 className="page-header__title">Laporan Realisasi Anggaran</h1>
              <div className="page-header__doc-abbr">LRA — Pemerintah Daerah</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* AI GROQ PANEL */}
          <div className="card card--ai">
            <div className="card__header">
              <div className="card__icon card__icon--ai">✨</div>
              <div>
                <div className="card__title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  AI Groq — Baca &amp; Isi Otomatis
                  <span className="ai-badge">BETA</span>
                </div>
                <div className="card__desc">Upload file LRA (PDF atau Excel), Groq AI akan membaca dan mengisi form secara otomatis</div>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#5b21b6' }}>🔑 Groq API Key</span>
              <button type="button" onClick={() => setShowApiKeyInput(!showApiKeyInput)} className="btn btn--outline-ai" style={{ padding:'5px 12px', fontSize:12 }}>
                {showApiKeyInput ? '🙈 Sembunyikan' : '⚙️ Atur API Key'}
              </button>
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="ai-link">Dapatkan API Key gratis ↗</a>
            </div>

            {showApiKeyInput && (
              <div style={{ marginBottom:12 }}>
                <input type="password" value={groqApiKey} placeholder="gsk_..." onChange={e => setGroqApiKey(e.target.value)} className="api-key-input" />
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:5 }}>API Key disimpan sementara di browser dan tidak dikirim ke server manapun selain Groq API.</div>
              </div>
            )}
            {groqApiKey && groqApiKey !== 'YOUR_GROQ_API_KEY_HERE' && (
              <div className="api-key-status">✅ API Key tersimpan</div>
            )}

            <input ref={aiFileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={handleAiFileUpload} style={{ display:"none" }} />

            <div className="ai-drop-zone" onClick={() => !isAiProcessing && aiFileInputRef.current?.click()}>
              {!isAiProcessing && !aiResult && (<>
                <div className="ai-drop-zone__icon">🤖</div>
                <div className="ai-drop-zone__title">Klik untuk upload file LRA ke Groq AI</div>
                <div className="ai-drop-zone__desc">AI akan membaca, memahami, dan mengisi form secara otomatis</div>
                <div className="file-chips">
                  {["📄 PDF","📊 Excel (.xlsx)","📋 Excel (.xls)","📝 CSV"].map(t => <span key={t} className="file-chip">{t}</span>)}
                </div>
              </>)}
              {isAiProcessing && (<>
                <div className="ai-drop-zone__icon" style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
                <div className="ai-drop-zone__title">AI sedang menganalisis...</div>
              </>)}
              {aiResult && !isAiProcessing && (<>
                <div className="ai-drop-zone__icon">✅</div>
                <div className="ai-drop-zone__title" style={{ color:'var(--success)' }}>Berhasil! {aiResult.items?.length || 0} item diekstrak</div>
                <div className="ai-drop-zone__desc">Klik untuk upload file baru</div>
              </>)}
            </div>

            {aiProgress && <div className="ai-progress">⚙️ {aiProgress}</div>}
            {aiUploadedFile && !isAiProcessing && (
              <div className="uploaded-file-bar">
                <span className="uploaded-file-bar__name">📁 {aiUploadedFile.name}</span>
                <button onClick={() => { setAiUploadedFile(null); setAiResult(null) }} style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:18, flexShrink:0 }}>×</button>
              </div>
            )}
            {aiResult && (
              <div className="ai-result-box">
                <div className="ai-result-box__title">📊 Hasil Ekstraksi Groq AI</div>
                {aiResult.daerah && <div className="ai-result-row">🏛️ <b>Daerah terdeteksi:</b> {aiResult.daerah}</div>}
                {aiResult.tahunAnggaran && <div className="ai-result-row">📅 <b>Tahun Anggaran:</b> {aiResult.tahunAnggaran}</div>}
                <div className="ai-result-row">✅ <b>Item berhasil diekstrak:</b> {aiResult.items?.length || 0} item</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>✨ Form telah diisi otomatis. Periksa dan sesuaikan jika perlu.</div>
              </div>
            )}

            <div className="ai-steps">
              <div className="ai-steps__title">⚡ Cara Kerja</div>
              <div className="ai-steps__grid">
                {[
                  ["1","Dapatkan Groq API Key gratis dari console.groq.com"],
                  ["2","Masukkan API Key, lalu upload file LRA (PDF/Excel/CSV)"],
                  ["3","Groq AI membaca dokumen dan mengisi form otomatis"],
                  ["4","Periksa hasil, koreksi jika perlu, lalu submit"],
                ].map(([n,t]) => (
                  <div key={n} className="ai-step">
                    <span className="ai-step__num">{n}</span>
                    <span className="ai-step__text">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INFO DAERAH */}
          <div className="card">
            <div className="info-daerah-header">
              <div className="info-daerah-header__logo">
                <img
                  src="/logokemendagri.png"
                  alt="Logo Kemendagri"
                  style={{ width: LOGO_CONFIG.infoDaerah.width, height: LOGO_CONFIG.infoDaerah.height, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
              </div>
              <div className="info-daerah-header__text">
                <div className="info-daerah-header__title">Identitas Daerah Pelapor</div>
                <div className="info-daerah-header__desc">Lengkapi data wilayah, tahun anggaran, dan penanggung jawab laporan LRA</div>
              </div>
              <div className="info-daerah-header__stamp">
                <div className="info-daerah-header__stamp-inner">
                  <div className="info-daerah-header__stamp-line1">WAJIB DIISI</div>
                  <div className="info-daerah-header__stamp-line2">LENGKAP</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:'12.5px', fontWeight:700, marginBottom:8, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                🔍 Cari Kabupaten / Kota
              </label>
              <div className="search-wrap" ref={searchRef}>
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text" value={searchQuery}
                    onChange={handleSearch} onKeyDown={handleSearchKey}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                    placeholder="Ketik nama kabupaten/kota..."
                    autoComplete="off"
                    className="search-input"
                  />
                  {searchQuery && <button type="button" onClick={clearSearch} className="search-clear">×</button>}
                </div>
                {showDropdown && (
                  <div className="search-dropdown">
                    {searchResults.length === 0
                      ? <div className="search-empty">Tidak ditemukan: "{searchQuery}"</div>
                      : searchResults.map((entry, i) => {
                          const isKota = entry.kabkota.startsWith("Kota")
                          const bLabel = entry.kabkota === "" ? "PROV" : isKota ? "KOTA" : "KAB"
                          const bColor = entry.kabkota === "" ? "#1565c0" : isKota ? "#15803d" : "#c2410c"
                          const displayName = entry.kabkota || entry.provinsi
                          return (
                            <div key={i} onClick={() => selectResult(entry)} onMouseEnter={() => setActiveIdx(i)}
                              className={`search-item${i===activeIdx?" search-item--active":""}`}>
                              <span className="region-badge" style={{ background:bColor }}>{bLabel}</span>
                              <div>
                                <div className="search-item__name"><HL text={displayName} q={searchQuery} /></div>
                                {entry.kabkota && <div className="search-item__prov">{entry.provinsi.replace("Prov. ","")}</div>}
                              </div>
                            </div>
                          )
                        })
                    }
                  </div>
                )}
              </div>
              {(formData.kabupatenKota || formData.provinsi === "Prov. DKI Jakarta") && (
                <div className="selected-region">
                  ✅ {formData.kabupatenKota || formData.provinsi}
                  {formData.kabupatenKota && <span style={{ color:'var(--text-muted)', fontWeight:400 }}> — {formData.provinsi.replace("Prov. ","")}</span>}
                </div>
              )}
              <div className="search-hint">💡 Ketik min. 2 huruf untuk mencari. Pilih hasil untuk mengisi Provinsi &amp; Kab/Kota secara otomatis.</div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>🗺️ Provinsi</label>
                <select name="provinsi" value={formData.provinsi} onChange={handleChange}>
                  <option value="">-- Pilih Provinsi --</option>
                  {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>🏛️ Kabupaten/Kota</label>
                <select name="kabupatenKota" value={formData.kabupatenKota} onChange={handleChange}>
                  <option value="">-- Pilih Kabupaten/Kota --</option>
                  {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>📅 Tahun Anggaran</label>
                <select name="tahunAnggaran" value={formData.tahunAnggaran} onChange={handleChange}>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
              <div className="form-field">
                <label>👤 Penanggung Jawab <span style={{ color:'#dc2626' }}>*</span></label>
                <input name="namaPemohon" value={formData.namaPemohon} onChange={handleChange} placeholder="Nama penanggung jawab" required />
              </div>
              <div className="form-field">
                <label>📊 Target Sheet Pengiriman</label>
                <select name="targetSheet" value={formData.targetSheet} onChange={handleChange}>
                  <option>31 Januari 2025</option>
                  <option>10 Januari 2025</option>
                  <option>17 Januari 2025</option>
                  <option>24 Januari 2025</option>
                </select>
              </div>
              <div className="form-field">
                <label>📝 Keterangan (Opsional)</label>
                <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows={2} style={{ resize:'vertical' }} />
              </div>
            </div>
          </div>

          {/* FILE UPLOAD */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon card__icon--green">📁</div>
              <div>
                <div className="card__title">Upload File Excel / CSV (Manual)</div>
                <div className="card__desc">Upload file LRA format Excel (.xlsx, .xls) atau CSV — parsing berdasarkan kode rekening</div>
              </div>
              {uploadedFile && (
                <button type="button" onClick={() => { setUploadedFile(null); setFilePreview("") }} className="btn btn--danger" style={{ marginLeft:'auto', fontSize:12, padding:'6px 12px' }}>
                  🗑️ Hapus
                </button>
              )}
            </div>
            <label className="file-upload-label">
              📂 {uploadedFile ? "✅ File Terupload" : "Pilih File"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display:"none" }} />
            </label>
            {uploadedFile && <span style={{ marginLeft:10, fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>📄 {uploadedFile.name}</span>}
            {isProcessingFile && <div style={{ marginTop:8, fontSize:13, color:'var(--warning)', fontWeight:600 }}>⏳ Memproses...</div>}
            {filePreview && (
              <div>
                <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:12, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>Preview (10 baris pertama):</div>
                <div className="file-preview">{filePreview}</div>
              </div>
            )}
          </div>

          {/* PASTE MODE */}
          <div className="card card--warning">
            <div className="card__header">
              <div className="card__icon card__icon--orange">📋</div>
              <div style={{ flex:1 }}>
                <div className="card__title">Copy-Paste dari Excel</div>
                <div className="card__desc">Tempel data langsung dari spreadsheet atau dokumen teks</div>
              </div>
              <button type="button" onClick={() => setPasteMode(!pasteMode)}
                className={`btn ${pasteMode ? 'btn--danger' : 'btn--orange'}`} style={{ marginLeft:8 }}>
                {pasteMode ? "❌ Tutup" : "📥 Aktifkan Paste"}
              </button>
            </div>
            {pasteMode && (
              <div className="paste-zone">
                <p className="paste-hint">
                  Format: <b>Kode [TAB] Uraian [TAB] Anggaran [TAB] Realisasi</b> — atau — <b>Kode [TAB] Anggaran [TAB] Realisasi</b><br/>
                  <span style={{ color:'var(--success)' }}>✅ Juga mendukung format spasi (dari PDF atau teks biasa)</span>
                </p>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste data dari Excel atau PDF di sini..." />
                <button type="button" onClick={handlePasteData} disabled={!pasteText.trim()}
                  className={`btn btn--success ${!pasteText.trim() ? 'btn--disabled' : ''}`}>
                  ✅ Terapkan Data Paste
                </button>
              </div>
            )}
          </div>

          {/* TABEL LRA */}
          <div style={{ overflowX:"auto" }}>
            {LRA_STRUCTURE.map((kg) => {
              const kt = calcKatTotal(kg.kode)
              const theme = getKategoriTheme(kg.kode)
              const headerClass = kg.kode==="4" ? "kat-header--pendapatan" : kg.kode==="5" ? "kat-header--belanja" : "kat-header--pembiayaan"
              return (
                <div key={kg.kode} style={{ marginBottom:32 }}>
                  <div className={`kat-header ${headerClass}`}>
                    <span>{kg.kode === "4" ? "📈" : kg.kode === "5" ? "📉" : "💼"}</span>
                    <span>{kg.kode}. {kg.kategori}</span>
                  </div>

                  {kg.sections.map((section) => {
                    const st = calcSubTotal(section.kode)
                    const isPaste = activePasteSection === section.kode
                    return (
                      <div key={section.kode} style={{ marginBottom:22 }}>
                        <div className="section-header-row">
                          <div className="section-title">{section.kode}. {section.subKategori}</div>
                          <button type="button" onClick={() => setActivePasteSection(isPaste?null:section.kode)}
                            className={`btn ${isPaste ? 'btn--danger' : 'btn--outline-blue'}`} style={{ fontSize:12, padding:'6px 12px', whiteSpace:'nowrap' }}>
                            {isPaste ? "❌ Tutup" : "📋 Paste Excel"}
                          </button>
                        </div>

                        {isPaste && (
                          <div className="section-paste-zone">
                            <p style={{ fontSize:12, color:'var(--primary)', margin:'0 0 8px', fontWeight:600 }}>
                              ✅ Mendukung TAB dan SPASI sebagai pemisah kolom
                            </p>
                            <textarea
                              value={sectionPasteText[section.kode]||""}
                              onChange={e=>setSectionPasteText(prev=>({...prev,[section.kode]:e.target.value}))}
                              placeholder={`Paste ${section.items.length} baris di sini...`}
                            />
                            <button type="button" onClick={() => handleSectionPaste(section.kode)}
                              disabled={!sectionPasteText[section.kode]?.trim()}
                              className={`btn btn--success ${!sectionPasteText[section.kode]?.trim() ? 'btn--disabled' : ''}`}
                              style={{ fontSize:12 }}>
                              ✅ Terapkan Data
                            </button>
                          </div>
                        )}

                        {/* DESKTOP TABLE */}
                        <table className="lra-table lra-table-desktop">
                          <thead>
                            <tr>
                              <th>Kode Rekening</th>
                              <th>Uraian</th>
                              <th style={{ textAlign:'center' }}>Anggaran (Rp)</th>
                              <th style={{ textAlign:'center' }}>Realisasi (Rp)</th>
                              <th>%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.items.map(item => renderItemRow(item))}
                            <tr className="tr-total">
                              <td className="td-kode"><strong>{section.kode}</strong></td>
                              <td className="td-uraian"><strong>Jumlah {section.subKategori}</strong></td>
                              <td className="td-input" style={{ textAlign:'right', color:'var(--primary)', fontFamily:"'DM Mono', monospace", fontWeight:700 }}>{formatRupiahInput(String(st.a))}</td>
                              <td className="td-input" style={{ textAlign:'right', color:'var(--success)', fontFamily:"'DM Mono', monospace", fontWeight:700 }}>{formatRupiahInput(String(st.r))}</td>
                              <td className="td-pct" style={{ color:'var(--warning)' }}>{st.pct}%</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* MOBILE CARDS */}
                        <div className="lra-cards-mobile">
                          {section.items.map(item => renderItemRowMobile(item))}
                          <div className="mobile-total">
                            <div className="mobile-total__title">Jumlah {section.subKategori}</div>
                            <div className="mobile-total__grid">
                              <span className="mobile-total__key">Anggaran:</span>
                              <span className="mobile-total__val" style={{ color:'var(--primary)' }}>Rp {formatRupiahInput(String(st.a))}</span>
                              <span className="mobile-total__key">Realisasi:</span>
                              <span className="mobile-total__val" style={{ color:'var(--success)' }}>Rp {formatRupiahInput(String(st.r))}</span>
                              <span className="mobile-total__key">Persentase:</span>
                              <span className="mobile-total__val" style={{ color:'var(--warning)' }}>{st.pct}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="kat-total">
                    <div className="kat-total__label">TOTAL {kg.kode}. {kg.kategori}</div>
                    <div className="kat-total__values">
                      <div className="kat-total__stat">
                        <div className="kat-total__stat-label">Anggaran</div>
                        <div className="kat-total__stat-val" style={{ color: theme.accent }}>Rp {formatRupiahInput(String(kt.a))}</div>
                      </div>
                      <div className="kat-total__stat">
                        <div className="kat-total__stat-label">Realisasi</div>
                        <div className="kat-total__stat-val" style={{ color:'var(--success)' }}>Rp {formatRupiahInput(String(kt.r))}</div>
                      </div>
                      <div className="kat-total__stat">
                        <div className="kat-total__stat-label">Persentase</div>
                        <div className="kat-total__stat-val" style={{ color:'#7c3aed' }}>{kt.pct}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* GRAND TOTAL */}
          <div className="grand-total">
            <h3 className="grand-total__title">📊 Ringkasan Total Keseluruhan</h3>
            <div className="grand-total__grid">
              {([
                ["Total Anggaran", formatRupiahInput(String(totals.a)), "var(--primary)"],
                ["Total Realisasi", formatRupiahInput(String(totals.r)), "var(--success)"],
                ["Sisa Anggaran", formatRupiahInput(String(totals.sisa)), "var(--warning)"],
                ["Persentase", totals.pct + "%", "#7c3aed"],
              ] as [string,string,string][]).map(([label,val,color]) => (
                <div key={label}>
                  <div className="grand-total__stat-label">{label}</div>
                  <div className="grand-total__stat-val" style={{ color }}>{label !== "Persentase" ? "Rp " : ""}{val}</div>
                </div>
              ))}
            </div>
          </div>

          {message && (
            <div className={`message-bar ${message.includes("✅") ? "message-bar--success" : "message-bar--error"}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => router.push('/')} className="btn btn--gray btn--large">
              ← Kembali
            </button>
            <button type="submit" disabled={loading} className={`btn btn--success btn--large ${loading ? 'btn--disabled' : ''}`}>
              {loading ? "⏳ Mengirim..." : "💾 Simpan Semua Data"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}