/* DR7 updater: installs the latest GitHub Release of hongducdev/SCCTLM_Foto into the panel folder.
 * Pure logic (no DOM). The file list of a release comes from release-manifest.json, signed with the
 * maintainer's Ed25519 key (js/release-keys.js). Every download is hashed against that manifest and
 * finishes before the first write, and files go through js/update-staging-journal.js (staging folder + journal),
 * so a bad signature, a tampered file, a network failure or a crash midway never leaves a mix of two versions.
 * A release that is not newer than the installed one is refused. */
(function () {
    'use strict';

    var REPO = 'hongducdev/SCCTLM_Foto';
    var API = 'https://api.github.com/repos/' + REPO;
    var RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
    var RECORD = '.dr7-version.json';
    var MANIFEST = 'CSXS/manifest.xml';
    var SIGNED_MANIFEST = 'release-manifest.json';

    function fs() { return window.cep.fs; }

    function request(url, type) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            if (type) xhr.responseType = type;
            xhr.timeout = 30000;
            xhr.onload = function () {
                if (xhr.status === 200) resolve(type ? xhr.response : xhr.responseText);
                else if (xhr.status === 403 || xhr.status === 429) reject(Object.assign(  // unauthenticated limit: 60 calls/hour per IP
                    new Error('GitHub tạm giới hạn lượt kiểm tra từ mạng này, hãy thử lại sau ít phút.'), { status: xhr.status }));
                else reject(Object.assign(new Error('GitHub ' + xhr.status + ': ' + url), { status: xhr.status }));
            };
            xhr.onerror = xhr.ontimeout = function () { reject(new Error('Không kết nối được GitHub')); };
            xhr.send();
        });
    }

    // "v1.2.3" / "1.2.3" -> [1, 2, 3]; anything else -> null.
    function parseVersion(text) {
        var m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(text || '').trim());
        return m ? [+m[1], +m[2], +m[3]] : null;
    }

    function isNewer(latest, current) {
        var a = parseVersion(latest), b = parseVersion(current);
        if (!a) return false;
        if (!b) return true;
        for (var i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
        return false;
    }

    function readText(base, path) {
        var result = fs().readFile(base + '/' + path);
        return result.err ? null : result.data;
    }

    function installedVersion(base) {
        var m = /<Extension Id="com\.(?:retouchpanel|scctlm\.foto)\.panel" Version="([^"]+)"/.exec(readText(base, MANIFEST) || '');
        return m ? m[1] : '';
    }

    function readRecord(base) {
        try {
            var record = JSON.parse(readText(base, RECORD) || '{}');
            return record && typeof record.files === 'object' ? record : { files: {} };
        } catch (e) {
            return { files: {} };
        }
    }

    // A manifest that only bumps version numbers takes effect without a Photoshop restart.
    function manifestShape(text) { return String(text || '').replace(/Version="[^"]*"/g, '').replace(/\s+/g, ' '); }

    function toBase64(buffer) {
        var bytes = new Uint8Array(buffer), chunks = [];
        for (var i = 0; i < bytes.length; i += 0x8000) {
            chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)));
        }
        return window.btoa(chunks.join(''));
    }

    // -> { current, latest: { tag, name, notes, url } | null, available }
    function check(base) {
        var current = installedVersion(base);
        return request(API + '/releases/latest').then(function (text) {
            var release = JSON.parse(text);
            var latest = { tag: release.tag_name, name: release.name || release.tag_name,
                notes: release.body || '', url: release.html_url };
            return { current: current, latest: latest, available: isNewer(latest.tag, current) };
        }, function (error) {
            if (error.status === 404) return { current: current, latest: null, available: false };
            throw error;
        });
    }

    // Hash of the installed file, or null when it cannot be read.
    function localHash(base, path) {
        var result = fs().readFile(base + '/' + path, window.cep.encoding.Base64);
        return result.err ? Promise.resolve(null) : window.dr7Release.sha512(window.dr7Release.fromBase64(result.data));
    }

    // Splits the signed file list into files to download and files already identical on disk.
    // A record entry { sha512, mtime } that still matches the file's mtime saves hashing it again;
    // records from 0.1.9 (git sha strings) fall through to a one-time hash instead of a re-download.
    function selectChanged(base, files, record) {
        var changed = [], current = {};
        return Object.keys(files).reduce(function (chain, path) {
            return chain.then(function () {
                var stat = fs().stat(base + '/' + path), known = record.files[path];
                if (stat.err) { changed.push(path); return null; }
                if (known && typeof known === 'object' && known.sha512 === files[path] && known.mtime === +stat.data.mtime) {
                    current[path] = known;
                    return null;
                }
                return localHash(base, path).then(function (hash) {
                    if (hash === files[path]) current[path] = window.dr7Staging.stamp(base, path, hash); else changed.push(path);
                });
            });
        }, Promise.resolve()).then(function () { return { changed: changed, current: current }; });
    }

    // Fetches and verifies the signed manifest of release `tag`; rejects unless it is genuinely newer.
    function verifiedManifest(base, tag) {
        var raw = RAW + encodeURIComponent(tag) + '/', installed = installedVersion(base);
        return Promise.all([request(raw + SIGNED_MANIFEST, 'arraybuffer'), request(raw + SIGNED_MANIFEST + '.sig', 'arraybuffer')])
            .then(function (parts) {
                var manifest = window.dr7Release.parse(parts[0], parts[1], window.dr7ReleaseKeys || {});
                if (manifest.version !== tag.replace(/^v/, '')) {
                    throw new Error('Chữ ký thuộc bản ' + manifest.version + ', không phải ' + tag + ' — đã huỷ.');
                }
                if (!isNewer(manifest.version, installed)) {
                    throw new Error('Bản ' + tag + ' không mới hơn bản đang cài (' + installed + ') — đã huỷ.');
                }
                if (parseVersion(installed) && isNewer(manifest.minVersion, installed)) {
                    throw new Error('Bản ' + tag + ' cần cài lại thủ công, bản đang cài (' + installed + ') quá cũ để cập nhật tự động.');
                }
                if (!manifest.files[MANIFEST] || !manifest.files['index.html']) throw new Error('Bản phát hành ' + tag + ' thiếu file plugin');
                return manifest;
            }, function (error) {
                if (error.status === 404) throw new Error('Bản ' + tag + ' chưa có chữ ký phát hành — đã huỷ, không thay đổi file nào.');
                throw error;
            });
    }

    // Writes every download to the staging folder and reads it back. The install is untouched until this is done.
    function stageAll(base, paths, downloads, hashes) {
        var staging = window.dr7Staging;
        staging.clearStaging(base);
        return paths.reduce(function (chain, path) {
            return chain.then(function () {
                staging.stage(base, path, toBase64(downloads[path]));
                return staging.verifyStaged(base, path, hashes[path]);
            });
        }, Promise.resolve()).catch(function (error) { staging.clearStaging(base); throw error; });
    }

    // Installs release `tag` into `base`. onProgress(done, total) during downloads.
    // -> { changed: [paths], removed: [paths], restart: bool }
    function update(base, tag, onProgress) {
        if (!/^[A-Za-z0-9._-]+$/.test(tag)) return Promise.reject(new Error('Tag không hợp lệ: ' + tag));
        var record = readRecord(base), downloads = {}, done = 0, selection, manifest;
        return verifiedManifest(base, tag).then(function (signed) {
            manifest = signed;
            return selectChanged(base, manifest.files, record);
        }).then(function (picked) {
            selection = picked;
            if (onProgress) onProgress(0, selection.changed.length);
            // Sequential downloads keep memory and GitHub load low; nothing is written yet.
            return selection.changed.reduce(function (chain, path) {
                return chain.then(function () {
                    return request(RAW + encodeURIComponent(tag) + '/' + path.split('/').map(encodeURIComponent).join('/'),
                        'arraybuffer').then(function (buffer) {
                        return window.dr7Release.sha512(buffer).then(function (hash) {
                            if (hash !== manifest.files[path]) {
                                throw new Error('File tải về không khớp chữ ký: ' + path + ' — đã huỷ, không thay đổi file nào.');
                            }
                            downloads[path] = buffer;
                            if (onProgress) onProgress(++done, selection.changed.length);
                        });
                    });
                });
            }, Promise.resolve());
        }).then(function () {
            return stageAll(base, selection.changed, downloads, manifest.files);
        }).then(function () {
            var staging = window.dr7Staging, changed = selection.changed;
            var removed = Object.keys(record.files).filter(function (path) {
                return !manifest.files[path] && window.dr7Release.isRuntimePath(path);
            });
            var oldManifest = readText(base, MANIFEST);
            var files = {};                                   // moved files get stamped after the move; unchanged ones keep their entry
            Object.keys(manifest.files).forEach(function (path) {
                files[path] = changed.indexOf(path) === -1 ? selection.current[path] : manifest.files[path];
            });
            try {
                staging.begin(base, { journalVersion: 1, tag: tag,
                    move: staging.order(changed).map(function (path) { return { path: path, sha512: manifest.files[path] }; }),
                    remove: removed, record: { version: tag, files: files } });
            } catch (error) { staging.clearStaging(base); throw error; }
            var outcome = staging.recover(base);              // the same code path that finishes an interrupted update
            if (outcome.status !== 'completed') throw new Error(outcome.message);
            var newManifest = changed.indexOf(MANIFEST) === -1 ? oldManifest :
                new TextDecoder('utf-8').decode(downloads[MANIFEST]);
            return { changed: changed, removed: removed, restart: manifestShape(oldManifest) !== manifestShape(newManifest) };
        });
    }

    window.dr7Updater = { check: check, update: update, isNewer: isNewer, installedVersion: installedVersion };
}());
