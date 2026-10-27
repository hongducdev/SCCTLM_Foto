/*
 * Khung ảnh: lưu/nạp mẫu (kiểu khung, chữ, màu... chứ không phải chữ của từng ảnh) vào localStorage.
 * Dữ liệu đọc lại luôn qua bộ lọc SCHEMA: khoá lạ hoặc giá trị sai kiểu bị bỏ, nên mẫu hỏng không làm vỡ form.
 * storage là đối số (thường window.localStorage) để test được bằng Node.
 */
(function (root) {
    'use strict';

    var KEY = 'dr7.frame.presets';
    var MAX_PRESETS = 20;
    var NAME_MAX = 30;
    var BACKGROUNDS = ['white', 'gray', 'black', 'custom'];
    var HEX = /^#[0-9a-f]{6}$/i;

    var frame = root.dr7ExifFrame, fields = root.dr7ExifFields;

    function oneOf(list) { return function (value) { return list.indexOf(value) !== -1; }; }
    function range(min, max) { return function (value) { return typeof value === 'number' && isFinite(value) && value >= min && value <= max; }; }
    function text(max) { return function (value) { return typeof value === 'string' && value.length <= max && frame.clean(value) === value.trim(); }; }
    function hex(value) { return typeof value === 'string' && HEX.test(value); }

    var SCHEMA = {
        style: oneOf(frame.STYLES), align: oneOf(frame.ALIGNS), logoPos: oneOf(frame.LOGO_POSITIONS), output: oneOf(frame.OUTPUTS), background: oneOf(BACKGROUNDS),
        prefix: text(frame.TEXT_MAX), separator: function (value) { return typeof value === 'string' && value.length >= 1 && value.length <= 4; },
        picks: function (value) { return Array.isArray(value) && value.every(oneOf(fields.FIELDS)); },
        border: range(1, frame.MAX_BORDER), radius: range(0, frame.MAX_RADIUS), size: range(frame.MIN_SCALE, frame.MAX_SCALE),
        gap: range(frame.MIN_SCALE, frame.MAX_SCALE), font: frame.isFontName, bgColor: hex, text: hex, muted: hex,
        logo: function (value) { return typeof value === 'string' && value.length <= 400 && frame.clean(value) === value.trim(); }
    };

    function sanitize(values) {
        var clean = {};
        if (!values || typeof values !== 'object') return clean;
        Object.keys(SCHEMA).forEach(function (key) {
            if (SCHEMA[key](values[key])) clean[key] = values[key];
        });
        return clean;
    }

    // { tên: values }, luôn là object thường; JSON hỏng hay storage bị chặn thì trả về rỗng
    function load(storage) {
        var result = {};
        try {
            var stored = JSON.parse(storage.getItem(KEY));
            if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
                Object.keys(stored).slice(0, MAX_PRESETS).forEach(function (name) { result[name] = sanitize(stored[name]); });
            }
        } catch (e) { return {}; }
        return result;
    }

    function write(storage, presets) {
        try {
            storage.setItem(KEY, JSON.stringify(presets));
            return { ok: true };
        } catch (e) {
            return { ok: false, error: 'Không lưu được mẫu: ' + e };
        }
    }

    function save(storage, rawName, values) {
        var name = frame.clean(rawName).slice(0, NAME_MAX), presets = load(storage);
        if (!name) return { ok: false, error: 'Hãy đặt tên cho mẫu.' };
        if (!(name in presets) && Object.keys(presets).length >= MAX_PRESETS) return { ok: false, error: 'Tối đa ' + MAX_PRESETS + ' mẫu, hãy xoá bớt.' };
        presets[name] = sanitize(values);
        var result = write(storage, presets);
        result.name = name;
        return result;
    }

    function remove(storage, name) {
        var presets = load(storage);
        delete presets[name];
        return write(storage, presets);
    }

    root.dr7FramePresets = { MAX_PRESETS: MAX_PRESETS, NAME_MAX: NAME_MAX, sanitize: sanitize, load: load, save: save, remove: remove };
}(typeof window !== 'undefined' ? window : this));
