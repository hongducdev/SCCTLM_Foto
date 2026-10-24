/*
 * Tìm nơi một phím F (vd "F5", "Shift+F7") đang được dùng trước khi gán cho Action, để hỏi người dùng ghi đè.
 *
 * Nguồn kiểm được: phím panel đã gán cho Action khác, phím mặc định của Photoshop (Windows) trong bảng dưới,
 * phím người dùng đã đánh dấu "dùng ngoài panel" (js/shortcut-reserved-keys.js). Photoshop không cho script
 * đọc phím của Action có sẵn hay phím menu người dùng tự đổi, nên những phím đó không kiểm được.
 */
(function (root) {
    'use strict';

    // Phím F mặc định của Photoshop trên Windows (Edit > Keyboard Shortcuts)
    var PHOTOSHOP_KEYS = {
        'F2': 'Edit > Cut',
        'F3': 'Edit > Copy',
        'F4': 'Edit > Paste',
        'F5': 'Window > Brush Settings',
        'F6': 'Window > Color',
        'F7': 'Window > Layers',
        'F8': 'Window > Info',
        'F12': 'File > Revert',
        'Shift+F5': 'Edit > Fill',
        'Shift+F6': 'Select > Modify > Feather',
        'Shift+F7': 'Select > Inverse'
    };

    // combo: phím cần gán; target: { set, action } nhận phím; bindings: [{ key, set, action }] panel đã gán;
    // reserved: phím đã đánh dấu. Trả về danh sách nơi trùng: { kind: 'panel' | 'photoshop' | 'reserved', label, binding? }
    function find(combo, target, bindings, reserved) {
        var out = [];
        (bindings || []).forEach(function (b) {
            if (b.key === combo && !(b.set === target.set && b.action === target.action)) {
                out.push({ kind: 'panel', label: 'Action "' + b.action + '" (bộ "' + b.set + '")', binding: b });
            }
        });
        if (PHOTOSHOP_KEYS[combo]) out.push({ kind: 'photoshop', label: 'lệnh ' + PHOTOSHOP_KEYS[combo] + ' của Photoshop' });
        if ((reserved || []).indexOf(combo) >= 0) out.push({ kind: 'reserved', label: 'phím bạn đã đánh dấu là dùng ngoài panel' });
        return out;
    }

    var api = { PHOTOSHOP_KEYS: PHOTOSHOP_KEYS, find: find };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.dr7ShortcutConflicts = api;
}(typeof window !== 'undefined' ? window : globalThis));
