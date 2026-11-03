#target photoshop
// Test new effects on disposable RGB images, preserving the user's document.
(function () {
    var original = app.documents.length ? app.activeDocument : null;
    var units = app.preferences.rulerUnits, dialogs = app.displayDialogs;
    var foreground = app.foregroundColor, background = app.backgroundColor, tool = app.currentTool;
    var scratch = null, report = [];
    try {
        app.displayDialogs = DialogModes.NO;
        $.scctlmFotoBase = File($.fileName).parent.parent.fsName.replace(/\\/g,'/');
        $.evalFile($.scctlmFotoBase+'/loader.jsx');
        if (!$.scctlmFotoReady) throw new Error($.scctlmFotoLoadErrors.join('\n'));
        app.load(new File($.scctlmFotoBase+'/jsx/pj/mhk-patterns.pat'));
        report.push('PASS: Photoshop imported mhk-patterns.pat');
        var commands = ['CGYSB','MLXG','mcwl','sfb','PP_DETAIL'];
        for (var depth = 0; depth < 2; depth++) for (var i = 0; i < commands.length; i++) {
            scratch = app.documents.add(128,128,72,'MHK audit '+commands[i]+' '+(depth ? 16 : 8),NewDocumentMode.RGB);
            scratch.bitsPerChannel = depth ? BitsPerChannelType.SIXTEEN : BitsPerChannelType.EIGHT;
            app.preferences.rulerUnits = Units.PIXELS;
            var color = new SolidColor(); color.rgb.hexValue = '876543';
            scratch.selection.select([[20,20],[108,20],[108,108],[20,108]]);
            scratch.selection.fill(color); scratch.selection.deselect();
            var name = commands[i], before = scratch.layers.length;
            try {
                if (name.indexOf('PP_') === 0) $['_ext_'+name].run();
                else $.scctlmFotoCommands[name]();
                if (scratch.layers.length <= before) throw new Error('No output layer');
                if (scratch.activeLayer.name.indexOf('MHK') !== 0) throw new Error('Wrong output layer');
                var bounds = scratch.activeLayer.bounds;
                if (bounds[2].as('px') <= bounds[0].as('px')) throw new Error('Empty output layer');
                if ((name === 'CGYSB' || name === 'PP_DETAIL') && scratch.activeLayer.kind !== LayerKind.SMARTOBJECT) throw new Error('Not a Smart Object');
                report.push('PASS: '+name+' RGB/'+(depth ? 16 : 8));
            } catch (error) { report.push('FAIL: '+name+' RGB/'+(depth ? 16 : 8)+': '+error+' line='+error.line); }
            finally { scratch.close(SaveOptions.DONOTSAVECHANGES); scratch = null; }
        }
    } catch (error) { report.push('FAIL: '+error+' line='+error.line); }
    finally {
        if (scratch) scratch.close(SaveOptions.DONOTSAVECHANGES);
        app.preferences.rulerUnits = units; app.displayDialogs = dialogs;
        app.foregroundColor = foreground; app.backgroundColor = background;
        if (tool) app.currentTool = tool;
        if (original) app.activeDocument = original;
    }
    return report.join('\n');
}());
