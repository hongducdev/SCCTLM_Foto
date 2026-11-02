// Run: node tests/check-color-mode-guard.js
// js/color-mode-guard.js: which panel commands are gated on RGB, and how the "not RGB" reply is parsed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/color-mode-guard.js'), 'utf8'), vm.createContext({ window }));
const guard = window.scctlmFotoColorMode;

for (const name of ['ZCZQ', 'GGXS', 'JMXS', 'TJSH', 'TJYY', 'MBPF', 'FSJH', 'DKACR']) assert.ok(guard.needsRgb('doa', name), `doa ${name} needs RGB`);
for (const name of ['DS', 'WT', 'RE', 'DB', 'SE', 'BA', 'LS', 'BTNPFSD2', 'TC', 'SH']) assert.ok(guard.needsRgb('ext', name), `ext ${name} needs RGB`);
for (const [kind, name] of [['ext', 'WM'], ['ext', 'BPP'], ['ext', 'BUGFIX'], ['doa', 'MLXG'], ['preset', 'x.xmp'], ['artboard', 'a'], ['frame', 'f']]) {
    assert.equal(guard.needsRgb(kind, name), false, `${kind} ${name} is not gated`);
}

assert.equal(guard.parse('SCCTLM_OK'), null);
assert.equal(guard.parse('SCCTLM_ERROR: boom'), null);
assert.equal(guard.parse(undefined), null);
assert.equal(guard.parse('SCCTLM_NOT_RGB:DocumentMode.CMYK'), 'CMYK');
assert.equal(guard.parse('SCCTLM_NOT_RGB:DocumentMode.GRAYSCALE'), 'Grayscale');
assert.equal(guard.parse('SCCTLM_NOT_RGB:DocumentMode.LAB'), 'Lab');
assert.equal(guard.parse('SCCTLM_NOT_RGB:DocumentMode.INDEXEDCOLOR'), 'Indexed Color');
assert.equal(guard.parse('SCCTLM_NOT_RGB:DocumentMode.BITMAP'), 'Bitmap');
assert.equal(guard.parse('SCCTLM_NOT_RGB'), 'khác RGB');
assert.equal(guard.parse('SCCTLM_ERROR#0: Error: SCCTLM_NOT_RGB:DocumentMode.CMYK\nFile: x.jsx\nLine: 3'), 'CMYK', 'wrapped error from jsx/main.jsx');

const batch = guard.preflightCode('ext', 'BA');
assert.match(batch, /for\(var i=0;i<app\.documents\.length;i\+\+\)if\(app\.documents\[i\]\.mode!==DocumentMode\.RGB\)return "SCCTLM_NOT_RGB:"\+String\(app\.documents\[i\]\.mode\);/, 'BA checks every open document');
const sandbox = (docs) => vm.runInNewContext(`(function(){${batch}return "ok";}())`, { app: { documents: docs }, DocumentMode: { RGB: 'RGB' } });
assert.equal(sandbox([{ mode: 'RGB' }, { mode: 'RGB' }]), 'ok');
assert.equal(sandbox([{ mode: 'RGB' }, { mode: 'GRAY' }]), 'SCCTLM_NOT_RGB:GRAY', 'a non-RGB background document stops the batch');

const code = guard.preflightCode('doa', 'ZCZQ');
assert.match(code, /app\.activeDocument\.mode!==DocumentMode\.RGB/);
assert.match(code, /^if\(.*\)return "SCCTLM_NOT_RGB:"\+String\(app\.activeDocument\.mode\);$/);

console.log('check-color-mode-guard: OK');
