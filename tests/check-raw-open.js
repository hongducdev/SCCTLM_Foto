// Run: node tests/check-raw-open.js
// jsx/raw-open.jsx runs against stubbed Photoshop globals; panel.js and index.html are checked as text.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function load(existingPaths) {
    const calls = [];
    class File {
        constructor(p) { this.fsName = p; this.exists = existingPaths.includes(p); }
        static openDialog() { return File.picked; }
    }
    File.picked = null;
    const app = {
        displayDialogs: 'ERROR',
        open(file, options) {
            calls.push({ file, options, dialogs: app.displayDialogs });
            if (app.failOpen) throw new Error('open failed');
        }
    };
    const context = {
        File, app, $: {},
        CameraRAWOpenOptions: function () {},
        CameraRAWSettingsType: { SELECTEDIMAGE: 'SELECTEDIMAGE' },
        BitsPerChannelType: { SIXTEEN: 'SIXTEEN' },
        ColorSpaceType: { SRGB: 'SRGB' },
        DialogModes: { NO: 'NO' }
    };
    vm.runInNewContext(read('jsx/raw-open.jsx'), context, { filename: 'raw-open.jsx' });
    return { command: context.$._ext_OPENRAW, calls, app, File };
}

{
    const { command, calls, app } = load(['C:/photos/a.ARW']);
    assert.equal(command.run('C:/photos/a.ARW'), 'SCCTLM_OK');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].dialogs, 'NO', 'the Camera Raw dialog must be suppressed while opening');
    assert.equal(calls[0].options.settings, 'SELECTEDIMAGE');
    assert.equal(calls[0].options.bitsPerChannel, 'SIXTEEN');
    assert.equal(calls[0].options.colorSpace, 'SRGB');
    assert.equal(app.displayDialogs, 'ERROR', 'dialog mode must be restored');
}

{
    const { command, app } = load(['C:/photos/a.ARW']);
    app.failOpen = true;
    assert.throws(() => command.run('C:/photos/a.ARW'), /open failed/);
    assert.equal(app.displayDialogs, 'ERROR', 'dialog mode must be restored when open fails');
}

{
    const { command, calls } = load([]);
    assert.throws(() => command.run('C:/photos/missing.ARW'), error => /File not found/.test(error.message));
    assert.equal(calls.length, 0);
}

{
    const { command, File, calls } = load([]);
    File.picked = null;
    assert.throws(() => command.run(), error => error.number === 8007, 'closing the picker must read as a cancel');
    assert.equal(calls.length, 0);
}

{
    const { command, File, calls } = load(['C:/photos/b.ARW']);
    File.picked = new File('C:/photos/b.ARW');
    assert.equal(command.run(), 'SCCTLM_OK');
    assert.equal(calls[0].file.fsName, 'C:/photos/b.ARW');
}

assert.match(read('js/panel.js'), /\(WM\|BPP\|BPPRESET\|OPENRAW\|BUGFIX\)/, 'OPENRAW must run without an open document');
assert.match(read('index.html'), /onClickButton\('OPENRAW'\)/, 'panel needs the RAW button');
assert.equal(read('jsx/raw-open.jsx').includes('\r'), false, 'repo files are LF');

console.log('raw-open: ok');
