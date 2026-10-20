/*
 * Hộp thoại dùng chung của panel (thay alert/confirm của trình duyệt):
 *   dr7Dialog({ title, message, confirmText, cancelText, tone }) → Promise<boolean>   (tone: 'error' = viền/tiêu đề đỏ)
 * Chỉ có confirmText: hộp thông báo (1 nút), luôn trả true. Có thêm cancelText: hộp hỏi, true = xác nhận.
 * Chỉ mở 1 hộp mỗi lúc: hộp mới đóng hộp cũ (hộp cũ trả false). Esc = huỷ, đóng xong trả focus về nơi đang giữ trước đó.
 */
(function () {
    'use strict';

    var closeCurrent = null;

    window.dr7Dialog = function (options) {
        var opts = options || {};
        if (closeCurrent) closeCurrent(false);
        return new Promise(function (resolve) {
            var previous = document.activeElement;
            var overlay = document.createElement('div');
            overlay.className = 'dr7-dialog';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            var box = document.createElement('div');
            box.className = 'dr7-dialog-box' + (opts.tone === 'error' ? ' is-error' : '');
            var title = document.createElement('strong');
            title.textContent = opts.title || '';
            var message = document.createElement('p');
            message.textContent = opts.message || '';
            var actions = document.createElement('div');
            actions.className = 'dr7-dialog-actions';

            function close(result) {
                closeCurrent = null;
                document.removeEventListener('keydown', onKeyDown, true);
                overlay.remove();
                if (previous && previous.focus) previous.focus();
                resolve(result);
            }
            function onKeyDown(event) {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.stopPropagation();
                close(!opts.cancelText);
            }
            function addButton(text, result, primary) {
                var button = document.createElement('button');
                button.textContent = text;
                if (primary) button.className = 'is-primary';
                button.addEventListener('click', function () { close(result); });
                actions.appendChild(button);
                return button;
            }

            var cancel = opts.cancelText ? addButton(opts.cancelText, false, false) : null;
            var ok = addButton(opts.confirmText || 'Đã hiểu', true, true);
            overlay.addEventListener('click', function (event) { if (event.target === overlay) close(!opts.cancelText); });
            document.addEventListener('keydown', onKeyDown, true);
            box.appendChild(title);
            box.appendChild(message);
            box.appendChild(actions);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            closeCurrent = close;
            (cancel || ok).focus();                  // hộp hỏi: focus ở "huỷ" để Enter lỡ tay không xác nhận
        });
    };
}());
