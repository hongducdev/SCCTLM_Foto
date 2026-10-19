/* DR7 bridge: explicit command namespace, loader readiness, host error details. */
(function () {
    'use strict';

    var cs = new CSInterface();
    var PANEL_MIN_WIDTH = 300;
    var ready = false;
    var busy = false;
    window.dr7IsBusy = function () { return busy; };
    window.dr7Reload = function () {
        if (busy) return false;
        // Máy dev: chép code mới từ thư mục nguồn sang bản cài trước khi nạp lại
        try {
            if (window.dr7SyncDevSource) window.dr7SyncDevSource(base);
        } catch (e) {
            alert('Không đồng bộ được code từ thư mục nguồn:\n' + e.message);
        }
        window.location.reload(true);
        return true;
    };

    // Bundled preset file names: plain characters only, so a name can never
    // climb out of /presets or break out of the generated JS string.
    var PRESET_FILE = /^[A-Za-z0-9 _()-]+(\.[A-Za-z0-9 _()-]+)*\.xmp$/i;
    // Colour mix: "group/NNN:opacity" entries (max 4), see jsx/color-mix.jsx.
    var COLOR_MIX = /^[a-z]+\/\d{3}:\d{1,3}(,[a-z]+\/\d{3}:\d{1,3}){0,3}$/;
    var HEX_COLOR = /^#[0-9a-f]{6}$/i;
    var ATN_FILE = /^[A-Za-z0-9 _()-]+(\.[A-Za-z0-9 _()-]+)*\.atn$/i;
    // Danh sách phím tắt Play Action: mỗi dòng "phím\tbộ\tAction" (xem jsx/action-shortcut-setup.jsx).
    // Rỗng = xoá hết phím. Tên Action không được chứa ký tự điều khiển.
    var SHORTCUT_LIST = {
        test: function (text) {
            return text === '' || String(text).split('\n').every(function (line) {
                var f = line.split('\t');
                return f.length === 3 && /^(Ctrl\+)?(Shift\+)?F([2-9]|1[0-2])$/.test(f[0]) &&
                    f[1] !== '' && f[2] !== '' && !/[\x00-\x1f]/.test(f[1] + f[2]);
            });
        }
    };

    // done(res): tuỳ chọn, gọi sau khi Photoshop chạy xong (res = "DR7_OK" / "DR7_CANCEL" / lỗi)
    // arg: tuỳ chọn, màu "#rrggbb" truyền cho lệnh $._ext_<name>.run
    function run(kind, name, done, arg) {
        var valid = kind === 'preset' ? PRESET_FILE : kind === 'atn' ? ATN_FILE : kind === 'colormix' ? COLOR_MIX : kind === 'shortcut' ? SHORTCUT_LIST :
            kind === 'artboard' ? window.dr7Artboard.spec : kind === 'atnpick' ? /^pick$/ : /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!valid.test(name) || (arg !== undefined && !HEX_COLOR.test(arg))) { if (done) done('DR7_INVALID'); return; }
        if (!ready) {
            alert('Lõi Photoshop chưa sẵn sàng. Hãy đóng và mở lại panel.');
            if (done) done('DR7_NOT_READY');
            return;
        }
        if (busy) { if (done) done('DR7_BUSY'); return; }
        busy = true;
        var target = kind === 'doa' ? '$.dr7Commands[' + JSON.stringify(name) + ']' :
            kind === 'preset' ? '$.dr7ApplyBundledXmp' : kind === 'colormix' ? '$.dr7ApplyColorMix' : kind === 'atn' ? '$.dr7ImportBundledAtn' : kind === 'atnpick' ? '$.dr7ImportAtnDialog' :
            kind === 'shortcut' ? '$.dr7ShortcutSetup.install' : kind === 'artboard' ? '$._ext_ARTBOARD.run' : '$._ext_' + name + '.run';
        var args = kind === 'atnpick' ? '' : kind === 'preset' || kind === 'atn' || kind === 'colormix' || kind === 'shortcut' || kind === 'artboard' ? JSON.stringify(name) :
            arg !== undefined ? JSON.stringify(arg) : '';
        // name đã qua kiểm tra; riêng danh sách phím tắt (nhiều dòng, tên Action tuỳ ý) không được
        // chèn thô vào mã ExtendScript hay thông báo → dùng nhãn cố định
        var label = kind === 'shortcut' ? 'Phím tắt Action' : kind === 'atnpick' ? 'Nhập Action' : kind === 'artboard' ? 'Artboard' : name;
        // Only WM (its own batch dialog), BPP/BPPRESET (brush setup) and BUGFIX run without an open image;
        // BA processes every open document, so it needs at least one.
        var code = '(function(){var d=app.displayDialogs,u=app.preferences.rulerUnits;' +
            'try{' + (kind !== 'shortcut' && kind !== 'atn' && kind !== 'atnpick' && kind !== 'artboard' && !/^(WM|BPP|BPPRESET|BUGFIX)$/.test(name) ?
                'if(!app.documents.length)return "DR7_NO_DOCUMENT";' : '') +
            'if(typeof ' + target + '!=="function")throw new Error("Missing command: ' + label + '");' +
            'var r=' + target + '(' + args + ');return r==="DR7_EXISTS"?r:"DR7_OK";}catch(e){if(e.number===8007)return "DR7_CANCEL";' +
            'return "DR7_ERROR: "+e+"\\nFile: "+e.fileName+"\\nLine: "+e.line;}' +
            'finally{app.displayDialogs=d;app.preferences.rulerUnits=u;}}())';
        try {
            cs.evalScript(code, function (res) {
                busy = false;
                if (res === 'DR7_NO_DOCUMENT') {
                    alert('Hãy mở ảnh trong Photoshop trước khi chạy lệnh.');
                } else if (res !== 'DR7_OK' && res !== 'DR7_CANCEL' && res !== 'DR7_EXISTS') {
                    alert('Photoshop — ' + label + ':\n' + res);
                }
                if (done) done(res);
            });
        } catch (e) {
            busy = false;
            alert('Không kết nối được Photoshop:\n' + e);
            if (done) done('DR7_ERROR');
        }
    }

    // --- API cho index.html ---
    window.doa = function (name) { run('doa', name); };
    window.onClickButton = function (name) { run('ext', name); };
    window.dr7ApplyPreset = function (fileName) { run('preset', fileName); };
    // spec "fuji/001:60,dazz/003:40": mỗi màu 1 layer, độ mờ theo %, xem js/color-presets.js
    window.dr7ApplyColorMix = function (spec, done) { run('colormix', spec, done); };
    // done(res): "DR7_OK" = đã nạp bộ Action, "DR7_EXISTS" = Photoshop đã có bộ cùng tên
    window.dr7ImportActions = function (fileName, done) { run('atn', fileName, done); };
    // Chọn 1 file .atn bất kỳ và nạp thẳng vào bảng Actions
    window.dr7ImportActionPicker = function (done) { run('atnpick', 'pick', done); };
    // Gọi từ js/shortcut-key-capture.js sau khi người dùng ấn phím
    window.dr7SetupShortcut = function (list, done) { run('shortcut', list, done); };
    // spec đã qua window.dr7Artboard.spec; tạo artboard bằng jsx/artboard-create.jsx
    window.dr7RunArtboard = function (spec, done) { run('artboard', spec, done); };
    // Cho module khác (js/brush-setup-controls.js, js/rim-color-controls.js) chạy lệnh $._ext_<name> và nhận kết quả
    window.dr7RunCommand = function (name, done, arg) { run('ext', name, done, arg); };

    // One button per .xmp dropped into /presets, labelled with the file name.
    function renderPresets() {
        var grid = document.querySelector('.preset-grid');
        if (!grid || !window.cep || !window.cep.fs || !base) return;
        var listing = window.cep.fs.readdir(base + '/presets');
        if (listing.err) return;
        listing.data.filter(function (file) { return PRESET_FILE.test(file); }).sort().forEach(function (file) {
            var button = document.createElement('button');
            var label = file.replace(/\.xmp$/i, '');
            button.className = 'ba-preset';
            button.title = 'Áp nhanh preset ' + label;
            button.textContent = label;
            button.onclick = function () { window.dr7ApplyPreset(file); };
            grid.appendChild(button);
        });
    }

    // One button per .atn dropped into /presets, followed by the static "Nhập…" picker button.
    function renderActionFiles() {
        var grid = document.querySelector('.atn-grid');
        var importButton = grid && grid.querySelector('.atn-import');
        if (!importButton) return;
        var files = [];
        if (window.cep && window.cep.fs && base) {
            var listing = window.cep.fs.readdir(base + '/presets');
            if (!listing.err) files = listing.data.filter(function (file) { return ATN_FILE.test(file); }).sort();
        }
        files.forEach(function (file) {
            var button = document.createElement('button');
            var label = file.replace(/\.atn$/i, '').replace(/_/g, ' ');
            button.title = 'Nạp bộ Action ' + label + ' vào bảng Actions (' + file + ')';
            button.className = 'atn-load icon-btn';
            button.textContent = label;
            button.onclick = function () {
                window.dr7ImportActions(file, function (res) {
                    if (res === 'DR7_OK') flashStatus('✓ Đã nạp bộ Action ' + label);
                    else if (res === 'DR7_EXISTS') flashStatus('Bộ Action ' + label + ' đã có trong Photoshop');
                    if (window.dr7RefreshActions) window.dr7RefreshActions();
                });
            };
            grid.insertBefore(button, importButton);
        });
        importButton.onclick = function () {
            window.dr7ImportActionPicker(function (res) {
                if (res === 'DR7_OK') flashStatus('✓ Đã nhập bộ Action');
                else if (res === 'DR7_EXISTS') flashStatus('Bộ Action này đã có trong Photoshop');
                if (window.dr7RefreshActions) window.dr7RefreshActions();
            });
        };
        fitHeight();
    }

    // Manifest size is only a default; Photoshop may remember an older, taller panel.
    function fitHeight() {
        if (!window.__adobe_cep__) return;
        var panel = document.querySelector('.panel');
        if (!panel) return;
        var height = Math.ceil(panel.getBoundingClientRect().bottom + window.pageYOffset);
        // Photoshop nhớ bề rộng cũ của panel: nâng lên tối thiểu PANEL_MIN_WIDTH (khớp MinSize trong manifest)
        cs.resizeContent(Math.max(document.documentElement.clientWidth, PANEL_MIN_WIDTH), height);
    }

    // --- Cập nhật từ GitHub Release (logic trong js/github-updater.js) ---
    var release = null;
    function status(text, isError) {
        var box = document.querySelector('.panel-status');
        if (!box) return;
        box.textContent = text || '';
        box.hidden = !text;
        box.className = 'panel-status' + (isError ? ' is-error' : '');
        fitHeight();
    }
    window.dr7Status = status;
    window.dr7FitHeight = fitHeight;
    // Thông báo ngắn, tự ẩn nếu chưa bị thông báo khác thay
    var flashTimer = 0;
    function flashStatus(text) {
        status(text);
        clearTimeout(flashTimer);
        flashTimer = setTimeout(function () {
            var box = document.querySelector('.panel-status');
            if (box && box.textContent === text) status('');
        }, 3000);
    }
    function showRelease(result) {
        release = result;
        var label = document.querySelector('.panel-version');
        var button = document.querySelector('.update-button');
        if (label) label.textContent = result.current ? 'v' + result.current.replace(/^v/, '') : '';
        if (!button) return;
        button.classList.toggle('has-update', result.available);
        button.title = result.available ? 'Có bản mới ' + result.latest.tag + ' — bấm để cập nhật' :
            'Kiểm tra cập nhật từ GitHub';
    }
    function checkRelease() {
        return window.dr7Updater.check(base).then(function (result) { showRelease(result); return result; });
    }
    window.dr7Update = function () {
        var button = document.querySelector('.update-button');
        if (busy || !window.dr7Updater || !base) return;
        busy = true;
        if (button) { button.disabled = true; button.classList.add('working'); }
        status('Đang kiểm tra bản mới...');
        function finish() { busy = false; if (button) { button.disabled = false; button.classList.remove('working'); } }
        checkRelease().then(function (result) {
            if (!result.latest) { status('Chưa có bản phát hành nào trên GitHub.'); return null; }
            if (!result.available) { status('Đang dùng bản mới nhất (' + result.latest.tag + ').'); return null; }
            var notes = result.latest.notes ? '\n\n' + result.latest.notes.slice(0, 600) : '';
            if (!window.confirm('Cập nhật SCCTLM_Foto lên ' + result.latest.tag + '?' + notes)) { status(''); return null; }
            return window.dr7Updater.update(base, result.latest.tag, function (done, total) {
                status('Đang tải ' + done + '/' + total + ' file...');
            }).then(function (installed) {
                if (installed.restart) {
                    status('Đã cập nhật ' + result.latest.tag + '. Hãy khởi động lại Photoshop để áp dụng.');
                    return 'restart';
                }
                return 'reload';
            });
        }).then(function (next) {
            finish();
            if (next === 'reload') window.dr7Reload();
        }, function (error) {
            finish();
            status('Cập nhật thất bại: ' + (error && error.message || error), true);
        });
    };

    window.onLoaded = function () {
        if (window.dr7InitTabs) window.dr7InitTabs();
        if (window.dr7InitExplore) window.dr7InitExplore();
        if (window.dr7InitArtboard) window.dr7InitArtboard();
        if (window.dr7InitColorPresets) window.dr7InitColorPresets(base);
        renderPresets();
        renderActionFiles();
        if (window.dr7InitShortcutCapture) window.dr7InitShortcutCapture();
        if (window.dr7InitBrushSetup) window.dr7InitBrushSetup();
        if (window.dr7InitBrushControls) window.dr7InitBrushControls();
        if (window.dr7InitBrushColor) window.dr7InitBrushColor();
        if (window.dr7InitRimColor) window.dr7InitRimColor();
        fitHeight();
        // Silent check: an offline panel simply shows no badge.
        if (window.dr7Updater && base && window.cep) {
            showRelease({ current: window.dr7Updater.installedVersion(base), latest: null, available: false });
            checkRelease().catch(function (error) { window.console.warn('DR7 update check:', error); });
        }
    };

    // ------------------------------------------------------------
    // Nạp lõi ExtendScript với đường dẫn lấy từ CEP (KHÔNG suy từ $.fileName).
    // The loader callback confirms readiness before accepting button clicks.
    // ------------------------------------------------------------
    function extensionDir() {
        var p = '';
        try { p = cs.getSystemPath(SystemPath.EXTENSION) || ''; } catch (e) { }
        if (!p) {
            // dự phòng: lấy từ URL của panel và BỎ tên file (index.html)
            try { p = decodeURIComponent(window.location.pathname || '').replace(/\/[^/]*$/, ''); } catch (e) { }
        }
        return String(p).replace(/\\/g, '/').replace(/^file:\/\/\//i, '').replace(/^\/([A-Za-z]:)/, '$1').replace(/\/+$/, '');
    }

    var base = extensionDir();
    window.dr7Base = base;                                  // tiện kiểm tra trong console
    if (!base) {
        alert('SCCTLM_Foto: không xác định được thư mục panel.\nHãy cài lại bằng install/Cai-dat-SCCTLM_Foto.bat');
    } else {
        cs.evalScript('try{$.dr7Base = ' + JSON.stringify(base) + '; $.evalFile($.dr7Base + "/loader.jsx");' +
            '$.dr7Ready ? "DR7_READY" : $.dr7LoadErrors.join("\\n");}catch(e){"DR7_ERROR: "+e+" line "+e.line;}', function (res) {
            ready = res === 'DR7_READY';
            if (!ready) {
                alert('SCCTLM_Foto — không nạp được lõi ExtendScript:\n' + res + '\n\nThư mục panel:\n' + base);
                return;
            }
            // ScriptUI dialogs opened from a CEP panel (Làm Da, Hàng loạt, Tuỳ chỉnh, Chữ/Logo)
            // can hang Photoshop on Windows until this workaround runs. It used to be fired from
            // body onload, which always lands before this async callback and was silently dropped.
            run('ext', 'BUGFIX');
        });
    }
}());
