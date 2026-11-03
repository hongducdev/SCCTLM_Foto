// Run: node tests/check-jsx-no-cep.js
// The photo core (jsx/, loader.jsx) must stay free of CEP APIs so a CEP -> UXP move only rewrites js/ and the bridge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const FORBIDDEN = /\bCSInterface\b|\bcep\.[a-z]|__adobe_cep__|\bCSEvent\b|\bSystemPath\b/;
const files = ['loader.jsx', ...fs.readdirSync(path.join(root, 'jsx')).filter(n => n.endsWith('.jsx')).map(n => 'jsx/' + n)];
const offenders = [];
for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => { if (FORBIDDEN.test(line)) offenders.push(file + ':' + (i + 1) + ': ' + line.trim().slice(0, 100)); });
}
assert.deepEqual(offenders, [], 'CEP API in the ExtendScript core:\n' + offenders.join('\n'));
console.log('PASS: ' + files.length + ' ExtendScript files free of CEP APIs');
