const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  ExternalHyperlink, PageBreak
} = require('docx');

const DIR = __dirname;
const VIOLET = '7C3AED';
const LIGHT = 'F3EFFC';
const GREEN_LT = 'DCFCE7';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const CONTENT_W = 9026; // A4 dengan margin 1 inch

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, ...opts })]
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun(text)]
  });
}
function bulletBold(label, rest) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: label, bold: true }), new TextRun(rest)]
  });
}

function img(file, widthPx, heightPx, caption) {
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [new ImageRun({
        type: 'png',
        data: fs.readFileSync(path.join(DIR, file)),
        transformation: { width: widthPx, height: heightPx },
        altText: { title: caption, description: caption, name: file }
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: '666666' })]
    })
  ];
  return out;
}

function headerCell(text, w) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: VIOLET, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })]
  });
}
function cell(text, w, opts = {}) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || false, size: 20 })] })]
  });
}

function testTable(headers, widths, rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((t, i) => headerCell(t, widths[i])) }),
      ...rows.map((r, idx) =>
        new TableRow({
          children: r.map((t, i) =>
            cell(t, widths[i], {
              fill: idx % 2 === 1 ? LIGHT : undefined,
              ...(i === r.length - 1 && t === 'PASS' ? { fill: GREEN_LT, bold: true } : {})
            })
          )
        })
      )
    ]
  });
}

// ===== data test case =====

const unitTests = [
  ['validateExpense', 'Data valid tidak menghasilkan error', 'PASS'],
  ['validateExpense', 'Menolak nominal 0 atau negatif', 'PASS'],
  ['validateExpense', 'Menolak kategori kosong', 'PASS'],
  ['validateExpense', 'Menolak kategori tidak dikenal', 'PASS'],
  ['validateExpense', 'Menolak tanggal kosong', 'PASS'],
  ['createExpense', 'Membuat pengeluaran dengan ID unik', 'PASS'],
  ['createExpense', 'Catatan kosong diisi string kosong', 'PASS'],
  ['createExpense', 'Melempar error saat data tidak valid', 'PASS'],
  ['filterExpenses', 'Filter berdasarkan kategori', 'PASS'],
  ['filterExpenses', 'Filter berdasarkan rentang tanggal', 'PASS'],
  ['filterExpenses', 'Tanpa filter mengembalikan semua data', 'PASS'],
  ['calculateTotal', 'Menjumlahkan seluruh nominal', 'PASS'],
  ['calculateTotal', 'List kosong menghasilkan 0', 'PASS'],
  ['deleteExpense', 'Menghapus data sesuai ID', 'PASS'],
  ['deleteExpense', 'ID string vs number tetap cocok', 'PASS'],
  ['updateExpense', 'Mengubah field dan mempertahankan ID', 'PASS'],
  ['updateExpense', 'Data lain tidak ikut berubah', 'PASS'],
  ['updateExpense', 'Melempar error saat data edit tidak valid', 'PASS'],
  ['summarizeByCategory', 'Menjumlahkan nominal per kategori', 'PASS'],
  ['summarizeByCategory', 'List kosong menghasilkan objek kosong', 'PASS'],
  ['monthlyTotal', 'Hanya menjumlahkan bulan yang diminta', 'PASS'],
  ['monthlyTotal', 'Bulan tanpa data menghasilkan 0', 'PASS'],
  ['budgetStatus', 'Limit belum diatur menghasilkan state none', 'PASS'],
  ['budgetStatus', 'Pemakaian < 80% menghasilkan state ok', 'PASS'],
  ['budgetStatus', 'Pemakaian >= 80% menghasilkan state warn', 'PASS'],
  ['budgetStatus', 'Melebihi limit menghasilkan state over (persen dibatasi 100)', 'PASS'],
  ['validateIncome', 'Data valid tidak menghasilkan error', 'PASS'],
  ['validateIncome', 'Menolak nominal 0 dan tanggal kosong', 'PASS'],
  ['createIncome', 'Membuat pemasukan dengan ID unik', 'PASS'],
  ['createIncome', 'Melempar error saat data tidak valid', 'PASS'],
  ['monthlySeries', 'Total N bulan terakhir berurutan benar', 'PASS'],
  ['monthlySeries', 'Lintas tahun (Des-Jan) dihitung benar', 'PASS'],
  ['toCsv', 'Menghasilkan header dan baris data', 'PASS'],
  ['toCsv', 'Escape koma dan tanda kutip pada catatan', 'PASS'],
  ['buildWorkbook', 'Membuat 3 sheet (Pengeluaran, Pemasukan, Ringkasan)', 'PASS'],
  ['buildWorkbook', 'Sheet pengeluaran berisi header, data, dan total', 'PASS'],
  ['buildWorkbook', 'Sheet ringkasan berisi baris saldo', 'PASS']
];

