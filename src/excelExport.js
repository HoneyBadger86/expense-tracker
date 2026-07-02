const ExcelJS = require('exceljs');

const COLORS = {
  violet: 'FF7C3AED',
  green: 'FF16A34A',
  pink: 'FFEC4899',
  zebra: 'FFF5F1FC',
  totalFill: 'FFEDE9FE',
  white: 'FFFFFFFF'
};

const RUPIAH_FMT = '"Rp" #,##0';

function styleHeaderRow(row, fillColor) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white }, size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  row.height = 22;
}

function zebraFill(row) {
  if (row.number % 2 === 0) {
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } };
    });
  }
}

function addExpenseSheet(workbook, expenses) {
  const sheet = workbook.addWorksheet('Pengeluaran', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  sheet.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Kategori', key: 'category', width: 18 },
    { header: 'Nominal', key: 'amount', width: 18, style: { numFmt: RUPIAH_FMT } },
    { header: 'Catatan', key: 'note', width: 42 }
  ];
  styleHeaderRow(sheet.getRow(1), COLORS.violet);

  for (const expense of expenses) {
    const row = sheet.addRow({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      note: expense.note
    });
    zebraFill(row);
  }

  const totalRow = sheet.addRow({
    category: 'TOTAL',
    amount: expenses.reduce((sum, e) => sum + e.amount, 0)
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalFill } };
  });

  sheet.autoFilter = 'A1:D1';
  return sheet;
}

function addIncomeSheet(workbook, incomes) {
  const sheet = workbook.addWorksheet('Pemasukan', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  sheet.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Nominal', key: 'amount', width: 18, style: { numFmt: RUPIAH_FMT } },
    { header: 'Catatan', key: 'note', width: 42 }
  ];
  styleHeaderRow(sheet.getRow(1), COLORS.green);

  for (const income of incomes) {
    const row = sheet.addRow({ date: income.date, amount: income.amount, note: income.note });
    zebraFill(row);
  }

  const totalRow = sheet.addRow({
    date: 'TOTAL',
    amount: incomes.reduce((sum, i) => sum + i.amount, 0)
  });
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalFill } };
  });

  return sheet;
}

function addSummarySheet(workbook, categorySummary, totals) {
  const sheet = workbook.addWorksheet('Ringkasan');
  sheet.columns = [
    { header: 'Kategori', key: 'label', width: 24 },
    { header: 'Total', key: 'value', width: 20, style: { numFmt: RUPIAH_FMT } }
  ];
  styleHeaderRow(sheet.getRow(1), COLORS.pink);

  for (const [category, total] of Object.entries(categorySummary)) {
    zebraFill(sheet.addRow({ label: category, value: total }));
  }

  sheet.addRow({});
  const rows = [
    ['Total Pengeluaran', totals.expense],
    ['Total Pemasukan', totals.income],
    ['Saldo', totals.income - totals.expense]
  ];
  for (const [label, value] of rows) {
    const row = sheet.addRow({ label, value });
    row.eachCell((cell) => {
      cell.font = { bold: true };
    });
  }

  return sheet;
}

async function buildWorkbook({ expenses, incomes, categorySummary }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Expense Tracker';
  workbook.created = new Date();

  addExpenseSheet(workbook, expenses);
  addIncomeSheet(workbook, incomes);
  addSummarySheet(workbook, categorySummary, {
    expense: expenses.reduce((sum, e) => sum + e.amount, 0),
    income: incomes.reduce((sum, i) => sum + i.amount, 0)
  });

  return workbook;
}

module.exports = { buildWorkbook };
