/*
 * Nút Trước / Sau: cho người dùng biết đang xem ảnh gốc (layer của panel đang ẩn) để khỏi lưu nhầm ảnh chưa retouch.
 * Trạng thái được đọc từ Photoshop (jsx/before-after.jsx: stateName) khi panel mở, sau mỗi lệnh của panel, khi panel được
 * focus lại, khi chuột đi vào panel (tối đa một lần mỗi 1,5 giây), và khi Photoshop báo đổi ảnh, tạo/mở/đóng ảnh hay chọn
 * bước History (gộp lại thành một lần đọc). Ctrl+Z và ẩn/hiện layer ngay trong Photoshop không được báo, nên vẫn có thể
 * trễ đến lần đọc kế tiếp. Panel không lưu trạng thái riêng nên không lệch ảnh.
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

    // Photoshop events come in bursts (a select per layer click, several per Undo): read once when they settle,
    // and leave it to the command's own refresh while a panel command is running.
    var pending = 0;
    function refreshSoon() {
        root.clearTimeout(pending);
        pending = root.setTimeout(function () {
            if (root.scctlmFotoIsBusy && root.scctlmFotoIsBusy()) return;
            refresh();
        }, 400);
    }

    // charIDToTypeID("slct"): Photoshop báo khi chọn bước History. Đo trên Photoshop 23.2: Ctrl+Z, Ctrl+Shift+Z
    // và ẩn/hiện layer KHÔNG được báo (kể cả khi đăng ký undoEvent / Shw / Hd), nên không đăng ký chúng.
    var SELECT_EVENT = 1936483188;

    // documentAfterActivate: đổi ảnh, tạo/mở ảnh mới, đóng ảnh (ảnh khác thành ảnh đang mở).
    // slct qua com.adobe.PhotoshopRegisterEvent, trả về com.adobe.PhotoshopJSONCallback + extension id.
    function listenToPhotoshop() {
        if (!root.CSInterface || !root.CSEvent) return;
        try {
            var cs = new root.CSInterface(), extensionId = cs.getExtensionID();
            if (!extensionId) return;
            cs.addEventListener('documentAfterActivate', refreshSoon);
            cs.addEventListener('com.adobe.PhotoshopJSONCallback' + extensionId, refreshSoon);
            var event = new root.CSEvent('com.adobe.PhotoshopRegisterEvent', 'APPLICATION');
            event.extensionId = extensionId;
            event.data = String(SELECT_EVENT);
            cs.dispatchEvent(event);
        } catch (e) { /* không nghe được sự kiện thì vẫn còn focus / rê chuột */ }
    }

    root.scctlmFotoRefreshBeforeAfter = refresh;
    if (root.addEventListener) {
        root.addEventListener('focus', refresh);
        root.addEventListener('mouseover', refreshThrottled);
        root.setTimeout(refresh, 3000);                  // lõi ExtendScript nạp xong rồi mới đọc được trạng thái
    }
    listenToPhotoshop();
    if (typeof module !== 'undefined' && module.exports) module.exports = { apply: apply, refresh: refresh };
}(typeof window !== 'undefined' ? window : this));
