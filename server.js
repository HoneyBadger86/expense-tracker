const express = require('express');
const path = require('path');
const { loadExpenses, saveExpenses, loadSettings, saveSettings } = require('./src/store');
const {
  CATEGORIES,
  createExpense,
  filterExpenses,
  calculateTotal,
  deleteExpense,
  updateExpense,
  summarizeByCategory,
  monthlyTotal,
  budgetStatus
} = require('./src/expenseService');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const expenses = loadExpenses();
  const settings = loadSettings();
  const filters = {
    category: req.query.category || '',
    dateFrom: req.query.dateFrom || '',
    dateTo: req.query.dateTo || ''
  };
  const filtered = filterExpenses(expenses, filters);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const spentThisMonth = monthlyTotal(expenses, currentMonth);
  const budget = {
    limit: settings.monthlyBudget || 0,
    spent: spentThisMonth,
    ...budgetStatus(spentThisMonth, settings.monthlyBudget)
  };

  res.render('index', {
    expenses: sorted,
    total: calculateTotal(filtered),
    categorySummary: summarizeByCategory(filtered),
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
