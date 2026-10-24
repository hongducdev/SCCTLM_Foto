// Run: node tests/check-github-updater.js
// Executes the real js/github-updater.js (with the real verifier and vendored tweetnacl) against a fake
// GitHub (XHR) and an in-memory cep.fs. Releases are signed with a throwaway Ed25519 key.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { signBytes, publicKeyBase64 } = require('../scripts/release-lib');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name), 'utf8');
const BASE = 'C:/ext/DR7';
const manifest = version => '<ExtensionManifest ExtensionBundleVersion="' + version + '"><ExtensionList>' +
    '<Extension Id="com.retouchpanel.panel" Version="' + version + '" /></ExtensionList></ExtensionManifest>';
const sha512 = data => crypto.createHash('sha512').update(data).digest('hex');
const MTIME = 1000;

const pem = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const otherPem = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEYS = { k1: publicKeyBase64(pem) };

function setup(routes, disk, stamps = {}) {
    const requests = [];
    const files = new Map(Object.entries(disk).map(([k, v]) => [BASE + '/' + k, Buffer.from(v)]));
    const mtimes = new Map([...files.keys()].map(k => [k, stamps[k.slice(BASE.length + 1)] || MTIME]));
    const dirs = new Set([BASE]);
    const writes = [];
    const hashedReads = [];
    let clock = 5000;
    function XMLHttpRequest() {}
    XMLHttpRequest.prototype.open = function (method, url) { this.url = url; };
    XMLHttpRequest.prototype.send = function () {
        requests.push(this.url);
        const route = routes[this.url];
        setImmediate(() => {
            if (route === 'network') return this.onerror();
            if (route && route.status) { this.status = route.status; this.responseText = ''; return this.onload(); }
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
            readFile: (p, enc) => {
                if (!files.has(p)) return { err: 3 };
                if (enc === 'Base64') { hashedReads.push(p); return { err: 0, data: files.get(p).toString('base64') }; }
                return { err: 0, data: files.get(p).toString('utf8') };
            },
            stat: p => files.has(p)
                ? { err: 0, data: { mtime: new Date(mtimes.get(p)), isDirectory: () => false } }   // like the real cep.fs.stat: no size
                : dirs.has(p) ? { err: 0, data: { isDirectory: () => true } } : { err: 3 },
            makedir: p => { dirs.add(p); return { err: 0 }; },
            writeFile: (p, data, enc) => {
                writes.push(p);
                files.set(p, enc === 'Base64' ? Buffer.from(data, 'base64') : Buffer.from(data));
                mtimes.set(p, clock++);
                return { err: 0 };
            },
            deleteFile: p => { files.delete(p); return { err: 0 }; }
        }
    };
    const window = { XMLHttpRequest, cep, btoa: s => Buffer.from(s, 'binary').toString('base64'),
        atob: s => Buffer.from(s, 'base64').toString('binary'), crypto: crypto.webcrypto, isSecureContext: true,
        Promise, TextDecoder, JSON, Object, Uint8Array, String, encodeURIComponent, Error };
    window.window = window;
    window.self = window;
    vm.runInNewContext(source('vendor/tweetnacl.min.js'), window);
    window.dr7ReleaseKeys = KEYS;
    vm.runInNewContext(source('release-manifest-verifier.js'), window);
    vm.runInNewContext(source('github-updater.js'), window);
    return { updater: window.dr7Updater, requests, files, mtimes, writes, hashedReads, read: p => files.get(BASE + '/' + p) };
}

// Objects from the vm realm have foreign prototypes; compare their JSON shape.
const plain = value => JSON.parse(JSON.stringify(value));
const API = 'https://api.github.com/repos/hongducdev/SCCTLM_Foto';
const rawOf = tag => 'https://raw.githubusercontent.com/hongducdev/SCCTLM_Foto/' + tag + '/';
const release = JSON.stringify({ tag_name: 'v1.1.0', name: 'DR7 1.1.0', body: 'notes', html_url: 'u' });

// Routes for a signed release: manifest + signature + the files themselves.
function signedRelease(version, content, { key = pem, extra = {}, minVersion = '0.2.0', tag = 'v' + version } = {}) {
    const hashes = {};
    for (const [file, data] of Object.entries(content)) hashes[file] = sha512(data);
    const bytes = JSON.stringify({ format: 1, keyId: 'k1', version, minVersion, files: { ...hashes, ...extra } }, null, 1) + '\n';
    const routes = { [rawOf(tag) + 'release-manifest.json']: bytes, [rawOf(tag) + 'release-manifest.json.sig']: signBytes(bytes, key) };
    for (const [file, data] of Object.entries(content)) routes[rawOf(tag) + file.split('/').map(encodeURIComponent).join('/')] = data;
    return routes;
}
const stampOf = data => ({ sha512: sha512(data), mtime: MTIME });

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

    // update() from a 0.1.9-style record (git sha strings): files already identical are hashed once, not downloaded.
    const content = { 'index.html': '<html>new</html>', 'CSXS/manifest.xml': manifest('1.1.0'), 'jsx/main.jsx': 'keep',
        'img/new icon.png': '\u0000\u00ffPNG' };
    const routes = signedRelease('1.1.0', content);
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
    assert.equal(t.read('jsx/main.jsx').toString(), 'keep', 'identical files are not downloaded');
    assert.equal(t.read('jsx/old.jsx'), undefined);
    assert.equal(t.read('jsx/user-notes.txt').toString(), 'not tracked', 'unknown files are never deleted');
    assert.ok(!t.requests.some(u => /git\/trees/.test(u)), 'the file list comes from the signed manifest, not the GitHub API');
    assert.equal(t.requests.length, 2 + 3, 'manifest + signature + the 3 changed files');
    const saved = JSON.parse(t.read('.dr7-version.json'));
    assert.equal(saved.version, 'v1.1.0');
    assert.equal(saved.files['jsx/main.jsx'].sha512, sha512('keep'), 'the record keeps hashes for unchanged files too');
    assert.ok(saved.files['index.html'].mtime > MTIME, 'the record stores the mtime of what was just written');
    assert.deepEqual(Object.keys(saved.files).sort(), Object.keys(content).sort());

    // A second update trusts the record's mtime: unchanged files are neither downloaded nor re-read.
    const next = { ...content, 'index.html': '<html>v3</html>', 'CSXS/manifest.xml': manifest('1.2.0') };
    const nextRoutes = signedRelease('1.2.0', next);
    const afterFirst = Object.fromEntries([...t.files].map(([p, data]) => [p.slice(BASE.length + 1), data]));
    const afterStamps = Object.fromEntries([...t.mtimes].map(([p, m]) => [p.slice(BASE.length + 1), m]));
    t = setup(nextRoutes, afterFirst, afterStamps);
    result = await t.updater.update(BASE, 'v1.2.0');
    assert.deepEqual(plain(result.changed).sort(), ['CSXS/manifest.xml', 'index.html']);
    assert.deepEqual(t.hashedReads.map(p => p.slice(BASE.length + 1)).sort(), ['CSXS/manifest.xml', 'index.html'],
        'only files whose record entry no longer matches are hashed locally');

    // A manifest whose structure changes needs a Photoshop restart.
    t = setup(signedRelease('1.1.0', { ...content, 'CSXS/manifest.xml': manifest('1.1.0').replace('</ExtensionList>',
        '</ExtensionList><CEFCommandLine/>') }), disk);
    assert.equal((await t.updater.update(BASE, 'v1.1.0')).restart, true);

    // A download failing midway writes nothing.
    t = setup({ ...routes, [rawOf('v1.1.0') + 'index.html']: 'network' }, disk);
    await assert.rejects(t.updater.update(BASE, 'v1.1.0'), /GitHub/);
    assert.deepEqual(t.writes, [], 'no file may be written before every download succeeds');
    assert.equal(t.read('index.html').toString(), '<html>old</html>');

    // Anything that fails verification aborts before the first write.
    async function refused(routeSet, pattern, label, installed = disk) {
        const run = setup(routeSet, installed);
        await assert.rejects(run.updater.update(BASE, 'v1.1.0'), pattern, label);
        assert.deepEqual(run.writes, [], label + ': nothing written');
        assert.equal(run.read('index.html').toString(), String(installed['index.html']), label + ': installed file untouched');
        return run;
    }
    const noSignature = /không có chữ ký hợp lệ — đã huỷ, không thay đổi file nào/;
    t = await refused(signedRelease('1.1.0', content, { key: otherPem }), noSignature, 'signed with another key');
    assert.ok(!t.requests.some(u => /index\.html/.test(u)), 'no file is downloaded for an unverified manifest');
    const tampered = { ...routes, [rawOf('v1.1.0') + 'release-manifest.json']: routes[rawOf('v1.1.0') + 'release-manifest.json'].replace('"k1"', '"k1" ') };
    await refused(tampered, noSignature, 'manifest edited after signing');
    await refused({ ...routes, [rawOf('v1.1.0') + 'release-manifest.json.sig']: 'garbage' }, noSignature, 'corrupt signature');
    await refused({ ...routes, [rawOf('v1.1.0') + 'index.html']: '<html>swapped by an attacker</html>' }, /không khớp chữ ký: index\.html/, 'file differs from the signed hash');
    await refused({}, /chưa có chữ ký phát hành/, 'release without a manifest (e.g. a 0.1.x tag)');
    await refused(signedRelease('1.2.0', content, { tag: 'v1.1.0' }), /bản 1\.2\.0, không phải v1\.1\.0/, 'signed for another version');
    await refused(signedRelease('1.1.0', content, { extra: { '../evil.js': 'a'.repeat(128) } }), /không hợp lệ.*evil/, 'path traversal inside a signed manifest');
    await refused(signedRelease('1.1.0', { 'jsx/main.jsx': 'keep' }), /thiếu file plugin/, 'release without the plugin files');
    await refused(signedRelease('1.1.0', content, { minVersion: '1.0.1' }), /cài lại thủ công/, 'installed version older than minVersion');

    // Downgrade protection: a validly signed but older (or equal) release is refused.
    const old = signedRelease('1.0.0', { ...content, 'CSXS/manifest.xml': manifest('1.0.0') }, { tag: 'v1.1.0' });
    await refused(old, /không phải v1\.1\.0/, 'old manifest served under a new tag');
    for (const [installed, tag] of [['1.1.0', 'v1.0.0'], ['1.1.0', 'v1.1.0'], ['1.2.0', 'v1.1.0']]) {
        const run = setup(signedRelease(tag.slice(1), content, { tag }), { 'CSXS/manifest.xml': manifest(installed), 'index.html': 'i' });
        await assert.rejects(run.updater.update(BASE, tag), /không mới hơn/, installed + ' -> ' + tag);
        assert.deepEqual(run.writes, []);
    }

    // Bundled presets (the bulk of the repo) are never re-downloaded while their record entry still matches the file.
    const presets = {};
    for (const group of ['dazz', 'fuji', 'kodak']) for (let i = 1; i <= 40; i += 1) presets['presets/colors/' + group + '/' + String(i).padStart(3, '0') + '.xmp'] = 'preset ' + group + i;
    presets['presets/My Preset (1).xmp'] = 'mine';
    const light = { 'index.html': 'i', 'CSXS/manifest.xml': manifest('1.1.0'), 'js/panel.js': 'new panel', ...presets };
    const lightRoutes = signedRelease('1.1.0', light);
    const lightRecord = { version: 'v1.0.0', files: { 'index.html': stampOf('i'), 'CSXS/manifest.xml': stampOf(manifest('1.0.0')), 'js/panel.js': stampOf('old panel') } };
    const lightDisk = { 'CSXS/manifest.xml': manifest('1.0.0'), 'index.html': 'i', 'js/panel.js': 'old panel' };
    for (const [p, data] of Object.entries(presets)) { lightRecord.files[p] = stampOf(data); lightDisk[p] = data; }
    lightDisk['.dr7-version.json'] = JSON.stringify(lightRecord);
    t = setup(lightRoutes, lightDisk);
    result = await t.updater.update(BASE, 'v1.1.0');
    assert.deepEqual(plain(result.changed).sort(), ['CSXS/manifest.xml', 'js/panel.js']);
    const downloaded = t.requests.filter(u => !/release-manifest/.test(u)).map(u => u.slice(rawOf('v1.1.0').length));
    assert.deepEqual(downloaded.sort(), ['CSXS/manifest.xml', 'js/panel.js'], 'unchanged presets are not downloaded (' + Object.keys(presets).length + ' presets)');
    assert.equal(t.writes.filter(w => /presets\//.test(w)).length, 0, 'unchanged presets are not rewritten');
    assert.ok(!t.hashedReads.some(p => /presets\//.test(p)), 'unchanged presets are not read back for hashing either');

    // A preset deleted locally is fetched again; one edited locally (mtime differs from the record) is restored.
    const missing = 'presets/colors/fuji/007.xmp', edited = 'presets/colors/kodak/003.xmp';
    const brokenDisk = { ...lightDisk }; delete brokenDisk[missing]; brokenDisk[edited] = 'locally edited preset';
    t = setup(lightRoutes, brokenDisk, { [edited]: MTIME + 77 });
    result = await t.updater.update(BASE, 'v1.1.0');
    assert.deepEqual(plain(result.changed).sort(), ['CSXS/manifest.xml', edited, 'js/panel.js', missing].sort());
    assert.equal(t.read(missing).toString(), presets[missing]);
    assert.equal(t.read(edited).toString(), presets[edited]);

    // Odd tags never reach the network.
    t = setup({}, disk);
    await assert.rejects(t.updater.update(BASE, '../main'), /Tag/);
    assert.equal(t.requests.length, 0);

    // GitHub's rate limit (403/429) gets a readable message instead of the raw status.
    for (const status of [403, 429]) {
        t = setup({ [API + '/releases/latest']: { status } }, { 'CSXS/manifest.xml': manifest('1.0.0') });
        await assert.rejects(t.updater.check(BASE), error => /giới hạn/.test(error.message) && error.status === status);
    }
    console.log('PASS: release check/version compare, signed incremental update, tamper/downgrade/min-version refusal, record cache, removal, restart, atomic failure, rate limit');
})().catch(error => { console.error(error); process.exitCode = 1; });
