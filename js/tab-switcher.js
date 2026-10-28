/* Chuyển tab của panel: mỗi .tab-button[data-tab] (và nút Ủng hộ trên header) hiện .tab-pane cùng data-tab. */
(function () {
    'use strict';

    function select(name) {
        var buttons = document.querySelectorAll('.tab-button, .support-button');
        var panes = document.querySelectorAll('.tab-pane');
        Array.prototype.forEach.call(buttons, function (button) {
            var active = button.getAttribute('data-tab') === name;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        Array.prototype.forEach.call(panes, function (pane) {
            pane.hidden = pane.getAttribute('data-tab') !== name;
        });
        // Mỗi tab cao khác nhau: co cửa sổ panel theo tab đang mở
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    window.dr7InitTabs = function () {
        document.addEventListener('click', function (event) {
            var button = event.target.closest ? event.target.closest('.tab-button, .support-button') : null;
            if (button) select(button.getAttribute('data-tab'));
        });
    };
}());
