/*
 * Nút Trước / Sau: cho người dùng biết đang xem ảnh gốc (layer của panel đang ẩn) để khỏi lưu nhầm ảnh chưa retouch.
 * Trạng thái được đọc từ Photoshop (jsx/before-after.jsx: stateName) sau mỗi lệnh của panel và khi panel được focus lại;
 * không lưu riêng trong panel nên không thể lệch với ảnh.
 */
(function (root) {
    'use strict';

    var SELECTOR = "button[onclick=\"onClickButton('BEFOREAFTER')\"]";
    var NORMAL = 'Trước / Sau';
    var VIEWING = 'Ảnh gốc';
    var NORMAL_TITLE = 'Ẩn / hiện các lớp retouch do panel tạo để so với ảnh gốc';
    var VIEWING_TITLE = 'Các lớp retouch đang ẩn. Bấm để hiện lại trước khi lưu ảnh';

    function apply(hidden) {
        var button = root.document && root.document.querySelector(SELECTOR);
        if (!button) return;
        var label = button.querySelector('span');
        button.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        button.title = hidden ? VIEWING_TITLE : NORMAL_TITLE;
        if (label) label.textContent = hidden ? VIEWING : NORMAL;
    }

    function refresh() {
        if (!root.CSInterface) return;
        try {
            new root.CSInterface().evalScript(
                'try{(typeof $._ext_BEFOREAFTER==="object"&&app.documents.length)?$._ext_BEFOREAFTER.stateName():"shown"}catch(e){"shown"}',
                function (res) { apply(String(res) === 'hidden'); }
            );
        } catch (e) { /* trạng thái chỉ là gợi ý, không làm hỏng panel */ }
    }

    root.scctlmFotoRefreshBeforeAfter = refresh;
    if (root.addEventListener) root.addEventListener('focus', refresh);
    if (typeof module !== 'undefined' && module.exports) module.exports = { apply: apply, refresh: refresh };
}(typeof window !== 'undefined' ? window : this));
