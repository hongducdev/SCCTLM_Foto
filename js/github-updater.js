/* DR7 updater: installs the latest GitHub Release of hongducdev/SCCTLM_Foto into the panel folder.
 * Pure logic (no DOM). Files are fetched over HTTPS from a fixed repository and written
 * with cep.fs; every download finishes before the first write, so a network failure
 * midway leaves the installed copy untouched. */
(function () {
    'use strict';

    var REPO = 'hongducdev/SCCTLM_Foto';
    var API = 'https://api.github.com/repos/' + REPO;
    var RAW = 'https://raw.githubusercontent.com/' + REPO + '/';
    var RECORD = '.dr7-version.json';
    var MANIFEST = 'CSXS/manifest.xml';
    // Same runtime set as install/watch-plugin.js, plus the manifest. Paths are git paths ("/").
    var RUNTIME = /^(index\.html|style\.css|loader\.jsx|CSXS\/manifest\.xml|(js|jsx|css|img|presets)\/.+)$/;
    var SAFE = /^[A-Za-z0-9 _.()&+,-]+(\/[A-Za-z0-9 _.()&+,-]+)*$/;

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
        var m = /<Extension Id="com\.retouchpanel\.panel" Version="([^"]+)"/.exec(readText(base, MANIFEST) || '');
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

    function makeDirs(base, path) {
        var parts = path.split('/').slice(0, -1), dir = base;
        for (var i = 0; i < parts.length; i++) {
            dir += '/' + parts[i];
            if (fs().stat(dir).err) {
                var made = fs().makedir(dir);
                if (made.err) throw new Error('Không tạo được thư mục ' + dir + ' (lỗi ' + errorName(made.err) + ')');
            }
        }
    }

    function write(base, path, data, encoding) {
        makeDirs(base, path);
        var target = base + '/' + path;
        var result = fs().writeFile(target, data, encoding);
        if (result.err === fs().ERR_CANT_WRITE) {            // file chỉ-đọc (vd chép từ nguồn chỉ-đọc): bỏ cờ rồi ghi lại 1 lần
            fs().chmod(target, 438);                         // 0o666
            result = fs().writeFile(target, data, encoding);
        }
        if (result.err) throw new Error('Không ghi được ' + path + ' (lỗi ' + errorName(result.err) + ')');
    }

    // cep.fs.ERR_* theo mã số, để thông báo lỗi đọc được (vd 6 -> ERR_CANT_WRITE)
    function errorName(code) {
        var names = Object.keys(fs()).filter(function (key) { return /^ERR_/.test(key) && fs()[key] === code; });
        return code + (names.length ? ' ' + names[0] : '');
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

    // Installs release `tag` into `base`. onProgress(done, total) during downloads.
    // -> { changed: [paths], removed: [paths], restart: bool }
    function update(base, tag, onProgress) {
        if (!/^[A-Za-z0-9._-]+$/.test(tag)) return Promise.reject(new Error('Tag không hợp lệ: ' + tag));
        var record = readRecord(base);
        return request(API + '/git/trees/' + encodeURIComponent(tag) + '?recursive=1').then(function (text) {
            var tree = JSON.parse(text);
            if (tree.truncated) throw new Error('Cây file trên GitHub quá lớn');
            var files = {}, changed = [];
            tree.tree.forEach(function (entry) {
                if (entry.type !== 'blob' || !RUNTIME.test(entry.path) || !SAFE.test(entry.path) ||
                    /(^|\/)\.\.?(\/|$)/.test(entry.path)) return;
                files[entry.path] = entry.sha;
                if (record.files[entry.path] !== entry.sha || fs().stat(base + '/' + entry.path).err) changed.push(entry.path);
            });
            if (!files[MANIFEST] || !files['index.html']) throw new Error('Bản phát hành ' + tag + ' thiếu file plugin');
            var removed = Object.keys(record.files).filter(function (path) {
                return !files[path] && RUNTIME.test(path) && SAFE.test(path);
            });
            var downloads = {}, done = 0;
            if (onProgress) onProgress(0, changed.length);
            // Sequential downloads keep memory and GitHub load low; nothing is written yet.
            return changed.reduce(function (chain, path) {
                return chain.then(function () {
                    return request(RAW + encodeURIComponent(tag) + '/' + path.split('/').map(encodeURIComponent).join('/'),
                        'arraybuffer').then(function (buffer) {
                        downloads[path] = buffer;
                        if (onProgress) onProgress(++done, changed.length);
                    });
                });
            }, Promise.resolve()).then(function () {
                var oldManifest = readText(base, MANIFEST);
                changed.forEach(function (path) { write(base, path, toBase64(downloads[path]), window.cep.encoding.Base64); });
                removed.forEach(function (path) { fs().deleteFile(base + '/' + path); });
                write(base, RECORD, JSON.stringify({ version: tag, files: files }, null, 1), window.cep.encoding.UTF8);
                var newManifest = changed.indexOf(MANIFEST) === -1 ? oldManifest :
                    new TextDecoder('utf-8').decode(downloads[MANIFEST]);
                return { changed: changed, removed: removed, restart: manifestShape(oldManifest) !== manifestShape(newManifest) };
            });
        });
    }

    window.dr7Updater = { check: check, update: update, isNewer: isNewer, installedVersion: installedVersion };
}());
