// Run on the maintainer's machine after bumping the version and committing:
//   node scripts/release-sign.js [--min-version x.y.z] [--key-id k1]
// Writes release-manifest.json + release-manifest.json.sig for the files git tracks. Commit both, then tag.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const lib = require('./release-lib');

const root = path.resolve(__dirname, '..');
function option(name, fallback) {
    const index = process.argv.indexOf(name);
    return index === -1 ? fallback : process.argv[index + 1];
}

try {
    const dirty = lib.git(root, ['status', '--porcelain']).split('\n').filter(Boolean)
        .filter(line => !line.endsWith(lib.MANIFEST_FILE) && !line.endsWith(lib.SIGNATURE_FILE));
    if (dirty.length) throw new Error('Commit or discard these first, the signature must cover committed content:\n' + dirty.join('\n'));
    const keyPath = lib.defaultKeyPath();
    if (!fs.existsSync(keyPath)) throw new Error('No signing key at ' + keyPath + ' (create one with scripts/release-keygen.js)');
    const pem = fs.readFileSync(keyPath, 'utf8');
    const keyId = option('--key-id', 'k1');
    const published = lib.releaseKeys(root)[keyId];
    if (published !== lib.publicKeyBase64(pem)) throw new Error('The signing key does not match ' + keyId + ' in js/release-keys.js');

    const manifest = lib.buildManifest(root, { keyId, minVersion: option('--min-version', lib.FIRST_SIGNED_VERSION) });
    const signature = lib.signBytes(manifest, pem);
    const problems = lib.verifyRelease(root, manifest, signature, lib.releaseKeys(root));
    if (problems.length) throw new Error('Self-check failed:\n' + problems.join('\n'));
    fs.writeFileSync(path.join(root, lib.MANIFEST_FILE), manifest);
    fs.writeFileSync(path.join(root, lib.SIGNATURE_FILE), signature);
    console.log('Signed ' + Object.keys(JSON.parse(manifest).files).length + ' files for ' + JSON.parse(manifest).version +
        '. Now: git add release-manifest.json* && git commit && git tag v' + JSON.parse(manifest).version);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
