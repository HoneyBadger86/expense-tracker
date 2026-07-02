const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    headless: true
  },
  webServer: {
    command: 'node server.js',
    port: 3100,
    env: {
      PORT: '3100',
      DATA_FILE: 'data/expenses.test.json',
      SETTINGS_FILE: 'data/settings.test.json'
    },
    reuseExistingServer: false,
    timeout: 10000
  }
});
