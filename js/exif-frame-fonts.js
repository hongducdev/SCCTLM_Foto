/*
 * Khung ảnh: nạp danh sách font đang cài trong Photoshop vào ô chọn font (một lần, lúc mở tab lần đầu).
 * Giá trị mỗi dòng là tên PostScript, đúng thứ jsx/exif-frame.jsx cần; tên không hợp lệ với bộ kiểm tra spec bị bỏ qua.
 */
(function () {
    'use strict';

    var cs = new CSInterface();
    var loaded = false;
    var VALID_NAME = /^[A-Za-z0-9_.+-]{1,80}$/;

    // select: <select> cần điền; preferred: tên PostScript chọn sẵn nếu có trong danh sách
    window.dr7LoadFrameFonts = function (select, preferred) {
        if (loaded) return;
        cs.evalScript('typeof $._ext_EXIFFRAME=="object"?$._ext_EXIFFRAME.fonts():"DR7_MISSING"', function (res) {
            if (loaded || !/\t/.test(String(res))) return;
            loaded = true;
            var fonts = String(res).split('\n').map(function (line) {
                var at = line.indexOf('\t');
                return { name: line.slice(0, at), label: line.slice(at + 1) };
            }).filter(function (font) { return VALID_NAME.test(font.name); });
            fonts.sort(function (a, b) { return a.label.localeCompare(b.label); });
            select.textContent = '';
            fonts.forEach(function (font) {
                var option = document.createElement('option');
                option.value = font.name;
                option.textContent = font.label;
                select.appendChild(option);
            });
            if (fonts.some(function (font) { return font.name === preferred; })) select.value = preferred;
        });
    };
}());
