// Run: node tests/check-wm-dialog-close.js
// The batch text/LOGO dialog (jsx/4.jsxbin) must have a Close button that is also the Esc target and closes without running a batch.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../jsx/4.jsxbin'), 'utf8');
assert.match(source, /win\.grp100\.bu4 = win\.grp100\.add\("button", undefined, "\\u0110\\u00f3ng", \{\s*name: "cancel"\s*\}\);/, 'Close button must be named "cancel" so Esc triggers it');
assert.match(source, /win\.grp100\.bu4\.onClick = function\(\) \{\s*win\.close\(2\);\s*\};/, 'Close button must close with code 2 and not call process()');
console.log('check-wm-dialog-close: OK');
