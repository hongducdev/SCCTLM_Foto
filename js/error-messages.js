/*
 * Cổng duy nhất biến lỗi thô (chuỗi từ ExtendScript, Error của JS, mã trả về) thành thông báo tiếng Việt cho người dùng:
 *   scctlmFotoErrors.explain(raw, { label, source }) → { title, message, action }
 *   scctlmFotoErrors.line(raw, ctx)                  → "message action" một dòng, cho thanh trạng thái
 *   scctlmFotoErrors.recent()                        → chuỗi thô gần đây, chỉ để hiện trong báo cáo Chẩn đoán
 * source: command | load | update | cep | explore. Không bao giờ trả chuỗi thô ra ngoài (tests/check-error-messages.js).
 * Chạy được cả trong Node.
 */
(function (root) {
    'use strict';

    var MAX_RECENT = 20, MAX_RAW = 600;
    var recent = [];
    var VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    // Dấu hiệu chuỗi kỹ thuật: mã SCCTLM_XXX, File:/Line:, tên lỗi, đường dẫn, URL, "[object", "undefined"/"null"
    var TECHNICAL = /SCCTLM_[A-Z_]+\b|\bFile:|\bLine:|\b[a-z]*error\b|\bundefined\b|\bnull\b|\[object|\bat \S+:\d+|[A-Za-z]:[\\/]|\/Users\/|\(lỗi |https?:\/\//i;
    var RETRY = 'Nếu lỗi lặp lại, mở Chẩn đoán ở cuối panel và gửi báo cáo cho SCCTLM.';

    function textOf(raw) {
        if (raw && typeof raw === 'object') return String(raw.message !== undefined ? raw.message : '');
        return raw === undefined || raw === null ? '' : String(raw);
    }

    function remember(text, source) {
        recent.push({ time: new Date().toISOString(), source: source || 'command', raw: text.slice(0, MAX_RAW) });
        if (recent.length > MAX_RECENT) recent.shift();
    }

    function what(ctx) { return ctx && ctx.label ? '«' + ctx.label + '»' : 'thao tác này'; }
    function pack(title, message, action) { return { title: title, message: message, action: action || RETRY }; }

    function service(text) {
        return /YouTube/i.test(text) ? 'YouTube' : /GitHub/i.test(text) ? 'GitHub' : 'internet';
    }

    // Mẫu theo thứ tự ưu tiên: [regex, dựng thông báo, source bắt buộc (tuỳ chọn)].
    var PATTERNS = [
        [/require[sd]? RGB|RGB 8-bit|8-bit or 16-bit/i, function (t, c) {
            return pack('Ảnh chưa ở chế độ màu RGB', 'Chức năng này chỉ chạy trên ảnh RGB 8-bit hoặc 16-bit nên ' + what(c) + ' chưa chạy được.',
                'Vào Image > Mode > RGB Color (và 8 Bits/Channel hoặc 16 Bits/Channel) trong Photoshop rồi bấm lại.');
        }],
        [/SCCTLM_BA_EMPTY/, function () {
            return pack('Chưa có kết quả để so sánh', 'Trong lần làm việc này, panel chưa tạo lớp nào trên ảnh này để ẩn hoặc hiện. Ảnh mở lại từ file sau khi đóng cũng không còn được nhớ.',
                'Chạy một công cụ của panel trên ảnh này trước, rồi bấm Trước / Sau.');
        }],
        [/Missing command/i, function (t, c) {
            return pack('Plugin thiếu thành phần', 'Không tìm thấy lệnh ' + what(c) + ' trong lõi plugin, có thể bản cài bị thiếu file.',
                'Bấm nút ↻ để nạp lại. Nếu vẫn lỗi, cài lại bằng install\\Cai-dat-SCCTLM_Foto.bat.');
        }],
        [/SCCTLM_NOT_READY/, function () {
            return pack('Plugin chưa sẵn sàng', 'Lõi của plugin chưa nạp xong nên chưa chạy được lệnh.', 'Bấm nút ↻ hoặc đóng rồi mở lại panel.');
        }],
        [/EvalScript error|SCCTLM_MISSING/i, function () {
            return pack('Panel chưa nói chuyện được với Photoshop', 'Photoshop không phản hồi lệnh từ panel.',
                'Đóng hộp thoại đang mở trong Photoshop (nếu có), rồi bấm nút ↻ để nạp lại panel.');
        }],
        [/not currently available/i, function (t, c) {
            return pack('Photoshop chưa cho chạy lúc này', 'Photoshop không cho chạy ' + what(c) + ' ở trạng thái hiện tại.',
                'Đóng hộp thoại hoặc chế độ đang mở (đang gõ chữ, đang Transform…), chọn một lớp ảnh thường rồi thử lại.');
        }],
        [/out of memory|not enough memory|insufficient memory|scratch disk|\bRAM\b/i, function (t, c) {
            return pack('Photoshop thiếu bộ nhớ', 'Không đủ bộ nhớ để chạy ' + what(c) + ' trên ảnh này.',
                'Đóng bớt ảnh đang mở, giảm kích thước ảnh hoặc dọn ổ đĩa đệm (Edit > Purge > All) rồi thử lại.');
        }],
        [/\block(ed)?\b/i, function (t, c) {
            return pack('Lớp đang bị khoá', 'Lớp đang chọn bị khoá nên ' + what(c) + ' không ghi được lên đó.',
                'Mở khoá lớp trong bảng Layers rồi thử lại.');
        }],
        [/File not found|Missing (bundled|colour|mhk)|Cannot (open|write)|file is empty/i, function () {
            return pack('Plugin thiếu file', 'Plugin thiếu hoặc không đọc được một file đi kèm (preset, màu hoặc hoa văn).',
                'Cài lại bằng install\\Cai-dat-SCCTLM_Foto.bat, hoặc bấm nút ⤓ để cập nhật lại các file.');
        }],
        [/no such element|does not exist|doesn't exist|target layer|no active|no selection|selection is empty|invalid (layer|target)|not found/i, function (t, c) {
            return pack('Chưa chọn đúng lớp hoặc vùng', 'Không tìm thấy lớp hoặc vùng chọn mà ' + what(c) + ' cần.',
                'Chọn lớp ảnh trong bảng Layers (không phải nhóm hay mask), tạo vùng chọn nếu cần, rồi thử lại.');
        }],
        [/smart object|cannot contain text|type layer|text layer|rasteri[sz]e|pixel layer|layer kind/i, function (t, c) {
            return pack('Loại lớp không phù hợp', 'Lớp đang chọn không dùng được với ' + what(c) + '.',
                'Chọn một lớp ảnh (pixel), hoặc Rasterize lớp đó trước khi chạy.');
        }],
        [/General Photoshop error|Photoshop error/i, function (t, c) {
            return pack('Photoshop báo lỗi', 'Photoshop gặp lỗi khi chạy ' + what(c) + ' nên thao tác chưa hoàn tất.',
                'Kiểm tra lớp bị thêm dở trong bảng Layers (Ctrl+Z để hoàn tác), rồi thử lại. ' + RETRY);
        }],
        [/chữ ký|signature/i, function () {
            return pack('Bản cập nhật bị từ chối', 'Bản cập nhật không qua được bước kiểm tra chữ ký nên không được cài.',
                'Plugin giữ nguyên bản đang dùng. Thử lại sau; nếu lặp lại, tải bản cài mới từ trang GitHub của SCCTLM_Foto.');
        }],
        [/giới hạn lượt|GitHub (403|429)/, function () {
            return pack('Chưa kiểm tra được bản mới', 'GitHub tạm giới hạn lượt kiểm tra từ mạng này.', 'Thử lại sau ít phút.');
        }],
        [/Không kết nối được|network|timeout|Failed to fetch/i, function (t) {
            return pack('Không kết nối được mạng', 'Không kết nối được ' + service(t) + '.', 'Kiểm tra kết nối internet rồi thử lại.');
        }],
        [/^(YouTube|GitHub) \d{3}/, function (t) {
            return pack('Máy chủ đang trục trặc', 'Máy chủ ' + service(t) + ' đang gặp sự cố hoặc không trả dữ liệu.', 'Thử lại sau ít phút.');
        }],
        [/Không (ghi|tạo|xoá|chuyển|đọc lại|đọc) được|file tạm/i, function () {
            return pack('Không ghi được file của plugin', 'Plugin không ghi hoặc chuyển được một file cần thiết.',
                'Đóng Photoshop, mở lại rồi thử lại. Nếu vẫn lỗi, cài lại bằng install\\Cai-dat-SCCTLM_Foto.bat.');
        }],
        [/\.jsx|did not define|not registered/i, function () {
            return pack('Plugin khởi động chưa đủ', 'Một số thành phần của plugin không nạp được nên có nút có thể không chạy.',
                'Bấm nút ↻ để nạp lại. Nếu vẫn lỗi, cài lại bằng install\\Cai-dat-SCCTLM_Foto.bat.');
        }, 'load']
    ];

    var DEFAULTS = {
        command: function (c) { return pack('Chưa hoàn thành thao tác', 'Không hoàn thành được ' + what(c) + '. Photoshop không báo rõ nguyên nhân.'); },
        load: function () { return pack('Plugin chưa khởi động được', 'Lõi của plugin không nạp được nên các nút chưa dùng được.', 'Bấm nút ↻ để nạp lại. ' + RETRY); },
        update: function () { return pack('Cập nhật không thành công', 'Chưa cập nhật được plugin. Bản đang dùng vẫn nguyên vẹn.', 'Thử lại sau; ' + RETRY.charAt(0).toLowerCase() + RETRY.slice(1)); },
        cep: function () { return pack('Không kết nối được Photoshop', 'Panel không gửi được lệnh sang Photoshop.', 'Bấm nút ↻ để nạp lại panel. ' + RETRY); },
        explore: function () { return pack('Chưa tải được danh sách', 'Không tải được danh sách video lúc này.', 'Kiểm tra internet rồi bấm Thử lại.'); }
    };

    // Chỉ phần nội dung lỗi: bỏ tiền tố SCCTLM_ERROR#n, tên lớp lỗi ("Error:") và phần "File:/Line:" do panel/ExtendScript thêm vào
    function clean(text) {
        return text.replace(/^SCCTLM_ERROR(#-?\d+)?:\s*/, '').replace(/\r?\nFile:[\s\S]*$/, '').replace(/^[A-Za-z]*Error:\s*/, '')
            .replace(/\s+/g, ' ').trim();
    }

    function explain(raw, ctx) {
        var source = ctx && DEFAULTS[ctx.source] ? ctx.source : 'command';
        var text = textOf(raw);
        remember(text, source);
        var guard = root.scctlmFotoColorMode, mode = guard ? guard.parse(text) : null;
        if (mode) {
            return pack('Ảnh chưa ở chế độ màu RGB', 'Ảnh đang ở chế độ màu ' + mode + ' nên ' + what(ctx) + ' chưa chạy được.',
                'Vào Image > Mode > RGB Color trong Photoshop rồi bấm lại.');
        }
        var authored = clean(text);
        for (var i = 0; i < PATTERNS.length; i += 1) {
            if ((!PATTERNS[i][2] || PATTERNS[i][2] === source) && PATTERNS[i][0].test(authored)) return PATTERNS[i][1](authored, ctx);
        }
        var visible = withoutPaths(authored);
        if (visible && VIETNAMESE.test(visible) && !TECHNICAL.test(visible)) return pack(DEFAULTS[source](ctx).title, visible, RETRY);
        return DEFAULTS[source](ctx);
    }

    // Câu của plugin thường kèm đường dẫn ("Không tìm thấy file logo: C:\...") — bỏ đường dẫn, giữ phần còn lại
    function withoutPaths(text) {
        return text.replace(/\s*(?:[A-Za-z]:[\\/]|\/(?:Users|home)\/)\S*/g, '').replace(/\s*:\s*$/, '.').trim();
    }

    function line(raw, ctx) {
        var r = explain(raw, ctx);
        return r.message + ' ' + r.action;
    }

    root.scctlmFotoErrors = {
        explain: explain,
        line: line,
        recent: function () { return recent.slice(); }
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = root.scctlmFotoErrors;
}(typeof window !== 'undefined' ? window : this));