const systemTests = [
  ['ST-01', 'Menampilkan pesan kosong saat belum ada data', 'PASS'],
  ['ST-02', 'Menambah pengeluaran baru, muncul di daftar dan total ter-update', 'PASS'],
  ['ST-03', 'Menolak input tidak valid dengan pesan error', 'PASS'],
  ['ST-04', 'Filter kategori hanya menampilkan data yang sesuai', 'PASS'],
  ['ST-05', 'Mengedit pengeluaran mengubah data di daftar', 'PASS'],
  ['ST-06', 'Edit dengan data tidak valid menampilkan error, data tidak berubah', 'PASS'],
  ['ST-07', 'Mengatur budget menampilkan progress pemakaian bulan ini', 'PASS'],
  ['ST-08', 'Budget terlampaui menampilkan peringatan', 'PASS'],
  ['ST-09', 'Chart per kategori muncul saat ada data', 'PASS'],
  ['ST-10', 'Menghapus pengeluaran menghilangkan baris dan mengurangi total', 'PASS'],
  ['ST-11', 'Membatalkan konfirmasi hapus mempertahankan data', 'PASS'],
  ['ST-12', 'Menambah pemasukan memperbarui pemasukan dan saldo bulan ini', 'PASS'],
  ['ST-13', 'Menghapus pemasukan mengembalikan saldo', 'PASS'],
  ['ST-14', 'Export CSV mengembalikan data pengeluaran', 'PASS'],
  ['ST-15', 'Export Excel mengembalikan workbook berisi data', 'PASS'],
  ['ST-16', 'Chart tren bulanan tampil', 'PASS']
];

