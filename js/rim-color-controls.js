/*
 * Nhóm Rim Light: ô màu dạng viên thuốc + mã hex + hút màu từ ảnh + 7 màu mẫu + thanh Cường độ.
 *
 * Nhóm chỉ hiện khi ảnh đang mở có nhóm "Rim Light" chứa lớp "Color" ($._ext_RIMCOLOR.available(),
 * xem jsx/rim-light-color.jsx); Photoshop không báo khi đổi ảnh hay chạy Action nên panel hỏi lại khi quay
 * lại panel và mỗi vài giây. Đổi màu tô lại lớp Color ngay (lệnh RIMCOLOR, 1 bước History), kéo
 * Cường độ đặt độ mờ của cả nhóm Rim Light. Nhóm vừa hiện thì lấy cường độ thật của nhóm.
 */
(function () {
    'use strict';

    var POLL_MS = 2500;
    var OPACITY_DELAY_MS = 120;
    var HEX = /^#[0-9a-f]{6}$/i;

    var cs = new CSInterface();
    var group = null, pill = null, picker = null, hexInput = null, slider = null, sliderValue = null;
    var exists = false;
    var pending = false;                                // chưa nhận kết quả lần hỏi trước thì không hỏi thêm
    var opacityTimer = 0;

    function currentHex() { return picker.value.toLowerCase(); }
    function currentOpacity() { return Math.round(Number(slider.value)); }

    function paintTrack() {
        slider.style.setProperty('--fill', slider.value + '%');
        sliderValue.textContent = slider.value + '%';
    }

    function setColor(hex) {
        picker.value = hex.toLowerCase();
        hexInput.value = hex.toUpperCase();
        pill.style.background = hex;
        var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
        pill.style.color = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1a1a1a' : '#ffffff';   // icon luôn đọc được trên màu nền
        hexInput.classList.remove('is-invalid');
    }

    // Có nhóm Rim Light thì tô lại màu ngay (1 bước History)
    function applyColor() {
        if (!exists) return;
        window.dr7RunCommand('RIMCOLOR', function () { refresh(); }, currentHex());
    }

    function pickColor(hex) {
        setColor(hex);
        applyColor();
    }

    function setExists(value) {
        if (exists === value) return;
        exists = value;
        group.hidden = !exists;
        if (window.dr7FitHeight) window.dr7FitHeight();
        if (exists) {                                    // nhóm vừa xuất hiện: lấy cường độ thật của nhóm
            cs.evalScript('$._ext_RIMCOLOR.getOpacity()', function (res) {
                if (/^\d{1,3}$/.test(res)) { slider.value = Math.min(100, Number(res)); paintTrack(); }
            });
        }
    }

    function refresh() {
        if (pending || (window.dr7IsBusy && window.dr7IsBusy())) return;
        pending = true;
        cs.evalScript('typeof $._ext_RIMCOLOR=="object"?$._ext_RIMCOLOR.available():"0"', function (res) {
            pending = false;
            setExists(res === '1');
        });
    }

    function writeOpacity() {
        if (!exists) return;
        cs.evalScript('$._ext_RIMCOLOR.setOpacity(' + currentOpacity() + ')', function (res) {
            if (res !== 'ok') console.warn('DR7: không đặt được cường độ Rim Light', res);
        });
    }

    window.dr7InitRimColor = function () {
        group = document.querySelector('.group-rim');
        pill = document.querySelector('.rim-pill');
        picker = document.querySelector('.rim-color-input');
        hexInput = document.querySelector('.rim-hex');
        slider = document.querySelector('.rim-intensity');
        sliderValue = document.querySelector('.rim-intensity-value');
        var eyedropper = document.querySelector('.rim-eyedropper');
        var swatches = document.querySelectorAll('.rim-swatch');
        if (!group || !pill || !picker || !hexInput || !slider || !sliderValue || !eyedropper) return;

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
        eyedropper.addEventListener('click', function () { window.dr7Eyedropper(eyedropper, pickColor); });
        var reset = document.querySelector('.rim-reset');
        if (reset) reset.addEventListener('click', function () {   // về trắng + độ sáng 100%
            slider.value = 100;
            paintTrack();
            writeOpacity();
            pickColor('#ffffff');
        });
        slider.addEventListener('input', function () {
            paintTrack();
            clearTimeout(opacityTimer);
            opacityTimer = setTimeout(writeOpacity, OPACITY_DELAY_MS);
        });
        window.addEventListener('focus', refresh);
        setInterval(refresh, POLL_MS);
        paintTrack();
        refresh();
    };
}());
