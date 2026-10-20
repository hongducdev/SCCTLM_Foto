// Run: node tests/check-github-updater.js
// Executes the real js/github-updater.js against a fake GitHub (XHR) and an in-memory cep.fs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/github-updater.js'), 'utf8');
const BASE = 'C:/ext/DR7';
const manifest = version => '<ExtensionManifest ExtensionBundleVersion="' + version + '"><ExtensionList>' +
    '<Extension Id="com.retouchpanel.panel" Version="' + version + '" /></ExtensionList></ExtensionManifest>';

function setup(routes, disk) {
    const requests = [];
    const files = new Map(Object.entries(disk).map(([k, v]) => [BASE + '/' + k, Buffer.from(v)]));
    const dirs = new Set([BASE]);
    const writes = [];
    function XMLHttpRequest() {}
    XMLHttpRequest.prototype.open = function (method, url) { this.url = url; };
    XMLHttpRequest.prototype.send = function () {
        requests.push(this.url);
        const route = routes[this.url];
        setImmediate(() => {
            if (route === 'network') return this.onerror();
            this.status = route === undefined ? 404 : 200;
            const body = route === undefined ? '{"message":"Not Found"}' : route;
            if (this.responseType === 'arraybuffer') {
                const b = Buffer.from(body);
                this.response = b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
            } else this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
            this.onload();
        });
    };
    const cep = {
        encoding: { UTF8: 'UTF-8', Base64: 'Base64' },
        fs: {
            readFile: p => files.has(p) ? { err: 0, data: files.get(p).toString('utf8') } : { err: 3 },
            stat: p => files.has(p) || dirs.has(p) ? { err: 0 } : { err: 3 },
            makedir: p => { dirs.add(p); return { err: 0 }; },
            writeFile: (p, data, enc) => {
                writes.push(p);
                files.set(p, enc === 'Base64' ? Buffer.from(data, 'base64') : Buffer.from(data));
                return { err: 0 };
            },
            deleteFile: p => { files.delete(p); return { err: 0 }; }
        }
    };
    const window = { XMLHttpRequest, cep, btoa: s => Buffer.from(s, 'binary').toString('base64'),
        Promise, TextDecoder, JSON, Object, Uint8Array, String, encodeURIComponent, Error };
    window.window = window;
    vm.runInNewContext(source, window);
    return { updater: window.dr7Updater, requests, files, writes, read: p => files.get(BASE + '/' + p) };
}

// Objects from the vm realm have foreign prototypes; compare their JSON shape.
const plain = value => JSON.parse(JSON.stringify(value));
const API = 'https://api.github.com/repos/hongducdev/SCCTLM_Foto';
const RAW = 'https://raw.githubusercontent.com/hongducdev/SCCTLM_Foto/v1.1.0/';
const release = JSON.stringify({ tag_name: 'v1.1.0', name: 'DR7 1.1.0', body: 'notes', html_url: 'u' });
const tree = entries => JSON.stringify({ truncated: false, tree: entries.map(([p, sha]) => ({ path: p, type: 'blob', sha })) });

