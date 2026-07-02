const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'expenses.json');

function loadExpenses() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  return raw ? JSON.parse(raw) : [];
}

function saveExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(__dirname, '..', 'data', 'settings.json');

function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { monthlyBudget: 0 };
  }
  const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8').trim();
  return raw ? JSON.parse(raw) : { monthlyBudget: 0 };
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

module.exports = { loadExpenses, saveExpenses, loadSettings, saveSettings, DATA_FILE, SETTINGS_FILE };
