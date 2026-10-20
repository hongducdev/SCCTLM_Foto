/*
 * Phím người dùng đánh dấu là "đang dùng ngoài panel" (vd đã gán thẳng cho một Action trong Photoshop).
 * Photoshop không cho script đọc phím của Action có sẵn, nên panel chỉ biết được phím này nếu người dùng
 * tự đánh dấu. js/shortcut-key-capture.js chặn việc gán các phím này cho Action khác.
 *
 * Lưu ở localStorage khoá "dr7ReservedKeys": mảng chuỗi phím, vd ["F4", "Shift+F7"].
 */
(function (root) {
    'use strict';

    var STORAGE_KEY = 'dr7ReservedKeys';
    var KEY_FORMAT = /^(Ctrl\+)?(Shift\+)?F([2-9]|1[0-2])$/;      // cùng định dạng với jsx/action-shortcut-setup.jsx

    // Chỉ giữ chuỗi phím hợp lệ, không trùng; bỏ mọi thứ khác trong dữ liệu đã lưu
    function clean(list) {
        var out = [];
        (Array.isArray(list) ? list : []).forEach(function (key) {
            if (typeof key === 'string' && KEY_FORMAT.test(key) && out.indexOf(key) < 0) out.push(key);
        });
        return out;
    }

    // Có trong danh sách thì bỏ ra, chưa có thì thêm vào; trả về { list, reserved } (reserved: trạng thái sau khi đổi)
    function toggle(list, key) {
        var current = clean(list);
        var at = current.indexOf(key);
        if (at >= 0) {
            current.splice(at, 1);
            return { list: current, reserved: false };
        }
        if (!KEY_FORMAT.test(key)) return { list: current, reserved: false };
        current.push(key);
        return { list: current, reserved: true };
    }

    function load() {
        try {
            return clean(JSON.parse(root.localStorage.getItem(STORAGE_KEY) || '[]'));
        } catch (e) {
            console.warn('DR7: danh sách phím đã đánh dấu hỏng hoặc không đọc được, bỏ qua', e);
            return [];
        }
    }

    function save(list) {
        try {
            root.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('DR7: không lưu được danh sách phím đã đánh dấu', e);
        }
    }

    var api = {
        clean: clean,
        toggle: toggle,
        list: load,
        has: function (key) { return load().indexOf(key) >= 0; },
        // Đổi trạng thái 1 phím trong kho lưu; trả về true nếu giờ phím đang được đánh dấu
        flip: function (key) {
            var result = toggle(load(), key);
            save(result.list);
            return result.reserved;
        }
    };

    if (typeof module === 'object' && module.exports) module.exports = api;   // tests/check-shortcut-reserved.js
    else root.dr7ReservedKeys = api;
}(typeof window !== 'undefined' ? window : globalThis));
