const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'expenses.test.json');
const INCOME_FILE = path.join(__dirname, '..', 'data', 'incomes.test.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.test.json');

test.beforeEach(async () => {
  fs.writeFileSync(DATA_FILE, '[]');
  fs.writeFileSync(INCOME_FILE, '[]');
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ monthlyBudget: 0 }));
});

test('menampilkan pesan kosong saat belum ada data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('empty-row')).toContainText('Belum ada cerita pengeluaran', { ignoreCase: true });
  await expect(page.getByTestId('total-amount')).toContainText('Rp 0');
});

test('menambah pengeluaran baru dan muncul di daftar dengan total terupdate', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '50000');
  await page.selectOption('#category', 'Makanan');
  await page.fill('#date', '2026-07-01');
  await page.fill('#note', 'Makan siang');
  await page.getByTestId('submit-add').click();

  const row = page.getByTestId('expense-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Makanan', { ignoreCase: true });
  await expect(row).toContainText('Makan siang', { ignoreCase: true });
  await expect(page.getByTestId('total-amount')).toContainText('Rp 50.000');
});

test('menolak input tidak valid dengan pesan error', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '0');
  await page.fill('#date', '2026-07-01');
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('error-message')).toBeVisible();
});

test('filter kategori hanya menampilkan data yang sesuai', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '20000');
  await page.selectOption('#category', 'Transportasi');
  await page.fill('#date', '2026-07-02');
  await page.getByTestId('submit-add').click();

  await page.fill('#amount', '15000');
  await page.selectOption('#category', 'Hiburan');
  await page.fill('#date', '2026-07-03');
  await page.getByTestId('submit-add').click();

  await page.selectOption('#filter-category', 'Transportasi');
  await page.getByTestId('submit-filter').click();

  const rows = page.getByTestId('expense-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Transportasi', { ignoreCase: true });
});

test('mengedit pengeluaran mengubah data di daftar', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '10000');
  await page.selectOption('#category', 'Makanan');
  await page.fill('#date', '2026-07-01');
  await page.fill('#note', 'Sarapan');
  await page.getByTestId('submit-add').click();

  await page.getByTestId('edit-btn').click();
  await expect(page).toHaveURL(/\/edit$/);

  await page.fill('#amount', '35000');
  await page.selectOption('#category', 'Hiburan');
  await page.fill('#note', 'Nonton film');
  await page.getByTestId('submit-update').click();

  const row = page.getByTestId('expense-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Hiburan', { ignoreCase: true });
  await expect(row).toContainText('Nonton film', { ignoreCase: true });
  await expect(page.getByTestId('total-amount')).toContainText('Rp 35.000');
});

test('edit dengan data tidak valid menampilkan error dan tidak mengubah data', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '10000');
  await page.selectOption('#category', 'Makanan');
  await page.fill('#date', '2026-07-01');
  await page.getByTestId('submit-add').click();

  await page.getByTestId('edit-btn').click();
  await page.fill('#amount', '0');
  await page.getByTestId('submit-update').click();

  await expect(page.getByTestId('error-message')).toBeVisible();

  await page.goto('/');
  await expect(page.getByTestId('total-amount')).toContainText('Rp 10.000');
});

test('mengatur budget menampilkan progress pemakaian bulan ini', async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto('/');

  await page.fill('input[name="monthlyBudget"]', '100000');
  await page.getByTestId('submit-budget').click();

  await expect(page.getByTestId('budget-text')).toContainText('Rp 0 / Rp 100.000');

  await page.fill('#amount', '50000');
  await page.selectOption('#category', 'Makanan');
  await page.fill('#date', today);
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('budget-text')).toContainText('Rp 50.000 / Rp 100.000');
  await expect(page.getByTestId('budget-progress')).toHaveAttribute('style', /width:\s*50%/);
});

test('budget terlampaui menampilkan peringatan', async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto('/');

  await page.fill('input[name="monthlyBudget"]', '40000');
  await page.getByTestId('submit-budget').click();

  await page.fill('#amount', '60000');
  await page.selectOption('#category', 'Belanja');
  await page.fill('#date', today);
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('budget-note')).toContainText('terlampaui', { ignoreCase: true });
});

