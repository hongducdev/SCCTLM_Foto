/*
 * WMMEASURE - measures text widths with Photoshop's real fonts for the Watermark tab (js/wm-layout.js needs them to lay the template out).
 * measure(list): list is an array [{ text, font (PostScript name), bold, size (px) }] already checked by js/wm-spec.js;
 * returns the string "[width px, ...]" in the same order.
 * Width = width of "|text|" minus width of "||", so leading and trailing spaces count. Measured in a throw-away document.
 */
$._ext_WMMEASURE = {
    PROBE: '||',

    textWidth: function (doc, text, font, size) {
        var layer = doc.artLayers.add();
        layer.kind = LayerKind.TEXT;
        var item = layer.textItem;
        item.contents = text;
        item.font = font;
        item.size = size;
        var box = layer.bounds;
        var width = box[2].as('px') - box[0].as('px');
        layer.remove();
        return width;
    },

    measure: function (list) {
        var previous = app.activeDocument, units = app.preferences.rulerUnits, typeUnits = app.preferences.typeUnits;
        var cache = {}, widths = [], doc, i, key, entry, face, dialogs = app.displayDialogs;
        app.preferences.rulerUnits = Units.PIXELS;
        app.preferences.typeUnits = TypeUnits.PIXELS;
        app.displayDialogs = DialogModes.NO;
        try {
            doc = app.documents.add(4000, 400, 72, 'wm-measure', NewDocumentMode.RGB);
            for (i = 0; i < list.length; i += 1) {
                entry = list[i];
                face = entry.bold ? $._ext_EXIFFRAME.boldOf(entry.font) : entry.font;
                key = face + '|' + entry.size + '|' + entry.text;
                if (cache[key] === undefined) {
                    cache[key] = this.textWidth(doc, '|' + entry.text + '|', face, entry.size) - this.textWidth(doc, this.PROBE, face, entry.size);
                }
                widths.push(cache[key]);
            }
        } finally {
            if (doc) doc.close(SaveOptions.DONOTSAVECHANGES);
            app.preferences.rulerUnits = units;
            app.preferences.typeUnits = typeUnits;
            app.displayDialogs = dialogs;
            if (previous) app.activeDocument = previous;
        }
        return '[' + widths.join(',') + ']';
    }
};
