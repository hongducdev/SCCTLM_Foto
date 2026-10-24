/* DR7 release verifier: checks the Ed25519 signature of release-manifest.json and hashes file contents.
 * Pure logic (no DOM). Signature verification uses vendored tweetnacl (CEP's Chromium has no
 * WebCrypto Ed25519); hashing prefers crypto.subtle. Paths in a signed manifest are still validated. */
(function () {
    'use strict';

    // Same runtime set as install/watch-plugin.js, plus the manifest. Paths are git paths ("/").
    var RUNTIME = /^(index\.html|style\.css|loader\.jsx|CSXS\/manifest\.xml|(js|jsx|css|img|presets)\/.+)$/;
    var SAFE = /^[A-Za-z0-9 _.()&+,-]+(\/[A-Za-z0-9 _.()&+,-]+)*$/;
    var HEX512 = /^[0-9a-f]{128}$/;
    var BAD_SIGNATURE = 'Bản cập nhật không có chữ ký hợp lệ — đã huỷ, không thay đổi file nào.';

    function isRuntimePath(path) {
        return typeof path === 'string' && RUNTIME.test(path) && SAFE.test(path) && !/(^|\/)\.\.?(\/|$)/.test(path);
    }

    function fromBase64(text) {
        var binary = window.atob(String(text).replace(/\s+/g, '')), bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function toHex(bytes) {
        var out = '';
        for (var i = 0; i < bytes.length; i++) out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
        return out;
    }

    function sha512(buffer) {
        var bytes = new Uint8Array(buffer);
        var subtle = window.crypto && window.crypto.subtle;
        if (subtle && window.isSecureContext !== false) {
            return subtle.digest('SHA-512', bytes).then(function (digest) { return toHex(new Uint8Array(digest)); });
        }
        return Promise.resolve(toHex(window.nacl.hash(bytes)));
    }

    // Synchronous hash for update recovery, which must finish before the panel loads the ExtendScript core.
    function sha512Sync(bytes) { return toHex(window.nacl.hash(bytes)); }

    // Verifies `signature` (base64 text bytes) over the raw `manifestBytes` with publicKeys[keyId]
    // (base64 of the 32-byte key). Returns the parsed manifest; throws a readable Error otherwise.
    function parse(manifestBytes, signature, publicKeys) {
        var manifest, key, sig;
        try {
            var text = new TextDecoder('utf-8').decode(new Uint8Array(manifestBytes));
            manifest = JSON.parse(text);
            sig = fromBase64(new TextDecoder('utf-8').decode(new Uint8Array(signature)));
        } catch (e) {
            throw new Error(BAD_SIGNATURE);
        }
        var valid = false;
        try {
            key = manifest && typeof manifest.keyId === 'string' && Object.prototype.hasOwnProperty.call(publicKeys, manifest.keyId)
                ? fromBase64(publicKeys[manifest.keyId]) : null;
            valid = !!key && sig.length === 64 && window.nacl.sign.detached.verify(new Uint8Array(manifestBytes), sig, key);
        } catch (e) { /* malformed key: treated as an invalid signature */ }
        if (!valid) throw new Error(BAD_SIGNATURE);
        if (manifest.format !== 1 || !manifest.files || typeof manifest.files !== 'object' ||
            typeof manifest.version !== 'string' || typeof manifest.minVersion !== 'string') {
            throw new Error('Định dạng bản cập nhật không được hỗ trợ — hãy cài lại thủ công.');
        }
        Object.keys(manifest.files).forEach(function (path) {
            if (!isRuntimePath(path) || !HEX512.test(manifest.files[path])) {
                throw new Error('Manifest bản cập nhật chứa file không hợp lệ: ' + path);
            }
        });
        return manifest;
    }

    window.dr7Release = { parse: parse, sha512: sha512, sha512Sync: sha512Sync, isRuntimePath: isRuntimePath, fromBase64: fromBase64 };
}());
