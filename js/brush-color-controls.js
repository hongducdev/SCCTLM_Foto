/*
 * Nhóm Brush Lab: ô màu dạng viên thuốc + mã hex + hút màu Foreground + màu mẫu + thanh Độ sáng.
 * Action Stroke Brush Path tô nét bằng Foreground và Opacity của cọ, nên đổi màu ở đây là đặt Foreground
 * ($._ext_BRUSH.setColor) và kéo Độ sáng là đặt Opacity của cọ ($._ext_BRUSH.setOpacity), xem
 * jsx/brush-size-hardness.jsx; không cần mở ảnh. Quay lại panel thì đọc lại cả hai, vì đổi trong Photoshop
 * làm đổi giá trị đang hiện.
 */
(function () {
    'use strict';

    var HEX = /^#[0-9a-f]{6}$/i;

    var cs = new CSInterface();
    var WRITE_DELAY_MS = 120;

    var picker = null, hexInput = null, pill = null, slider = null, sliderValue = null;
    var writeTimer = 0;

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

    function paintTrack() {
        slider.style.setProperty('--fill', slider.value + '%');
        sliderValue.textContent = slider.value + '%';
    }

    function writeOpacity() {
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.setOpacity(' + Math.round(Number(slider.value)) + '):"DR7_MISSING"', function (res) {
            if (res !== 'ok') console.warn('DR7: không đặt được Opacity cho cọ', res);
        });
    }

    function refresh() {
        if (document.activeElement !== hexInput) readForeground(setColor);
        if (document.activeElement === slider) return;
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.getOpacity():"DR7_MISSING"', function (res) {
            if (!/^\d{1,3}$/.test(res)) return;           // "none": công cụ hiện tại không có Opacity, giữ giá trị đang hiện
            slider.value = Math.min(100, Number(res));
            paintTrack();
        });
    }

    window.dr7InitBrushColor = function () {
        picker = document.querySelector('.brush-color-input');
        hexInput = document.querySelector('.brush-hex');
        pill = document.querySelector('.brush-pill');
        slider = document.querySelector('.brush-opacity');
        sliderValue = document.querySelector('.brush-opacity-value');
        var eyedropper = document.querySelector('.brush-eyedropper');
        var swatches = document.querySelectorAll('.brush-swatch');
        if (!picker || !hexInput || !pill || !slider || !sliderValue || !eyedropper) return;

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
        slider.addEventListener('input', function () {
            paintTrack();
            clearTimeout(writeTimer);
            writeTimer = setTimeout(writeOpacity, WRITE_DELAY_MS);
        });
        window.addEventListener('focus', refresh);
        paintTrack();
        refresh();
    };
}());
