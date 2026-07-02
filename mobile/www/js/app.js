const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Lainnya'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const CHIP = {
  Makanan: { icon: 'fa-burger', color: 'chip-orange' },
  Transportasi: { icon: 'fa-car', color: 'chip-blue' },
  Belanja: { icon: 'fa-bag-shopping', color: 'chip-pink' },
  Tagihan: { icon: 'fa-file-invoice', color: 'chip-slate' },
  Hiburan: { icon: 'fa-gamepad', color: 'chip-green' },
  Lainnya: { icon: 'fa-box', color: 'chip-yellow' }
};
const PALETTE = {
  Makanan: '#f97316',
  Transportasi: '#3b82f6',
  Belanja: '#ec4899',
  Tagihan: '#64748b',
  Hiburan: '#22c55e',
  Lainnya: '#eab308'
};

// ---------- storage ----------

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let expenses = load('expenses', []);
let incomes = load('incomes', []);
let settings = load('settings', { monthlyBudget: 0 });
let filters = { category: '', dateFrom: '', dateTo: '' };

// ---------- logic (porting dari src/expenseService.js) ----------

function validateExpense(data) {
  const errors = [];
  const amount = Number(data.amount);
  if (!data.amount || Number.isNaN(amount) || amount <= 0) {
    errors.push('Nominal harus lebih besar dari 0');
  }
  if (!data.category || !CATEGORIES.includes(data.category)) {
    errors.push('Kategori harus dipilih');
  }
  if (!data.date) {
    errors.push('Tanggal harus diisi');
  }
  return errors;
}

function validateIncome(data) {
  const errors = [];
  const amount = Number(data.amount);
  if (!data.amount || Number.isNaN(amount) || amount <= 0) {
    errors.push('Nominal harus lebih besar dari 0');
  }
  if (!data.date) {
    errors.push('Tanggal harus diisi');
  }
  return errors;
}

function filterExpenses(list, f) {
  return list.filter((e) => {
    if (f.category && e.category !== f.category) return false;
    if (f.dateFrom && e.date < f.dateFrom) return false;
    if (f.dateTo && e.date > f.dateTo) return false;
    return true;
  });
}

function calculateTotal(list) {
  return list.reduce((sum, e) => sum + e.amount, 0);
}

function summarizeByCategory(list) {
  const summary = {};
  for (const e of list) {
    summary[e.category] = (summary[e.category] || 0) + e.amount;
  }
  return summary;
}

function monthlyTotal(list, yearMonth) {
  return calculateTotal(list.filter((e) => e.date && e.date.startsWith(yearMonth)));
}

function monthlySeries(list, months) {
  const now = new Date();
  const series = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    series.push({ month: ym, total: monthlyTotal(list, ym) });
  }
  return series;
}

function budgetStatus(spent, limit) {
  if (!limit || limit <= 0) return { percent: 0, state: 'none' };
  const percent = Math.min(Math.round((spent / limit) * 100), 100);
  if (spent > limit) return { percent, state: 'over' };
  if (spent >= limit * 0.8) return { percent, state: 'warn' };
  return { percent, state: 'ok' };
}

// ---------- helpers ----------

function rupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function el(id) {
  return document.getElementById(id);
}

function showError(message) {
  const box = el('error-box');
  box.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + message;
  box.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    box.style.display = 'none';
  }, 4000);
}

function fillCategorySelect(select, emptyLabel) {
  select.innerHTML = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = emptyLabel;
  select.appendChild(first);
  for (const cat of CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  }
}

// ---------- render ----------

let categoryChart = null;
let trendChart = null;

function render() {
  const filtered = filterExpenses(expenses, filters);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const sortedIncomes = [...incomes].sort((a, b) => b.date.localeCompare(a.date));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const spent = monthlyTotal(expenses, currentMonth);
  const incomeMonth = monthlyTotal(incomes, currentMonth);
  const balance = incomeMonth - spent;

  el('total-amount').textContent = rupiah(calculateTotal(filtered));
  el('income-total').textContent = rupiah(incomeMonth);
  const balanceEl = el('balance-amount');
  balanceEl.textContent = rupiah(balance);
  balanceEl.className = 'stat-value ' + (balance < 0 ? 'stat-negative' : 'stat-income');

  renderBudget(spent);
  renderExpenseTable(sorted);
  renderIncomeTable(sortedIncomes);
  renderCharts(filtered);
}

function renderBudget(spent) {
  const limit = settings.monthlyBudget || 0;
  const status = budgetStatus(spent, limit);
  const track = el('budget-track');
  const note = el('budget-note');

  if (limit > 0) {
    el('budget-text').textContent = rupiah(spent) + ' / ' + rupiah(limit);
    track.style.display = 'block';
    const fill = el('budget-progress');
    fill.className = 'progress-fill progress-' + status.state;
    fill.style.width = status.percent + '%';
    el('budget-input').value = limit;

    if (status.state === 'over') {
      note.textContent = 'Budget bulan ini sudah terlampaui!';
      note.className = 'budget-note budget-note-over';
      note.style.display = 'block';
    } else if (status.state === 'warn') {
      note.textContent = 'Hati-hati, budget hampir habis.';
      note.className = 'budget-note budget-note-warn';
      note.style.display = 'block';
    } else {
      note.style.display = 'none';
    }
  } else {
    el('budget-text').textContent = 'Belum diatur';
    track.style.display = 'none';
    note.style.display = 'none';
  }
}

