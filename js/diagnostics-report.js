/*
 * Báo cáo Chẩn đoán: người dùng sao chép gửi cho SCCTLM khi plugin lỗi cài đặt hay không nạp được.
 *   scctlmFotoDiagnostics.CORE_CODE           mã ExtendScript đọc trạng thái lõi (loader.jsx)
 *   scctlmFotoDiagnostics.parseCore(res)      kết quả CORE_CODE → { ready, totalMs, photoshop, errors[], times[] } hoặc null
 *   scctlmFotoDiagnostics.build(info)         → chuỗi báo cáo, đã ẩn thư mục home của người dùng
 * Chạy được cả trong Node (tests/check-diagnostics-report.js).
 */
(function (root) {
    'use strict';

    var SEP = '\u0001';
    var MAX_ERRORS = 10, MAX_RECENT = 10, MAX_TEXT = 300, SLOWEST = 5;

    // Mọi giá trị đọc từ $.scctlmFotoLoad*; chuỗi lỗi nhiều dòng được ghép một dòng để tách theo "\n".
    var CORE_CODE = '(function(){try{var t=$.scctlmFotoLoadTimes||[],s=[],e=$.scctlmFotoLoadErrors||[],m=[],i;' +
        'for(i=0;i<t.length;i++)s.push(String(t[i].file).replace(/^.*[\\\\\\/]/,"")+"\\t"+t[i].ms);' +
        'for(i=0;i<e.length;i++)m.push(String(e[i]).replace(/\\s+/g," "));' +
        'return ["ready="+($.scctlmFotoReady?1:0),"total="+$.scctlmFotoLoadTotalMs,"ps="+app.version,' +
        '"errors="+m.join("' + SEP + '"),"times="+s.join("' + SEP + '")].join("\\n");}catch(x){return "unavailable";}}())';

    function parseCore(res) {
        var text = String(res === undefined || res === null ? '' : res);
        if (!/^ready=/.test(text)) return null;
        var fields = {};
        text.split('\n').forEach(function (line) {
            var at = line.indexOf('=');
            if (at > 0) fields[line.slice(0, at)] = line.slice(at + 1);
        });
        return {
            ready: fields.ready === '1',
            totalMs: Number(fields.total) || 0,
            photoshop: fields.ps || '',
            errors: fields.errors ? fields.errors.split(SEP) : [],
            times: fields.times ? fields.times.split(SEP).map(function (item) {
                var parts = item.split('\t');
                return { file: parts[0], ms: Number(parts[1]) || 0 };
            }) : []
        };
    }

    // Tên người dùng Windows/macOS/Linux là thông tin cá nhân: báo cáo được gửi đi nên đổi thành "~"
    function redact(text, home) {
        var out = String(text);
        if (home) {
            var plain = String(home).replace(/\\/g, '/').replace(/\/+$/, '');
            if (plain) out = out.split(plain).join('~').split(plain.replace(/\//g, '\\')).join('~');
        }
        return out.replace(/[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s)"']+/gi, '~').replace(/\/(Users|home)\/[^\/\s)"']+/g, '~');
    }

    function clip(text) {
        var one = String(text).replace(/\s+/g, ' ').trim();
        return one.length > MAX_TEXT ? one.slice(0, MAX_TEXT) + '…' : one;
    }

    function build(info) {
        var i = info || {}, core = i.core;
        var lines = ['SCCTLM_Foto — báo cáo chẩn đoán', ''];
        lines.push('Phiên bản panel: ' + (i.panelVersion || 'không rõ'));
        lines.push('Photoshop: ' + ((core && core.photoshop) || i.photoshop || 'không rõ'));
        lines.push('Hệ điều hành: ' + (i.os || 'không rõ'));
        lines.push('Thư mục panel: ' + (i.base || 'không rõ'));
        if (!core) {
            lines.push('Lõi plugin: không đọc được (Photoshop không phản hồi hoặc lõi chưa nạp)');
        } else {
            lines.push('Lõi plugin: ' + (core.ready ? 'sẵn sàng' : 'CHƯA sẵn sàng'));
            lines.push('Thời gian nạp lõi: ' + core.totalMs + ' ms');
            var errors = core.errors.slice(0, MAX_ERRORS);
            lines.push('Lỗi khi nạp lõi: ' + (errors.length ? '' : 'không có'));
            errors.forEach(function (item) { lines.push('  - ' + clip(item)); });
            if (core.errors.length > MAX_ERRORS) lines.push('  … và ' + (core.errors.length - MAX_ERRORS) + ' lỗi nữa');
            var slow = core.times.slice().sort(function (a, b) { return b.ms - a.ms; }).slice(0, SLOWEST);
            if (slow.length) {
                lines.push('File nạp chậm nhất:');
                slow.forEach(function (item) { lines.push('  - ' + item.file + ': ' + item.ms + ' ms'); });
            }
        }
        var recent = (i.recent || []).slice(-MAX_RECENT);
        lines.push('');
        lines.push('Chi tiết kỹ thuật các lỗi gần đây: ' + (recent.length ? '' : 'chưa có'));
        recent.forEach(function (item) { lines.push('  - [' + item.source + '] ' + clip(item.raw)); });
        return redact(lines.join('\n'), i.home);
    }

    root.scctlmFotoDiagnostics = { CORE_CODE: CORE_CODE, parseCore: parseCore, build: build, redact: redact };
    if (typeof module !== 'undefined' && module.exports) module.exports = root.scctlmFotoDiagnostics;
}(typeof window !== 'undefined' ? window : this));
