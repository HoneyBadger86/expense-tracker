const express = require('express');
const path = require('path');
const { loadExpenses, saveExpenses } = require('./src/store');
const {
  CATEGORIES,
  createExpense,
  filterExpenses,
  calculateTotal,
  deleteExpense
} = require('./src/expenseService');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const expenses = loadExpenses();
  const filters = {
    category: req.query.category || '',
    dateFrom: req.query.dateFrom || '',
    dateTo: req.query.dateTo || ''
  };
  const filtered = filterExpenses(expenses, filters);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  res.render('index', {
    expenses: sorted,
    total: calculateTotal(filtered),
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

app.post('/expenses/:id/delete', (req, res) => {
  const expenses = loadExpenses();
  saveExpenses(deleteExpense(expenses, req.params.id));
  res.redirect('/');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Expense Tracker running at http://localhost:${PORT}`);
  });
}

module.exports = app;
