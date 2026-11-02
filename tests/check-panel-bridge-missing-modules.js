// Run: node tests/check-panel-bridge-missing-modules.js
// If js/color-mode-guard.js or js/error-messages.js fails to load (partial install, interrupted update), the panel bridge
// must keep working and show a plain sentence — never a TypeError, never raw error text.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const calls = [], alerts = [];
const panel = {
    JSON, alert: (message) => alerts.push(message), SystemPath: { EXTENSION: 0 },
    document: { querySelectorAll: () => [], body: { classList: { add() {}, remove() {} } } },
    location: { reload() {} }
};
panel.window = panel;
panel.CSInterface = function () {
    this.getSystemPath = () => 'D:/SCCTLM_Foto';
    this.evalScript = (code, callback) => calls.push({ code, callback });
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/panel.js'), 'utf8'), panel);

assert.equal(panel.scctlmFotoErrors, undefined, 'helpers are deliberately not loaded in this test');
calls[0].callback('SCCTLM_READY');
calls.pop().callback('SCCTLM_OK');                       // BUGFIX dispatched once the core is ready

assert.doesNotThrow(() => panel.doa('GGXS'), 'a command still runs without the colour-mode helper');
const sent = calls[calls.length - 1];
assert.match(sent.code, /scctlmFotoCommands\["GGXS"\]/, 'the GGXS command was sent');
assert.doesNotMatch(sent.code, /DocumentMode/, 'no RGB preflight without the helper');
assert.doesNotThrow(() => sent.callback('SCCTLM_ERROR#1: Error: boom\nFile: C:\\Users\\Ai\\x.jsx\nLine: 3'));

const shown = alerts[alerts.length - 1];
assert.match(shown, /cài lại/i, 'tells the user what to do');
assert.doesNotMatch(shown, /SCCTLM_ERROR|File:|Line:|boom|Users/, 'no raw error text');

assert.match(panel.scctlmFotoErrorLine('SCCTLM_ERROR: x', { source: 'update' }), /cài lại/i);
assert.doesNotThrow(() => panel.scctlmFotoReportError(new Error('x'), { source: 'command' }));

console.log('check-panel-bridge-missing-modules: OK');
