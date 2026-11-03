#target photoshop
// File > Scripts > Browse. Only disposable documents created here are modified.
(function () {
    var original = app.documents.length ? app.activeDocument : null;
    var dialogs = app.displayDialogs;
    var units = app.preferences.rulerUnits;
    var foreground = app.foregroundColor;
    var background = app.backgroundColor;
    var currentTool = app.currentTool;
    var scratch = null;
    var report = [];
    var originalAlert = $.global.alert;
    var notices = [];
    try {
        // Legacy handlers catch their own exceptions and alert; those must not count as PASS.
        $.global.alert = function (message) { notices.push(String(message)); };
        scratch = app.documents.add(128, 128, 72, 'SCCTLM_Foto audit - disposable', NewDocumentMode.RGB);
        $.scctlmFotoBase = File($.fileName).parent.parent.fsName.replace(/\\/g, '/');
        $.evalFile($.scctlmFotoBase + '/loader.jsx');
        if (!$.scctlmFotoReady) throw new Error($.scctlmFotoLoadErrors.join('\n'));
        var htmlFile = File($.scctlmFotoBase + '/index.html');
        htmlFile.open('r');
        var html = htmlFile.read();
        htmlFile.close();
        var pattern = /(doa|onClickButton)\('([^']+)'\)/g;
        var match, seen = {}, count = 0;
        while ((match = pattern.exec(html))) {
            var key = match[1] + ':' + match[2];
            if (seen[key]) continue;
            seen[key] = true;
            var fn = match[1] === 'doa' ? $.scctlmFotoCommands[match[2]] : $['_ext_' + match[2]].run;
            if (typeof fn !== 'function') throw new Error('Missing: ' + key);
            count++;
        }
        report.push('PASS: ' + count + ' callable legacy panel commands; loader ready');
        scratch.close(SaveOptions.DONOTSAVECHANGES);
        scratch = null;
        // DKACR opens the Camera Raw dialog and would block the audit; it is only checked for registration below.
        report.push('INFO: new MHK effects tested separately in photoshop-replacements-audit.jsx');
        var commands = ['GGXS', 'TJSH', 'JMXS', 'TJYY', 'FSJH', 'MBPF', 'ZCZQ'];
        for (var n = 0; n < commands.length; n++) {
            scratch = app.documents.add(128, 128, 72, 'SCCTLM_Foto audit ' + commands[n], NewDocumentMode.RGB);
            scratch.activeLayer = scratch.activeLayer.duplicate();
            scratch.selection.select([[16, 16], [112, 16], [112, 112], [16, 112]]);
            try {
                notices = [];
                $.scctlmFotoCommands[commands[n]]();
                if (notices.length) throw new Error(notices.join('; '));
                report.push('PASS: ' + commands[n] + ', layers=' + scratch.layers.length);
            } catch (error) {
                report.push('FAIL: ' + commands[n] + ': ' + error + ' line=' + error.line);
            } finally {
                scratch.close(SaveOptions.DONOTSAVECHANGES);
                scratch = null;
            }
        }
        // Panel buttons whose handler opens its own dialog are only checked for presence here;
        // running them would block the audit. See photoshop-replacements-audit.jsx for effects.
        report.push(typeof $.scctlmFotoCommands.DKACR === 'function' ? 'PASS: DKACR registered (opens Camera Raw, not run)' : 'FAIL: DKACR not registered');
        var actions = ['DS', 'BA', 'SE', 'WM', 'LS', 'SS', 'RE', 'DB', 'SH', 'LI', 'BTNPFSD2',
            'TC', 'WT', 'PP_DETAIL', 'BUGFIX'];
        for (var t = 0; t < actions.length; t++) {
            var handler = $['_ext_' + actions[t]];
            if (!handler || typeof handler.run !== 'function') {
                report.push('FAIL: missing handler ' + actions[t]);
            } else {
                report.push('PASS: handler ' + actions[t]);
            }
        }
    } catch (error) {
        report.push('FAIL: ' + error + ' line=' + error.line);
    } finally {
        $.global.alert = originalAlert;
        if (scratch) scratch.close(SaveOptions.DONOTSAVECHANGES);
        app.displayDialogs = dialogs;
        app.preferences.rulerUnits = units;
        app.foregroundColor = foreground;
        app.backgroundColor = background;
        if (currentTool) app.currentTool = currentTool;
        if (original) app.activeDocument = original;
    }
    return report.join('\n');
}());
