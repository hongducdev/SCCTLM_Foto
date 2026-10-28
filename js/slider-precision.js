/* Thanh trượt chính xác: bấm vào con số bên phải thanh trượt để gõ giá trị, ↑/↓ chỉnh ±1 (Shift: ±10). */
(function () {
    'use strict';

    function rowSlider(output) {
        var row = output.parentNode;
        return row && row.classList.contains('slider-row') ? row.querySelector('input[type="range"]') : null;
    }

    function commit(slider, text) {
        var typed = parseFloat(String(text).replace(',', '.'));
        if (isNaN(typed)) return;
        var min = Number(slider.min || 0), max = Number(slider.max || 100);
        slider.value = String(Math.min(max, Math.max(min, Math.round(typed))));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function edit(output) {
        var slider = rowSlider(output);
        if (!slider || output.hidden) return;
        var field = document.createElement('input');
        field.type = 'text';
        field.inputMode = 'numeric';
        field.className = 'slider-value-edit';
        field.value = String(Math.round(Number(slider.value)));
        field.setAttribute('aria-label', slider.getAttribute('aria-label') || 'Giá trị');

        var done = false;
        function close(apply) {
            if (done) return;
            done = true;
            if (apply) commit(slider, field.value);
            output.hidden = false;
            if (field.parentNode) field.parentNode.removeChild(field);
        }

        field.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') { event.preventDefault(); close(true); }
            else if (event.key === 'Escape') { event.preventDefault(); close(false); }
            else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                var step = (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1);
                commit(slider, (parseFloat(field.value) || 0) + step);
                field.value = String(Math.round(Number(slider.value)));
                field.select();
            }
        });
        field.addEventListener('blur', function () { close(true); });

        output.hidden = true;
        output.parentNode.insertBefore(field, output);
        field.focus();
        field.select();
    }

    document.addEventListener('click', function (event) {
        var output = event.target.closest ? event.target.closest('.slider-row > output') : null;
        if (output) edit(output);
    });
}());
