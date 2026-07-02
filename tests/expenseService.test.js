const {
  validateExpense,
  createExpense,
  filterExpenses,
  calculateTotal,
  deleteExpense,
  updateExpense,
  summarizeByCategory,
  monthlyTotal,
  budgetStatus
} = require('../src/expenseService');

describe('validateExpense', () => {
  test('returns no errors for valid data', () => {
    const errors = validateExpense({ amount: '50000', category: 'Makanan', date: '2026-07-01' });
    expect(errors).toHaveLength(0);
  });

  test('rejects zero or negative amount', () => {
    expect(validateExpense({ amount: '0', category: 'Makanan', date: '2026-07-01' })).toContain(
      'Nominal harus lebih besar dari 0'
    );
    expect(validateExpense({ amount: '-100', category: 'Makanan', date: '2026-07-01' })).toContain(
      'Nominal harus lebih besar dari 0'
    );
  });

  test('rejects missing category', () => {
    expect(validateExpense({ amount: '1000', category: '', date: '2026-07-01' })).toContain(
      'Kategori harus dipilih'
    );
  });

  test('rejects invalid category', () => {
    expect(validateExpense({ amount: '1000', category: 'Unknown', date: '2026-07-01' })).toContain(
      'Kategori harus dipilih'
    );
  });

  test('rejects missing date', () => {
    expect(validateExpense({ amount: '1000', category: 'Makanan', date: '' })).toContain(
      'Tanggal harus diisi'
    );
  });
});

describe('createExpense', () => {
  test('creates expense with generated id', () => {
    const expense = createExpense(
      { amount: '25000', category: 'Transportasi', date: '2026-07-01', note: 'Ojek' },
      () => 123
    );
    expect(expense).toEqual({
      id: 123,
      amount: 25000,
      category: 'Transportasi',
      date: '2026-07-01',
      note: 'Ojek'
    });
  });

  test('defaults note to empty string', () => {
    const expense = createExpense(
      { amount: '10000', category: 'Belanja', date: '2026-07-01' },
      () => 1
    );
    expect(expense.note).toBe('');
  });

  test('throws when data is invalid', () => {
    expect(() => createExpense({ amount: '0', category: '', date: '' })).toThrow();
  });
});

describe('filterExpenses', () => {
  const expenses = [
    { id: 1, amount: 10000, category: 'Makanan', date: '2026-07-01' },
    { id: 2, amount: 20000, category: 'Transportasi', date: '2026-07-05' },
    { id: 3, amount: 30000, category: 'Makanan', date: '2026-07-10' }
  ];

  test('filters by category', () => {
    const result = filterExpenses(expenses, { category: 'Makanan' });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.category === 'Makanan')).toBe(true);
  });

  test('filters by date range', () => {
    const result = filterExpenses(expenses, { dateFrom: '2026-07-03', dateTo: '2026-07-08' });
    expect(result).toEqual([expenses[1]]);
  });

  test('returns all expenses when no filters given', () => {
    expect(filterExpenses(expenses, {})).toEqual(expenses);
  });
});

describe('calculateTotal', () => {
  test('sums all amounts', () => {
    const expenses = [{ amount: 1000 }, { amount: 2500 }, { amount: 500 }];
    expect(calculateTotal(expenses)).toBe(4000);
  });

  test('returns 0 for empty list', () => {
    expect(calculateTotal([])).toBe(0);
  });
});

describe('deleteExpense', () => {
  test('removes expense matching id', () => {
    const expenses = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(deleteExpense(expenses, 2)).toEqual([{ id: 1 }, { id: 3 }]);
  });

  test('handles id as string vs number', () => {
    const expenses = [{ id: 1 }, { id: 2 }];
    expect(deleteExpense(expenses, '1')).toEqual([{ id: 2 }]);
  });
});

describe('updateExpense', () => {
  const expenses = [
    { id: 1, amount: 10000, category: 'Makanan', date: '2026-07-01', note: 'lama' },
    { id: 2, amount: 20000, category: 'Belanja', date: '2026-07-02', note: '' }
  ];

  test('updates fields of matching expense and keeps its id', () => {
    const result = updateExpense(expenses, 1, {
      amount: '75000',
      category: 'Hiburan',
      date: '2026-07-05',
      note: 'baru'
    });
    expect(result[0]).toEqual({
      id: 1,
      amount: 75000,
      category: 'Hiburan',
      date: '2026-07-05',
      note: 'baru'
    });
  });

  test('leaves other expenses untouched', () => {
    const result = updateExpense(expenses, 1, {
      amount: '75000',
      category: 'Hiburan',
      date: '2026-07-05'
    });
    expect(result[1]).toEqual(expenses[1]);
  });

  test('throws when updated data is invalid', () => {
    expect(() => updateExpense(expenses, 1, { amount: '0', category: '', date: '' })).toThrow();
  });
});

describe('summarizeByCategory', () => {
  test('sums amounts per category', () => {
    const expenses = [
      { amount: 10000, category: 'Makanan' },
      { amount: 5000, category: 'Makanan' },
      { amount: 20000, category: 'Transportasi' }
    ];
    expect(summarizeByCategory(expenses)).toEqual({ Makanan: 15000, Transportasi: 20000 });
  });

  test('returns empty object for empty list', () => {
    expect(summarizeByCategory([])).toEqual({});
  });
});

describe('monthlyTotal', () => {
  const expenses = [
    { amount: 10000, date: '2026-07-01' },
    { amount: 20000, date: '2026-07-15' },
    { amount: 99000, date: '2026-06-30' }
  ];

  test('sums only expenses in the given month', () => {
    expect(monthlyTotal(expenses, '2026-07')).toBe(30000);
  });

  test('returns 0 when no expense in that month', () => {
    expect(monthlyTotal(expenses, '2026-01')).toBe(0);
  });
});

describe('budgetStatus', () => {
  test('returns none when limit is not set', () => {
    expect(budgetStatus(50000, 0)).toEqual({ percent: 0, state: 'none' });
  });

  test('returns ok when spending is below 80% of limit', () => {
    expect(budgetStatus(50000, 100000)).toEqual({ percent: 50, state: 'ok' });
  });

  test('returns warn when spending reaches 80% of limit', () => {
    expect(budgetStatus(80000, 100000)).toEqual({ percent: 80, state: 'warn' });
  });

  test('returns over with capped percent when limit exceeded', () => {
    expect(budgetStatus(150000, 100000)).toEqual({ percent: 100, state: 'over' });
  });
});
