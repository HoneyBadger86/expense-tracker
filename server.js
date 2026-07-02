const express = require('express');
const path = require('path');
const {
  loadExpenses,
  saveExpenses,
  loadIncomes,
  saveIncomes,
  loadSettings,
  saveSettings
} = require('./src/store');
const { buildWorkbook } = require('./src/excelExport');
const {
  CATEGORIES,
  createExpense,
  filterExpenses,
  calculateTotal,
  deleteExpense,
  updateExpense,
  summarizeByCategory,
  monthlyTotal,
  budgetStatus,
  createIncome,
  monthlySeries,
  toCsv
} = require('./src/expenseService');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function parseFilters(query) {
  return {
    category: query.category || '',
    dateFrom: query.dateFrom || '',
    dateTo: query.dateTo || ''
  };
}

app.get('/', (req, res) => {
  const expenses = loadExpenses();
  const incomes = loadIncomes();
  const settings = loadSettings();
  const filters = parseFilters(req.query);
  const filtered = filterExpenses(expenses, filters);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const sortedIncomes = [...incomes].sort((a, b) => b.date.localeCompare(a.date));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const spentThisMonth = monthlyTotal(expenses, currentMonth);
  const incomeThisMonth = monthlyTotal(incomes, currentMonth);
  const budget = {
    limit: settings.monthlyBudget || 0,
    spent: spentThisMonth,
    ...budgetStatus(spentThisMonth, settings.monthlyBudget)
  };

  res.render('index', {
    expenses: sorted,
    incomes: sortedIncomes,
    total: calculateTotal(filtered),
    incomeThisMonth,
    balance: incomeThisMonth - spentThisMonth,
    categorySummary: summarizeByCategory(filtered),
    trend: monthlySeries(expenses, 6),
    budget,
    categories: CATEGORIES,
    filters,
    error: req.query.error || null
  });
});

app.post('/expenses', (req, res) => {
  try {
    const expenses = loadExpenses();
    const expense = createExpense(req.body);
    expenses.push(expense);
    saveExpenses(expenses);
    res.redirect('/');
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

app.get('/expenses/:id/edit', (req, res) => {
  const expenses = loadExpenses();
  const expense = expenses.find((exp) => String(exp.id) === String(req.params.id));
  if (!expense) {
    return res.redirect('/?error=' + encodeURIComponent('Data tidak ditemukan'));
  }
  res.render('edit', {
    expense,
    categories: CATEGORIES,
    error: req.query.error || null
  });
});

app.post('/expenses/:id/update', (req, res) => {
  try {
    const expenses = loadExpenses();
    saveExpenses(updateExpense(expenses, req.params.id, req.body));
    res.redirect('/');
  } catch (err) {
    res.redirect(`/expenses/${req.params.id}/edit?error=` + encodeURIComponent(err.message));
  }
});

app.post('/expenses/:id/delete', (req, res) => {
  const expenses = loadExpenses();
  saveExpenses(deleteExpense(expenses, req.params.id));
  res.redirect('/');
});

app.post('/incomes', (req, res) => {
  try {
    const incomes = loadIncomes();
    const income = createIncome(req.body);
    incomes.push(income);
    saveIncomes(incomes);
    res.redirect('/');
  } catch (err) {
    res.redirect('/?error=' + encodeURIComponent(err.message));
  }
});

app.post('/incomes/:id/delete', (req, res) => {
  const incomes = loadIncomes();
  saveIncomes(deleteExpense(incomes, req.params.id));
  res.redirect('/');
});

app.get('/export/csv', (req, res) => {
  const expenses = loadExpenses();
  const filtered = filterExpenses(expenses, parseFilters(req.query));
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="pengeluaran.csv"');
  // String literal berisi karakter BOM (U+FEFF) agar Excel membaca UTF-8 dengan benar
  const excelBom = '﻿';
  res.send(excelBom + toCsv(sorted));
});

app.get('/export/xlsx', async (req, res) => {
  const expenses = loadExpenses();
  const filtered = filterExpenses(expenses, parseFilters(req.query));
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const incomes = [...loadIncomes()].sort((a, b) => b.date.localeCompare(a.date));

  const workbook = await buildWorkbook({
    expenses: sorted,
    incomes,
    categorySummary: summarizeByCategory(sorted)
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="expense-tracker.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

app.post('/budget', (req, res) => {
  const limit = Number(req.body.monthlyBudget);
  if (Number.isNaN(limit) || limit < 0) {
    return res.redirect('/?error=' + encodeURIComponent('Budget harus berupa angka positif'));
  }
  const settings = loadSettings();
  settings.monthlyBudget = limit;
  saveSettings(settings);
  res.redirect('/');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Expense Tracker running at http://localhost:${PORT}`);
  });
}

module.exports = app;
