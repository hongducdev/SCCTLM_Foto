/*
 * Tiền kiểm chế độ màu cho các lệnh retouch: tạo layer/mask chỉ chạy đúng trên RGB; ở Gray/CMYK/Lab/Indexed Photoshop
 * dừng giữa chừng và để lại layer dở. Chạy được cả trong Node (tests/check-color-mode-guard.js).
 *
 * RGB_COMMANDS: các nút tạo layer/mask trên ảnh. Hạt phim (MLXG), Hào quang (CGYSB), Hạt thô (mcwl), Chấm (sfb) tự từ
 * chối ảnh không phải RGB và không để lại layer dở (đã chạy thử trên ảnh Gray/CMYK/Lab), nên không cần chặn ở đây.
 * Không chặn: WM, Brush, Rim Light, Artboard, Khung EXIF, Preset/Mix màu, Action (không tạo layer retouch theo RGB).
 * Nút mới tạo layer thì thêm vào bảng này.
 */
(function (root) {
    'use strict';

    var RGB_COMMANDS = {
        doa: ['ZCZQ', 'GGXS', 'JMXS', 'TJSH', 'TJYY', 'MBPF', 'FSJH', 'DKACR'],
        ext: ['DS', 'WT', 'RE', 'DB', 'SE', 'BA', 'LS', 'BTNPFSD2', 'TC', 'SH']
    };
    var MODE_NAMES = {
        GRAYSCALE: 'Grayscale', CMYK: 'CMYK', LAB: 'Lab', INDEXEDCOLOR: 'Indexed Color', INDEXCOLOR: 'Indexed Color',
        BITMAP: 'Bitmap', MULTICHANNEL: 'Multichannel', DUOTONE: 'Duotone'
    };
    var NOT_RGB = 'SCCTLM_NOT_RGB';

    function needsRgb(kind, name) {
        return (RGB_COMMANDS[kind] || []).indexOf(name) !== -1;
    }

    // Mã ExtendScript chạy trước lệnh; trả "SCCTLM_NOT_RGB:<mode>" để panel dựng thông báo.
    // Hàng loạt (BA) xử lý mọi ảnh đang mở nên kiểm tất cả, các lệnh khác chỉ kiểm ảnh đang chọn.
    function preflightCode(kind, name) {
        if (kind === 'ext' && name === 'BA') {
            return 'for(var i=0;i<app.documents.length;i++)if(app.documents[i].mode!==DocumentMode.RGB)return "' + NOT_RGB + ':"+String(app.documents[i].mode);';
        }
        return 'if(app.activeDocument.mode!==DocumentMode.RGB)return "' + NOT_RGB + ':"+String(app.activeDocument.mode);';
    }

    function modeName(raw) {
        var key = String(raw || '').replace(/^DocumentMode\./, '').toUpperCase();
        return MODE_NAMES[key] || (key ? key.charAt(0) + key.slice(1).toLowerCase() : 'khác RGB');
    }

    // res = chuỗi lệnh trả về, hoặc lỗi bọc ngoài ("SCCTLM_ERROR…: Error: SCCTLM_NOT_RGB:…" khi jsx/main.jsx ném lỗi);
    // null nếu không phải lỗi chế độ màu
    function parse(res) {
        var m = new RegExp(NOT_RGB + '(?::([A-Za-z.]+))?').exec(String(res || ''));
        return m ? modeName(m[1]) : null;
    }

    root.scctlmFotoColorMode = { needsRgb: needsRgb, preflightCode: preflightCode, modeName: modeName, parse: parse, CODE: NOT_RGB };
    if (typeof module !== 'undefined' && module.exports) module.exports = root.scctlmFotoColorMode;
}(typeof window !== 'undefined' ? window : this));
