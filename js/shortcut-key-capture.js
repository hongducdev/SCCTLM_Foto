/*
 * Ô phím tắt cạnh nút "Tạo ...": bấm ô → ấn phím → phím đó Play Action của nút (js/create-action-buttons.js).
 *
 * Action của Photoshop chỉ nhận F2–F12, có thể kèm Shift và/hoặc Ctrl (Cmd trên macOS), nên phím
 * khác bị từ chối kèm lời nhắc; Backspace/Delete xoá phím của Action đó. Trong lúc nghe, panel xin
 * CEP chuyển các phím đó cho panel (registerKeyEventsInterest) để Photoshop không nuốt mất (vd F5 mở Brush Settings).
 *
 * Danh sách phím lưu ở localStorage; mỗi lần đổi, toàn bộ danh sách được dựng lại thành bộ
 * Action "SCCTLM_Foto" bởi jsx/action-shortcut-setup.jsx (qua window.dr7SetupShortcut, js/panel.js).
 */
(function () {
    'use strict';

    var BINDINGS_KEY = 'dr7ActionShortcuts';            // [{ key, set, action }]
    var LEGACY_KEY = 'dr7ShortcutKey';                   // bản cũ: 1 phím cho Pen Pressure, chỉ để xoá
    var OWN_SET = 'SCCTLM_Foto';                         // bộ Action panel tự dựng (jsx/action-shortcut-setup.jsx)
    var LEGACY_SET = 'MHK DR7';                          // tên bộ đó ở bản cũ (trước khi đổi plugin)
    var KEY_BACKSPACE = 8, KEY_ESCAPE = 27, KEY_DELETE = 46;
    var KEY_F2 = 113, KEY_F12 = 123;                    // mã phím ảo: F1 = 112

    var cs = new CSInterface();
    var keycaps = [];                                    // { button, label, target: { set, action }, ensure(done(ok)) }
    var active = null;                                   // ô đang nghe phím
    var cleanupTried = false;

    function load(name) {
        try {
            return localStorage.getItem(name);
        } catch (e) {
            console.warn('DR7: không đọc được ' + name, e);
            return null;
        }
    }

    function save(name, value) {
        try {
            if (value === null) localStorage.removeItem(name);
            else localStorage.setItem(name, value);
        } catch (e) {
            console.warn('DR7: không lưu được ' + name, e);
        }
    }

    function hint(text) {
        if (window.dr7FlashStatus) window.dr7FlashStatus(text);
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

    function bindingFor(target) {
        var list = bindings();
        for (var i = 0; i < list.length; i += 1) {
            if (list[i].set === target.set && list[i].action === target.action) return list[i];
        }
        return null;
    }

    // Ô hiện phím đã gán; chưa gán thì hiện icon bàn phím (CSS ẩn/hiện theo class has-key)
    function render() {
        keycaps.forEach(function (cap) {
            var entry = bindingFor(cap.target);
            var listening = active === cap;
            cap.label.textContent = listening ? '…' : entry ? entry.key : '';
            cap.button.classList.toggle('has-key', listening || !!entry);
            cap.button.classList.toggle('listening', listening);
            cap.button.title = listening ? 'Ấn F2–F12 (+Shift/Ctrl) · Esc huỷ · Backspace xoá phím' :
                entry ? 'Phím tắt: ' + entry.key + ' · bấm để đổi' : 'Gán phím tắt (F2–F12) chạy Action này';
        });
    }

    // Dựng lại bộ Action 1 lần mỗi lần mở panel nếu còn dấu vết bản cũ: phím cũ gán cho Pen Pressure,
    // hoặc bộ "MHK DR7" (tên trước khi đổi plugin) còn trong Photoshop → bộ mới "SCCTLM_Foto" thay thế.
    function cleanupLegacy() {
        if (cleanupTried) return;
        cleanupTried = true;
        var raw = load(BINDINGS_KEY) || '';
        var stale = load(LEGACY_KEY) !== null || raw.indexOf('"set":"' + OWN_SET + '"') >= 0 ||
            raw.indexOf('"set":"' + LEGACY_SET + '"') >= 0;
        if (stale) { apply(bindings()); return; }
        // Bản trước gán phím cho Action đóng gói qua Action "▶ …" trong bộ SCCTLM_Foto: dựng lại để phím nằm thẳng trên Action đó
        cs.evalScript('typeof $.dr7ShortcutSetup=="object"?($.dr7ShortcutSetup.exists(' + JSON.stringify(LEGACY_SET) +
            ',null)||$.dr7ShortcutSetup.hasBundledWrapper()):false', function (res) {
            if (res === 'true') apply(bindings());
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

    function stop() {
        active = null;
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('blur', stop);
        setKeyInterest(false);
        render();
    }

    // Dựng lại bộ "SCCTLM_Foto" với danh sách mới; chỉ lưu khi Photoshop nạp thành công. after(): tuỳ chọn, gọi khi xong
    function apply(next, message, after) {
        stop();
        if (message) hint(message);
        var text = next.map(function (b) { return b.key + '\t' + b.set + '\t' + b.action; }).join('\n');
        window.dr7SetupShortcut(text, function (res) {
            if (res === 'DR7_OK') {
                save(BINDINGS_KEY, JSON.stringify(next));
                save(LEGACY_KEY, null);
            }
            render();
            if (after) after();
        });
    }

    function onKeyDown(event) {
        event.preventDefault();
        event.stopPropagation();
        var code = event.keyCode;
        if (code === KEY_ESCAPE || event.key === 'Escape') { stop(); return; }
        var target = active.target;
        var others = bindings().filter(function (b) { return !(b.set === target.set && b.action === target.action); });
        if (code === KEY_BACKSPACE || code === KEY_DELETE) {
            apply(others, 'Đang xoá phím…');
            return;
        }
        if (code < KEY_F2 || code > KEY_F12) {
            if (/^(Shift|Control|Meta|Alt)$/.test(event.key)) return;   // đang giữ phím bổ trợ
            hint('Chỉ nhận F2–F12');
            return;
        }
        if (event.altKey) { hint('Không dùng Alt'); return; }
        var combo = (event.ctrlKey || event.metaKey ? 'Ctrl+' : '') + (event.shiftKey ? 'Shift+' : '') +
            'F' + (code - KEY_F2 + 2);
        var conflicts = window.dr7ShortcutConflicts.find(combo, target, others,
            window.dr7ReservedKeys ? window.dr7ReservedKeys.list() : []);
        var assign = function () {
            if (conflicts.some(function (c) { return c.kind === 'reserved'; })) window.dr7ReservedKeys.flip(combo);
            // 1 phím chỉ Play 1 Action: ghi đè thì Action đang giữ phím đó mất phím
            var next = others.filter(function (b) { return b.key !== combo; });
            next.push({ key: combo, set: target.set, action: target.action });
            apply(next, 'Đang gán ' + combo + '…');
        };
        if (!conflicts.length) { assign(); return; }
        stop();
        askOverwrite(combo, conflicts).then(function (overwrite) {
            if (overwrite) assign();
            else hint('Không gán ' + combo);
        });
    }

    // Popup hỏi ghi đè: liệt kê nơi đang dùng phím; trùng phím menu thì nhắc trước câu hỏi của chính Photoshop
    function askOverwrite(combo, conflicts) {
        var lines = conflicts.map(function (c) { return '• ' + c.label; });
        var menu = conflicts.some(function (c) { return c.kind === 'photoshop'; });
        return window.dr7Dialog({
            title: 'Phím ' + combo + ' đang được dùng',
            message: 'Phím ' + combo + ' đang dùng cho:\n' + lines.join('\n') + '\n\nGhi đè để phím này chạy Action đã chọn.' +
                (menu ? '\nPhotoshop sẽ hỏi "Remove the conflicting action shortcuts?": chọn No để Action giữ phím.' : ''),
            confirmText: 'Ghi đè',
            cancelText: 'Không gán'
        });
    }

    function start(cap) {
        if (active) {                                       // bấm lần nữa = huỷ
            var same = active === cap;
            stop();
            if (same) return;
        }
        if (window.dr7IsBusy && window.dr7IsBusy()) return;
        // Action phải có trong Photoshop thì bộ phím mới trỏ được tới nó: nạp bộ đi kèm nếu chưa có
        cap.ensure(function (ok) {
            if (!ok || active) return;
            active = cap;
            setKeyInterest(true);
            document.addEventListener('keydown', onKeyDown, true);
            window.addEventListener('blur', stop);
            render();
        });
    }

    // button: ô phím; target: { set, action }; ensure(done(ok)): nạp bộ Action đi kèm nếu Photoshop chưa có
    window.dr7AttachShortcutKey = function (button, target, ensure) {
        var label = button.querySelector('.create-key-text');
        if (!label) return;
        var cap = { button: button, label: label, target: target, ensure: ensure };
        keycaps.push(cap);
        button.addEventListener('click', function () { start(cap); });
        render();
    };
    window.dr7CleanupShortcuts = cleanupLegacy;                 // js/panel.js gọi khi lõi ExtendScript đã sẵn sàng
    // Sau khi panel vừa nạp bộ Action đi kèm: dựng lại bộ "SCCTLM_Foto", vì lần dựng trước đã bỏ các phím
    // trỏ tới Action chưa có (jsx/action-shortcut-setup.jsx install)
    window.dr7ReinstallShortcuts = function (after) {
        var list = bindings();
        if (list.length) apply(list, null, after);
        else after();
    };
}());
