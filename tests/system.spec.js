const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'expenses.json');

test.beforeEach(async () => {
  fs.writeFileSync(DATA_FILE, '[]');
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

test('menghapus pengeluaran menghilangkan baris dan mengurangi total', async ({ page }) => {
  await page.goto('/');

  await page.fill('#amount', '30000');
  await page.selectOption('#category', 'Belanja');
  await page.fill('#date', '2026-07-04');
  await page.getByTestId('submit-add').click();

  await expect(page.getByTestId('expense-row')).toHaveCount(1);

  await page.getByTestId('delete-btn').click();

  await expect(page.getByTestId('empty-row')).toBeVisible();
  await expect(page.getByTestId('total-amount')).toContainText('Rp 0');
});
