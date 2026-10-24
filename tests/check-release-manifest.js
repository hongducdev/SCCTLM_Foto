// Run: node tests/check-release-manifest.js
// Signs a throwaway repo with a throwaway key and checks what scripts/release-verify.js accepts and rejects.
// The verifier under test is the panel's own js/release-manifest-verifier.js running with vendored tweetnacl.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const lib = require('../scripts/release-lib');

const real = path.join(__dirname, '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scctlm-release-'));
const put = (file, data) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), data); };
const sh = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
const manifestXml = version => '<ExtensionManifest ExtensionBundleVersion="' + version + '"><ExtensionList>' +
    '<Extension Id="com.retouchpanel.panel" Version="' + version + '" /></ExtensionList></ExtensionManifest>';

try {
    const { privateKey } = crypto.generateKeyPairSync('ed25519');
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const keys = { k1: lib.publicKeyBase64(pem) };
    for (const file of ['js/vendor/tweetnacl.min.js', 'js/release-manifest-verifier.js']) put(file, fs.readFileSync(path.join(real, file)));
    put('CSXS/manifest.xml', manifestXml('1.2.0'));
    put('index.html', '<html>panel</html>');
    put('jsx/main.jsx', '// main');
    put('presets/colors/a b (1).xmp', 'preset');
    put('README.md', 'not shipped');
    put('tests/check.js', 'not shipped');
    sh('init', '-q');
    sh('add', '-A');

    const sign = (opts, key) => {
        const manifest = lib.buildManifest(root, opts);
        return [manifest, lib.signBytes(manifest, key || pem)];
    };
    const verify = (manifest, signature, k = keys) => lib.verifyRelease(root, manifest, signature, k);

    // A correct release verifies; only plugin files are listed, with their sha512.
    let [manifest, signature] = sign();
    const parsed = JSON.parse(manifest);
    assert.deepEqual(verify(manifest, signature), []);
    assert.deepEqual(Object.keys(parsed.files), ['CSXS/manifest.xml', 'index.html', 'jsx/main.jsx', 'js/release-manifest-verifier.js',
        'js/vendor/tweetnacl.min.js', 'presets/colors/a b (1).xmp'].sort());
    assert.equal(parsed.files['index.html'], crypto.createHash('sha512').update('<html>panel</html>').digest('hex'));
    assert.equal(parsed.version, '1.2.0');
    assert.equal(manifest, lib.buildManifest(root), 'the signed bytes are reproducible');

    // Signature failures all read the same way and never get as far as the file list.
    const bad = /không có chữ ký hợp lệ/;
    const flipped = Buffer.from(manifest); flipped[flipped.indexOf('1.2.0')] ^= 1;
    assert.match(verify(flipped, signature)[0], bad, 'manifest changed after signing');
    const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
    assert.match(verify(manifest, lib.signBytes(manifest, other))[0], bad, 'signed by a different key');
    assert.match(verify(manifest, 'AAAA\n')[0], bad, 'truncated signature');
    assert.match(verify(manifest, Buffer.alloc(0))[0], bad, 'empty signature');
    assert.match(verify(manifest, signature, { k1: '' })[0], bad, 'no public key configured');
    assert.match(verify(manifest, signature, { k1: '!!!' })[0], bad, 'malformed public key');
    assert.match(verify(manifest, signature, { k2: keys.k1 })[0], bad, 'unknown keyId');
    assert.match(verify(Buffer.from('not json'), signature)[0], bad);

    // Signed but unacceptable content.
    const signRaw = obj => { const bytes = JSON.stringify(obj); return [bytes, lib.signBytes(bytes, pem)]; };
    const hash = parsed.files['index.html'];
    assert.match(verify(...signRaw({ ...parsed, format: 2 }))[0], /Định dạng/);
    assert.match(verify(...signRaw({ ...parsed, files: { ...parsed.files, '../evil.js': hash } }))[0], /không hợp lệ.*evil/);
    assert.match(verify(...signRaw({ ...parsed, files: { ...parsed.files, 'js/../../x.js': hash } }))[0], /không hợp lệ/);
    assert.match(verify(...signRaw({ ...parsed, files: { ...parsed.files, 'README.md': hash } }))[0], /không hợp lệ.*README/);
    assert.match(verify(...signRaw({ ...parsed, files: { ...parsed.files, 'js/short.js': 'abc' } }))[0], /không hợp lệ.*short/);
    assert.match(verify(...signRaw({ ...parsed, version: '1.3.0' }))[0], /1\.3\.0 != CSXS/, 'version must equal the plugin manifest');

    // The tree must match the signed list exactly.
    put('index.html', '<html>edited after signing</html>');
    assert.deepEqual(verify(manifest, signature), ['hash mismatch: index.html']);
    put('index.html', '<html>panel</html>');
    put('js/new-feature.js', 'unsigned');
    sh('add', '-A');
    assert.deepEqual(verify(manifest, signature), ['not in manifest: js/new-feature.js'], 'a runtime file the manifest forgot');
    sh('rm', '-q', '-f', 'js/new-feature.js');
    fs.rmSync(path.join(root, 'jsx/main.jsx'));
    assert.deepEqual(verify(manifest, signature), ['listed but missing: jsx/main.jsx']);
    put('jsx/main.jsx', '// main');

    // A tracked plugin file the updater would skip must stop signing rather than silently not ship.
    put('js/odd$name.js', 'x');
    sh('add', '-A');
    assert.throws(() => lib.buildManifest(root), /odd\$name\.js/);
    assert.match(verify(manifest, signature).join('\n'), /not shippable.*odd\$name/);

    console.log('PASS: signed manifest accepted; tampering, wrong/missing key, bad content, unsigned/missing/odd files rejected');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}
