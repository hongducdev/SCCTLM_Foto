/* Public Ed25519 keys the updater trusts to sign releases: keyId -> base64 of the 32-byte public key.
 * Create the pair with `node scripts/release-keygen.js` and paste the printed value here (k1 stays empty
 * until then, so the updater installs nothing). To rotate, ship a build that lists both keys first. */
window.dr7ReleaseKeys = {
    k1: 'fpD2AWp9bNNehR9bjZ1UMJSZkjVPWdZwbC2hTUeUcko='
};
