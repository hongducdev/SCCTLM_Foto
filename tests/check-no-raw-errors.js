// Run: node tests/check-no-raw-errors.js
// A user-facing message (notify / status / alert / textContent) must never be built from a raw error value:
// it has to go through scctlmFotoErrors (js/error-messages.js) or be a fixed sentence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const SHOWS = /\b(notify|status|scctlmFotoStatus|flashStatus|alert|dialog|scctlmFotoDialog)\s*\(|\.textContent\s*=/;
const RAW = /\+\s*(res|removed|e|err|error)(\.message)?\s*[,;)+]|String\(\s*(e|err|error)\s*\)|\b(e|err|error)\.(message|line|fileName)\b/;
const SKIP_FILES = new Set(['CSInterface.js']);
const MAX_LINE = 1500;

function sources(dir, ext) {
    return fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(ext) && !SKIP_FILES.has(f)).map((f) => `${dir}/${f}`);
}

const violations = [];
for (const file of [...sources('js', '.js'), ...sources('jsx', '.jsx')]) {
    fs.readFileSync(path.join(root, file), 'utf8').split('\n').forEach((line, index) => {
        const code = line.trim();
        if (code.length > MAX_LINE || /^(\/\/|\*|\/\*)/.test(code)) return;
        if (SHOWS.test(code) && RAW.test(code) && !/scctlmFotoError(s|Line)|errorLine\(|reportError\(|console\.(warn|error|log)|\$\.writeln/.test(code)) {
            violations.push(`${file}:${index + 1}: ${code.slice(0, 140)}`);
        }
    });
}
assert.deepEqual(violations, [], `raw error values reach the user:\n${violations.join('\n')}`);
console.log('check-no-raw-errors: OK');
