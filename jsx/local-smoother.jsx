/*
 * LS - local skin smoothing ("Lam min"). Panel calls $._ext_LS.run().
 * Needs an RGB document with a partial selection; shows jsx/local-smoother-dialog.jsx, then adds ONE pixel layer
 * above the active layer (helpers: jsx/local-smoother-layers.jsx) as one History step.
 */
$._ext_LS = {
    // ---- TUNABLE SETTINGS ---------------------------------------------------------------------------------
    HISTORY_NAME: 'DR7 Local Smoother',
    LAYER_NAME: 'L\u00E0m m\u1ECBn c\u1EE5c b\u1ED9',
    MODE_MESSAGE: 'Xin l\u1ED7i, script ch\u1EC9 ch\u1EA1y \u1EDF ch\u1EBF \u0111\u1ED9 m\u00E0u RGB. Mu\u1ED1n \u0111\u1ED5i ch\u1EBF \u0111\u1ED9 m\u00E0u, v\u00E0o Image/Mode/RGB Color.',
    MODE_TITLE: 'Th\u00F4ng b\u00E1o',
    // ------------------------------------------------------------------------------------------------------

    // Runs in the global scope (suspendHistory): reads everything through $._ext_LS
    build: function () {
        var self = $._ext_LS, L = $._ext_LS_LAYERS, doc = app.activeDocument;
        if (!L.hasPartialSelection(doc)) { $._ext_LS_DIALOG.showHint(); return; }
        var o = $._ext_LS_DIALOG.show();
        if (!o) { doc.selection.deselect(); return; }
        var channel = L.saveSelection(doc);
        try {
            doc.selection.deselect();
            var layer = L.stampBelow(doc, self.LAYER_NAME);
            if (o.detail < o.smooth && o.strength > 0) {
                var smoothed = L.smooth(doc, layer, o.detail, o.smooth);   // Linear Light difference layer
                smoothed.opacity = o.strength;
                L.loadSoftSelection(doc, channel);
                doc.activeLayer = smoothed;
                L.maskFromSelection();
                doc.selection.deselect();
                layer = smoothed.merge();
            }
            layer.name = self.LAYER_NAME;
            doc.activeLayer = layer;
        } finally {
            doc.selection.deselect();
            channel.remove();
        }
    },

    run: function () {
        if (!app.documents.length) return '';
        var step = app.activeDocument.mode === DocumentMode.RGB ? 'build' : 'notRgb';
        app.activeDocument.suspendHistory($._ext_LS.HISTORY_NAME, '$._ext_LS.' + step + '()');
        return '';
    },

    notRgb: function () { alert($._ext_LS.MODE_MESSAGE, $._ext_LS.MODE_TITLE); }
};
