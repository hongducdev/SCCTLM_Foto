/*
 * Khung ảnh: mẫu watermark dựng sẵn (nhóm Hasselblad; các mẫu Leica gốc nằm ở js/wm-templates-data.js) và thư viện logo hãng trong img/logos.
 * Mỗi mẫu có cùng khoá với mẫu đã lưu (js/exif-frame-presets.js); logo là tên file trong img/logos, đổi sang đường dẫn khi áp dụng.
 */
(function (root) {
    'use strict';

    var LIGHT = { background: 'white', bgColor: '#ffffff', text: '#111111', muted: '#8a8a8a' };
    var DARK = { background: 'black', bgColor: '#000000', text: '#f2f2f2', muted: '#9a9a9a' };

    var LOGOS = [
        ['ic_leica_32.png', 'Leica'], ['ic_hasselblad_new_black.png', 'Hasselblad (đen)'], ['ic_hasselblad_new_white.png', 'Hasselblad (trắng)'],
        ['ic_sony_32.png', 'Sony'], ['ic_sony_alpha_32.png', 'Sony Alpha'], ['ic_canon_32.png', 'Canon'], ['ic_nikon_32.png', 'Nikon'],
        ['ic_fujifilm_32.png', 'Fujifilm'], ['ic_lumix_32.png', 'Lumix'], ['ic_olympus_32.png', 'Olympus'], ['ic_pentax.png', 'Pentax'],
        ['ic_ricoh_32.png', 'Ricoh'], ['ic_sigma_32.png', 'Sigma'], ['ic_kodak1_32.png', 'Kodak'], ['ic_dji_32.png', 'DJI'],
        ['ic_insta360_32.png', 'Insta360'], ['ic_apple_black_32.png', 'Apple'], ['ic_samsung_32.png', 'Samsung'], ['ic_google_32.png', 'Google'],
        ['ic_huawei_32.png', 'Huawei'], ['ic_honor_32.png', 'Honor'], ['ic_oppo_32.png', 'Oppo'], ['ic_vivo_32.png', 'Vivo'],
        ['ic_oneplus_32.png', 'OnePlus'], ['ic_realme_32.png', 'Realme'], ['ic_nothing_32.png', 'Nothing']
    ].map(function (pair) { return { file: pair[0], name: pair[1] }; });

    function make(group, name, values) {
        var template = { group: group, name: name, prefix: '', separator: ' ', output: 'layers', border: 3, radius: 0, size: 100, gap: 100, font: 'ArialMT' };
        Object.keys(values).forEach(function (key) { template[key] = values[key]; });
        return template;
    }

    function mix(a, b) {
        var result = {};
        [a, b].forEach(function (part) { Object.keys(part).forEach(function (key) { result[key] = part[key]; }); });
        return result;
    }

    var HASSELBLAD = 'Hasselblad';
    var HB = { style: 'bottom', logo: 'ic_hasselblad_new_black.png', border: 2, size: 110 };

    var TEMPLATES = [
        make(HASSELBLAD, 'Logo trên, chữ giữa', mix(LIGHT, mix(HB, { align: 'center', logoPos: 'top' }))),
        make(HASSELBLAD, 'Chữ trái, logo phải', mix(LIGHT, mix(HB, { align: 'left', logoPos: 'right' }))),
        make(HASSELBLAD, 'Nền đen, chữ trái, logo phải', mix(DARK, mix(HB, { align: 'left', logoPos: 'right', logo: 'ic_hasselblad_new_white.png' })))
    ];

    // Thư mục chứa panel dưới dạng đường dẫn thường (CEP trả về dạng /C:/... hoặc file:///C:/... và có thể mã hoá %20)
    function extensionRoot(raw) {
        var path = decodeURIComponent(String(raw)).replace(/\\/g, '/').replace(/^file:\/\/\//, '');
        return /^\/[A-Za-z]:/.test(path) ? path.slice(1) : path;
    }

    function logoPath(base, file) {
        return file ? extensionRoot(base) + '/img/logos/' + file : '';
    }

    root.dr7FrameTemplates = { LOGOS: LOGOS, TEMPLATES: TEMPLATES, logoPath: logoPath, extensionRoot: extensionRoot };
}(typeof window !== 'undefined' ? window : this));