(async () => {
    // check(): version compare against the installed manifest; no release yet -> not available.
    let t = setup({}, { 'CSXS/manifest.xml': manifest('1.0.0') });
    assert.deepEqual(plain(await t.updater.check(BASE)), { current: '1.0.0', latest: null, available: false });
    t = setup({ [API + '/releases/latest']: release }, { 'CSXS/manifest.xml': manifest('1.0.0') });
    let result = await t.updater.check(BASE);
    assert.equal(result.available, true);
    assert.equal(result.latest.tag, 'v1.1.0');
    t = setup({ [API + '/releases/latest']: release }, { 'CSXS/manifest.xml': manifest('1.1.0') });
    assert.equal((await t.updater.check(BASE)).available, false, 'same version must not offer an update');
    assert.equal(t.updater.isNewer('v1.10.0', '1.9.9'), true, 'versions compare numerically');
    assert.equal(t.updater.isNewer('nightly', '1.0.0'), false, 'non-semver tags are ignored');

    // update(): only changed runtime files are downloaded; others are filtered out.
    const routes = {
        [API + '/git/trees/v1.1.0?recursive=1']: tree([
            ['index.html', 'h2'], ['CSXS/manifest.xml', 'm2'], ['jsx/main.jsx', 'same'], ['img/new icon.png', 'p1'],
            ['README.md', 'r'], ['tests/check.js', 't'], ['install/Cai-dat-SCCTLM_Foto.bat', 'b'], ['jsx/../../evil.jsx', 'e']
        ]),
        [RAW + 'index.html']: '<html>new</html>',
        [RAW + 'CSXS/manifest.xml']: manifest('1.1.0'),
        [RAW + 'img/new%20icon.png']: '\u0000\u00ffPNG'
    };
    const record = JSON.stringify({ version: 'v1.0.0', files: { 'index.html': 'h1', 'jsx/main.jsx': 'same',
        'jsx/old.jsx': 'o1', 'CSXS/manifest.xml': 'm1' } });
    const disk = { 'CSXS/manifest.xml': manifest('1.0.0'), 'index.html': '<html>old</html>', 'jsx/main.jsx': 'keep',
        'jsx/old.jsx': 'stale', 'jsx/user-notes.txt': 'not tracked', '.dr7-version.json': record };
    t = setup(routes, disk);
    const progress = [];
    result = await t.updater.update(BASE, 'v1.1.0', (done, total) => progress.push(done + '/' + total));
    assert.deepEqual(plain(result.changed).sort(), ['CSXS/manifest.xml', 'img/new icon.png', 'index.html']);
    assert.deepEqual(plain(result.removed), ['jsx/old.jsx'], 'only files from the previous release are removed');
    assert.equal(result.restart, false, 'a version-only manifest change needs no restart');
    assert.deepEqual(progress, ['0/3', '1/3', '2/3', '3/3']);
    assert.equal(t.read('index.html').toString(), '<html>new</html>');
    assert.deepEqual([...t.read('img/new icon.png')], [...Buffer.from('\u0000\u00ffPNG')], 'binary files survive Base64');
    assert.equal(t.read('jsx/main.jsx').toString(), 'keep', 'unchanged files are not downloaded');
    assert.equal(t.read('jsx/old.jsx'), undefined);
    assert.equal(t.read('jsx/user-notes.txt').toString(), 'not tracked', 'unknown files are never deleted');
    assert.ok(!t.requests.some(u => /README|tests|install|evil/.test(u)), 'non-runtime paths must not be fetched');
    assert.ok(!t.files.has('C:/evil.jsx') && !t.files.has('C:/ext/evil.jsx'), 'path traversal must be rejected');
    const saved = JSON.parse(t.read('.dr7-version.json'));
    assert.equal(saved.version, 'v1.1.0');
    assert.equal(saved.files['img/new icon.png'], 'p1');

    // A manifest whose structure changes needs a Photoshop restart.
    t = setup(Object.assign({}, routes, { [RAW + 'CSXS/manifest.xml']: manifest('1.1.0').replace('</ExtensionList>',
        '</ExtensionList><CEFCommandLine/>') }), disk);
    assert.equal((await t.updater.update(BASE, 'v1.1.0')).restart, true);

    // A download failing midway writes nothing.
    t = setup(Object.assign({}, routes, { [RAW + 'index.html']: 'network' }), disk);
    await assert.rejects(t.updater.update(BASE, 'v1.1.0'), /GitHub/);
    assert.deepEqual(t.writes, [], 'no file may be written before every download succeeds');
    assert.equal(t.read('index.html').toString(), '<html>old</html>');

    // Bundled presets (the bulk of the repo) are never re-downloaded while their sha is unchanged:
    // one changed JS file among many unchanged presets = exactly one raw download.
    const presets = [];
    for (const group of ['dazz', 'fuji', 'kodak']) for (let i = 1; i <= 40; i += 1) presets.push('presets/colors/' + group + '/' + String(i).padStart(3, '0') + '.xmp');
    presets.push('presets/My Preset (1).xmp', 'presets/MHK05451.xmp');
    const presetTree = presets.map(p => [p, 'sha:' + p]);
    const lightRoutes = {
        [API + '/git/trees/v1.1.0?recursive=1']: tree([['index.html', 'h1'], ['CSXS/manifest.xml', 'm1'], ['js/panel.js', 'new'], ...presetTree]),
        [RAW + 'js/panel.js']: 'new panel'
    };
    const lightRecord = { version: 'v1.0.0', files: { 'index.html': 'h1', 'CSXS/manifest.xml': 'm1', 'js/panel.js': 'old' } };
    const lightDisk = { 'CSXS/manifest.xml': manifest('1.0.0'), 'index.html': 'i', 'js/panel.js': 'old panel' };
    for (const [p, sha] of presetTree) { lightRecord.files[p] = sha; lightDisk[p] = 'preset'; }
    lightDisk['.dr7-version.json'] = JSON.stringify(lightRecord);
    t = setup(lightRoutes, lightDisk);
    result = await t.updater.update(BASE, 'v1.1.0');
    assert.deepEqual(plain(result.changed), ['js/panel.js'], 'only the changed JS file is selected');
    const rawRequests = t.requests.filter(u => u.startsWith('https://raw.githubusercontent.com/'));
    assert.deepEqual(rawRequests, [RAW + 'js/panel.js'], 'unchanged presets are not downloaded (' + presets.length + ' presets in the tree)');
    assert.equal(t.read('js/panel.js').toString(), 'new panel');
    assert.equal(t.writes.filter(w => /presets\//.test(w)).length, 0, 'unchanged presets are not rewritten');

    // A preset deleted locally (same sha in the record) is fetched again.
    const missing = 'presets/colors/fuji/007.xmp';
    const missingDisk = Object.assign({}, lightDisk);
    delete missingDisk[missing];
    t = setup(Object.assign({}, lightRoutes, { [RAW + missing]: 'restored preset' }), missingDisk);
    result = await t.updater.update(BASE, 'v1.1.0');
    assert.deepEqual(plain(result.changed).sort(), ['js/panel.js', missing].sort(), 'a preset missing on disk is selected for download');
    assert.equal(t.read(missing).toString(), 'restored preset');

    // A release tree without the plugin files is refused; odd tags never reach the network.
    t = setup({ [API + '/git/trees/v1.1.0?recursive=1']: tree([['README.md', 'r']]) }, disk);
    await assert.rejects(t.updater.update(BASE, 'v1.1.0'), /thiếu file plugin/);
    t = setup({}, disk);
    await assert.rejects(t.updater.update(BASE, '../main'), /Tag/);
    assert.equal(t.requests.length, 0);
    console.log('PASS: release check/version compare, incremental download, whitelist/traversal, removal, restart, atomic failure');
})().catch(error => { console.error(error); process.exitCode = 1; });
