// Run: node tests/check-debug-port.js
// .debug opens Chromium remote debugging (port 9004) into the panel. It belongs on dev installs only:
// installers must not copy it for users, the release zip must leave it out, and the panel removes it from old user installs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');

function panelWith(files) {
    const deleted = [];
    const cepFs = {
        stat: (p) => (p in files ? { err: 0, data: { mtime: 1, isDirectory: () => false } } : { err: 3 }),
        readFile: (p) => (p in files ? { err: 0, data: files[p] } : { err: 3 }),
        deleteFile: (p) => { deleted.push(p); delete files[p]; return { err: 0 }; }
    };
    const context = { cep: { fs: cepFs, encoding: { UTF8: 'UTF-8', Base64: 'Base64' } } };
    context.window = context;
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/dev-source-sync.js'), 'utf8'), context);
    return { drop: context.scctlmFotoDropDebugPort, deleted };
}

const base = 'C:/Users/u/AppData/Roaming/Adobe/CEP/extensions/SCCTLM_Foto';

// User install that still has .debug from an older installer: removed.
let panel = panelWith({ [base + '/.debug']: '<ExtensionList/>' });
assert.equal(panel.drop(base), true);
assert.deepEqual(panel.deleted, [base + '/.debug']);

// Dev install (installed from a git checkout): kept.
panel = panelWith({ [base + '/.debug']: 'x', [base + '/.scctlm-foto-dev-source']: 'D:\\DR7\r\n' });
assert.equal(panel.drop(base), false);
assert.deepEqual(panel.deleted, []);

// Panel runs straight from a git checkout (junction/symlink into CEP extensions): kept.
panel = panelWith({ [base + '/.debug']: 'x', [base + '/.git']: 'gitdir: x' });
assert.equal(panel.drop(base), false);
assert.deepEqual(panel.deleted, []);

// Installed in place (record points at the install itself): kept.
panel = panelWith({ [base + '/.debug']: 'x', [base + '/.scctlm-foto-dev-source']: base });
assert.equal(panel.drop(base), false);
assert.deepEqual(panel.deleted, []);

// No .debug: nothing to do.
panel = panelWith({});
assert.equal(panel.drop(base), false);
assert.deepEqual(panel.deleted, []);

// panel.js calls it before the ExtendScript core loads.
const bridge = fs.readFileSync(path.join(root, 'js/panel.js'), 'utf8');
assert.ok(bridge.indexOf('scctlmFotoDropDebugPort(base)') !== -1 && bridge.indexOf('scctlmFotoDropDebugPort(base)') < bridge.indexOf('loader.jsx'),
    'panel.js removes .debug before loading the core');

// Installers copy an explicit runtime list and only copy .debug from a git checkout.
const bat = fs.readFileSync(path.join(root, 'install/Cai-dat-SCCTLM_Foto.bat'), 'utf8');
assert.match(bat, /for %%F in \(CSXS js jsx css img presets\)/, 'Windows installer copies runtime folders only');
assert.doesNotMatch(bat, /robocopy "%SRC%" "%SCCTLM_FOTO_TARGET%" \/E/, 'Windows installer no longer mirrors the whole source');
assert.match(bat, /if exist "%SRC%\\\.git" \(\s*copy \/y "%SRC%\\\.debug"/, 'Windows installer copies .debug only for dev installs');
assert.match(bat, /del \/q "%SCCTLM_FOTO_TARGET%\\\.debug"/, 'Windows installer removes .debug from user installs');
const mac = fs.readFileSync(path.join(root, 'install/Cai-dat-SCCTLM_Foto.command'), 'utf8');
assert.match(mac, /for d in CSXS js jsx css img presets; do/, 'macOS installer copies runtime folders only');
assert.doesNotMatch(mac, /rsync -a [^\n]*"\$SRC\/" "\$TARGET\/"/, 'macOS installer no longer mirrors the whole source');
assert.match(mac, /rm -f "\$TARGET\/\.debug"/, 'macOS installer removes .debug from user installs');

// Release zip (git archive) leaves .debug out.
const attr = execFileSync('git', ['check-attr', 'export-ignore', '.debug'], { cwd: root, encoding: 'utf8' });
assert.match(attr, /export-ignore: set/, '.debug is export-ignore');

console.log('check-debug-port: OK');
