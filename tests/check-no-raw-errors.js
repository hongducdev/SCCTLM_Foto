// Run: node tests/check-no-raw-errors.js
// A user-facing message (notify / status / alert / textContent) must never be built from a raw error value:
// it has to go through scctlmFotoErrors (js/error-messages.js) or be a fixed sentence.
//
// This is a line-based scan, so it only sees a raw value written on the same line as the call that shows it. A value
// copied into another variable first (`var m = e.message; status(m)`) is not caught: show errors through
// scctlmFotoErrorLine / reportError and the scan never needs to.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const RAW_NAME = '(?:res|removed|raw|e|err|error)';
const SHOWS = /\b(notify|status|scctlmFotoStatus|flashStatus|alert|dialog|scctlmFotoDialog)\s*\(|\.textContent\s*=/;
const RAW = [
    new RegExp(`\\+\\s*${RAW_NAME}(\\.message)?\\s*[,;)+]`),                       // 'Lỗi: ' + res
    new RegExp(`String\\(\\s*${RAW_NAME}\\s*\\)`),                                // String(e)
    /\b(e|err|error)\.(message|line|fileName|stack)\b/,                           // error.message
    new RegExp(`\\$\\{\\s*${RAW_NAME}(\\.\\w+)?\\s*\\}`),                         // `${error}`
    new RegExp(`\\b(?:notify|status|scctlmFotoStatus|flashStatus|alert)\\s*\\((?:[^()]*,\\s*)?${RAW_NAME}\\s*[,)]`), // notify(title, res), status(res, true)
    new RegExp(`[(,]\\s*${RAW_NAME}\\s*\\+\\s*['"\`]`),                           // notify(title, res + '...')
    new RegExp(`\\.textContent\\s*=\\s*${RAW_NAME}\\s*[;)]?\\s*$`)                // el.textContent = error
];
const SAFE = /scctlmFotoError(s|Line)|errorLine\(|reportError\(|console\.(warn|error|log)|\$\.writeln/;
const SKIP_FILES = new Set(['CSInterface.js']);
const MAX_LINE = 1500;

const leaks = (code) => SHOWS.test(code) && RAW.some((pattern) => pattern.test(code)) && !SAFE.test(code);

// The scanner itself: each of these old or imagined lines must be flagged, and the fixed forms must not be.
const MUST_FLAG = [
    "notify('Photoshop — ' + label, res);",
    "notify('Không kết nối được Photoshop', String(e));",
    "status('Cập nhật thất bại: ' + (error && error.message || error), true);",
    "status('Không đọc được ảnh: ' + res, true);",
    "status(res, true);",
    "notify('t', res + '\\n\\nThư mục panel:\\n' + base);",
    "alert(e);",
    "alert(this.TITLE, e);",
    "status(`Không đo được: ${res}`, true);",
    "alert(`Lỗi ${error.message}`);",
    "state.textContent = error;",
    "state.textContent = 'Không tải được (' + error.message + ')';"
];
const MUST_PASS = [
    "reportError(res, { source: 'command', label: buttonLabel(kind, name) });",
    "status(errorLine(error, { source: 'update' }), true);",
    "status(window.scctlmFotoErrorLine(res, { source: 'command' }), true);",
    "notify('Chưa mở ảnh', 'Hãy mở ảnh trong Photoshop trước khi chạy lệnh.');",
    "notify(result.title, result.message + '\\n\\n' + result.action);",
    "alert(title + '\\n' + message);",
    "window.console.warn('SCCTLM_Foto explore:', error);",
    "$.writeln('SCCTLM_Foto: pen pressure failed: ' + e);",
    "status(text, isError);",
    "box.textContent = text || '';"
];
for (const line of MUST_FLAG) assert.ok(leaks(line), `scanner must flag: ${line}`);
for (const line of MUST_PASS) assert.ok(!leaks(line), `scanner must allow: ${line}`);

function sources(dir, ext) {
    return fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(ext) && !SKIP_FILES.has(f)).map((f) => `${dir}/${f}`);
}

const violations = [];
for (const file of [...sources('js', '.js'), ...sources('jsx', '.jsx')]) {
    fs.readFileSync(path.join(root, file), 'utf8').split('\n').forEach((line, index) => {
        const code = line.trim();
        if (code.length > MAX_LINE || /^(\/\/|\*|\/\*)/.test(code)) return;
        if (leaks(code)) violations.push(`${file}:${index + 1}: ${code.slice(0, 140)}`);
    });
}
assert.deepEqual(violations, [], `raw error values reach the user:\n${violations.join('\n')}`);
console.log('check-no-raw-errors: OK');
