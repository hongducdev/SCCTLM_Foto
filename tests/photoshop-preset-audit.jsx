#target photoshop
// Live audit: prove APPLY_PRESET_XMP (file picked by the user) and the bundled
// preset buttons generated from /presets render with no dialog after the full
// core loads, and that the host refuses preset names outside /presets.
// Run through evalFile so $.fileName resolves to this file:
//   $ps = New-Object -ComObject Photoshop.Application
//   $ps.DoJavaScript('$.evalFile(new File("D:/SCCTLM_Foto/tests/photoshop-preset-audit.jsx"))', $null)
(function () {
    var original = app.documents.length ? app.activeDocument : null;
    var units = app.preferences.rulerUnits, dialogs = app.displayDialogs;
    var scratch = null, report = [];
    function hexes(doc) {
        var out = [];
        for (var i = 0; i < doc.colorSamplers.length; i++) out.push(doc.colorSamplers[i].color.rgb.hexValue);
        return out;
    }
    // Apply once, check the new layer and that every sampler moved, then drop the layer.
    function expectRecolour(label, layerName, apply) {
        var before = hexes(scratch), layers = scratch.layers.length;
        apply();
        var after = hexes(scratch), changed = 0;
        for (var k = 0; k < before.length; k++) if (before[k] !== after[k]) changed++;
        if (scratch.layers.length <= layers || scratch.activeLayer.name !== layerName) {
            throw new Error(label + ': expected layer "' + layerName + '", got "' + scratch.activeLayer.name + '"');
        }
        report.push((changed > 0 ? 'PASS' : 'FAIL') + ': ' + label + ' changed pixels (' + changed + '/' +
            before.length + ' samplers ' + before.join(',') + ' -> ' + after.join(',') + ')');
        if (changed === 0) throw new Error(label + ' did not change any sampled pixel');
        scratch.activeLayer.remove();
    }
    try {
        app.displayDialogs = DialogModes.NO;
        $.scctlmFotoBase = File($.fileName).parent.parent.fsName.replace(/\\/g, '/');
        $.evalFile($.scctlmFotoBase + '/loader.jsx');
        if (!$.scctlmFotoReady) throw new Error($.scctlmFotoLoadErrors.join('\n'));
        if (typeof $.scctlmFotoCommands.APPLY_PRESET_XMP !== 'function') throw new Error('APPLY_PRESET_XMP not registered');
        if (typeof $.scctlmFotoApplyBundledXmp !== 'function') throw new Error('Missing $.scctlmFotoApplyBundledXmp');
        report.push('PASS: core loaded, preset commands registered');

        var presetFile = new File($.scctlmFotoBase + '/presets/MHK05451.xmp');
        if (!presetFile.exists) throw new Error('Missing sample preset: ' + presetFile.fsName);

        scratch = app.documents.add(200, 200, 72, 'SCCTLM_Foto Preset Audit', NewDocumentMode.RGB);
        app.preferences.rulerUnits = Units.PIXELS;
        var colors = ['4a2f1d', '8fa3b1', 'd9c07a'];
        for (var i = 0; i < colors.length; i++) {
            var c = new SolidColor(); c.rgb.hexValue = colors[i];
            scratch.selection.select([[i * 66, 0], [i * 66 + 66, 0], [i * 66 + 66, 200], [i * 66, 200]]);
            scratch.selection.fill(c);
        }
        scratch.selection.deselect();
        for (var s = 0; s < 3; s++) scratch.colorSamplers.add([new UnitValue(30 + s * 70, 'px'), new UnitValue(100, 'px')]);

        // withDialog=false guarantees no Camera Raw window can open during the audit
        expectRecolour('APPLY_PRESET_XMP', 'Preset - MHK05451', function () {
            $.scctlmFotoCommands.APPLY_PRESET_XMP(presetFile, false);
        });
        // Exactly what a generated preset button sends through the panel bridge.
        expectRecolour('bundled preset button', 'Preset - MHK05451', function () {
            $.scctlmFotoApplyBundledXmp('MHK05451.xmp');
        });

        var layers = scratch.layers.length, refused = false;
        try { $.scctlmFotoApplyBundledXmp('../loader.jsx'); } catch (eName) { refused = /Invalid preset name/.test(eName); }
        if (!refused || scratch.layers.length !== layers) throw new Error('Preset name outside /presets was not refused');
        report.push('PASS: preset name outside /presets refused');
    } catch (error) {
        report.push('ERROR: ' + error + ' line=' + error.line);
    } finally {
        if (scratch) scratch.close(SaveOptions.DONOTSAVECHANGES);
        app.preferences.rulerUnits = units;
        app.displayDialogs = dialogs;
        if (original) app.activeDocument = original;
    }
    return report.join('\n');
}());
