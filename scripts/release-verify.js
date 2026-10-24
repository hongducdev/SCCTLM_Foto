// CI / pre-tag check, needs no private key: node scripts/release-verify.js [repo root]
// Fails unless release-manifest.json is signed by a key in js/release-keys.js and matches the tracked files exactly.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const lib = require('./release-lib');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
try {
    const keys = lib.releaseKeys(root);
    if (!Object.values(keys).some(Boolean)) throw new Error('js/release-keys.js has no public key yet');
    const problems = lib.verifyRelease(root, fs.readFileSync(path.join(root, lib.MANIFEST_FILE)),
        fs.readFileSync(path.join(root, lib.SIGNATURE_FILE)), keys);
    if (problems.length) throw new Error(problems.join('\n'));
    console.log('release-manifest.json OK');
} catch (error) {
    console.error(error.code === 'ENOENT' ? 'Missing ' + path.basename(error.path) + ' (run scripts/release-sign.js)' : error.message);
    process.exit(1);
}
