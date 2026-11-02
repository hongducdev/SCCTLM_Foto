#target photoshop
// Actual Photoshop execution on disposable 8/16-bit images; never saves images.
(function () {
    var original = app.documents.length ? app.activeDocument : null;
    var scratch = null, report = [];
    var dialogs = app.displayDialogs, units = app.preferences.rulerUnits;
    try {
        $.scctlmFotoBase = File($.fileName).parent.parent.fsName.replace(/\\/g, '/');
        // Full loader: pfsd2 relies on $.scctlmFotoSkinStep from main.jsx.
        $.evalFile($.scctlmFotoBase + '/loader.jsx');
        if (!$.scctlmFotoReady) throw new Error($.scctlmFotoLoadErrors.join('\n'));
        var colors = ['FFFFFF', '000000', 'CC9977'];
        var depths = [BitsPerChannelType.EIGHT, BitsPerChannelType.SIXTEEN];
        for (var d = 0; d < depths.length; d++) {
            for (var c = 0; c < colors.length; c++) {
                scratch = app.documents.add(128, 128, 72, 'SCCTLM_Foto skin audit', NewDocumentMode.RGB);
                scratch.bitsPerChannel = depths[d];
                var color = new SolidColor();
                color.rgb.hexValue = colors[c];
                scratch.selection.selectAll();
                scratch.selection.fill(color);
                scratch.selection.deselect();
                try {
                    $._ext_BTNPFSD2.run();
                    if (!scratch.layerSets.length) throw new Error('No skin-color group created');
                    report.push('PASS: ' + colors[c] + ' ' + (d ? 16 : 8) + '-bit; group created');
                } catch (error) {
                    report.push('FAIL: ' + colors[c] + ' ' + (d ? 16 : 8) + '-bit: ' + error + ' line=' + error.line);
                } finally {
                    scratch.close(SaveOptions.DONOTSAVECHANGES);
                    scratch = null;
                }
            }
        }
    } finally {
        if (scratch) scratch.close(SaveOptions.DONOTSAVECHANGES);
        app.displayDialogs = dialogs;
        app.preferences.rulerUnits = units;
        if (original) app.activeDocument = original;
    }
    return report.join('\n');
}());
