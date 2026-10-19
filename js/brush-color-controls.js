/*
 * Nhóm Brush Lab: ô màu dạng viên thuốc + mã hex + hút màu Foreground + màu mẫu, chỉnh màu nét của action Stroke Brush Path.
 * Action tô nét bằng màu Foreground của Photoshop nên đổi màu ở đây là đặt Foreground
 * ($._ext_BRUSH.setColor, xem jsx/brush-size-hardness.jsx); không cần mở ảnh. Quay lại panel thì đọc lại
 * Foreground, vì đổi màu trong Photoshop làm đổi màu đang hiện.
 */
(function () {
    'use strict';

    var HEX = /^#[0-9a-f]{6}$/i;

    var cs = new CSInterface();
    var picker = null, hexInput = null, pill = null;

    function setColor(hex) {
        picker.value = hex.toLowerCase();
        hexInput.value = hex.toUpperCase();
        pill.style.background = hex;
        var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
        pill.style.color = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1a1a1a' : '#ffffff';   // icon luôn đọc được trên màu nền
        hexInput.classList.remove('is-invalid');
    }

    function pickColor(hex) {
        setColor(hex);
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.setColor("' + hex.toLowerCase() + '"):"DR7_MISSING"', function (res) {
            if (res !== 'ok') console.warn('DR7: không đặt được màu Foreground cho cọ', res);
        });
    }

    function readForeground(onColor) {
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.getColor():"DR7_MISSING"', function (res) {
            if (HEX.test(res)) onColor(res);
            else console.warn('DR7: không đọc được màu Foreground', res);
        });
    }

    function refresh() {
        if (document.activeElement === hexInput) return;
        readForeground(setColor);
    }

    window.dr7InitBrushColor = function () {
        picker = document.querySelector('.brush-color-input');
        hexInput = document.querySelector('.brush-hex');
        pill = document.querySelector('.brush-pill');
        var eyedropper = document.querySelector('.brush-eyedropper');
        var swatches = document.querySelectorAll('.brush-swatch');
        if (!picker || !hexInput || !pill || !eyedropper) return;

        picker.addEventListener('change', function () { pickColor(picker.value); });
        hexInput.addEventListener('input', function () {
            hexInput.classList.toggle('is-invalid', !HEX.test(hexInput.value));
        });
        hexInput.addEventListener('change', function () {
            var text = hexInput.value.trim();
            if (text.charAt(0) !== '#') text = '#' + text;
            if (HEX.test(text)) pickColor(text);
            else setColor(picker.value);                 // sai định dạng: trả về màu đang chọn
        });
        Array.prototype.forEach.call(swatches, function (swatch) {
            swatch.addEventListener('click', function () { pickColor(swatch.getAttribute('data-color')); });
        });
        eyedropper.addEventListener('click', function () { readForeground(setColor); });
        window.addEventListener('focus', refresh);
        refresh();
    };
}());
