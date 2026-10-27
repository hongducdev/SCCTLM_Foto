/*
 * Khung ảnh: hình học của khung và bộ kiểm tra spec gửi sang Photoshop (xem panel.js, kind 'frame').
 * Thuần tính toán, không đụng DOM/Photoshop nên test được bằng Node. Mọi số đo tính theo cạnh ngắn của ảnh.
 * EXIF ở js/exif-frame-fields.js, ghép spec từ form ở js/exif-frame-compose.js, giao diện ở js/exif-frame-tab.js,
 * phần vẽ thật ở jsx/exif-frame.jsx.
 */
(function (root) {
    'use strict';

    var MAX_SIZE = 30000;
    var MAX_BORDER = 20;
    var MAX_RADIUS = 5;
    var MIN_SCALE = 50;
    var MAX_SCALE = 200;
    var MAX_LINES = 3;
    var TEXT_MAX = 120;
    var STYLES = ['bottom', 'polaroid', 'overlay'];
    var ALIGNS = ['left', 'center', 'right'];
    var OUTPUTS = ['layers', 'flatten'];
    var LOGO_POSITIONS = ['left', 'top', 'right', 'split'];
    var HEX = /^#[0-9a-f]{6}$/i;
    var FONT = /^[A-Za-z0-9_.+-]{1,80}$/;
    var LOGO_FILE = /\.(png|jpe?g|svg)$/i;
    var LOGO_PATH_MAX = 400;
    // Ký tự điều khiển và hai ký tự ngắt dòng Unicode: chèn vào mã ExtendScript sẽ làm vỡ chuỗi
    var CONTROL = new RegExp('[\\x00-\\x1f' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');

    var BACKGROUNDS = {
        white: { fill: '#ffffff', text: '#111111', muted: '#8a8a8a' },
        gray: { fill: '#e6e6e6', text: '#111111', muted: '#7a7a7a' },
        black: { fill: '#000000', text: '#f2f2f2', muted: '#9a9a9a' }
    };

    function clean(text) {
        return String(text).replace(CONTROL, ' ').trim().slice(0, TEXT_MAX);
    }

    // Màu chữ (chính và phụ) dễ đọc trên một màu nền bất kỳ
    function contrast(hex) {
        var n = parseInt(hex.slice(1), 16);
        var luma = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
        return luma > 0.55 ? BACKGROUNDS.white : BACKGROUNDS.black;
    }

    function clamp(value, min, max, fallback) {
        return typeof value === 'number' && isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    }

    // opts: { style, border (% cạnh ngắn), radius (% cạnh ngắn, bo góc ảnh), size (% cỡ chữ), gap (% khoảng cách dòng), lineCount,
    //         logoPos ('top' chừa chỗ cho logo phía trên chữ khi hasLogo; 'split' + hasSide: thêm một dòng ở cột phải, căn giữa khối chữ) }
    // bottom: viền đều ba cạnh + dải chữ dưới; polaroid: dải dưới dày hơn; overlay: giữ nguyên ảnh, chữ đè lên đáy ảnh.
    // Ảnh luôn nằm ở (border, border); mỗi dòng có cỡ chữ và đường chân chữ (baseline) riêng.
    function layout(width, height, opts) {
        var style = STYLES.indexOf(opts.style) === -1 ? 'bottom' : opts.style;
        var count = clamp(opts.lineCount, 1, MAX_LINES, 2);
        var side = Math.min(width, height);
        var size1 = Math.max(12, Math.round(side * 0.022 * clamp(opts.size, MIN_SCALE, MAX_SCALE, 100) / 100));
        var size2 = Math.max(10, Math.round(size1 * 0.8));
        var gap = Math.round(size1 * 0.45 * clamp(opts.gap, MIN_SCALE, MAX_SCALE, 100) / 100);
        var pad = Math.round(size1 * 1.5);
        var sizes = [size1, size2, size2].slice(0, count);
        var textHeight = sizes.reduce(function (sum, size) { return sum + size; }, 0) + gap * (count - 1);
        var overlay = style === 'overlay';
        var stacked = !!opts.hasLogo && opts.logoPos === 'top';
        var logoHeight = stacked ? Math.round(size1 * 2.4) : 0;
        var logoGap = stacked ? Math.round(size1 * 0.7) : 0;
        var block = textHeight + logoHeight + logoGap;
        var border = overlay ? 0 : Math.max(1, Math.round(side * clamp(opts.border, 1, MAX_BORDER, 3) / 100));
        var band = overlay ? 0 : Math.max(style === 'polaroid' ? border * 3 : border, pad * 2 + block);
        var blockTop = overlay ? height - pad - block : height + border + Math.round((band - block) / 2);
        var top = blockTop + logoHeight + logoGap;
        var hasSide = opts.logoPos === 'split' && !!opts.hasSide;
        var used = 0;
        var radius = overlay ? 0 : Math.min(Math.round(side * clamp(opts.radius, 0, MAX_RADIUS, 0) / 100), Math.floor(side / 2));
        return {
            border: border,
            radius: radius,
            canvasW: width + border * 2,
            canvasH: height + border + band,
            band: band,
            areaLeft: border,
            areaWidth: width,
            inset: pad,
            logoTop: blockTop,
            logoHeight: logoHeight,
            side: hasSide ? { size: size1, baseline: top + Math.round((textHeight - size1) / 2) + Math.round(size1 * 0.8) } : null,
            lines: sizes.map(function (size) {
                var line = { size: size, baseline: top + used + Math.round(size * 0.8) };
                used += size + gap;
                return line;
            })
        };
    }

    function isText(value) {
        return typeof value === 'string' && value.length <= TEXT_MAX && !new RegExp(CONTROL.source).test(value);
    }

    function isSize(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 1 && value <= MAX_SIZE;
    }

    function isCoordinate(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0 && value <= MAX_SIZE;
    }

    function isRow(line) {
        return Array.isArray(line) && line.length >= 1 && line.length <= 3 && line.every(isSegment);
    }

    function isSegment(seg) {
        return !!seg && isText(seg.text) && seg.text.trim() !== '' && typeof seg.bold === 'boolean' && typeof seg.muted === 'boolean';
    }

    function isLayout(plan) {
        return !!plan && isSize(plan.canvasW) && isSize(plan.canvasH) && isCoordinate(plan.border) && isCoordinate(plan.radius) && isCoordinate(plan.areaLeft) &&
            isSize(plan.areaWidth) && isCoordinate(plan.inset) && isCoordinate(plan.logoTop) && isCoordinate(plan.logoHeight) &&
            (plan.side === null || (!!plan.side && isSize(plan.side.size) && isCoordinate(plan.side.baseline))) && Array.isArray(plan.lines) && plan.lines.length >= 1 &&
            plan.lines.length <= MAX_LINES && plan.lines.every(function (l) { return isSize(l.size) && isCoordinate(l.baseline); });
    }

    function isFontName(value) {
        return typeof value === 'string' && FONT.test(value);
    }

    function isLogo(logo) {
        return logo === null || (!!logo && typeof logo.path === 'string' && logo.path.length > 0 && logo.path.length <= LOGO_PATH_MAX &&
            !new RegExp(CONTROL.source).test(logo.path) && LOGO_FILE.test(logo.path));
    }

    // spec: { srcW, srcH, style, align, font (tên PostScript), output, logo ({ path } hoặc null), layout, background, text, muted,
    //         logoPos, lines: [[{ text, bold, muted }]], side: [{ text, bold, muted }] hoặc null (chỉ khi logoPos là 'split') }
    // Số dòng chữ phải bằng số dòng của layout, nếu không cỡ chữ và vị trí sẽ lệch.
    var validator = {
        test: function (spec) {
            if (!spec || typeof spec !== 'object' || !isSize(spec.srcW) || !isSize(spec.srcH) || !isLayout(spec.layout)) return false;
            if (STYLES.indexOf(spec.style) === -1 || ALIGNS.indexOf(spec.align) === -1 || LOGO_POSITIONS.indexOf(spec.logoPos) === -1 || OUTPUTS.indexOf(spec.output) === -1) return false;
            if (!isFontName(spec.font) || !isLogo(spec.logo)) return false;
            if (!HEX.test(spec.background) || !HEX.test(spec.text) || !HEX.test(spec.muted)) return false;
            if (!Array.isArray(spec.lines) || spec.lines.length !== spec.layout.lines.length) return false;
            if (spec.side === null ? spec.layout.side !== null : !(spec.logoPos === 'split' && spec.layout.side !== null && isRow(spec.side))) return false;
            return spec.lines.every(isRow);
        }
    };

    root.dr7ExifFrame = {
        MAX_BORDER: MAX_BORDER, MAX_RADIUS: MAX_RADIUS, MIN_SCALE: MIN_SCALE, MAX_SCALE: MAX_SCALE, MAX_LINES: MAX_LINES, TEXT_MAX: TEXT_MAX,
        STYLES: STYLES, ALIGNS: ALIGNS, LOGO_POSITIONS: LOGO_POSITIONS, OUTPUTS: OUTPUTS, BACKGROUNDS: BACKGROUNDS,
        clean: clean, contrast: contrast, isFontName: isFontName, layout: layout, spec: validator
    };
}(typeof window !== 'undefined' ? window : this));
