/*
 * Đồng bộ code từ thư mục nguồn (vd D:\DR7) sang bản cài trước khi nút ↻ nạp lại,
 * để không cần chạy install\Hot-reload-SCCTLM_Foto.bat.
 *
 * Chỉ bật khi bản cài có file `.dr7-dev-source` chứa đường dẫn thư mục nguồn
 * (Cai-dat-SCCTLM_Foto.bat tự ghi khi cài từ một git checkout). Người dùng thường không có file này
 * → ↻ chỉ nạp lại như cũ.
 *
 * Chép file khi bản cài chưa có hoặc file nguồn mới hơn (mtime). Không xoá file nào.
 */
(function () {
    'use strict';

    var SOURCE_RECORD = '.dr7-dev-source';
    var UPDATER_RECORD = '.dr7-version.json';
    var UPDATER_JOURNAL = '.dr7-update.json';
    // Cùng danh sách file runtime với install/watch-plugin.js
    var FILES = ['index.html', 'style.css', 'loader.jsx'];
    var FOLDERS = ['js', 'jsx', 'css', 'img', 'presets'];

    function fs() { return window.cep && window.cep.fs; }

    function readSourceDir(base) {
        var res = fs().readFile(base + '/' + SOURCE_RECORD, window.cep.encoding.UTF8);
        if (res.err) return '';
        var dir = String(res.data).replace(/^\uFEFF/, '').replace(/\\/g, '/').replace(/[\s\/]+$/, '');
        // Nguồn trùng bản cài (hoặc rỗng) thì không có gì để chép
        return dir && dir.toLowerCase() !== base.toLowerCase() ? dir : '';
    }

    function mtime(path) {
        var res = fs().stat(path);
        return res.err ? -1 : +res.data.mtime;
    }

    function ensureDir(path) {
        var res = fs().stat(path);
        if (!res.err && res.data.isDirectory()) return;
        var parent = path.substring(0, path.lastIndexOf('/'));
        if (parent) ensureDir(parent);
        fs().makedir(path);
    }

    function copyIfNewer(src, dst, relative) {
        var from = src + '/' + relative, to = dst + '/' + relative;
        var srcTime = mtime(from);
        if (srcTime < 0 || srcTime <= mtime(to)) return 0;
        var data = fs().readFile(from, window.cep.encoding.Base64);
        if (data.err) throw new Error('Không đọc được ' + from + ' (lỗi ' + data.err + ')');
        ensureDir(to.substring(0, to.lastIndexOf('/')));
        var written = fs().writeFile(to, data.data, window.cep.encoding.Base64);
        if (written.err) throw new Error('Không ghi được ' + to + ' (lỗi ' + written.err + ')');
        return 1;
    }

    function copyFolder(src, dst, relative) {
        var listing = fs().readdir(src + '/' + relative);
        if (listing.err) return 0;                       // thư mục tuỳ chọn (vd presets/) có thể không có
        var count = 0;
        listing.data.forEach(function (name) {
            var child = relative + '/' + name;
            var info = fs().stat(src + '/' + child);
            if (info.err) return;
            count += info.data.isDirectory() ? copyFolder(src, dst, child) : copyIfNewer(src, dst, child);
        });
        return count;
    }

    // Trả về số file đã chép (0 nếu không cấu hình nguồn). Ném lỗi nếu chép thất bại.
    window.dr7SyncDevSource = function (base) {
        if (!fs() || !base) return 0;
        var src = readSourceDir(base);
        if (!src || mtime(src + '/loader.jsx') < 0) return 0;  // thư mục nguồn đã bị xoá/di chuyển
        var count = 0;
        FILES.forEach(function (file) { count += copyIfNewer(src, base, file); });
        FOLDERS.forEach(function (folder) { count += copyFolder(src, base, folder); });
        // Bản ghi của GitHub updater không còn khớp file vừa chép (giống watch-plugin.js)
        if (count) { fs().deleteFile(base + '/' + UPDATER_RECORD); fs().deleteFile(base + '/' + UPDATER_JOURNAL); }
        return count;
    };
}());
