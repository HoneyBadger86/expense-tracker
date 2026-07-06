/*
 * Hapus semua data (pengeluaran, pemasukan, budget).
 * Jalankan: node scripts/clear.js
 * Berguna untuk mereset aplikasi ke kondisi bersih sebelum/sesudah demo.
 */
const { saveExpenses, saveIncomes, saveSettings } = require('../src/store');

saveExpenses([]);
saveIncomes([]);
saveSettings({ monthlyBudget: 0 });

console.log('OK. Semua data pengeluaran, pemasukan, dan budget sudah dikosongkan.');
console.log('Refresh browser di http://localhost:3000 untuk melihat kondisi bersih.');
