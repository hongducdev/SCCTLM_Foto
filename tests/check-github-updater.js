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
const manifest = (version, id) => '<ExtensionManifest ExtensionBundleVersion="' + version + '"><ExtensionList>' +
    '<Extension Id="' + (id || 'com.retouchpanel.panel') + '" Version="' + version + '" /></ExtensionList></ExtensionManifest>';
const sha512 = data => crypto.createHash('sha512').update(data).digest('hex');
const MTIME = 1000;

const pem = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const otherPem = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEYS = { k1: publicKeyBase64(pem) };

function setup(routes, disk, stamps = {}, faults = {}) {
    const requests = [];
    const files = new Map(Object.entries(disk).map(([k, v]) => [BASE + '/' + k, Buffer.from(v)]));
    const mtimes = new Map([...files.keys()].map(k => [k, stamps[k.slice(BASE.length + 1)] || MTIME]));
    const dirs = new Set([BASE]);
    for (const key of files.keys()) for (let i = key.indexOf('/', BASE.length + 1); i > 0; i = key.indexOf('/', i + 1)) dirs.add(key.slice(0, i));
    const counts = { write: 0, rename: 0 };
    const children = dir => [...new Set([...files.keys(), ...dirs].filter(k => k.startsWith(dir + '/') && k !== dir).map(k => k.slice(dir.length + 1).split('/')[0]))];
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
                if (enc === 'Base64') { if (!p.includes('/.dr7-update')) hashedReads.push(p); return { err: 0, data: files.get(p).toString('base64') }; }
                return { err: 0, data: files.get(p).toString('utf8') };
            },
            stat: p => files.has(p)
                ? { err: 0, data: { mtime: new Date(mtimes.get(p)), isDirectory: () => false } }   // like the real cep.fs.stat: no size
                : dirs.has(p) ? { err: 0, data: { isDirectory: () => true } } : { err: 3 },
            makedir: p => { dirs.add(p); return { err: 0 }; },
            writeFile: (p, data, enc) => {
                if (faults.failWrite && ++counts.write === faults.failWrite) return { err: 7 };
                writes.push(p);
                files.set(p, enc === 'Base64' ? Buffer.from(data, 'base64') : Buffer.from(data));
                mtimes.set(p, clock++);
                return { err: 0 };
            },
            deleteFile: p => dirs.has(p) ? { err: 8 } : files.delete(p) ? { err: 0 } : { err: 3 },   // like cep.fs: no directories
            chmod: () => ({ err: 0 }),
            readdir: p => dirs.has(p) ? { err: 0, data: children(p) } : { err: 3 },
            rename: (from, to) => {                          // like cep.fs: no overwrite, no implicit parent folders
                counts.rename += 1;
                if (faults.failRename === counts.rename) return { err: 6 };
                if (faults.crashRename === counts.rename) throw new Error('process died');   // the file about to be replaced was already deleted
                if (!files.has(from) || !dirs.has(to.slice(0, to.lastIndexOf('/')))) return { err: 3 };
                if (files.has(to)) return { err: 1 };
                files.set(to, files.get(from)); mtimes.set(to, mtimes.get(from)); files.delete(from); mtimes.delete(from);
                return { err: 0 };
            }
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
    vm.runInNewContext(source('update-staging-journal.js'), window);
    vm.runInNewContext(source('github-updater.js'), window);
    return { updater: window.dr7Updater, staging: window.dr7Staging, requests, files, mtimes, dirs, writes, hashedReads, read: p => files.get(BASE + '/' + p) };
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

    // Renaming the Extension Id (old Id on disk, new Id in the release) updates and asks for a restart.
    t = setup(signedRelease('1.1.0', { ...content, 'CSXS/manifest.xml': manifest('1.1.0', 'com.scctlm.foto.panel') }), disk);
    assert.equal((await t.updater.update(BASE, 'v1.1.0')).restart, true);
    assert.equal(t.updater.installedVersion(BASE), '1.1.0', 'installedVersion reads the new Id');

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
    // Staging + journal: nothing reaches the install until every file is staged and verified, and an
    // interrupted move is finished (or abandoned) by recover() before the panel loads.
    const staged = { 'index.html': '<html>2.0</html>', 'CSXS/manifest.xml': manifest('2.0.0'), 'js/panel.js': 'panel 2',
        'js/github-updater.js': 'updater 2', 'jsx/a.jsx': 'a2', 'jsx/b.jsx': 'b2' };
    const stagedDisk = { 'index.html': '<html>1.0</html>', 'CSXS/manifest.xml': manifest('1.0.0'), 'js/panel.js': 'panel 1',
        'js/github-updater.js': 'updater 1', 'jsx/a.jsx': 'a1', 'jsx/b.jsx': 'b1', 'jsx/gone.jsx': 'old',
        '.dr7-version.json': JSON.stringify({ version: 'v1.0.0', files: { 'jsx/gone.jsx': 'g' } }) };
    const stagedRoutes = signedRelease('2.0.0', staged);
    const snapshot = run => ({
        disk: Object.fromEntries([...run.files].map(([p, data]) => [p.slice(BASE.length + 1), data])),
        stamps: Object.fromEntries([...run.mtimes].map(([p, m]) => [p.slice(BASE.length + 1), m]))
    });
    const leftovers = run => [...run.files.keys()].filter(p => p.startsWith(BASE + '/.dr7-update/'));
    const onDisk = run => Object.fromEntries(Object.keys(staged).map(p => [p, run.read(p).toString()]));
    const installedOld = Object.fromEntries(Object.entries(stagedDisk).filter(([p]) => staged[p] !== undefined).map(([p, v]) => [p, String(v)]));

    // A write error while staging (disk full) leaves the install untouched and cleans the staging folder.
    t = setup(stagedRoutes, stagedDisk, {}, { failWrite: 2 });
    await assert.rejects(t.updater.update(BASE, 'v2.0.0'), /Không ghi được/);
    assert.deepEqual(onDisk(t), installedOld, 'the installed files are untouched');
    assert.deepEqual(leftovers(t), [], 'staged files are removed');
    assert.equal(t.read('.dr7-update.json'), undefined, 'no journal is left behind');

    // A move failing after two files: update() reports it, the journal stays, recover() finishes the job.
    t = setup(stagedRoutes, stagedDisk, {}, { crashRename: 3 });
    await assert.rejects(t.updater.update(BASE, 'v2.0.0'), /Chưa hoàn tất cập nhật v2.0.0.*process died/);
    const journal = JSON.parse(t.read('.dr7-update.json'));
    assert.equal(journal.journalVersion, 1);
    assert.deepEqual(journal.move.map(m => m.path), ['js/panel.js', 'jsx/a.jsx', 'jsx/b.jsx', 'js/github-updater.js', 'index.html', 'CSXS/manifest.xml'],
        'the code that runs recover(), index.html and the manifest are moved last');
    assert.deepEqual(journal.remove, ['jsx/gone.jsx']);
    assert.equal(t.read('index.html').toString(), '<html>1.0</html>', 'index.html is still the old one when the move stops early');
    const crashed = snapshot(t);
    t = setup({}, crashed.disk, crashed.stamps);
    let outcome = t.staging.recover(BASE);
    assert.equal(outcome.status, 'completed');
    assert.equal(outcome.reload, true, 'panel code changed, so the panel must reload');
    assert.deepEqual(onDisk(t), Object.fromEntries(Object.entries(staged).map(([p, v]) => [p, String(v)])), 'every file now matches the release');
    assert.equal(t.read('jsx/gone.jsx'), undefined);
    assert.deepEqual(leftovers(t), []);
    assert.equal(t.read('.dr7-update.json'), undefined, 'journal removed once finished');
    const finished = JSON.parse(t.read('.dr7-version.json'));
    assert.equal(finished.version, 'v2.0.0');
    assert.equal(finished.files['jsx/a.jsx'].sha512, sha512('a2'));
    assert.equal(t.updater.installedVersion(BASE), '2.0.0');
    assert.equal(t.staging.recover(BASE).status, 'none', 'a second recover() finds nothing to do');
    assert.deepEqual(t.writes, [...t.writes].filter(p => p.endsWith('.dr7-version.json')), 'recover only writes the record');

    // A move that fails without the process dying (staged file locked): the file is copied instead and the update completes.
    t = setup(stagedRoutes, stagedDisk, {}, { failRename: 2 });
    result = await t.updater.update(BASE, 'v2.0.0');
    assert.deepEqual(onDisk(t), Object.fromEntries(Object.entries(staged).map(([p, v]) => [p, String(v)])));
    assert.deepEqual(leftovers(t), []);

    // A staged file changed after the journal was written: nothing moves, everything is cleaned, with a message.
    t = setup(stagedRoutes, stagedDisk, {}, { crashRename: 1 });
    await assert.rejects(t.updater.update(BASE, 'v2.0.0'), /process died/);
    const tamperedState = snapshot(t);
    tamperedState.disk['.dr7-update/jsx/b.jsx'] = 'b-evil';
    t = setup({}, tamperedState.disk, tamperedState.stamps);
    outcome = t.staging.recover(BASE);
    assert.equal(outcome.status, 'discarded');
    assert.match(outcome.message, /gián đoạn.*cập nhật lại/);
    assert.equal(t.read('jsx/b.jsx').toString(), 'b1', 'the tampered file never reaches the install');
    assert.equal(t.read('jsx/a.jsx').toString(), 'a1', 'nothing was moved');
    assert.deepEqual(leftovers(t), []);
    assert.equal(t.read('.dr7-update.json'), undefined);
    assert.equal(t.read('index.html').toString(), '<html>1.0</html>', 'index.html was not replaced');

    // Damaged or unknown journals are discarded, and the panel still loads.
    for (const [label, text] of [['broken json', '{"journalVersion": 1, "move": ['], ['future journalVersion', JSON.stringify({ journalVersion: 2, tag: 'v9.0.0', move: [], remove: [], record: { version: 'v9.0.0', files: {} } })],
        ['path outside the runtime set', JSON.stringify({ ...journal, remove: ['../../evil.dll'] })]]) {
        t = setup({}, { ...installedOld, '.dr7-update.json': text, '.dr7-update/jsx/a.jsx': 'a2' });
        outcome = t.staging.recover(BASE);
        assert.equal(outcome.status, 'discarded', label);
        assert.equal(t.read('.dr7-update.json'), undefined, label + ': journal removed');
        assert.deepEqual(leftovers(t), [], label + ': staging removed');
        assert.deepEqual(onDisk(t), installedOld, label + ': install untouched');
    }

    // No journal: recover() does nothing at all.
    t = setup({}, installedOld);
    assert.deepEqual(plain(t.staging.recover(BASE)), { status: 'none' });
    assert.deepEqual(t.writes, []);

    // The ordering helper on its own: tail files last whatever order they arrive in.
    assert.deepEqual(plain(t.staging.order(['index.html', 'js/github-updater.js', 'jsx/z.jsx', 'js/vendor/tweetnacl.min.js', 'css/a.css'])),
        ['css/a.css', 'jsx/z.jsx', 'js/github-updater.js', 'js/vendor/tweetnacl.min.js', 'index.html']);

    console.log('PASS: release check/version compare, signed incremental update, tamper/downgrade/min-version refusal, record cache, removal, restart, atomic failure, rate limit');
})().catch(error => { console.error(error); process.exitCode = 1; });
