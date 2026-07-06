/*
 * Seed data demo untuk presentasi.
 * Mengisi pengeluaran + pemasukan tersebar 6 bulan terakhir, dengan
 * pemasukan selalu lebih besar dari pengeluaran (saldo positif),
 * lalu menyetel budget. Jalankan: npm run seed
 *
 * PERINGATAN: ini MENIMPA data yang ada.
 */
const { saveExpenses, saveIncomes, saveSettings } = require('../src/store');

// bobot kemunculan: kategori kecil (makan/transport) lebih sering,
// tagihan besar jarang — biar realistis dan daftarnya padat.
const PROFILE = {
  Makanan:      { weight: 35, min: 15000,  max: 75000,  notes: ['Makan siang', 'Sarapan', 'Ngopi', 'Jajan sore', 'Makan malam', 'Gofood', 'Cemilan', 'Nasi padang'] },
  Transportasi: { weight: 25, min: 10000,  max: 55000,  notes: ['Ojek online', 'Bensin', 'Parkir', 'Grab', 'Tiket bus', 'Isi e-toll'] },
  Belanja:      { weight: 12, min: 50000,  max: 350000, notes: ['Belanja bulanan', 'Baju', 'Skincare', 'Alat tulis', 'Sabun & sampo', 'Sepatu'] },
  Hiburan:      { weight: 12, min: 25000,  max: 180000, notes: ['Nonton bioskop', 'Game', 'Nongkrong', 'Karaoke', 'Langganan Spotify'] },
  Lainnya:      { weight: 10, min: 20000,  max: 150000, notes: ['Kado teman', 'Obat', 'Fotokopi', 'Donasi', 'Biaya tak terduga'] },
  Tagihan:      { weight: 6,  min: 100000, max: 600000, notes: ['Internet', 'Listrik', 'Air', 'Pulsa', 'Langganan Netflix'] }
};

const SALARY = 5000000;          // gaji tetap tiap bulan
const MONTHS_BACK = 6;

// bikin daftar kategori berbobot untuk pemilihan acak
const WEIGHTED = [];
for (const [cat, p] of Object.entries(PROFILE)) {
  for (let i = 0; i < p.weight; i++) WEIGHTED.push(cat);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ymd(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const now = new Date();
let idCounter = Date.now();
const nextId = () => idCounter++;

const expenses = [];
const incomes = [];

for (let back = MONTHS_BACK - 1; back >= 0; back--) {
  const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const isCurrent = back === 0;
  const maxDay = isCurrent ? now.getDate() : 28; // bulan berjalan tidak masuk masa depan

  // target belanja sebulan SELALU di bawah gaji 5jt -> saldo positif
  const target = isCurrent ? randInt(1500000, 2200000) : randInt(2800000, 3800000);

  let monthTotal = 0;
  let guard = 0;
  while (monthTotal < target && guard < 500) {
    guard++;
    const category = pick(WEIGHTED);
    const p = PROFILE[category];
    const amount = Math.round(randInt(p.min, p.max) / 500) * 500;
    if (monthTotal + amount > target * 1.05) continue; // jangan kelewat jauh dari target
    expenses.push({
      id: nextId(),
      amount,
      category,
      date: ymd(year, month, randInt(1, maxDay)),
      note: pick(p.notes)
    });
    monthTotal += amount;
  }

  // gaji tetap awal bulan + sesekali bonus
  incomes.push({ id: nextId(), amount: SALARY, date: ymd(year, month, 1), note: 'Gaji bulanan' });
  if (Math.random() < 0.35) {
    incomes.push({
      id: nextId(),
      amount: randInt(200000, 800000),
      date: ymd(year, month, randInt(2, maxDay)),
      note: pick(['Bonus proyek', 'THR', 'Uang tambahan', 'Freelance'])
    });
  }
}

saveExpenses(expenses);
saveIncomes(incomes);
saveSettings({ monthlyBudget: 4000000 });

const cur = now.toISOString().slice(0, 7);
const curExp = expenses.filter((e) => e.date.startsWith(cur)).reduce((s, e) => s + e.amount, 0);
const curInc = incomes.filter((i) => i.date.startsWith(cur)).reduce((s, i) => s + i.amount, 0);

console.log(`OK. ${expenses.length} pengeluaran + ${incomes.length} pemasukan dibuat (6 bulan).`);
console.log(`Bulan ini  -> pemasukan Rp ${curInc.toLocaleString('id-ID')}, pengeluaran Rp ${curExp.toLocaleString('id-ID')}, saldo Rp ${(curInc - curExp).toLocaleString('id-ID')}`);
console.log('Budget: Rp 4.000.000. Refresh browser untuk melihat hasilnya.');
