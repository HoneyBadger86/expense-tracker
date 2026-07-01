const CATEGORIES = ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Lainnya'];

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

function createExpense(data, idGenerator = () => Date.now()) {
  const errors = validateExpense(data);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  return {
    id: idGenerator(),
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
    note: data.note || ''
  };
}

function filterExpenses(expenses, filters = {}) {
  return expenses.filter((expense) => {
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    if (filters.dateFrom && expense.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && expense.date > filters.dateTo) {
      return false;
    }
    return true;
  });
}

function calculateTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function deleteExpense(expenses, id) {
  return expenses.filter((expense) => String(expense.id) !== String(id));
}

module.exports = {
  CATEGORIES,
  validateExpense,
  createExpense,
  filterExpenses,
  calculateTotal,
  deleteExpense
};
