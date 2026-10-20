/*
 * Nhóm "Phím tắt Action": chọn 1 Action → bấm nút ⌨ → ấn phím → phím đó Play Action đã chọn.
 *
 * Action của Photoshop chỉ nhận F2–F12, có thể kèm Shift và/hoặc Ctrl (Cmd trên macOS), nên phím
 * khác bị từ chối kèm lời nhắc; Backspace/Delete xoá phím của Action đang chọn. Trong lúc nghe,
 * panel xin CEP chuyển các phím đó cho panel (registerKeyEventsInterest) để Photoshop không
 * nuốt mất (vd F5 mở Brush Settings).
 *
 * Danh sách phím lưu ở localStorage; mỗi lần đổi, toàn bộ danh sách được dựng lại thành bộ
 * Action "SCCTLM_Foto" bởi jsx/action-shortcut-setup.jsx (qua window.dr7SetupShortcut, js/panel.js).
 */
(function () {
    'use strict';

    var BINDINGS_KEY = 'dr7ActionShortcuts';            // [{ key, set, action }]
    var TARGET_KEY = 'dr7ShortcutTarget';               // "set\taction" đang chọn
    var LEGACY_KEY = 'dr7ShortcutKey';                   // bản cũ: 1 phím cho Pen Pressure, chỉ để xoá
    var OWN_SET = 'SCCTLM_Foto';                         // bộ Action panel tự dựng (jsx/action-shortcut-setup.jsx)
    var LEGACY_SET = 'MHK DR7';                          // tên bộ đó ở bản cũ (trước khi đổi tên plugin)
    var KEY_BACKSPACE = 8, KEY_ESCAPE = 27, KEY_DELETE = 46;
    var KEY_F2 = 113, KEY_F12 = 123;                    // mã phím ảo: F1 = 112

    var cs = new CSInterface();
    var button = null, picker = null, badge = null;
    var listening = false;

    function load(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('DR7: không đọc được ' + key, e);
            return null;
        }
    }

    function save(key, value) {
        try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch (e) {
            console.warn('DR7: không lưu được ' + key, e);
        }
    }

    function bindings() {
        var list = [];
        try {
            list = JSON.parse(load(BINDINGS_KEY) || '[]');
        } catch (e) {
            console.warn('DR7: danh sách phím tắt hỏng, bỏ qua', e);
        }
        // Bộ "SCCTLM_Foto" (và tên cũ "MHK DR7") do panel tự dựng (Action ▶) nên không thể là đích;
        // bản cũ từng gán Pen Pressure ở đó
        return list.filter(function (b) { return b && b.set !== OWN_SET && b.set !== LEGACY_SET; });
    }

    function target() {
        if (!picker || !picker.value) return null;
        var parts = picker.value.split('\t');
        return { set: parts[0], action: parts[1] };
    }

    function bindingFor(t) {
        if (!t) return null;
        var list = bindings();
        for (var i = 0; i < list.length; i += 1) {
            if (list[i].set === t.set && list[i].action === t.action) return list[i];
        }
        return null;
    }

    // Nút chỉ có icon bàn phím; phím đã gán (hoặc lời nhắc khi đang nghe) hiện ở huy hiệu bên cạnh
    function showKey(hint) {
        var bound = bindingFor(target());
        var text = hint || (bound ? bound.key : '');
        badge.textContent = text;
        badge.hidden = !text;
        badge.classList.toggle('is-hint', !!hint);
        button.title = listening ? 'Ấn F2–F12 (+Shift/Ctrl) · Esc huỷ · Backspace xoá phím' : button.getAttribute('data-title') || button.title;
        button.classList.toggle('listening', listening);
    }

    // Danh sách Action theo bộ (optgroup); Action đã có phím ghi kèm phím
    function renderPicker(lines) {
        var keep = picker.value || load(TARGET_KEY) || '';
        var list = bindings();
        picker.textContent = '';
        var group = null;
        lines.split('\n').forEach(function (line) {
            var parts = line.split('\t');
            if (parts.length !== 2) return;
            if (!group || group.label !== parts[0]) {
                group = document.createElement('optgroup');
                group.label = parts[0];
                picker.appendChild(group);
            }
            var option = document.createElement('option');
            option.value = line;
            option.textContent = parts[1];
            list.forEach(function (b) {
                if (b.set === parts[0] && b.action === parts[1]) option.textContent += '  —  ' + b.key;
            });
            group.appendChild(option);
        });
        picker.value = keep;
        if (!picker.value && picker.options.length) picker.selectedIndex = 0;
        showKey();
    }

    function refreshActions() {
        if (listening) return;
        cs.evalScript('typeof $.dr7ShortcutSetup=="object"?$.dr7ShortcutSetup.listActions():"DR7_MISSING"', function (res) {
            if (res === 'DR7_MISSING' || /^EvalScript error/.test(res)) {
                console.warn('DR7: không đọc được danh sách Action', res);
                return;
            }
            renderPicker(res);
            cleanupLegacy();
        });
    }

    // Dựng lại bộ Action 1 lần mỗi lần mở panel nếu còn dấu vết bản cũ: phím cũ gán cho Pen Pressure,
    // hoặc bộ "MHK DR7" (tên trước khi đổi plugin) còn trong Photoshop → bộ mới "SCCTLM_Foto" thay thế.
    // Chạy sau listActions nên lõi ExtendScript chắc chắn đã nạp xong.
    var cleanupTried = false;
    function cleanupLegacy() {
        if (cleanupTried) return;
        cleanupTried = true;
        var raw = load(BINDINGS_KEY) || '';
        var stale = load(LEGACY_KEY) !== null || raw.indexOf('"set":"' + OWN_SET + '"') >= 0 ||
            raw.indexOf('"set":"' + LEGACY_SET + '"') >= 0;
        if (stale) { apply(bindings(), null); return; }
        cs.evalScript('$.dr7ShortcutSetup.exists(' + JSON.stringify(LEGACY_SET) + ',null)', function (res) {
            if (res === 'true') apply(bindings(), null);
        });
    }

    // Xin CEP giao F2–F12 (mọi tổ hợp Shift/Ctrl), Esc, Backspace, Delete cho panel trong lúc nghe
    function setKeyInterest(on) {
        var keys = [];
        if (on) {
            [KEY_ESCAPE, KEY_BACKSPACE, KEY_DELETE].forEach(function (code) { keys.push({ keyCode: code }); });
            for (var code = KEY_F2; code <= KEY_F12; code += 1) {
                [false, true].forEach(function (ctrl) {
                    [false, true].forEach(function (shift) {
                        keys.push({ keyCode: code, ctrlKey: ctrl, metaKey: ctrl, shiftKey: shift });
                    });
                });
            }
        }
        try {
            cs.registerKeyEventsInterest(JSON.stringify(keys));
        } catch (e) {
            console.warn('DR7: registerKeyEventsInterest lỗi', e);
        }
    }

    function stop(hint) {
        listening = false;
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('blur', onBlur);
        setKeyInterest(false);
        showKey(hint);
    }

    function onBlur() { stop(); }

    // Dựng lại bộ "SCCTLM_Foto" với danh sách mới; chỉ lưu khi Photoshop nạp thành công
    function apply(next, label) {
        stop(label);
        var text = next.map(function (b) { return b.key + '\t' + b.set + '\t' + b.action; }).join('\n');
        window.dr7SetupShortcut(text, function (res) {
            if (res === 'DR7_OK') {
                save(BINDINGS_KEY, JSON.stringify(next));
                save(LEGACY_KEY, null);
            }
            refreshActions();
        });
    }

    // Hộp thông báo phím bị trùng: nêu rõ phím nào và đang gán cho Action nào (bộ nào)
    function showConflict(key, clash) {
        var old = document.querySelector('.shortcut-conflict');
        if (old) old.remove();
        var overlay = document.createElement('div');
        overlay.className = 'shortcut-conflict';
        overlay.setAttribute('role', 'alertdialog');
        var box = document.createElement('div');
        box.className = 'shortcut-conflict-box';
        var title = document.createElement('strong');
        title.textContent = 'Phím tắt bị trùng';
        var msg = document.createElement('p');
        msg.textContent = 'Phím ' + key + ' đã được gán cho Action "' + clash.action + '" (bộ "' + clash.set +
            '"). Hãy chọn phím khác, hoặc xoá phím đó ở Action kia trước (Backspace).';
        var ok = document.createElement('button');
        ok.textContent = 'Đã hiểu';
        function close() { overlay.remove(); }
        ok.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
        box.appendChild(title);
        box.appendChild(msg);
        box.appendChild(ok);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        ok.focus();
    }

    function onKeyDown(event) {
        event.preventDefault();
        event.stopPropagation();
        var code = event.keyCode;
        var t = target();
        if (code === KEY_ESCAPE || event.key === 'Escape') { stop(); return; }
        var others = bindings().filter(function (b) { return !(b.set === t.set && b.action === t.action); });
        if (code === KEY_BACKSPACE || code === KEY_DELETE) {
            apply(others, 'Đang xoá phím…');
            return;
        }
        if (code < KEY_F2 || code > KEY_F12) {
            if (/^(Shift|Control|Meta|Alt)$/.test(event.key)) return;   // đang giữ phím bổ trợ
            showKey('Chỉ nhận F2–F12…');
            return;
        }
        if (event.altKey) { showKey('Không dùng Alt…'); return; }
        var key = (event.ctrlKey || event.metaKey ? 'Ctrl+' : '') + (event.shiftKey ? 'Shift+' : '') +
            'F' + (code - KEY_F2 + 2);
        // 1 phím chỉ Play 1 Action: phím đã dùng cho Action khác thì báo lỗi, không tự lấy lại
        var clash = others.filter(function (b) { return b.key === key; })[0];
        if (clash) {
            stop();
            showConflict(key, clash);
            return;
        }
        var next = others.slice();
        next.push({ key: key, set: t.set, action: t.action });
        apply(next, 'Đang gán ' + key + '…');
    }

    function start() {
        if (listening) { stop(); return; }                  // bấm lần nữa = huỷ
        if (!target()) { showKey('Chưa có Action'); return; }
        if (window.dr7IsBusy && window.dr7IsBusy()) return;
        listening = true;
        setKeyInterest(true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('blur', onBlur);
        showKey('Ấn F2–F12…');
    }

    window.dr7InitShortcutCapture = function () {
        button = document.querySelector('.shortcut-capture');
        picker = document.querySelector('.shortcut-action');
        badge = document.querySelector('.shortcut-badge');
        if (!button || !picker || !badge) return;
        button.setAttribute('data-title', button.title);       // tiêu đề gốc, khôi phục sau khi nghe phím
        button.addEventListener('click', start);
        picker.addEventListener('change', function () { save(TARGET_KEY, picker.value); showKey(); });
        window.addEventListener('focus', refreshActions);       // quay lại panel → bắt Action mới tạo trong Photoshop
        refreshActions();
    };
    window.dr7RefreshActions = refreshActions;               // sau khi nạp thêm bộ Action (js/panel.js)
}());
