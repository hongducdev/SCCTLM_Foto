#target photoshop
// Behaviour baseline for the clean-room rewrite (docs/clean-room/PROCESS.md).
// Runs each command in $.dr7BaselineCommands on 3 synthetic RGB images, records the layer tree and the composite
// histogram of the result, and writes JSON to tests/baselines/<name>.json. It calls commands by name only.
// Set before running:  $.dr7BaselineCommands = ['WT'];  $.dr7BaselineName = 'wt.before';  (name is optional)
//   $ps = New-Object -ComObject Photoshop.Application
//   $ps.DoJavaScript('$.dr7BaselineCommands=["WT"]; $.dr7BaselineName="wt.before"; $.evalFile(new File("D:/DR7/tests/photoshop-baseline-record.jsx"))', $null)
(function () {
    var COMMANDS = $.dr7BaselineCommands || [];
    var NAME = $.dr7BaselineName || 'baseline';
    var original = app.documents.length ? app.activeDocument : null;
    var units = app.preferences.rulerUnits, dialogs = app.displayDialogs;
    var foreground = app.foregroundColor, background = app.backgroundColor, tool = app.currentTool;
    var scratch = null, results = [], failure = '';

    function rgb(hex) { var c = new SolidColor(); c.rgb.hexValue = hex; return c; }
    function rect(doc, x, y, w, h, hex) {
        doc.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
        doc.selection.fill(rgb(hex));
        doc.selection.deselect();
    }
    // Same pixels on every run: no noise filters, only flat fills.
    var IMAGES = [
        { name: 'skin-gradient', draw: function (doc) {
            for (var i = 0; i < 32; i++) rect(doc, i * 4, 0, 4, 128, ['E8C4A8', 'DDB596', 'D0A482', 'C4977A'][Math.floor(i / 8)]);
        } },
        { name: 'two-tone-and-line', draw: function (doc) {
            rect(doc, 0, 0, 64, 128, 'E0B090'); rect(doc, 64, 0, 64, 128, 'A06B50'); rect(doc, 16, 60, 96, 6, '301810');
        } },
        { name: 'stripes', draw: function (doc) {
            for (var i = 0; i < 16; i++) rect(doc, 0, i * 8, 128, 4, i % 2 ? 'CC9977' : '603828');
        } }
    ];

    function esc(text) {
        return String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
    }
    function toJson(value) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (typeof value === 'string') return '"' + esc(value) + '"';
        var parts = [], i, key;
        if (value instanceof Array) { for (i = 0; i < value.length; i++) parts.push(toJson(value[i])); return '[' + parts.join(',') + ']'; }
        for (key in value) if (value.hasOwnProperty(key)) parts.push('"' + esc(key) + '":' + toJson(value[key]));
        return '{' + parts.join(',') + '}';
    }

    function px(unit) { return Math.round(unit.as('px')); }
    function describe(layer) {
        var node = { name: layer.name, type: String(layer.typename), visible: layer.visible, opacity: Math.round(layer.opacity),
            blend: String(layer.blendMode) };
        try { node.bounds = [px(layer.bounds[0]), px(layer.bounds[1]), px(layer.bounds[2]), px(layer.bounds[3])]; } catch (e) { node.bounds = null; }
        if (layer.typename == 'ArtLayer') { node.kind = String(layer.kind); }
        else { node.children = []; for (var i = 0; i < layer.layers.length; i++) node.children.push(describe(layer.layers[i])); }
        return node;
    }
    function tree(doc) { var out = []; for (var i = 0; i < doc.layers.length; i++) out.push(describe(doc.layers[i])); return out; }

    try {
        app.displayDialogs = DialogModes.NO;
        app.preferences.rulerUnits = Units.PIXELS;
        $.dr7Base = File($.fileName).parent.parent.fsName.replace(/\\/g, '/');
        $.evalFile($.dr7Base + '/loader.jsx');
        if (!$.dr7Ready) throw new Error($.dr7LoadErrors.join('\n'));
        if (!COMMANDS.length) throw new Error('Set $.dr7BaselineCommands to the command names to record');
        for (var c = 0; c < COMMANDS.length; c++) for (var m = 0; m < IMAGES.length; m++) {
            var entry = { command: COMMANDS[c], image: IMAGES[m].name };
            scratch = app.documents.add(128, 128, 72, 'baseline ' + COMMANDS[c] + ' ' + IMAGES[m].name, NewDocumentMode.RGB);
            try {
                scratch.bitsPerChannel = BitsPerChannelType.EIGHT;
                IMAGES[m].draw(scratch);
                scratch.selection.select([[16, 16], [112, 16], [112, 112], [16, 112]]);
                var run = $.dr7Commands[COMMANDS[c]];
                if (typeof run != 'function') throw new Error('Not a registered command');
                run();
                entry.ok = true;
                entry.layers = tree(scratch);
                entry.histogram = scratch.histogram;
            } catch (error) { entry.ok = false; entry.error = String(error); }
            try { scratch.close(SaveOptions.DONOTSAVECHANGES); } catch (e) { }
            scratch = null;
            results.push(entry);
        }
        var folder = new Folder($.dr7Base + '/tests/baselines');
        if (!folder.exists) folder.create();
        var out = new File(folder.fsName + '/' + NAME + '.json');
        out.encoding = 'UTF-8'; out.open('w'); out.write(toJson({ format: 1, name: NAME, results: results })); out.close();
    } catch (error) { failure = String(error) + ' line=' + error.line; }
    finally {
        if (scratch) { try { scratch.close(SaveOptions.DONOTSAVECHANGES); } catch (e) { } }
        app.preferences.rulerUnits = units; app.displayDialogs = dialogs;
        app.foregroundColor = foreground; app.backgroundColor = background;
        if (tool) app.currentTool = tool;
        if (original) app.activeDocument = original;
    }
    var failed = 0; for (var r = 0; r < results.length; r++) if (!results[r].ok) failed++;
    return failure ? 'FAIL: ' + failure : 'Recorded ' + results.length + ' runs (' + failed + ' failed) -> tests/baselines/' + NAME + '.json';
}());
