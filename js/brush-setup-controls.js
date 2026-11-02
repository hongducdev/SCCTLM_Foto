/*
 * Nhóm Brush Lab: nút bánh răng ở tiêu đề bật "Thiết lập cọ" (BPP) hoặc trả "Về mặc định" (BPPRESET), xem jsx/brush-pen-pressure.jsx.
 *
 * Trạng thái lấy thẳng từ cọ hiện tại trong Photoshop ($._ext_BPP.state()), không lưu ở panel:
 *   - "setup"  : Shape Dynamics bật, mọi Control = Pen Pressure → hiện chấm xanh, bấm bánh răng để về mặc định
 *   - còn lại  : ẩn chấm xanh, bấm bánh răng để thiết lập cọ
 * Đọc lại khi mở panel, khi quay lại panel (focus) và sau mỗi lần bấm, vì đổi cọ/công cụ trong
 * Photoshop cũng làm đổi trạng thái.
 */
(function () {
    'use strict';

    var STATUS_MS = 3000;                               // thời gian hiện thông báo thành công

    var cs = new CSInterface();
    var gear = null, dot = null, isSetup = false;
    var statusTimer = 0;

    function render(state) {
        isSetup = state === 'setup';
        dot.hidden = !isSetup;
        gear.classList.toggle('is-done', isSetup);
        gear.title = isSetup
            ? 'Cọ đã bật Pen Pressure · bấm để trả cọ về mặc định'
            : 'Thiết lập cọ: Shape Dynamics, Size / Angle / Roundness Jitter: Control = Pen Pressure';
    }

    function refresh() {
        cs.evalScript('typeof $._ext_BPP=="object"?$._ext_BPP.state():"SCCTLM_MISSING"', function (res) {
            if (!/^(setup|default|none)$/.test(res)) {
                console.warn('SCCTLM_Foto: không đọc được trạng thái Brush', res);
                return;
            }
            render(res);
        });
    }

    // Thông báo ngắn ở dòng trạng thái dưới tiêu đề panel, tự ẩn nếu chưa bị thông báo khác thay
    function flash(text) {
        if (!window.scctlmFotoStatus) return;
        window.scctlmFotoStatus(text);
        clearTimeout(statusTimer);
        statusTimer = setTimeout(function () {
            var box = document.querySelector('.panel-status');
            if (box && box.textContent === text) window.scctlmFotoStatus('');
        }, STATUS_MS);
    }

    function runCommand(name, successText) {
        window.scctlmFotoRunCommand(name, function (res) {
            if (res === 'SCCTLM_OK') flash(successText);
            refresh();
        });
    }

    window.scctlmFotoInitBrushSetup = function () {
        gear = document.querySelector('.brush-gear');
        dot = document.querySelector('.brush-status');
        if (!gear || !dot) return;
        gear.addEventListener('click', function () {
            if (isSetup) runCommand('BPPRESET', '✓ Đã trả cọ về mặc định');
            else runCommand('BPP', '✓ Đã thiết lập cọ: Shape Dynamics + Pen Pressure');
        });
        window.addEventListener('focus', refresh);
        refresh();
    };
}());
