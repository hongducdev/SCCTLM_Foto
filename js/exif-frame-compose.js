/*
 * Khung ảnh: ghép các giá trị trên form và kích thước ảnh thành spec gửi sang Photoshop (js/exif-frame-layout.js kiểm tra lại).
 * values: { style, prefix, model, make, settings, extra, border, radius, size, gap, align, logoPos, font, output, logo (đường dẫn hoặc ''),
 *           background, text, muted }
 */
(function (root) {
    'use strict';

    var frame = root.dr7ExifFrame;

    function segment(text, bold, muted) {
        return { text: text, bold: bold, muted: muted };
    }

    // title: "Shot on" + tên máy (đậm) + hãng; settings: thông số; extra: chữ thêm (tác giả, địa điểm...)
    function parts(values) {
        var prefix = frame.clean(values.prefix), model = frame.clean(values.model), make = frame.clean(values.make);
        var settings = frame.clean(values.settings), extra = frame.clean(values.extra);
        return {
            title: model || make ? [prefix ? segment(prefix, false, true) : null, model ? segment(model, true, false) : null, make ? segment(make, false, true) : null]
                .filter(Boolean) : null,
            settings: settings ? [segment(settings, false, true)] : null,
            extra: extra ? [segment(extra, false, true)] : null
        };
    }

    // Dòng 1: tên máy, dòng 2: thông số, dòng 3: chữ thêm
    function lines(values) {
        var p = parts(values);
        return [p.title, p.settings, p.extra].filter(Boolean);
    }

    // Hai cột: tên máy và chữ thêm bên trái, thông số bên phải; không có chữ bên trái thì thông số ở lại bên trái
    function columns(values) {
        var p = parts(values), left = [p.title, p.extra].filter(Boolean);
        return left.length || !p.settings ? { left: left, side: left.length ? p.settings : null } : { left: [p.settings], side: null };
    }

    // Trả về null khi chưa có chữ nào để vẽ
    function compose(values, doc) {
        var split = values.logoPos === 'split', cols = split ? columns(values) : null, text = split ? cols.left : lines(values);
        if (!text.length) return null;
        return {
            srcW: doc.w, srcH: doc.h, style: values.style, align: split ? 'left' : values.align, side: split ? cols.side : null, logoPos: values.logoPos || 'left', font: values.font, output: values.output,
            logo: values.logo ? { path: String(values.logo).split('\\').join('/') } : null,
            layout: frame.layout(doc.w, doc.h, { style: values.style, border: values.border, radius: values.radius, size: values.size, gap: values.gap, lineCount: text.length, hasLogo: !!values.logo, hasSide: split && !!cols.side, logoPos: values.logoPos || 'left' }),
            background: values.background, text: values.text, muted: values.muted, lines: text
        };
    }

    root.dr7ExifFrameCompose = { lines: lines, compose: compose };
}(typeof window !== 'undefined' ? window : this));