test('chart per kategori muncul saat ada data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('chart-empty')).toBeVisible();

  await page.fill('#amount', '25000');
  await page.selectOption('#category', 'Transportasi');
  await page.fill('#date', '2026-07-01');
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('category-chart')).toBeVisible();
});

test('menghapus pengeluaran menghilangkan baris dan mengurangi total', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '30000');
  await page.selectOption('#category', 'Belanja');
  await page.fill('#date', '2026-07-04');
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('expense-row')).toHaveCount(1);

  page.on('dialog', (dialog) => dialog.accept());
  await page.getByTestId('delete-btn').click();

  await expect(page.getByTestId('empty-row')).toBeVisible();
  await expect(page.getByTestId('total-amount')).toContainText('Rp 0');
});

test('membatalkan konfirmasi hapus mempertahankan data', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '30000');
  await page.selectOption('#category', 'Belanja');
  await page.fill('#date', '2026-07-04');
  await page.getByTestId('submit-add').click();

  page.on('dialog', (dialog) => dialog.dismiss());
  await page.getByTestId('delete-btn').click();

  await expect(page.getByTestId('expense-row')).toHaveCount(1);
  await expect(page.getByTestId('total-amount')).toContainText('Rp 30.000');
});

test('menambah pemasukan memperbarui pemasukan dan saldo bulan ini', async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto('/');

  await page.fill('#i-amount', '100000');
  await page.fill('#i-date', today);
  await page.fill('#i-note', 'Gaji');
  await page.getByTestId('submit-income').click();

  await expect(page.getByTestId('income-total')).toContainText('Rp 100.000');
  await expect(page.getByTestId('balance-amount')).toContainText('Rp 100.000');
  await expect(page.getByTestId('income-row')).toHaveCount(1);

  await page.fill('#amount', '30000');
  await page.selectOption('#category', 'Makanan');
  await page.fill('#date', today);
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('balance-amount')).toContainText('Rp 70.000');
});

test('menghapus pemasukan mengembalikan saldo', async ({ page }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto('/');

  await page.fill('#i-amount', '50000');
  await page.fill('#i-date', today);
  await page.getByTestId('submit-income').click();

  await expect(page.getByTestId('income-row')).toHaveCount(1);

  page.on('dialog', (dialog) => dialog.accept());
  await page.getByTestId('income-delete-btn').click();

  await expect(page.getByTestId('income-empty-row')).toBeVisible();
  await expect(page.getByTestId('income-total')).toContainText('Rp 0');
});

test('export CSV mengembalikan data pengeluaran', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '15000');
  await page.selectOption('#category', 'Transportasi');
  await page.fill('#date', '2026-07-03');
  await page.fill('#note', 'Ojek pagi');
  await page.getByTestId('submit-add').click();

  const response = await page.request.get('/export/csv');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/csv');
  const body = await response.text();
  expect(body).toContain('Tanggal,Kategori,Nominal,Catatan');
  expect(body).toContain('2026-07-03,Transportasi,15000,Ojek pagi');
});

test('export Excel mengembalikan workbook berisi data', async ({ page }) => {
  const ExcelJS = require('exceljs');

  await page.goto('/');
  await page.fill('#amount', '15000');
  await page.selectOption('#category', 'Transportasi');
  await page.fill('#date', '2026-07-03');
  await page.fill('#note', 'Ojek pagi');
  await page.getByTestId('submit-add').click();

  const response = await page.request.get('/export/xlsx');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('spreadsheetml');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.body());
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Pengeluaran', 'Pemasukan', 'Ringkasan']);

  const sheet = workbook.getWorksheet('Pengeluaran');
  expect(sheet.getCell('A2').value).toBe('2026-07-03');
  expect(sheet.getCell('C2').value).toBe(15000);
});

test('chart tren bulanan tampil', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('trend-chart')).toBeVisible();
});
