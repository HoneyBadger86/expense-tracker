# Duit Kemana Aja? 💸 — Expense Tracker

Aplikasi pencatatan pengeluaran harian (Web + Android) — tugas proyek perangkat lunak sederhana.

## Fitur

- CRUD pengeluaran (tambah, lihat, edit, hapus dengan konfirmasi)
- Pemasukan & saldo bulan berjalan
- Budget bulanan dengan progress bar dan peringatan (80% / terlampaui)
- Doughnut chart per kategori + bar chart tren 6 bulan (Chart.js)
- Filter kategori & rentang tanggal
- Export Excel berformat (3 sheet, header berwarna, format Rupiah) dan CSV
- Versi Android (APK) via Capacitor — data tersimpan di perangkat

## Teknologi

| Bagian | Stack |
|--------|-------|
| Backend web | Node.js + Express + EJS, penyimpanan file JSON |
| Frontend | HTML/CSS kustom, Font Awesome 6, Chart.js 4 |
| Export | ExcelJS |
| Mobile | Capacitor 7 + Android SDK |
| Testing | Jest (37 unit test) + Playwright (16 system test) |

## Cara Menjalankan

```bash
npm install
npm start          # web di http://localhost:3000
npx jest           # unit testing
npx playwright test  # system testing
```

### Build APK Android

```bash
npx cap sync android
cd android
gradlew assembleDebug
# hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

> Catatan Windows: path di `android/local.properties` (sdk.dir) dan
> `android/gradle.properties` (org.gradle.java.home) harus memakai forward slash.

## Struktur Project

```
server.js          → Express app (routes)
src/               → logika bisnis (expenseService), storage, export Excel
views/             → template EJS (index, edit)
public/            → stylesheet
mobile/www/        → versi mobile standalone (localStorage) untuk APK
android/           → project Capacitor Android
tests/             → unit test (Jest) & system test (Playwright)
laporan/           → laporan tugas (DOCX/PDF) + screenshot
```

## Hasil Testing

53/53 test case PASS (37 unit + 16 system). Detail lengkap di
[laporan/Laporan-ExpenseTracker.pdf](laporan/Laporan-ExpenseTracker.pdf).
