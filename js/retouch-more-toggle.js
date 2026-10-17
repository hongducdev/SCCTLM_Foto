/* Nút ba chấm trong nhóm Retouch: ẩn / hiện lưới công cụ phụ (Tùy chỉnh, Hàng loạt, Chữ / Logo ...). */
(function () {
    'use strict';

    document.addEventListener('click', function (event) {
        var button = event.target.closest ? event.target.closest('.retouch-more') : null;
        if (!button) return;
        var grid = document.getElementById(button.getAttribute('aria-controls'));
        if (!grid) return;
        var open = grid.hidden;
        grid.hidden = !open;
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        button.title = open ? 'Thu gọn công cụ' : 'Hiện thêm công cụ';
        if (window.dr7FitHeight) window.dr7FitHeight();
    });
}());
