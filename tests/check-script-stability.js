// Run: node tests/check-script-stability.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const manifest = read('CSXS/manifest.xml');
assert.match(manifest, /<Menu>SCCTLM_Foto<\/Menu>/);
assert.match(manifest, /<Size><Height>580<\/Height><Width>300<\/Width><\/Size>/);
assert.equal((manifest.match(/\.\/img\/icon-large\.png/g) || []).length, 2);
// The GitHub updater compares release tags with the panel Version; bundle and panel must agree.
const bundleVersion = /ExtensionBundleVersion="(\d+\.\d+\.\d+)"/.exec(manifest);
const panelVersion = /<Extension Id="com\.(?:retouchpanel|scctlm\.foto)\.panel" Version="(\d+\.\d+\.\d+)"/.exec(manifest);
assert.ok(bundleVersion && panelVersion && bundleVersion[1] === panelVersion[1], 'manifest versions must match (x.y.z)');
const names = [...new Set([...html.matchAll(/doa\('([^']+)'\)/g)].map(m => m[1]))];
const main = read('jsx/main.jsx');
const skinFiles = fs.readdirSync(path.join(root, 'jsx')).filter(name => /^skin-.*\.jsx$/.test(name));
const mainAndSkins = main + skinFiles.map(name => read('jsx/' + name)).join('\n');
const registered = main.slice(main.indexOf('$.dr7BuildSkinCommands ='));
const replacements = read('jsx/mhk-replacements.jsx');
const presetLut = read('jsx/preset-lut.jsx');
for (const name of names) {
    assert.ok(new RegExp('\\b' + name + ': (\\$\\.dr7SkinStep\\("[^"]+", )?f\\.' + name + '\\b').test(registered) ||
        new RegExp('\\b' + name + ': function').test(replacements) ||
        new RegExp('\\b' + name + ': ' + name + '\\b').test(presetLut), name + ' must be registered');
}
assert.doesNotMatch(presetLut, /CrVe/, 'preset-lut must not hardcode ACR version CrVe to prevent Unsupported Edits popup');
// Execute the real module against a stub host so the ACR payload builder is
// exercised, not its source text. A preset exported by a newer Camera Raw must
// reach the filter without a version claim, else ACR raises Unsupported Edits.
const acrHost = { $: {}, app: { documents: [] }, charIDToTypeID: (k) => k, stringIDToTypeID: (k) => k,
    DialogModes: { NO: 2, ALL: 1 }, Error, decodeURI, String, RegExp, JSON };
acrHost.window = acrHost;
vm.runInNewContext(presetLut, acrHost);
assert.equal(typeof acrHost.$.dr7SanitizeAcrXmp, 'function', 'payload sanitizer must be exported');
const future = '<?xml?> <rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" '
    + 'crs:Version="15.0" crs:Exposure2012="+0.50"><crs:CameraProfile>Embedded</crs:CameraProfile></rdf:Description>';
const cleaned = acrHost.$.dr7SanitizeAcrXmp(future);
assert.doesNotMatch(cleaned, /crs:Version/, 'a future ACR version claim must be stripped before the filter runs');
assert.match(cleaned, /crs:Exposure2012="\+0\.50"/, 'sanitizing must keep the actual preset settings');
assert.match(cleaned, /crs:HasSettings="True"/, 'settings blob must be marked as settings for Camera Raw');
assert.equal((acrHost.$.dr7SanitizeAcrXmp(future).match(/crs:HasSettings/g) || []).length, 1,
    'an existing HasSettings flag must not be duplicated');
const sidecar = acrHost.$.dr7SanitizeAcrXmp(read('presets/MHK05451.xmp'));
assert.doesNotMatch(sidecar, /crs:(Temperature|Tint)=/, 'raw-only Kelvin white balance must not reach the filter');
assert.match(sidecar, /crs:WhiteBalance="Auto"/, 'white balance mode must be kept');
assert.match(sidecar, /crs:HueAdjustmentOrange="\+12"/, 'colour settings must be kept');
const relative = acrHost.$.dr7SanitizeAcrXmp('<x crs:Temperature="+20" crs:Tint="-5" xmlns:crs="c"/>');
assert.match(relative, /crs:Temperature="\+20" crs:Tint="-5"/, 'filter-range white balance must be kept');
assert.doesNotMatch(main, /\$\._ext\s*=/, 'main must not overwrite loader error handling');
for (const entry of fs.readdirSync(path.join(root, 'jsx'), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const source = read('jsx/' + entry.name);
    new vm.Script(source, { filename: entry.name });
    assert.doesNotMatch(source, /typeof\$|new File\(\$\.fileName\)/);
    assert.doesNotMatch(source, /[^\x00-\x7f]/, 'ExtendScript source must remain ASCII');
}
// Workflow and Da dialog scripts: a real failure must reach the panel bridge (message/line, silent cancel),
// not be reported as "no file open". Executes each file's actual wrapper statement.
for (const file of ['ds', 'se', 'ba', 'ss', 're', 'tc']) {
    const line = read('jsx/' + file + '.jsx').split('\n').find(l => l.includes('try{app.activeDocument.suspendHistory('));
    const wrapper = line && [line.slice(line.indexOf('try{app.activeDocument.suspendHistory')).trim()];
    assert.ok(wrapper, file + ' wrapper must exist');
    const notices = [];
    const stub = documents => ({ alert: m => notices.push(m), app: { documents, get activeDocument() {
        if (!documents.length) throw new Error('No such element');
        return { suspendHistory: () => { throw new Error('host failure'); } };
    } } });
    assert.throws(() => vm.runInNewContext(wrapper[0], stub([{}])), /host failure/, file + ' must rethrow real errors');
    assert.equal(notices.length, 0, file + ' must not mislabel a real error as "no file open"');
    vm.runInNewContext(wrapper[0], stub([]));
    assert.equal(notices.length, 1, file + ' must still explain a missing document');
}
// Every Da dialog script must refuse non-RGB documents before opening its dialog.
for (const file of ['ss', 're', 'tc']) {
    assert.match(read('jsx/' + file + '.jsx'), /mode!==DocumentMode\.RGB/, file + ' must guard RGB mode');
}
// Local smoother (clean-room rewrite of LS): registers LS, guards RGB, runs as one history step.
assert.match(read('jsx/local-smoother.jsx'), /\$\._ext_LS\s*=\s*\{[\s\S]*DocumentMode\.RGB[\s\S]*suspendHistory/, 'LS registers, guards RGB and runs as one history step');
// Teeth whitening (clean-room rewrite): registers WT, does nothing outside RGB, runs as one history step.
assert.match(read('jsx/white-teeth.jsx'), /\$\._ext_WT\s*=\s*\{[\s\S]*DocumentMode\.RGB[\s\S]*suspendHistory/, 'WT registers, guards RGB and runs as one history step');
// Dodge & Burn (clean-room rewrite): registers DB, one history step, RGB-only guard.
assert.match(read('jsx/dodge-burn.jsx'), /\$\._ext_DB\s*=\s*\{[\s\S]*DocumentMode\.RGB[\s\S]*suspendHistory/, 'DB registers, guards RGB and runs as one history step');
// Clear History wiped the user's undo stack (was the tail of MBPF).
assert.doesNotMatch(mainAndSkins, /clearEvent/, 'no command may clear the document history');
// Da commands without a dialog: run the real $.dr7SkinStep from main.jsx against a stub host.
const skinSource = main.slice(main.indexOf('$.dr7SkinStep = function'), main.indexOf('// Each skin-*.jsx file registers'));
const skinNotices = [], steps = [];
const skinDoc = { mode: 'RGB', suspendHistory(title, code) { steps.push(title); vm.runInNewContext(code, skinHost); } };
const skinHost = { $: {}, DocumentMode: { RGB: 'RGB' }, alert: m => skinNotices.push(m), app: { activeDocument: skinDoc } };
vm.runInNewContext(skinSource, skinHost);
let skinRan = 0;
skinHost.$.dr7SkinStep('DR7 test', () => { skinRan++; })();
assert.deepEqual([skinRan, steps, skinNotices.length], [1, ['DR7 test'], 0], 'RGB must run as one history step');
assert.throws(() => skinHost.$.dr7SkinStep('DR7 test', () => { throw new Error('host failure'); })(), /host failure/,
    'a failure must reach the panel bridge');
assert.equal(skinHost.$.dr7SkinStepBody, null, 'the step body must not leak after a failure');
skinDoc.mode = 'CMYK';
skinHost.$.dr7SkinStep('DR7 test', () => { skinRan++; })();
assert.deepEqual([skinRan, skinNotices.length], [1, 1], 'non-RGB must explain and not run');
assert.match(read('jsx/tone-group.jsx'),/\$\._ext_BTNPFSD2\s*=\s*\{[\s\S]*suspendHistory/, 'Mau tong registers BTNPFSD2 and runs as one history step');
// Every skin command lives in its own skin-*.jsx and registers itself; the table is built from that registry.
const skinNames = ['DKACR', 'FSJH', 'GGXS', 'JMXS', 'MBPF', 'TJSH', 'TJYY', 'ZCZQ'];
const registeredBy = {};
for (const name of skinFiles) {
    const source = read('jsx/' + name);
    for (const m of source.matchAll(/\$\.dr7SkinFns\.([A-Z]+) = ([A-Z]+);/g)) {
        assert.equal(m[1], m[2], name + ' must register its own function');
        assert.match(source, new RegExp('^function ' + m[1] + '\\(\\) \\{', 'm'), name + ' must declare ' + m[1]);
        registeredBy[m[1]] = name;
    }
}
assert.deepEqual(Object.keys(registeredBy).sort(), skinNames, 'every skin command must be registered by exactly one skin file');
const buildHost = fns => {
    const host = { $: { dr7Commands: {}, dr7LoadErrors: [], dr7SkinFns: fns }, DocumentMode: { RGB: 'RGB' }, alert() {}, app: {} };
    vm.runInNewContext(main, host);
    host.$.dr7SkinFns = fns;
    host.$.dr7BuildSkinCommands();
    return host.$;
};
const allFns = Object.fromEntries(skinNames.map(name => [name, () => name]));
let built = buildHost(allFns);
assert.deepEqual(Object.keys(built.dr7Commands).sort(), skinNames, 'all skin commands are exposed');
assert.equal(built.dr7LoadErrors.length, 0);
assert.equal(built.dr7Commands.TJSH, allFns.TJSH, 'unwrapped commands are the registered function itself');
const { GGXS: dropped1, TJSH: dropped2, ...partial } = allFns;
built = buildHost(partial);
assert.deepEqual(Object.keys(built.dr7Commands).sort(), skinNames.filter(n => n !== 'GGXS' && n !== 'TJSH'),
    'a skin file that did not load must not leave a broken command behind');
assert.deepEqual([...built.dr7LoadErrors].sort(), ['skin command not registered: GGXS', 'skin command not registered: TJSH'],
    'a missing skin file must be reported through dr7LoadErrors');
for (const name of ['DnB_Brush.tpl', 'DS4_Soft_Brush.tpl', 'dsPickColor.png',
    'dsSelection.png', 'dsTransform.png', 'eyesSelection.png', 'localSmoother.png',
    'maskSamplers.png', 'removerDialog.png', 'removerSelection.png']) {
    assert.ok(fs.statSync(path.join(root, 'jsx/pj', name)).size > 0);
}
for (const [name, expected] of [['DnB_Brush.tpl', 'DR7 Dodge & Burn'], ['DS4_Soft_Brush.tpl', 'DR7 Soft Brush']]) {
    const binary = fs.readFileSync(path.join(root, 'jsx/pj', name));
    assert.ok(binary.swap16().toString('utf16le').includes(expected), 'preset name must match script');
}
for (const name of ['CGYSB', 'MLXG', 'mcwl', 'sfb']) {
    assert.match(read('jsx/mhk-replacements.jsx'), new RegExp('\\b' + name + ': function'));
}
// Catch incomplete/wrong native exports, and validate each generated RGB tile record.
const pat = fs.readFileSync(path.join(root,'jsx/pj/mhk-patterns.pat'));
assert.equal(pat.toString('ascii',0,4),'8BPT');
assert.equal(pat.readUInt32BE(6),8);
let offset = 10;
for (const [index,name] of ['Grain','Weave','Coarse','Lines','Dots','Blossom','Lotus','Stars'].entries()) {
    assert.equal(pat.readUInt32BE(offset),1);
    assert.equal(pat.readUInt32BE(offset+4),3);
    offset += 12;
    const length=pat.readUInt32BE(offset); offset+=4;
    assert.equal(Buffer.from(pat.subarray(offset,offset+length*2)).swap16().toString('utf16le'),'MHK '+name+' v1\0');
    offset+=length*2;
    const idLength=pat[offset++];
    assert.equal(pat.toString('ascii',offset,offset+idLength),'7153d9a1-6e46-4cbc-a782-00000000000'+index);
    offset+=idLength;
    assert.equal(pat.readUInt32BE(offset),3);
    offset+=8+pat.readUInt32BE(offset+4);
}
assert.equal(offset,pat.length,'PAT records must consume the complete file');
// Exercise actual bridge-generated code; the transport is replaced, not the handler.
const calls = [], alerts = [];
const bodyClasses = new Set();
const panel = { JSON, alert: message => alerts.push(message), SystemPath: { EXTENSION: 0 },
    document: { body: { classList: { add: c => bodyClasses.add(c), remove: c => bodyClasses.delete(c) } } } };
panel.window = panel;
let reloads = 0;
panel.location = { reload: () => { reloads++; } };
panel.CSInterface = function () {
    this.getSystemPath = () => 'D:/DR7';
    this.evalScript = (code, callback) => calls.push({ code, callback });
};
vm.runInNewContext(read('js/panel.js'), panel);
panel.doa('GGXS');
assert.equal(calls.length, 1, 'must wait for loader callback');
calls[0].callback('DR7_READY');
// The ScriptUI crash workaround must run once the core is ready, not from body onload (always too early).
assert.equal(calls.length, 2, 'ready must dispatch the BUGFIX workaround');
assert.match(calls[1].code, /\$\._ext_BUGFIX\.run/);
assert.doesNotMatch(read('index.html'), /onClickButton\('BUGFIX'\)/, 'BUGFIX must not fire before the loader is ready');
calls.pop().callback('DR7_OK');
let ran = 0;
const host = { app: { documents: [{}], displayDialogs: 1, preferences: { rulerUnits: 2 } }, $: { dr7Commands: {} } };
host.$.dr7Commands.GGXS = () => {
    ran++;
    host.app.displayDialogs = 9;
    host.app.preferences.rulerUnits = 8;
    throw Object.assign(new Error('test failure'), { line: 42, fileName: 'main.jsx' });
};
panel.doa('GGXS');
panel.doa('GGXS');
assert.equal(calls.length, 2, 'must not queue double clicks');
assert.ok(bodyClasses.has('is-busy'), 'panel must show the busy state while a command runs');
assert.equal(panel.dr7Reload(), false, 'reload must not interrupt a command');
assert.equal(reloads, 0);
const result = vm.runInNewContext(calls[1].code, host);
assert.equal(ran, 1);
assert.match(result, /test failure[\s\S]*main.jsx[\s\S]*42/);
assert.equal(host.app.displayDialogs, 1);
assert.equal(host.app.preferences.rulerUnits, 2);
calls[1].callback(result);
assert.ok(!bodyClasses.has('is-busy'), 'busy state must clear when the command ends');
assert.equal(panel.dr7Reload(), true);
assert.equal(reloads, 1);
panel.doa('GGXS');
assert.equal(calls.length, 3, 'failure must release busy state');
host.app.documents = [];
assert.equal(vm.runInNewContext(calls[2].code, host), 'DR7_NO_DOCUMENT');
assert.equal(ran, 1, 'no document must not invoke handler');
calls[2].callback('DR7_NO_DOCUMENT');
// Preset buttons pass the bundled file name as a JS string literal; unsafe names never reach Photoshop.
for (const bad of ['../evil.xmp', 'a"b.xmp', 'a\b.xmp', 'notes.txt', '.xmp']) panel.dr7ApplyPreset(bad);
assert.equal(calls.length, 3, 'unsafe preset names must be rejected by the bridge');
panel.dr7ApplyPreset('MHK05451.xmp');
assert.equal(calls.length, 4, 'a valid bundled preset must be sent');
host.app.documents = [{}];
const applied = [];
host.$.dr7ApplyBundledXmp = name => { applied.push(name); };
assert.equal(vm.runInNewContext(calls[3].code, host), 'DR7_OK');
assert.deepEqual(applied, ['MHK05451.xmp']);
calls[3].callback('DR7_OK');
// Batch skin (BA) processes the open documents, so it needs one; WM picks its own folders.
host.app.documents = [];
host.$._ext_BA = { run: () => { throw new Error('BA must not run without a document'); } };
host.$._ext_WM = { run: () => {} };
panel.onClickButton('BA');
assert.equal(vm.runInNewContext(calls[4].code, host), 'DR7_NO_DOCUMENT');
calls[4].callback('DR7_NO_DOCUMENT');
panel.onClickButton('WM');
assert.equal(vm.runInNewContext(calls[5].code, host), 'DR7_OK');
calls[5].callback('DR7_OK');
assert.throws(() => acrHost.$.dr7ApplyBundledXmp('../../secret.xmp'), /Invalid preset name/,
    'the host must re-check preset names before touching the file system');
// Bundled action: spec "file<TAB>set<TAB>action" with plain characters only; the host imports the set when missing, then plays.
const sent = calls.length, alertsBefore = alerts.length;
const specOf = (...parts) => parts.join('\t');
for (const bad of [specOf('../evil.atn', 'Set', 'Act'), specOf('a"b.atn', 'Set', 'Act'), specOf('notes.txt', 'Set', 'Act'),
    specOf('x.atn', 'Set'), specOf('x.atn', 'Se"t', 'Act'), specOf('x.atn', 'Set', 'A\nct')]) {
    panel.dr7EnsureAction(bad);
    panel.dr7PlayAction(bad);
}
assert.equal(calls.length, sent, 'unsafe action specs must be rejected by the bridge');
const spec = specOf('Thumbnail_action.atn', 'Thumbnail action', 'Stroke Brush Path');
const atnResults = [];
panel.dr7EnsureAction(spec, res => atnResults.push(res));
assert.equal(calls.length, sent + 1, 'a valid bundled action must be sent');
panel.dr7PlayAction(spec);
assert.equal(calls.length, sent + 1, 'a second command must wait while the first one is running');
const atnHost = {
    app: { documents: [], displayDialogs: 1, preferences: { rulerUnits: 2 }, load: file => atnHost.loaded.push(file.name) },
    loaded: [], asked: [], played: [],
    $: {
        dr7Base: root,
        dr7ShortcutSetup: { exists: (set, action) => { atnHost.asked.push([set, action]); return action === null ? atnHost.setPresent : atnHost.actionPresent; } }
    },
    ActionReference: function () { this.names = {}; this.putName = (cls, name) => { this.names[cls] = name; }; },
    ActionDescriptor: function () { this.putReference = (key, ref) => { this.ref = ref; }; },
    charIDToTypeID: id => id,
    DialogModes: { NO: 3 },
    executeAction: (event, desc) => atnHost.played.push([event, desc.ref.names.ASet, desc.ref.names.Actn]),
    File: function (file) {
        this.name = path.basename(file); this.fsName = file; this.exists = fs.existsSync(file);
        let data = null, at = 0;
        this.open = () => { data = fs.readFileSync(file); at = 0; return true; };
        this.read = count => { const text = data.subarray(at, at + count).toString('latin1'); at += count; return text; };
        this.close = () => { data = null; };
    }
};
vm.runInNewContext(read('jsx/action-set-import.jsx'), atnHost);
atnHost.setPresent = false; atnHost.actionPresent = false;
assert.equal(vm.runInNewContext(calls[sent].code, atnHost), 'DR7_OK', 'ensure must work without an open document');
assert.deepEqual(atnHost.asked, [['Thumbnail action', 'Stroke Brush Path'], ['Thumbnail action', null], ['Thumbnail action', null]],
    'the set name must be read from the .atn header before loading');
assert.deepEqual(atnHost.loaded, ['Thumbnail_action.atn']);
atnHost.setPresent = true; atnHost.actionPresent = true;
assert.equal(vm.runInNewContext(calls[sent].code, atnHost), 'DR7_EXISTS', 'an existing action must be kept, not loaded twice');
assert.equal(atnHost.loaded.length, 1);
atnHost.setPresent = true; atnHost.actionPresent = false;
assert.match(vm.runInNewContext(calls[sent].code, atnHost), /^DR7_ERROR.*has no action/, 'a set missing the action must not be overwritten');
assert.equal(atnHost.loaded.length, 1);
calls[sent].callback('DR7_EXISTS');
assert.deepEqual(atnResults, ['DR7_EXISTS']);
assert.equal(alerts.length, alertsBefore, 'DR7_EXISTS must not raise an alert');
panel.dr7PlayAction(spec);
assert.equal(calls.length, sent + 2);
assert.match(calls[sent + 1].code, /documents\.length/, 'playing needs an open document');
atnHost.actionPresent = true;
assert.equal(vm.runInNewContext(calls[sent + 1].code, Object.assign(atnHost, { app: Object.assign(atnHost.app, { documents: [{}] }) })), 'DR7_OK');
assert.deepEqual(atnHost.played, [['Ply ', 'Thumbnail action', 'Stroke Brush Path']]);
calls[sent + 1].callback('DR7_OK');
assert.throws(() => vm.runInNewContext('$.dr7ImportBundledAtn("../x.atn")', atnHost),
    /Invalid action file name/, 'the host must re-check the file name');
// Shortcut set rename: installing replaces the new set and removes the legacy "MHK DR7" set of older versions.
{
    const sets = { 'MHK DR7': ['▶ Old'], 'SCCTLM_Foto': ['▶ Current'], 'Default Actions': ['Gradient Map'] };
    const deleted = [], written = [];
    const setHost = {
        charIDToTypeID: id => id, stringIDToTypeID: id => id,
        ActionReference: function () { this.idx = {}; this.putIndex = (cls, i) => { this.idx[cls] = i; }; this.putName = (cls, n) => { this.name = n; }; },
        ActionDescriptor: function () { this.putReference = (k, r) => { this.ref = r; }; this.toStream = () => 'vers'; },
        DialogModes: { NO: 0 },
        executeAction: (event, desc) => { if (event === 'Dlt ') { deleted.push(desc.ref.name); delete sets[desc.ref.name]; } },
        executeActionGet: ref => {
            const names = Object.keys(sets), set = names[ref.idx.ASet - 1];
            if (!set) throw new Error('past the last set');
            if (ref.idx.Actn) return { getString: () => sets[set][ref.idx.Actn - 1] };
            return { getString: () => set, hasKey: () => true, getInteger: () => sets[set].length };
        },
        File: function (f) { this.open = () => true; this.write = d => { written.push(d); }; this.close = () => {}; this.remove = () => {}; },
        Folder: { temp: 'T' },
        app: { load: () => {} },
        $: {}
    };
    vm.runInNewContext(read('jsx/action-shortcut-setup.jsx'), setHost);
    const setup = setHost.$.dr7ShortcutSetup;
    assert.equal(setup.SET_NAME, 'SCCTLM_Foto');
    assert.equal(setup.listActions(), 'Default Actions	Gradient Map', 'both play-wrapper sets stay out of the picker');
    assert.equal(setup.install('Shift+F3	Default Actions	Gradient Map'), 1);
    assert.deepEqual(deleted.sort(), ['MHK DR7', 'SCCTLM_Foto'], 'both the current and the legacy set must be removed');
    assert.equal(setup.install('Shift+F3	MHK DR7	▶ Old'), 0, 'the legacy set is never a shortcut target');
}
// Keys for bundled actions go onto a reloaded copy of the bundled set; other actions still get a play wrapper.
{
    const atnPath = path.join(root, 'presets', 'Thumbnail_action.atn');
    const original = fs.readFileSync(atnPath);
    const sets = { 'Thumbnail action': ['Stroke Brush Path', 'YouTube Rim Light'], 'SCCTLM_Foto': ['▶ YouTube Rim Light (Thumbnail action)'], 'Default Actions': ['Gradient Map'] };
    const deleted = [], written = [], loaded = [];
    const bundledFile = { name: 'Thumbnail_action.atn', fsName: atnPath };
    function FileMock(file) {
        let data = null, at = 0;
        Object.assign(this, file && file.fsName ? file : { name: path.basename(String(file)), fsName: String(file) });
        this.open = mode => { if (mode !== 'w') { data = fs.readFileSync(this.fsName); at = 0; } return true; };
        this.read = count => { const end = count === undefined ? data.length : at + count; const text = data.subarray(at, end).toString('latin1'); at = end; return text; };
        this.write = text => written.push(Buffer.from(text, 'latin1'));
        this.close = () => {};
        this.remove = () => {};
    }
    const host = {
        charIDToTypeID: id => id, stringIDToTypeID: id => id,
        ActionReference: function () { this.idx = {}; this.putIndex = (cls, i) => { this.idx[cls] = i; }; this.putName = (cls, n) => { this.name = n; }; },
        ActionDescriptor: function () { this.putReference = (k, r) => { this.ref = r; }; this.putName = () => {}; this.toStream = () => 'vers'; },
        DialogModes: { NO: 0 },
        executeAction: (event, desc) => { if (event === 'Dlt ') { deleted.push(desc.ref.name); delete sets[desc.ref.name]; } },
        executeActionGet: ref => {
            const names = Object.keys(sets), set = names[ref.idx.ASet - 1];
            if (!set) throw new Error('past the last set');
            if (ref.idx.Actn) return { getString: () => sets[set][ref.idx.Actn - 1] };
            return { getString: () => set, hasKey: () => true, getInteger: () => sets[set].length };
        },
        File: FileMock,
        Folder: Object.assign(function () { this.getFiles = () => [Object.assign(new FileMock(bundledFile), { constructor: FileMock })]; }, { temp: 'T' }),
        app: { load: file => loaded.push(file.name) },
        $: { dr7Base: root }
    };
    host.File.prototype = FileMock.prototype;
    vm.runInNewContext(read('jsx/action-shortcut-setup.jsx'), host);
    vm.runInNewContext(read('jsx/action-set-import.jsx'), host);
    const setup = host.$.dr7ShortcutSetup;
    assert.equal(setup.hasBundledWrapper(), true, 'an old wrapper for a bundled action must be detected');
    assert.equal(setup.install('F5\tThumbnail action\tYouTube Rim Light\nShift+F3\tDefault Actions\tGradient Map'), 2);
    assert.deepEqual(deleted, ['SCCTLM_Foto', 'Thumbnail action'], 'the wrapper set and the old bundled set are replaced');
    assert.deepEqual(loaded, ['dr7-bundled-keys.atn', 'dr7-shortcut.atn']);
    const [baked, wrappers] = written;
    assert.equal(baked.length, original.length, 'only key bytes change');
    const diff = [...baked.keys()].filter(i => baked[i] !== original[i]);
    const rimName = original.indexOf(Buffer.from('\u0000\u0000\u0000\u0012' + 'YouTube Rim Light'.split('').map(c => '\u0000' + c).join(''), 'latin1'));
    assert.ok(rimName > 0);
    assert.deepEqual(diff, [rimName - 5], 'F5 is written as the u16 key of YouTube Rim Light, nothing else changes');
    assert.equal(baked.readUInt16BE(rimName - 6), 5);
    assert.ok(!wrappers.toString('latin1').includes('Y\u0000o\u0000u\u0000T'), 'no wrapper for the bundled action');
    assert.ok(wrappers.toString('latin1').includes('G\u0000r\u0000a\u0000d'), 'other actions keep their play wrapper');
    assert.equal(setup.hasBundledWrapper(), false);
}
console.log('PASS: ' + names.length + ' doa exports, JSX syntax/encoding/resources, bridge readiness/errors/preferences/double clicks/preset names, atn import');
