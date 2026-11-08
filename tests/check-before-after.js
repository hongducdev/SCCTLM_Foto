// Run: node tests/check-before-after.js
// The panel bridge wraps layer-creating commands with $._ext_BEFOREAFTER.before() / after(), leaves every other command
// alone, never lets Before / After break a retouch button, and explains an empty toggle in plain Vietnamese.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const calls = [];
const button = (onclick, label) => ({ getAttribute: () => onclick, querySelector: () => ({ textContent: label }) });
const panel = { JSON, alert: () => {}, SystemPath: { EXTENSION: 0 },
    document: { querySelectorAll: () => [button("onClickButton('BEFOREAFTER')", 'Trước / Sau')],
        body: { classList: { add() {}, remove() {} } } } };
panel.window = panel;
panel.location = { reload() {} };
panel.CSInterface = function () {
    this.getSystemPath = () => 'D:/SCCTLM_Foto';
    this.evalScript = (code, callback) => calls.push({ code, callback });
};
vm.runInNewContext(read('js/color-mode-guard.js'), panel);
vm.runInNewContext(read('js/error-messages.js'), panel);
vm.runInNewContext(read('js/panel.js'), panel);
panel.onClickButton('DB');
calls.shift().callback('SCCTLM_READY');
calls.shift().callback('SCCTLM_OK');           // BUGFIX workaround dispatched when the core is ready

function host(log, withModule) {
    const h = { app: { documents: [{ mode: 'RGB' }], activeDocument: { mode: 'RGB' }, displayDialogs: 1, preferences: { rulerUnits: 2 } },
        DocumentMode: { RGB: 'RGB' }, $: { scctlmFotoCommands: {} } };
    for (const name of ['DB', 'BA', 'WM', 'BEFOREAFTER', 'BPP', 'OPENRAW']) h.$['_ext_' + name] = { run: () => { log.push('run ' + name); } };
    h.$.scctlmFotoCommands.GGXS = () => { log.push('run GGXS'); };
    if (withModule) {
        h.$._ext_BEFOREAFTER.before = () => { log.push('before'); return { doc: 1, ids: [7] }; };
        h.$._ext_BEFOREAFTER.after = (prev) => { log.push('after ' + prev.ids.join(',')); };
        h.$._ext_BEFOREAFTER.ensureShown = () => { log.push('ensureShown'); };
        h.$._ext_BEFOREAFTER.ensureShownAll = () => { log.push('ensureShownAll'); };
    }
    return h;
}

function runBridge(fn, log, withModule) {
    fn();
    const sent = calls.pop();
    const result = vm.runInNewContext(sent.code, host(log, withModule));
    sent.callback(result);
    return result;
}

// Layer-creating commands are recorded: before the command, after the command, in that order
for (const [label, fn, run] of [
    ['ext DB', () => panel.onClickButton('DB'), 'run DB'],
    ['doa GGXS', () => panel.doa('GGXS'), 'run GGXS']
]) {
    const log = [];
    assert.equal(runBridge(fn, log, true), 'SCCTLM_OK', label);
    assert.deepEqual(log, ['before', run, 'after 7'], label + ' must be bracketed by before/after');
}

// Commands that do not create retouch layers are not tracked, and neither is the toggle itself
for (const name of ['BEFOREAFTER', 'BPP', 'OPENRAW']) {
    const log = [];
    runBridge(() => panel.onClickButton(name), log, true);
    assert.deepEqual(log, ['run ' + name], name + ' must run without before/after');
}

// Commands that rebuild or flatten the document show hidden layers first but record nothing
for (const name of ['BA', 'WM']) {
    const log = [];
    runBridge(() => panel.onClickButton(name), log, true);
    assert.deepEqual(log, ['ensureShownAll', 'run ' + name], name + ' processes every open image, so it must restore all of them');
}

// A missing Before / After module must never stop the retouch command
{
    const log = [];
    assert.equal(runBridge(() => panel.onClickButton('DB'), log, false), 'SCCTLM_OK');
    assert.deepEqual(log, ['run DB']);
}

// A command that fails does not record a half-built result
{
    const sent = (panel.onClickButton('DB'), calls.pop());
    const log = [];
    const h = host(log, true);
    h.$._ext_DB.run = () => { throw new Error('boom'); };
    const result = vm.runInNewContext(sent.code, h);
    sent.callback(result);
    assert.match(result, /^SCCTLM_ERROR/);
    assert.deepEqual(log, ['before'], 'after() must not run when the command failed');
}

// An empty toggle is a plain sentence with a next step, not a code
const empty = panel.scctlmFotoErrors.explain(new Error('SCCTLM_BA_EMPTY'), { source: 'command', label: 'Trước / Sau' });
assert.equal(empty.title, 'Chưa có kết quả để so sánh');
assert.doesNotMatch(empty.message + empty.action, /SCCTLM_/);

// The panel offers the button, and the ExtendScript module exposes what the bridge calls
assert.match(read('index.html'), /onclick="onClickButton\('BEFOREAFTER'\)"/);
const source = read('jsx/before-after.jsx');
const sandbox = { $: {}, charIDToTypeID: () => 0, stringIDToTypeID: () => 0 };
vm.runInNewContext(source, sandbox);
for (const fn of ['before', 'after', 'ensureShown', 'ensureShownAll', 'run', 'toggle', 'stateName']) assert.equal(typeof sandbox.$._ext_BEFOREAFTER[fn], 'function', fn);
assert.doesNotMatch(read('js/color-mode-guard.js'), /BEFOREAFTER/, 'the toggle creates no layers and needs no RGB check');

// The button shows when the panel layers are hidden, from what Photoshop reports
{
    const attrs = {};
    const span = { textContent: 'Trước / Sau' };
    const btn = { title: '', setAttribute: (k, v) => { attrs[k] = v; }, querySelector: () => span };
    const sent = [];
    const ui = { setTimeout: () => 0, document: { querySelector: () => btn }, CSInterface: function () { this.evalScript = (code, cb) => { sent.push(code); cb(sent.reply); }; } };
    ui.window = ui;
    vm.runInNewContext(read('js/before-after-state.js'), ui);
    sent.reply = 'hidden';
    ui.scctlmFotoRefreshBeforeAfter();
    assert.match(sent[0], /stateName[(][)]/);
    assert.equal(attrs['aria-pressed'], 'true');
    assert.equal(span.textContent, 'Ảnh gốc');
    sent.reply = 'shown';
    ui.scctlmFotoRefreshBeforeAfter();
    assert.equal(attrs['aria-pressed'], 'false');
    assert.equal(span.textContent, 'Trước / Sau');
}
assert.match(read('index.html'), /before-after-state[.]js/, 'the state module must be loaded by the panel');
assert.match(read('js/panel.js'), /scctlmFotoRefreshBeforeAfter/, 'the bridge refreshes the button after each command');

console.log('check-before-after: OK');
