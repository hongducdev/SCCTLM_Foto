/*
 * Nút hút màu dùng chung (Rim Light, Brush Lab): bấm nút thì Photoshop chuyển sang công cụ Eyedropper, người
 * dùng bấm vào ảnh để lấy màu. Photoshop không báo khi Foreground đổi nên panel hỏi lại mỗi POLL_MS; thấy màu
 * Foreground đổi thì trả màu cho nút và đưa công cụ cũ về (jsx/eyedropper-tool.jsx). Bấm nút lần nữa, đổi sang
 * công cụ khác hoặc quá TIMEOUT_MS thì thôi, không đổi màu.
 */
(function () {
    'use strict';

    var POLL_MS = 150;
    var TIMEOUT_MS = 120000;
    var TOOL = 'eyedropperTool';
    var HEX = /^#[0-9a-f]{6}$/i;

    var cs = new CSInterface();
    var timer = 0;
    var active = null;                                  // { button, startHex, deadline, onColor }

    function call(expression, onResult) {
        cs.evalScript('typeof $._ext_EYEDROPPER=="object"?' + expression + ':"DR7_MISSING"', onResult || function () {});
    }

    function finish(restoreTool) {
        clearInterval(timer);
        if (active) active.button.classList.remove('is-picking');
        active = null;
        if (restoreTool) call('$._ext_EYEDROPPER.stop()');
    }

    function poll() {
        if (!active) return;
        if (Date.now() > active.deadline) { finish(true); return; }
        call('$._ext_EYEDROPPER.poll()', function (res) {
            if (!active) return;
            var parts = String(res).split('|');
            if (parts.length !== 2 || !HEX.test(parts[1])) { finish(false); return; }
            if (parts[0] !== TOOL) { finish(false); return; }     // người dùng đã chọn công cụ khác
            if (parts[1] !== active.startHex) {
                var onColor = active.onColor, hex = parts[1];
                finish(true);
                onColor(hex);
            }
        });
    }

    window.dr7Eyedropper = function (button, onColor) {
        if (active) { finish(true); return; }
        call('$._ext_EYEDROPPER.start()', function (res) {
            if (!HEX.test(res)) { console.warn('DR7: không bật được công cụ Eyedropper', res); return; }
            active = { button: button, startHex: res, deadline: Date.now() + TIMEOUT_MS, onColor: onColor };
            button.classList.add('is-picking');
            timer = setInterval(poll, POLL_MS);
        });
    };
}());
