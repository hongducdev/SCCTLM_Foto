/* SCCTLM_Foto bridge: explicit command namespace, loader readiness, host error details. */
(function () {
    'use strict';

    var cs = new CSInterface();
    var PANEL_MIN_WIDTH = 300;
    var ready = false;
    var busy = false;
    window.scctlmFotoIsBusy = function () { return busy; };

    // Hộp thoại chung (js/dialog.js); alert/confirm của trình duyệt chỉ là đường lui nếu hộp thoại chưa nạp được
    function notify(title, message) {
        if (window.scctlmFotoDialog) return window.scctlmFotoDialog({ title: title, message: message, tone: 'error' });
        alert(title + '\n' + message);
        return Promise.resolve(true);
    }
    // Mọi lỗi hiện cho người dùng đi qua js/error-messages.js: câu tiếng Việt kèm việc cần làm, không bao giờ là mã hay chuỗi thô
    // Nếu error-messages.js không nạp được (cài thiếu file, cập nhật dở) vẫn phải có câu rõ ràng, không được ném TypeError
    var MISSING_HELPER = 'Một số file của plugin không nạp được nên chưa hiện được chi tiết lỗi. Hãy cài lại bằng install\\Cai-dat-SCCTLM_Foto.bat.';
    function reportError(raw, ctx) {
        if (!window.scctlmFotoErrors) return notify('Plugin chưa khởi động đủ', MISSING_HELPER);
        var result = window.scctlmFotoErrors.explain(raw, ctx);
        return notify(result.title, result.message + '\n\n' + result.action);
    }
    function errorLine(raw, ctx) {
        return window.scctlmFotoErrors ? window.scctlmFotoErrors.line(raw, ctx) : MISSING_HELPER;
    }
    window.scctlmFotoReportError = reportError;
    window.scctlmFotoErrorLine = errorLine;
    // Tên nút người dùng thấy (từ index.html) cho lệnh doa/ext; rỗng nếu không phải nút trên panel
    function buttonLabel(kind, name) {
        var wanted = (kind === 'doa' ? 'doa' : 'onClickButton') + "('" + name + "')";
        var buttons = document.querySelectorAll('button[onclick]');
        for (var i = 0; i < buttons.length; i += 1) {
            if (buttons[i].getAttribute('onclick') !== wanted) continue;
            var label = buttons[i].querySelector('span');
            return label ? label.textContent : '';
        }
        return '';
    }
    function ask(title, message, confirmText, cancelText) {
        if (window.scctlmFotoDialog) return window.scctlmFotoDialog({ title: title, message: message, confirmText: confirmText, cancelText: cancelText });
        return Promise.resolve(window.confirm(title + '\n\n' + message));
    }
    window.scctlmFotoReload = function () {
        if (busy) return false;
        // Máy dev: chép code mới từ thư mục nguồn sang bản cài trước khi nạp lại
        try {
            if (window.scctlmFotoSyncDevSource) window.scctlmFotoSyncDevSource(base);
        } catch (e) {
            // Nạp lại sau khi người dùng đọc xong thông báo, không thì trang tải lại và hộp thoại biến mất
            reportError(e, { source: 'update' }).then(function () {
                window.location.reload(true);
            });
            return true;
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
    // Action đi kèm panel: "file.atn\tbộ\tAction" (xem jsx/action-set-import.jsx, js/create-action-buttons.js)
    var BUNDLED_ACTION = /^[A-Za-z0-9 _()-]+(\.[A-Za-z0-9 _()-]+)*\.atn\t[A-Za-z0-9 _()-]+\t[A-Za-z0-9 _()-]+$/i;
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

    // Lệnh tạo layer retouch: Trước / Sau (jsx/before-after.jsx) ghi nhớ layer mới của các lệnh này.
    // Không tính Hàng loạt (BA, xử lý nhiều ảnh), Chữ / Logo, Brush, Mở RAW, BUGFIX và chính nút Trước / Sau.
    var TRACKED_EXT = /^(DS|WT|RE|DB|SE|LS|BTNPFSD2|TC|SH)$/;
    // Lệnh dựng lại hoặc gộp ảnh (khung EXIF, watermark, artboard, Hàng loạt, Chữ / Logo) không ghi layer nhưng phải hiện lại
    // layer đang ẩn bởi Trước / Sau, nếu không Flatten / Merge sẽ làm mất kết quả retouch.
    function restoresHidden(kind, name) {
        return kind === 'frame' || kind === 'wm' || kind === 'artboard' || (kind === 'ext' && (name === 'BA' || name === 'WM'));
    }
    function tracksLayers(kind, name) {
        return kind === 'doa' || kind === 'preset' || kind === 'colormix' || kind === 'play' || (kind === 'ext' && TRACKED_EXT.test(name));
    }

    // done(res): tuỳ chọn, gọi sau khi Photoshop chạy xong (res = "SCCTLM_OK" / "SCCTLM_CANCEL" / lỗi)
    // arg: tuỳ chọn, màu "#rrggbb" truyền cho lệnh $._ext_<name>.run
    function run(kind, name, done, arg) {
        var valid = kind === 'preset' ? PRESET_FILE : (kind === 'play' || kind === 'ensure') ? BUNDLED_ACTION : kind === 'colormix' ? COLOR_MIX : kind === 'shortcut' ? SHORTCUT_LIST :
            kind === 'artboard' ? window.scctlmFotoArtboard.spec : kind === 'frame' ? window.scctlmFotoExifFrame.spec : kind === 'wm' ? window.scctlmFotoWmSpec.plan : /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!valid.test(name) || (arg !== undefined && !HEX_COLOR.test(arg))) { if (done) done('SCCTLM_INVALID'); return; }
        if (!ready) {
            notify('Photoshop chưa sẵn sàng', 'Lõi Photoshop chưa sẵn sàng. Hãy đóng và mở lại panel.');
            if (done) done('SCCTLM_NOT_READY');
            return;
        }
        if (busy) { if (done) done('SCCTLM_BUSY'); return; }
        busy = true;
        document.body.classList.add('is-busy');
        var target = kind === 'doa' ? '$.scctlmFotoCommands[' + JSON.stringify(name) + ']' :
            kind === 'preset' ? '$.scctlmFotoApplyBundledXmp' : kind === 'colormix' ? '$.scctlmFotoApplyColorMix' : kind === 'play' ? '$.scctlmFotoPlayBundledAction' : kind === 'ensure' ? '$.scctlmFotoEnsureBundledAction' :
            kind === 'shortcut' ? '$.scctlmFotoShortcutSetup.install' : kind === 'artboard' ? '$._ext_ARTBOARD.run' : kind === 'frame' ? '$._ext_EXIFFRAME.run' : kind === 'wm' ? '$._ext_WMDRAW.run' : '$._ext_' + name + '.run';
        var args = kind === 'preset' || kind === 'play' || kind === 'ensure' || kind === 'colormix' || kind === 'shortcut' || kind === 'artboard' || kind === 'frame' || kind === 'wm' ? JSON.stringify(name) :
            arg !== undefined ? JSON.stringify(arg) : '';
        // name đã qua kiểm tra; riêng danh sách phím tắt (nhiều dòng, tên Action tuỳ ý) không được
        // chèn thô vào mã ExtendScript hay thông báo → dùng nhãn cố định
        var label = kind === 'shortcut' ? 'Phím tắt Action' : kind === 'play' || kind === 'ensure' ? 'Action' : kind === 'artboard' ? 'Artboard' : kind === 'frame' || kind === 'wm' ? 'Watermark' : name;
        // Only WM (its own batch dialog), BPP/BPPRESET (brush setup), OPENRAW (opens the image) and BUGFIX run without an open image;
        // BA processes every open document, so it needs at least one.
        var code = '(function(){var d=app.displayDialogs,u=app.preferences.rulerUnits;' +
            'try{' + (kind !== 'shortcut' && kind !== 'ensure' && kind !== 'artboard' && !/^(WM|BPP|BPPRESET|OPENRAW|BUGFIX)$/.test(name) ?
                'if(!app.documents.length)return "SCCTLM_NO_DOCUMENT";' : '') +
            (window.scctlmFotoColorMode && window.scctlmFotoColorMode.needsRgb(kind, name) ? window.scctlmFotoColorMode.preflightCode(kind, name) : '') +
            'if(typeof ' + target + '!=="function")throw new Error("Missing command: ' + label + '");' +
            (restoresHidden(kind, name) ? 'try{$._ext_BEFOREAFTER.ensureShown();}catch(e){}' : '') +
            (tracksLayers(kind, name) ? 'var ba=null;try{ba=$._ext_BEFOREAFTER.before();}catch(e){}' : '') +
            'var r=' + target + '(' + args + ');' +
            (tracksLayers(kind, name) ? 'if(ba&&r!=="SCCTLM_EXISTS"){try{$._ext_BEFOREAFTER.after(ba);}catch(e){}}' : '') +
            'return r==="SCCTLM_EXISTS"?r:"SCCTLM_OK";}catch(e){if(e.number===8007)return "SCCTLM_CANCEL";' +
            'return "SCCTLM_ERROR#"+e.number+": "+e+"\\nFile: "+e.fileName+"\\nLine: "+e.line;}' +
            'finally{app.displayDialogs=d;app.preferences.rulerUnits=u;}}())';
        try {
            cs.evalScript(code, function (res) {
                busy = false;
                document.body.classList.remove('is-busy');
                if (res === 'SCCTLM_NO_DOCUMENT') {
                    notify('Chưa mở ảnh', 'Hãy mở ảnh trong Photoshop trước khi chạy lệnh.');
                } else if (res !== 'SCCTLM_OK' && res !== 'SCCTLM_CANCEL' && res !== 'SCCTLM_EXISTS') {
                    reportError(res, { source: 'command', label: buttonLabel(kind, name) });
                }
                if (done) done(res);
            });
        } catch (e) {
            busy = false;
            document.body.classList.remove('is-busy');
            reportError(e, { source: 'cep' });
            if (done) done('SCCTLM_ERROR');
        }
    }

    // --- API cho index.html ---
    window.doa = function (name) { run('doa', name); };
    window.onClickButton = function (name) { run('ext', name); };
    window.scctlmFotoApplyPreset = function (fileName) { run('preset', fileName); };
    // spec "fuji/001:60,dazz/003:40": mỗi màu 1 layer, độ mờ theo %, xem js/color-presets.js
    window.scctlmFotoApplyColorMix = function (spec, done) { run('colormix', spec, done); };
    // spec "file.atn<TAB>bộ<TAB>Action": nạp bộ Action đi kèm nếu Photoshop chưa có (ensure), rồi chạy nó (play)
    window.scctlmFotoEnsureAction = function (spec, done) { run('ensure', spec, done); };
    window.scctlmFotoPlayAction = function (spec, done) { run('play', spec, done); };
    // Gọi từ js/shortcut-key-capture.js sau khi người dùng ấn phím
    window.scctlmFotoSetupShortcut = function (list, done) { run('shortcut', list, done); };
    // spec đã qua window.scctlmFotoArtboard.spec; tạo artboard bằng jsx/artboard-create.jsx
    window.scctlmFotoRunArtboard = function (spec, done) { run('artboard', spec, done); };
    // spec đã qua window.scctlmFotoExifFrame.spec; vẽ khung bằng jsx/exif-frame.jsx
    window.scctlmFotoRunFrame = function (spec, done) { run('frame', spec, done); };
    // kế hoạch đã qua window.scctlmFotoWmSpec.plan; vẽ watermark mẫu gốc bằng jsx/wm-draw.jsx
    window.scctlmFotoRunWm = function (plan, done) { run('wm', plan, done); };
    // Cho module khác (js/brush-setup-controls.js, js/rim-color-controls.js) chạy lệnh $._ext_<name> và nhận kết quả
    window.scctlmFotoRunCommand = function (name, done, arg) { run('ext', name, done, arg); };

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
            button.onclick = function () { window.scctlmFotoApplyPreset(file); };
            grid.appendChild(button);
        });
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
    window.scctlmFotoStatus = status;
    window.scctlmFotoFitHeight = fitHeight;
    window.scctlmFotoFlashStatus = flashStatus;
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
        return window.scctlmFotoUpdater.check(base).then(function (result) { showRelease(result); return result; });
    }
    window.scctlmFotoUpdate = function () {
        var button = document.querySelector('.update-button');
        if (busy || !window.scctlmFotoUpdater || !base) return;
        busy = true;
        if (button) { button.disabled = true; button.classList.add('working'); }
        status('Đang kiểm tra bản mới...');
        function finish() { busy = false; if (button) { button.disabled = false; button.classList.remove('working'); } }
        checkRelease().then(function (result) {
            if (!result.latest) { status('Chưa có bản phát hành nào trên GitHub.'); return null; }
            if (!result.available) { status('Đang dùng bản mới nhất (' + result.latest.tag + ').'); return null; }
            var notes = result.latest.notes ? '\n\n' + result.latest.notes.slice(0, 600) : '';
            return ask('Cập nhật SCCTLM_Foto lên ' + result.latest.tag + '?', notes.trim(), 'Cập nhật', 'Để sau').then(function (accepted) {
                if (!accepted) { status(''); return null; }
                status('Đang kiểm tra file...');   // the first update after 0.1.9 hashes every installed file (~4 s)
                return window.scctlmFotoUpdater.update(base, result.latest.tag, function (done, total) {
                    status('Đang tải ' + done + '/' + total + ' file...');
                }).then(function (installed) {
                    if (installed.restart) {
                        status('Đã cập nhật ' + result.latest.tag + '. Hãy khởi động lại Photoshop để áp dụng.');
                        return 'restart';
                    }
                    return 'reload';
                });
            });
        }).then(function (next) {
            finish();
            if (next === 'reload') window.scctlmFotoReload();
        }, function (error) {
            finish();
            status(errorLine(error, { source: 'update' }), true);
        });
    };

    window.onLoaded = function () {
        if (window.scctlmFotoInitTabs) window.scctlmFotoInitTabs();
        if (window.scctlmFotoInitExplore) window.scctlmFotoInitExplore();
        if (window.scctlmFotoInitArtboard) window.scctlmFotoInitArtboard();
        if (window.scctlmFotoInitFrame) window.scctlmFotoInitFrame();
        if (window.scctlmFotoInitWm) window.scctlmFotoInitWm();
        if (window.scctlmFotoInitColorPresets) window.scctlmFotoInitColorPresets(base);
        renderPresets();
        if (window.scctlmFotoInitCreateButtons) window.scctlmFotoInitCreateButtons();
        if (window.scctlmFotoInitBrushSetup) window.scctlmFotoInitBrushSetup();
        if (window.scctlmFotoInitBrushControls) window.scctlmFotoInitBrushControls();
        if (window.scctlmFotoInitBrushColor) window.scctlmFotoInitBrushColor();
        if (window.scctlmFotoInitRimColor) window.scctlmFotoInitRimColor();
        fitHeight();
        // Silent check: an offline panel simply shows no badge.
        if (window.scctlmFotoUpdater && base && window.cep) {
            showRelease({ current: window.scctlmFotoUpdater.installedVersion(base), latest: null, available: false });
            checkRelease().catch(function (error) { window.console.warn('SCCTLM_Foto update check:', error); });
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
    window.scctlmFotoBase = base;                                  // tiện kiểm tra trong console
    if (!base) {
        notify('SCCTLM_Foto', 'Không xác định được thư mục panel.\nHãy cài lại bằng install/Cai-dat-SCCTLM_Foto.bat');
    } else {
        // Finish an update that was cut short, before the core loads, so ExtendScript never sees half of two versions.
        var recovered = { status: 'none' };
        try { if (window.scctlmFotoStaging) recovered = window.scctlmFotoStaging.recover(base); }
        catch (error) { recovered = { status: 'failed', message: error }; }
        if (recovered.reload) { window.location.reload(); return; }   // the journal is gone now, so this reloads once
        if (recovered.message) status(errorLine(recovered.message, { source: 'update' }), true);
        cs.evalScript('try{$.scctlmFotoBase = ' + JSON.stringify(base) + '; var f=new File($.scctlmFotoBase + "/loader.jsx");' +
            'if(!f.exists){"SCCTLM_ERROR: thiếu file loader.jsx trong thư mục panel. Hãy cài lại bằng install/Cai-dat-SCCTLM_Foto.bat";}' +
            'else{$.evalFile(f);$.scctlmFotoReady ? "SCCTLM_READY" : $.scctlmFotoLoadErrors.join("\\n");}}' +
            'catch(e){"SCCTLM_ERROR: "+e+" ("+(f ? f.error : "")+") line "+e.line;}', function (res) {
            ready = res === 'SCCTLM_READY';
            if (!ready) {
                reportError(res, { source: 'load' });
                return;
            }
            // ScriptUI dialogs opened from a CEP panel (Làm Da, Hàng loạt, Tuỳ chỉnh, Chữ/Logo)
            // can hang Photoshop on Windows until this workaround runs. It used to be fired from
            // body onload, which always lands before this async callback and was silently dropped.
            // Dọn phím tắt kiểu cũ sau khi lõi vừa nạp xong (js/shortcut-key-capture.js); chạy sau BUGFIX vì 1 lệnh mỗi lúc
            run('ext', 'BUGFIX', function () {
                if (window.scctlmFotoCleanupShortcuts) window.scctlmFotoCleanupShortcuts();
            });
        });
    }
}());
