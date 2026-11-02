/*
 * Nút "Chẩn đoán" ở chân panel: gom thông tin cài đặt và lỗi gần đây, hiện trong hộp thoại và cho sao chép.
 * Không bị chặn bởi busy/ready, vì phải dùng được đúng lúc lõi hỏng. Logic báo cáo ở js/diagnostics-report.js.
 */
(function () {
    'use strict';

    var cs = new CSInterface();
    var CORE_TIMEOUT_MS = 5000;

    function hostVersion() {
        try { return JSON.parse(cs.getHostEnvironment()).appVersion || ''; } catch (e) { return ''; }
    }

    // Photoshop có thể đang bận hoặc lõi chưa nạp: sau CORE_TIMEOUT_MS vẫn hiện phần phía panel
    function readCore() {
        return new Promise(function (resolve) {
            var settled = false;
            var timer = setTimeout(function () { if (!settled) { settled = true; resolve(null); } }, CORE_TIMEOUT_MS);
            try {
                cs.evalScript(window.scctlmFotoDiagnostics.CORE_CODE, function (res) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve(window.scctlmFotoDiagnostics.parseCore(res));
                });
            } catch (e) {
                settled = true;
                clearTimeout(timer);
                resolve(null);
            }
        });
    }

    function panelVersion() {
        var base = window.scctlmFotoBase, updater = window.scctlmFotoUpdater;
        try { return base && updater ? 'v' + String(updater.installedVersion(base)).replace(/^v/, '') : ''; } catch (e) { return ''; }
    }

    function copy(text) {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        area.remove();
        return ok;
    }

    window.scctlmFotoOpenDiagnostics = function () {
        readCore().then(function (core) {
            var report = window.scctlmFotoDiagnostics.build({
                panelVersion: panelVersion(),
                photoshop: hostVersion(),
                os: cs.getOSInformation(),
                base: window.scctlmFotoBase,
                core: core,
                recent: window.scctlmFotoErrors.recent()
            });
            return window.scctlmFotoDialog({
                title: 'Báo cáo chẩn đoán', message: report, confirmText: 'Sao chép báo cáo', cancelText: 'Đóng'
            }).then(function (confirmed) {
                if (!confirmed) return;
                var flash = window.scctlmFotoFlashStatus || window.scctlmFotoStatus;
                if (copy(report)) flash('✓ Đã sao chép báo cáo, hãy dán vào tin nhắn gửi SCCTLM.');
                else window.scctlmFotoStatus('Không sao chép được. Hãy mở lại báo cáo, bôi đen nội dung rồi nhấn Ctrl+C.', true);
            });
        });
    };
}());