// ===== dokumen =====

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 80 },
    children: [new TextRun({ text: 'LAPORAN SINGKAT TUGAS PROYEK', bold: true, size: 36 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Aplikasi Pencatatan Pengeluaran Harian', size: 28 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: '"Duit Kemana Aja?" (Web + Android)', bold: true, size: 28, color: VIOLET })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: 'Rizki Ansori', bold: true, size: 24 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'Teknik Informatika — Universitas Teknologi Mataram', size: 22 })]
  }),

  h1('1. Deskripsi Masalah'),
  p('Banyak orang kesulitan mengetahui ke mana uangnya pergi setiap bulan. Pencatatan manual di buku atau aplikasi notes tidak memberikan ringkasan, tidak bisa difilter, dan tidak ada peringatan ketika pengeluaran sudah melewati batas wajar. Akibatnya pengeluaran kecil yang berulang (jajan, ojek online, langganan) sering tidak terasa sampai akhirnya total pengeluaran membengkak.'),
  p('Aplikasi ini menyelesaikan masalah tersebut dengan menyediakan pencatatan pengeluaran dan pemasukan harian yang cepat, ringkasan visual (grafik per kategori dan tren 6 bulan), budget bulanan dengan indikator peringatan, serta export laporan ke Excel/CSV. Aplikasi tersedia sebagai web (untuk laptop) dan APK Android (untuk HP).'),

  h1('2. Fitur dan Teknologi'),
  h2('2.1 Fitur Utama'),
  bulletBold('CRUD Pengeluaran: ', 'tambah, lihat, edit (halaman/modal edit), dan hapus dengan dialog konfirmasi.'),
  bulletBold('Pemasukan & Saldo: ', 'pencatatan pemasukan bulanan dan kartu saldo (pemasukan dikurangi pengeluaran bulan berjalan).'),
  bulletBold('Budget Bulanan: ', 'pengguna menetapkan limit; progress bar berubah warna (hijau, kuning saat 80%, merah saat terlampaui) beserta pesan peringatan.'),
  bulletBold('Visualisasi: ', 'doughnut chart pengeluaran per kategori dan bar chart tren 6 bulan terakhir (Chart.js).'),
  bulletBold('Filter: ', 'berdasarkan kategori dan rentang tanggal; semua ringkasan mengikuti filter aktif.'),
  bulletBold('Export: ', 'file Excel (.xlsx) berformat 3 sheet — Pengeluaran, Pemasukan, Ringkasan — dengan header berwarna, format Rupiah, dan baris total; serta CSV.'),
  bulletBold('Versi Android: ', 'APK standalone (data tersimpan di perangkat via localStorage), dibangun dengan Capacitor.'),
  h2('2.2 Teknologi'),
  bullet('Backend web: Node.js + Express, template EJS, penyimpanan file JSON.'),
  bullet('Frontend: HTML/CSS kustom (glassmorphism + gradien), Font Awesome 6, Chart.js 4.'),
  bullet('Export Excel: ExcelJS.'),
  bullet('Mobile: Capacitor 7 (WebView) — build APK debug via Gradle + Android SDK.'),
  bullet('Testing: Jest (unit testing) dan Playwright (system testing).'),

  new Paragraph({ children: [new PageBreak()] }),
  h1('3. Gambar Prototipe / Desain'),
  p('Berikut tampilan aplikasi yang telah diimplementasikan (data contoh).'),
  ...img('02-desktop-stats.png', 620, 436, 'Gambar 1. Dashboard — kartu ringkasan, budget, dan form input (desktop)'),
  ...img('01-desktop-full.png', 400, 828, 'Gambar 2. Halaman utama lengkap: chart kategori, tren 6 bulan, daftar pengeluaran & pemasukan'),
  new Paragraph({ children: [new PageBreak()] }),
  ...img('03-edit-page.png', 620, 436, 'Gambar 3. Halaman edit pengeluaran'),
  ...img('04-error-state.png', 620, 436, 'Gambar 4. Validasi input — pesan error saat data tidak valid'),
  new Paragraph({ children: [new PageBreak()] }),
  ...img('06-mobile-top.png', 260, 563, 'Gambar 5. Tampilan mobile (identik dengan APK Android "Duit Kemana Aja")'),

  new Paragraph({ children: [new PageBreak()] }),
  h1('4. Tabel Test Case dan Hasil Testing'),
  p('Testing dilakukan pada dua tingkat sesuai ketentuan tugas: Unit Testing (Jest) untuk logika bisnis dan System Testing (Playwright) untuk alur aplikasi end-to-end di browser sungguhan. Seluruh 53 test case berstatus PASS.'),
  h2('4.1 Unit Testing — Jest (37 test case)'),
  testTable(
    ['Fungsi', 'Test Case', 'Hasil'],
    [2200, 5726, 1100],
    unitTests
  ),
  new Paragraph({ children: [new PageBreak()] }),
  h2('4.2 System Testing — Playwright (16 test case)'),
  testTable(
    ['Kode', 'Skenario', 'Hasil'],
    [1100, 6826, 1100],
    systemTests
  ),
  h2('4.3 Ringkasan Hasil'),
  testTable(
    ['Jenis Testing', 'Jumlah', 'Lolos', 'Gagal'],
    [3826, 1800, 1700, 1700],
    [
      ['Unit Testing (Jest)', '37', '37', '0'],
      ['System Testing (Playwright)', '16', '16', '0'],
      ['Total', '53', '53', '0']
    ]
  ),

  h1('5. Bug yang Ditemukan Selama Pengembangan dan Perbaikannya'),
  testTable(
    ['Bug', 'Penyebab', 'Perbaikan'],
    [3000, 3013, 3013],
    [
      ['Pesan error validasi server tidak pernah muncul saat input tidak valid',
        'Atribut HTML "required/min" memblokir submit di browser sebelum request sampai ke server',
        'Validasi HTML native dilepas; validasi terpusat di server (tercakup unit test)'],
      ['System test menghapus data asli pengguna',
        'Test menulis ke file data yang sama dengan aplikasi',
        'File data test dipisah lewat environment variable (DATA_FILE, INCOME_FILE, SETTINGS_FILE)'],
      ['Tombol "Simpan" budget menutupi kolom input',
        'Aturan CSS width:100% pada .btn-funky mengalahkan .btn-small karena urutan deklarasi',
        'Spesifisitas selector dinaikkan menjadi .btn-funky.btn-small'],
      ['Build APK gagal: "java.io.IOException: Invalid file path"',
        'Backslash pada path Windows di local.properties/gradle.properties hilang saat dibaca (escaping format Java properties)',
        'Path SDK dan JDK ditulis memakai forward slash (C:/...)']
    ]
  ),

  h1('6. Cara Menjalankan'),
  bulletBold('Web: ', 'npm install lalu npm start — buka http://localhost:3000.'),
  bulletBold('Unit test: ', 'npx jest.'),
  bulletBold('System test: ', 'npx playwright test.'),
  bulletBold('Android: ', 'install file DuitKemanaAja-debug.apk, atau build ulang dengan cd android && gradlew assembleDebug.'),
  bulletBold('Source code: ', 'GitHub repository (tautan disertakan saat pengumpulan).')
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: VIOLET },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(DIR, 'Laporan-ExpenseTracker.docx'), buffer);
  console.log('DOCX generated');
});
