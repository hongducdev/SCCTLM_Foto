/*
 * Khung ảnh: các ô của form và trạng thái của chúng (đọc giá trị, chụp/khôi phục mẫu, màu theo kiểu khung, logo).
 * Không biết gì về Photoshop; js/exif-frame-tab.js nối form này với EXIF, xem trước và lệnh vẽ.
 */
(function () {
    'use strict';

    var DEFAULT_PREFIX = 'Shot on';
    var DEFAULT_BORDER = 3;
    var DEFAULT_FONT = 'ArialMT';
    var OVERLAY_COLORS = { text: '#ffffff', muted: '#e6e6e6' };
    var CONTROLS = ['prefix', 'model', 'make', 'settings', 'extra', 'separator', 'style', 'border', 'radius', 'size', 'gap', 'font', 'text', 'muted',
        'background', 'bg-color', 'eyedropper', 'output', 'logo-pick', 'logo-name', 'logo-clear', 'logo-pos', 'logo-brand'];
    // Phần của form được lưu trong mẫu: kiểu và giao diện, không phải chữ của từng ảnh (máy, hãng, thông số, dòng thêm)
    var PRESET_FIELDS = ['style', 'logoPos', 'output', 'background', 'prefix', 'separator', 'border', 'radius', 'size', 'gap', 'font', 'text', 'muted'];

    var data = window.dr7ExifFrame, fields = window.dr7ExifFields;

    function number(input, fallback, min, max) {
        var value = parseInt(input.value, 10);
        return isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    }

    window.dr7FrameForm = function (root) {
        var el = {}, state = { align: 'center', logo: '' }, listeners = [];

        CONTROLS.forEach(function (key) {
            el[key.replace(/-(\w)/g, function (m, c) { return c.toUpperCase(); })] = root.querySelector('.ef-' + key);
        });
        var chips = Array.prototype.slice.call(root.querySelectorAll('.ef-chip input'));
        var aligns = Array.prototype.slice.call(root.querySelectorAll('.ef-align'));

        function changed() { listeners.forEach(function (fn) { fn(); }); }

        function pickedFields() {
            var ticked = {};
            chips.forEach(function (box) { if (box.checked) ticked[box.getAttribute('data-field')] = true; });
            return fields.FIELDS.filter(function (key) { return ticked[key]; });
        }

        function values() {
            return {
                style: el.style.value, prefix: el.prefix.value, model: el.model.value, make: el.make.value, settings: el.settings.value,
                extra: el.extra.value, border: number(el.border, DEFAULT_BORDER, 1, data.MAX_BORDER), radius: number(el.radius, 0, 0, data.MAX_RADIUS),
                size: number(el.size, 100, data.MIN_SCALE, data.MAX_SCALE), gap: number(el.gap, 100, data.MIN_SCALE, data.MAX_SCALE),
                align: state.align, logoPos: el.logoPos.value, font: el.font.value || DEFAULT_FONT, output: el.output.value, logo: state.logo,
                background: el.bgColor.value, text: el.text.value, muted: el.muted.value
            };
        }

        function setColors(colors) {
            if (colors.fill) el.bgColor.value = colors.fill;
            el.text.value = colors.text;
            el.muted.value = colors.muted;
        }

        // Chữ đè lên ảnh không có viền, bo góc hay màu nền; màu chữ chuyển sang sáng cho dễ đọc trên ảnh
        function syncStyle() {
            var overlay = el.style.value === 'overlay';
            [el.border, el.radius, el.background, el.bgColor, el.eyedropper].forEach(function (control) { control.disabled = overlay; });
        }

        function applyStyle() {
            syncStyle();
            if (el.style.value === 'overlay') setColors(OVERLAY_COLORS);
            else if (data.BACKGROUNDS[el.background.value]) setColors(data.BACKGROUNDS[el.background.value]);
            else setColors(data.contrast(el.bgColor.value));
        }

        function pickBackground(hex) {
            el.bgColor.value = hex;
            el.background.value = 'custom';
            setColors(data.contrast(hex));
        }

        function setAlign(align) {
            state.align = align;
            aligns.forEach(function (button) {
                var on = button.getAttribute('data-align') === align;
                button.classList.toggle('is-active', on);
                button.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        function setLogo(path) {
            state.logo = path || '';
            el.logoName.textContent = state.logo ? state.logo.split(/[\\/]/).pop() : 'Chưa chọn logo';
            el.logoName.title = state.logo;
            el.logoClear.hidden = !state.logo;
        }

        function snapshot() {
            var form = values(), saved = { align: state.align, logo: state.logo, bgColor: form.background, picks: pickedFields() };
            PRESET_FIELDS.forEach(function (key) { saved[key] = key === 'background' ? el.background.value : form[key]; });
            return saved;
        }

        // Chỉ đặt những khoá có trong mẫu; font không còn cài trong Photoshop thì giữ font hiện tại
        function restore(saved) {
            PRESET_FIELDS.forEach(function (key) {
                if (saved[key] === undefined) return;
                var hasOption = !el[key].options || Array.prototype.some.call(el[key].options, function (o) { return o.value === String(saved[key]); });
                if (hasOption) el[key].value = saved[key];
            });
            if (saved.bgColor) el.bgColor.value = saved.bgColor;
            if (saved.picks) chips.forEach(function (box) { box.checked = saved.picks.indexOf(box.getAttribute('data-field')) !== -1; });
            if (saved.align) setAlign(saved.align);
            if (saved.logo !== undefined) setLogo(saved.logo);
            syncStyle();
        }

        function bind() {
            ['change', 'input'].forEach(function (type) {
                [el.logoPos, el.text, el.muted, el.border, el.radius, el.size, el.gap, el.font, el.output, el.separator, el.prefix, el.model, el.make, el.settings, el.extra]
                    .forEach(function (control) { control.addEventListener(type, changed); });
            });
            chips.forEach(function (box) { box.addEventListener('change', changed); });
            aligns.forEach(function (button) { button.addEventListener('click', function () { setAlign(button.getAttribute('data-align')); changed(); }); });
            el.style.addEventListener('change', function () { applyStyle(); changed(); });
            el.background.addEventListener('change', function () { applyStyle(); changed(); });
            el.bgColor.addEventListener('input', function () { pickBackground(el.bgColor.value); changed(); });
            el.logoClear.addEventListener('click', function () { setLogo(''); changed(); });
        }

        el.prefix.value = DEFAULT_PREFIX;
        el.border.value = DEFAULT_BORDER;
        el.radius.value = 0;
        el.border.max = data.MAX_BORDER;
        el.radius.max = data.MAX_RADIUS;
        [el.size, el.gap].forEach(function (input) { input.min = data.MIN_SCALE; input.max = data.MAX_SCALE; input.value = 100; });
        setColors(data.BACKGROUNDS.white);
        setAlign('center');
        setLogo('');
        bind();

        return {
            el: el, values: values, snapshot: snapshot, restore: restore, pickedFields: pickedFields, setLogo: setLogo,
            pickBackground: pickBackground, onChange: function (fn) { listeners.push(fn); }
        };
    };
}());
