const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { syncSharedCss } = require('./sync');

test('syncSharedCss handles missing CSS file', (t) => {
  const originalExistsSync = fs.existsSync;
  const originalConsoleError = console.error;

  let errorMessage = '';
  console.error = (msg) => {
    errorMessage = msg;
  };

  fs.existsSync = (p) => {
    if (p.endsWith('austroads.css')) {
      return false;
    }
    return originalExistsSync(p);
  };

  try {
    syncSharedCss();
    assert.match(errorMessage, /Source CSS not found:/);
  } finally {
    // Restore original functions
    fs.existsSync = originalExistsSync;
    console.error = originalConsoleError;
  }
});
