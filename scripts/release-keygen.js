// Run once, on your own machine: node scripts/release-keygen.js [key file]
// Creates the Ed25519 signing key (never inside the repo) and prints the public key for js/release-keys.js.
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { defaultKeyPath, publicKeyBase64 } = require('./release-lib');

const target = path.resolve(process.argv[2] || defaultKeyPath());
if (fs.existsSync(target)) {
    console.error('Refusing to overwrite an existing key: ' + target);
    process.exit(1);
}
const { privateKey } = crypto.generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, pem, { flag: 'wx', mode: 0o600 });
console.log('Private key written to ' + target);
console.log('Back it up to two offline places; losing it means releases can no longer be signed.');
console.log('\nPublic key (paste into js/release-keys.js as k1):\n' + publicKeyBase64(pem));
