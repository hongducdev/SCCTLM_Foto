/* DR7 update staging: downloads are written to <panel>/.dr7-update/, then moved into place under a journal
 * (<panel>/.dr7-update.json). A crash or a failed move midway is finished by recover(), which panel.js calls
 * before the ExtendScript core loads, so the panel never runs on a mix of two versions.
 * Pure logic (no DOM). cep.fs facts (measured in Photoshop): rename() refuses to overwrite and a missing target
 * folder is an error; deleteFile() refuses directories and read-only files, so staging folders stay (empty).
 * journalVersion 1 is frozen: an older recover() may have to read a journal written by a newer updater. */
(function () {
    'use strict';

    var STAGING = '.dr7-update';
    var JOURNAL = '.dr7-update.json';
    var RECORD = '.dr7-version.json';
    var JOURNAL_VERSION = 1;
    var NOT_FOUND = 3;
    var HEX512 = /^[0-9a-f]{128}$/;
    var INTERRUPTED = 'Cập nhật lần trước bị gián đoạn, hãy bấm ⤓ để cập nhật lại.';
    // Files moved last: the code that runs recover() and the files that decide what the panel is.
    var TAIL = [/^js\/(vendor\/.+|release-keys\.js|release-manifest-verifier\.js|update-staging-journal\.js|github-updater\.js)$/,
        /^index\.html$/, /^CSXS\/manifest\.xml$/];
    var PANEL_CODE = /^(index\.html|style\.css|js\/.+|css\/.+)$/;

    function fs() { return window.cep.fs; }

    // cep.fs.ERR_* theo mã số, để thông báo lỗi đọc được (vd 6 -> ERR_CANT_WRITE)
    function errorName(code) {
        var names = Object.keys(fs()).filter(function (key) { return /^ERR_/.test(key) && fs()[key] === code; });
        return code + (names.length ? ' ' + names[0] : '');
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

    function readBase64(path) {
        var result = fs().readFile(path, window.cep.encoding.Base64);
        return result.err ? null : result.data;
    }

    function hashOf(base64) { return window.dr7Release.sha512Sync(window.dr7Release.fromBase64(base64)); }

    function remove(path) {
        if (fs().stat(path).err) return;
        var result = fs().deleteFile(path);
        if (result.err) { fs().chmod(path, 438); result = fs().deleteFile(path); }
        if (result.err) throw new Error('Không xoá được ' + path + ' (lỗi ' + errorName(result.err) + ')');
    }

    function listFiles(dir) {
        var listing = fs().readdir(dir), found = [];
        if (listing.err) return found;
        listing.data.forEach(function (name) {
            var child = dir + '/' + name, stat = fs().stat(child);
            if (stat.err) return;
            found = stat.data.isDirectory() ? found.concat(listFiles(child)) : found.concat(child);
        });
        return found;
    }

    function clearStaging(base) {
        listFiles(base + '/' + STAGING).forEach(function (file) { try { remove(file); } catch (e) { /* retried by the next clean-up */ } });
    }

    // Record entry for an installed file: its hash plus the mtime it had when that hash was known
    // (cep.fs.stat reports no size, so mtime alone says whether the file may have changed).
    function stamp(base, path, sha512) {
        var stat = fs().stat(base + '/' + path);
        return { sha512: sha512, mtime: stat.err ? -1 : +stat.data.mtime };
    }

    function rank(path) {
        for (var i = 0; i < TAIL.length; i++) if (TAIL[i].test(path)) return i + 1;
        return 0;
    }

    function order(paths) {
        return paths.slice().sort(function (a, b) { return rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0); });
    }

    function stage(base, path, base64) { write(base, STAGING + '/' + path, base64, window.cep.encoding.Base64); }

    // Reads a staged file back and compares it with the signed hash.
    function verifyStaged(base, path, sha512) {
        var data = readBase64(base + '/' + STAGING + '/' + path);
        if (data === null) return Promise.reject(new Error('Không đọc lại được file tạm: ' + path));
        return window.dr7Release.sha512(window.dr7Release.fromBase64(data)).then(function (hash) {
            if (hash !== sha512) throw new Error('File tạm ghi sai: ' + path + ' — đã huỷ, không thay đổi file nào.');
        });
    }

    function begin(base, journal) { write(base, JOURNAL, JSON.stringify(journal, null, 1), window.cep.encoding.UTF8); }

    function validJournal(journal) {
        var isPath = window.dr7Release.isRuntimePath;
        if (!journal || journal.journalVersion !== JOURNAL_VERSION || typeof journal.tag !== 'string' ||
            !Array.isArray(journal.move) || !Array.isArray(journal.remove) || !journal.record ||
            typeof journal.record.version !== 'string' || !journal.record.files || typeof journal.record.files !== 'object') return false;
        return journal.move.every(function (entry) { return entry && isPath(entry.path) && HEX512.test(entry.sha512); }) &&
            journal.remove.every(isPath) &&
            Object.keys(journal.record.files).every(function (path) {
                var entry = journal.record.files[path];
                return isPath(path) && (HEX512.test(entry) || (entry && HEX512.test(entry.sha512) && typeof entry.mtime === 'number'));
            });
    }

    function moveInto(base, path) {
        var to = base + '/' + path;
        makeDirs(base, path);
        remove(to);                                          // rename() will not overwrite; a crash here leaves the staged copy to finish from
        var from = base + '/' + STAGING + '/' + path;
        var result = fs().rename(from, to);
        if (result.err) {                                    // e.g. the staged file is briefly locked: copy it, never leave the deleted file missing
            var data = readBase64(from);
            if (data === null) throw new Error('Không chuyển được ' + path + ' (lỗi ' + errorName(result.err) + ')');
            write(base, path, data, window.cep.encoding.Base64);
        }
    }

    function damaged(path) { return Object.assign(new Error('File tạm không khớp journal: ' + path), { damaged: true }); }

    function complete(base, journal) {
        // Check everything first so a damaged staging area changes nothing: a file is either still staged
        // with the journal's hash, or already in place with it.
        var pending = [];
        journal.move.forEach(function (entry) {
            var staged = readBase64(base + '/' + STAGING + '/' + entry.path);
            var current = staged !== null ? staged : readBase64(base + '/' + entry.path);
            if (current === null || hashOf(current) !== entry.sha512) throw damaged(entry.path);
            if (staged !== null) pending.push(entry.path);
        });
        pending.forEach(function (path) { moveInto(base, path); });
        journal.remove.forEach(function (path) { remove(base + '/' + path); });
        var files = {};
        Object.keys(journal.record.files).forEach(function (path) {
            var entry = journal.record.files[path];
            files[path] = typeof entry === 'string' ? stamp(base, path, entry) : entry;
        });
        write(base, RECORD, JSON.stringify({ version: journal.record.version, files: files }, null, 1), window.cep.encoding.UTF8);
        clearStaging(base);
        remove(base + '/' + JOURNAL);                        // last, so an interrupted clean-up simply runs again
        return { status: 'completed', tag: journal.tag, removed: journal.remove, reload: pending.some(function (path) { return PANEL_CODE.test(path); }) };
    }

    function discard(base) {
        clearStaging(base);
        try { remove(base + '/' + JOURNAL); } catch (e) { /* an unreadable journal is rediscarded next time */ }
        return { status: 'discarded', message: INTERRUPTED };
    }

    // Finishes (or abandons) an interrupted update. Synchronous on purpose: it must precede the ExtendScript load.
    // -> { status: 'none' | 'completed' | 'discarded' | 'failed', message?, reload? }
    function recover(base) {
        var read = fs().readFile(base + '/' + JOURNAL, window.cep.encoding.UTF8), journal = null;
        if (read.err === NOT_FOUND) return { status: 'none' };
        if (!read.err) { try { journal = JSON.parse(read.data); } catch (e) { journal = null; } }
        if (!validJournal(journal)) return discard(base);
        try {
            return complete(base, journal);
        } catch (error) {
            if (error.damaged) return discard(base);
            return { status: 'failed', message: 'Chưa hoàn tất cập nhật ' + journal.tag + ': ' + error.message +
                ' Hãy đóng rồi mở lại Photoshop.' };
        }
    }

    window.dr7Staging = { stage: stage, verifyStaged: verifyStaged, begin: begin, recover: recover,
        clearStaging: clearStaging, order: order, stamp: stamp, write: write };
}());
