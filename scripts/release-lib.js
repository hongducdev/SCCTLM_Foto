// Shared by release-keygen.js / release-sign.js / release-verify.js and tests/check-release-manifest.js.
// Verification deliberately runs the panel's own code (js/release-manifest-verifier.js + vendored
// tweetnacl) in a vm, so a release passes here only if the updater in users' panels accepts it.
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const MANIFEST_FILE = 'release-manifest.json';
const SIGNATURE_FILE = 'release-manifest.json.sig';
// Oldest installed version whose updater understands this manifest (the first one that verifies signatures).
const FIRST_SIGNED_VERSION = '0.2.0';
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
// Tracked paths that look like plugin files; any of them rejected by the updater's path rules is an error.
const RUNTIME_LIKE = /^(index\.html|style\.css|loader\.jsx|CSXS\/|js\/|jsx\/|css\/|img\/|presets\/)/;

function defaultKeyPath() {
    return process.env.SCCTLM_SIGNING_KEY || path.join(os.homedir(), '.scctlm', 'release-ed25519.pem');
}

function git(root, args) {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// The code that runs inside the panel; `window.dr7Release.parse(manifest, sig, keys)` is the acceptance test.
function browserRelease(root) {
    const window = { atob: s => Buffer.from(s, 'base64').toString('binary'), crypto: crypto.webcrypto,
        isSecureContext: true, TextDecoder, Uint8Array, Promise, Object, Error, JSON, String };
    window.window = window;
    window.self = window;
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/vendor/tweetnacl.min.js'), 'utf8'), window);
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/release-manifest-verifier.js'), 'utf8'), window);
    return window.dr7Release;
}

function releaseKeys(root) {
    const window = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/release-keys.js'), 'utf8'), { window });
    return JSON.parse(JSON.stringify(window.dr7ReleaseKeys || {}));
}

function sha512(data) { return crypto.createHash('sha512').update(data).digest('hex'); }

function installedVersion(root) {
    const text = fs.readFileSync(path.join(root, 'CSXS/manifest.xml'), 'utf8');
    const m = /<Extension Id="com\.retouchpanel\.panel" Version="([^"]+)"/.exec(text);
    if (!m) throw new Error('CSXS/manifest.xml has no Extension Version');
    return m[1];
}

// Tracked files the updater would ship, and tracked files that look like plugin files but would be skipped.
function runtimeFiles(root) {
    const { isRuntimePath } = browserRelease(root);
    const tracked = git(root, ['ls-files', '-z']).split('\0').filter(Boolean);
    return {
        files: tracked.filter(isRuntimePath).sort(),
        skipped: tracked.filter(p => RUNTIME_LIKE.test(p) && !isRuntimePath(p))
    };
}

function buildManifest(root, { keyId = 'k1', minVersion = FIRST_SIGNED_VERSION } = {}) {
    const { files, skipped } = runtimeFiles(root);
    if (skipped.length) throw new Error('Files the updater would not ship (unsafe path): ' + skipped.join(', '));
    const hashes = {};
    for (const file of files) hashes[file] = sha512(fs.readFileSync(path.join(root, file)));
    // Fixed key order and layout keep the signed bytes reproducible.
    return JSON.stringify({ format: 1, keyId, version: installedVersion(root), minVersion, files: hashes }, null, 1) + '\n';
}

function signBytes(bytes, privateKeyPem) {
    return crypto.sign(null, Buffer.from(bytes), crypto.createPrivateKey(privateKeyPem)).toString('base64') + '\n';
}

function publicKeyBase64(privateKeyPem) {
    const der = crypto.createPublicKey(crypto.createPrivateKey(privateKeyPem)).export({ type: 'spki', format: 'der' });
    if (!der.subarray(0, SPKI_ED25519_PREFIX.length).equals(SPKI_ED25519_PREFIX)) throw new Error('Not an Ed25519 key');
    return der.subarray(SPKI_ED25519_PREFIX.length).toString('base64');
}

// -> [problem strings]; empty means the manifest at `root` is exactly what the panel will accept and install.
function verifyRelease(root, manifestBytes, signatureBytes, publicKeys) {
    const problems = [];
    let manifest;
    try {
        manifest = browserRelease(root).parse(Buffer.from(manifestBytes), Buffer.from(signatureBytes), publicKeys);
    } catch (error) {
        return [error.message];
    }
    if (manifest.version !== installedVersion(root)) {
        problems.push('manifest version ' + manifest.version + ' != CSXS/manifest.xml ' + installedVersion(root));
    }
    const { files, skipped } = runtimeFiles(root);
    skipped.forEach(file => problems.push('not shippable (unsafe path): ' + file));
    for (const file of files) if (!manifest.files[file]) problems.push('not in manifest: ' + file);
    for (const [file, hash] of Object.entries(manifest.files)) {
        const full = path.join(root, file);
        if (!fs.existsSync(full)) problems.push('listed but missing: ' + file);
        else if (sha512(fs.readFileSync(full)) !== hash) problems.push('hash mismatch: ' + file);
    }
    return problems;
}

module.exports = { MANIFEST_FILE, SIGNATURE_FILE, FIRST_SIGNED_VERSION, defaultKeyPath, git, releaseKeys, buildManifest,
    signBytes, publicKeyBase64, verifyRelease, sha512 };
