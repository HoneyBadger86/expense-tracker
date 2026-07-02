const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'expenses.json');
const INCOME_FILE = process.env.INCOME_FILE || path.join(__dirname, '..', 'data', 'incomes.json');
const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(__dirname, '..', 'data', 'settings.json');

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  const raw = fs.readFileSync(file, 'utf-8').trim();
  return raw ? JSON.parse(raw) : fallback;
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function loadExpenses() {
  return readJson(DATA_FILE, []);
}

function saveExpenses(expenses) {
  writeJson(DATA_FILE, expenses);
}

function loadIncomes() {
  return readJson(INCOME_FILE, []);
}

function saveIncomes(incomes) {
  writeJson(INCOME_FILE, incomes);
}

function loadSettings() {
  return readJson(SETTINGS_FILE, { monthlyBudget: 0 });
}

function saveSettings(settings) {
  writeJson(SETTINGS_FILE, settings);
}

module.exports = {
  loadExpenses,
  saveExpenses,
  loadIncomes,
  saveIncomes,
  loadSettings,
  saveSettings,
  DATA_FILE,
  INCOME_FILE,
  SETTINGS_FILE
};
