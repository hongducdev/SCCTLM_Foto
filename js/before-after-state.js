/*
 * Nút Trước / Sau: cho người dùng biết đang xem ảnh gốc (layer của panel đang ẩn) để khỏi lưu nhầm ảnh chưa retouch.
 * Trạng thái được đọc từ Photoshop (jsx/before-after.jsx: stateName) khi panel mở, sau mỗi lệnh của panel, khi panel được
 * focus lại và khi chuột đi vào panel (tối đa một lần mỗi 1,5 giây). Panel không lưu trạng thái riêng nên không lệch ảnh;
 * chỉ có thể trễ đến lần đọc kế tiếp nếu người dùng đổi layer ngay trong Photoshop (Ctrl+Z, bảng Layers, đổi ảnh).
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

    var last = 0;
    function refreshThrottled() {
        var now = Date.now();
        if (now - last < 1500) return;
        last = now;
        refresh();
    }

    root.scctlmFotoRefreshBeforeAfter = refresh;
    if (root.addEventListener) {
        root.addEventListener('focus', refresh);
        root.addEventListener('mouseover', refreshThrottled);
        root.setTimeout(refresh, 3000);                  // lõi ExtendScript nạp xong rồi mới đọc được trạng thái
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { apply: apply, refresh: refresh };
}(typeof window !== 'undefined' ? window : this));
