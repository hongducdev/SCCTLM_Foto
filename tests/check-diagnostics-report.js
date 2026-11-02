// Run: node tests/check-diagnostics-report.js
// js/diagnostics-report.js: parses the core state read from ExtendScript and builds a report with no personal paths.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/diagnostics-report.js'), 'utf8'), vm.createContext({ window }));
const diag = window.scctlmFotoDiagnostics;

// CORE_CODE must be valid JavaScript (it is evaluated by ExtendScript, which is ES3)
assert.doesNotThrow(() => new vm.Script(diag.CORE_CODE), 'CORE_CODE parses');
assert.doesNotMatch(diag.CORE_CODE, /=>|\blet\b|\bconst\b|`/, 'CORE_CODE is ES3');

// Run CORE_CODE against a fake ExtendScript global and feed the result to parseCore
const fake = {
    $: { scctlmFotoReady: false, scctlmFotoLoadTotalMs: 163,
        scctlmFotoLoadErrors: ['C:\\Users\\Ai\\x\\jsx\\main.jsx: ReferenceError: y\n (line 9)', 'skin command not registered: ZCZQ'],
        scctlmFotoLoadTimes: [{ file: 'C:/Users/Ai/x/jsx/4.jsxbin', ms: 80 }, { file: 'C:\\Users\\Ai\\x\\jsx\\main.jsx', ms: 5 }, { file: '/a/b/ds.jsx', ms: 31 }] },
    app: { version: '27.1.0' }
};
const res = vm.runInContext(diag.CORE_CODE, vm.createContext(fake));
const core = diag.parseCore(res);
assert.equal(core.ready, false);
assert.equal(core.totalMs, 163);
assert.equal(core.photoshop, '27.1.0');
assert.equal(core.errors.length, 2);
assert.equal(core.times.map((t) => t.file).join(','), '4.jsxbin,main.jsx,ds.jsx');
assert.equal(diag.parseCore('unavailable'), null);
assert.equal(diag.parseCore('EvalScript error.'), null);
assert.equal(diag.parseCore(undefined), null);

const report = diag.build({
    panelVersion: 'v0.3.10', os: 'Windows 11', base: 'C:/Users/Ai/AppData/Roaming/Adobe/CEP/extensions/SCCTLM_Foto',
    home: 'C:\\Users\\Ai', core,
    recent: [{ source: 'command', raw: 'SCCTLM_ERROR: boom\nFile: C:\\Users\\Ai\\x.jsx\nLine: 3' }]
});
assert.match(report, /Phiên bản panel: v0\.3\.10/);
assert.match(report, /Photoshop: 27\.1\.0/);
assert.match(report, /Lõi plugin: CHƯA sẵn sàng/);
assert.match(report, /Thời gian nạp lõi: 163 ms/);
assert.match(report, /skin command not registered: ZCZQ/);
assert.match(report, /4\.jsxbin: 80 ms/);
assert.match(report, /\[command\] SCCTLM_ERROR: boom/, 'raw technical detail lives only in the report');
assert.doesNotMatch(report, /\bAi\b/, 'the Windows user name never appears');
assert.doesNotMatch(report, /C:[\\/]+Users/i);
assert.ok(report.indexOf('4.jsxbin') < report.indexOf('main.jsx: 5'), 'slowest first');

// No core (Photoshop silent / core not loaded): the CEP side still reports
const bare = diag.build({ panelVersion: 'v0.3.10', os: 'macOS', base: '/Users/ai/Library/x', core: null, recent: [] });
assert.match(bare, /Lõi plugin: không đọc được/);
assert.match(bare, /chưa có/);
assert.doesNotMatch(bare, /\/Users\/ai/, 'mac home hidden even without a home hint');

// Size caps
const many = diag.build({ core: { ready: false, totalMs: 1, photoshop: '', errors: Array.from({ length: 40 }, (_, i) => `e${i} ` + 'x'.repeat(900)), times: [] },
    recent: Array.from({ length: 50 }, (_, i) => ({ source: 'command', raw: 'r' + i + 'y'.repeat(900) })) });
assert.ok(many.length < 8000, `report stays small (${many.length})`);
assert.match(many, /và 30 lỗi nữa/);

// The panel wires it up: scripts load before panel.js, and the footer button exists
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const at = (name) => html.indexOf(`./js/${name}.js`);
for (const name of ['color-mode-guard', 'error-messages', 'diagnostics-report', 'diagnostics-controls']) {
    assert.ok(at(name) > 0 && at(name) < at('panel'), `${name}.js must load before panel.js`);
    assert.ok(fs.existsSync(path.join(__dirname, `../js/${name}.js`)));
}
assert.ok(at('dialog') < at('diagnostics-controls'), 'the shared dialog loads first');
assert.match(html, /<footer class="panel-footer">[\s\S]*onclick="scctlmFotoOpenDiagnostics\(\)"[\s\S]*Chẩn đoán/);
assert.match(html, /css\/diagnostics\.css[\s\S]*css\/focus-ring\.css/, 'focus-ring.css stays the last stylesheet');

console.log('check-diagnostics-report: OK');
