/*
 * Nút "Tạo Brush" (Brush Lab) và "Tạo Rim Light" (Rim Light) + ô phím tắt cạnh nút.
 *
 * Mỗi nút chạy một Action của bộ "Thumbnail action" đi kèm panel (presets/Thumbnail_action.atn).
 * Photoshop chưa có bộ đó thì panel nạp vào trước rồi mới chạy (jsx/action-set-import.jsx), nên người dùng
 * không phải tự nhập Action. Ô phím tắt gán phím cho đúng Action đó (js/shortcut-key-capture.js).
 */
(function () {
    'use strict';

    var FILE = 'Thumbnail_action.atn';
    var SET = 'Thumbnail action';
    var ITEMS = [
        { id: 'brush', action: 'Stroke Brush Path', name: 'Brush' },
        { id: 'rim', action: 'YouTube Rim Light', name: 'Rim Light' }
    ];

    function specOf(item) { return [FILE, SET, item.action].join('\t'); }

    // done(ok): true khi Action đã có trong Photoshop (sẵn có hoặc vừa nạp).
    // Vừa nạp thì dựng lại bộ phím tắt: phím gán trước đó cho Action này mới trỏ tới được
    function ensure(item, done) {
        window.dr7EnsureAction(specOf(item), function (res) {
            if (res === 'DR7_OK') {
                if (window.dr7FlashStatus) window.dr7FlashStatus('✓ Đã nạp bộ Action ' + SET);
                window.dr7ReinstallShortcuts(function () { done(true); });
                return;
            }
            done(res === 'DR7_EXISTS');
        });
    }

    window.dr7InitCreateButtons = function () {
        ITEMS.forEach(function (item) {
            var create = document.querySelector('.create-btn[data-create="' + item.id + '"]');
            var key = document.querySelector('.create-key[data-create="' + item.id + '"]');
            if (!create || !key) return;
            create.addEventListener('click', function () {
                if (window.dr7IsBusy && window.dr7IsBusy()) return;
                ensure(item, function (ok) {
                    if (!ok) return;
                    window.dr7PlayAction(specOf(item), function (res) {
                        if (res === 'DR7_OK' && window.dr7FlashStatus) window.dr7FlashStatus('✓ Đã tạo ' + item.name);
                    });
                });
            });
            window.dr7AttachShortcutKey(key, { set: SET, action: item.action }, function (done) { ensure(item, done); });
        });
    };
}());
