/* Thu gọn / mở rộng từng nhóm chức năng: bấm (hoặc Enter/Space) vào .section-title để ẩn nội dung nhóm. */
(function () {
    'use strict';

    function toggle(title) {
        var group = title.parentNode;
        var collapsed = !group.classList.contains('is-collapsed');
        group.classList.toggle('is-collapsed', collapsed);
        title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (window.scctlmFotoFitHeight) window.scctlmFotoFitHeight();
    }

    function titleOf(event) {
        var node = event.target.closest ? event.target.closest('.group > .section-title') : null;
        return node;
    }

    document.addEventListener('click', function (event) {
        var title = titleOf(event);
        if (title && !event.target.closest('button')) toggle(title);
    });
    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        var title = titleOf(event);
        if (!title || event.target.closest('button')) return;
        event.preventDefault();
        toggle(title);
    });
}());