function renderExpenseTable(list) {
  const tbody = el('expense-tbody');
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">Belum ada cerita pengeluaran di sini</td></tr>';
    return;
  }

  for (const exp of list) {
    const c = CHIP[exp.category] || { icon: 'fa-money-bill', color: 'chip-slate' };
    const tr = document.createElement('tr');
    tr.className = 'expense-row';

    const noteTd = document.createElement('td');
    noteTd.textContent = exp.note;

    tr.innerHTML =
      '<td>' + exp.date + '</td>' +
      '<td><span class="chip ' + c.color + '"><i class="fa-solid ' + c.icon + '"></i> ' + exp.category + '</span></td>' +
      '<td class="amount">' + rupiah(exp.amount) + '</td>';
    tr.appendChild(noteTd);

    const actionTd = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon btn-icon-edit';
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.addEventListener('click', () => openEditModal(exp.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.addEventListener('click', () => {
      if (confirm('Hapus pengeluaran ini?')) {
        expenses = expenses.filter((e) => e.id !== exp.id);
        save('expenses', expenses);
        render();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    actionTd.appendChild(actions);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  }
}

function renderIncomeTable(list) {
  const tbody = el('income-tbody');
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Belum ada pemasukan tercatat</td></tr>';
    return;
  }

  for (const inc of list) {
    const tr = document.createElement('tr');
    tr.className = 'expense-row';

    const noteTd = document.createElement('td');
    noteTd.textContent = inc.note;

    tr.innerHTML =
      '<td>' + inc.date + '</td>' +
      '<td class="amount amount-in">' + rupiah(inc.amount) + '</td>';
    tr.appendChild(noteTd);

    const actionTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.addEventListener('click', () => {
      if (confirm('Hapus pemasukan ini?')) {
        incomes = incomes.filter((i) => i.id !== inc.id);
        save('incomes', incomes);
        render();
      }
    });
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  }
}

function renderCharts(filtered) {
  const summary = summarizeByCategory(filtered);
  const hasData = Object.keys(summary).length > 0;

  el('chart-empty').style.display = hasData ? 'none' : 'block';
  el('category-chart-box').style.display = hasData ? 'block' : 'none';

  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }
  if (hasData) {
    const labels = Object.keys(summary);
    categoryChart = new Chart(el('categoryChart'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: labels.map((l) => summary[l]),
          backgroundColor: labels.map((l) => PALETTE[l] || '#a78bfa'),
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { family: 'Inter' }, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.label + ': ' + rupiah(ctx.parsed)
            }
          }
        }
      }
    });
  }

  const trend = monthlySeries(expenses, 6);
  if (trendChart) {
    trendChart.destroy();
  }
  trendChart = new Chart(el('trendChart'), {
    type: 'bar',
    data: {
      labels: trend.map((t) => {
        const parts = t.month.split('-');
        return MONTH_NAMES[Number(parts[1]) - 1] + ' ' + parts[0];
      }),
      datasets: [{
        data: trend.map((t) => t.total),
        backgroundColor: 'rgba(124, 58, 237, 0.7)',
        borderRadius: 8
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => rupiah(ctx.parsed.y)
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) =>
              value >= 1000000 ? value / 1000000 + 'jt' : value >= 1000 ? value / 1000 + 'rb' : value
          }
        }
      }
    }
  });
}

// ---------- edit modal ----------

function openEditModal(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;
  el('e-id').value = exp.id;
  el('e-amount').value = exp.amount;
  el('e-category').value = exp.category;
  el('e-date').value = exp.date;
  el('e-note').value = exp.note;
  el('edit-modal').classList.add('open');
}

function closeEditModal() {
  el('edit-modal').classList.remove('open');
}

// ---------- form handlers ----------

el('expense-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = {
    amount: el('amount').value,
    category: el('category').value,
    date: el('date').value,
    note: el('note').value
  };
  const errors = validateExpense(data);
  if (errors.length > 0) {
    showError(errors.join(', '));
    return;
  }
  expenses.push({
    id: Date.now(),
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
    note: data.note || ''
  });
  save('expenses', expenses);
  event.target.reset();
  render();
});

el('income-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = {
    amount: el('i-amount').value,
    date: el('i-date').value,
    note: el('i-note').value
  };
  const errors = validateIncome(data);
  if (errors.length > 0) {
    showError(errors.join(', '));
    return;
  }
  incomes.push({
    id: Date.now(),
    amount: Number(data.amount),
    date: data.date,
    note: data.note || ''
  });
  save('incomes', incomes);
  event.target.reset();
  render();
});

el('filter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  filters = {
    category: el('filter-category').value,
    dateFrom: el('dateFrom').value,
    dateTo: el('dateTo').value
  };
  render();
});

el('budget-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const limit = Number(el('budget-input').value);
  if (Number.isNaN(limit) || limit < 0) {
    showError('Budget harus berupa angka positif');
    return;
  }
  settings.monthlyBudget = limit;
  save('settings', settings);
  render();
});

el('edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = Number(el('e-id').value);
  const data = {
    amount: el('e-amount').value,
    category: el('e-category').value,
    date: el('e-date').value,
    note: el('e-note').value
  };
  const errors = validateExpense(data);
  if (errors.length > 0) {
    showError(errors.join(', '));
    return;
  }
  expenses = expenses.map((e) =>
    e.id === id
      ? { ...e, amount: Number(data.amount), category: data.category, date: data.date, note: data.note || '' }
      : e
  );
  save('expenses', expenses);
  closeEditModal();
  render();
});

el('edit-cancel').addEventListener('click', closeEditModal);
el('edit-modal').addEventListener('click', (event) => {
  if (event.target === el('edit-modal')) closeEditModal();
});

// ---------- init ----------

fillCategorySelect(el('category'), '-- Pilih Kategori --');
fillCategorySelect(el('e-category'), '-- Pilih Kategori --');
fillCategorySelect(el('filter-category'), 'Semua Kategori');
render();
