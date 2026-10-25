/*
 * DB - Dodge & Burn ("\u0110\u00E1nh kh\u1ED1i"). Panel calls $._ext_DB.run().
 * Shows the options dialog (jsx/dodge-burn-dialog.jsx) and builds the layers (helpers: jsx/dodge-burn-layers.jsx)
 * as ONE History step. RGB documents only; other modes get a message.
 */
$._ext_DB = {
    // ---- TUNABLE SETTINGS ---------------------------------------------------------------------------------
    HISTORY_NAME: 'DR7 Dodge & Burn',
    MODE_MESSAGE: 'Xin l\u1ED7i, script ch\u1EC9 ch\u1EA1y \u1EDF ch\u1EBF \u0111\u1ED9 m\u00E0u RGB. Mu\u1ED1n \u0111\u1ED5i ch\u1EBF \u0111\u1ED9 m\u00E0u, v\u00E0o Image/Mode/RGB Color.',
    MODE_TITLE: 'Th\u00F4ng b\u00E1o',
    DODGE_NAME: 'Dodge [l\u00E0m s\u00E1ng]',
    BURN_NAME: 'Burn [l\u00E0m t\u1ED1i]',
    DODGE_GROUP: 'Dodge (l\u00E0m s\u00E1ng)',
    BURN_GROUP: 'Burn (l\u00E0m t\u1ED1i)',
    HUESAT_NAME: 'L\u1EDBp Hue/Saturation',
    VIEW_GROUP: 'L\u1EDBp quan s\u00E1t \u0111en tr\u1EAFng',
    CONTRAST_NAME: 'T\u0103ng t\u01B0\u01A1ng ph\u1EA3n',
    GREY_NAME: 'L\u1EDBp \u0111en tr\u1EAFng',
    GREY_LEVEL: 128,
    HUESAT_MASTER: { hue: 0, sat: 0, light: 0 },
    // Curves: [input, output] taken from the measured grey-level responses (same in R, G, B)
    DODGE_POINTS: [[0, 0], [16, 23], [32, 47], [48, 69], [64, 92], [96, 133], [128, 168], [160, 196], [192, 219], [224, 238], [255, 255]],
    BURN_POINTS: [[0, 0], [16, 9], [32, 17], [48, 27], [64, 36], [96, 59], [128, 88], [160, 124], [192, 165], [224, 210], [255, 255]],
    CONTRAST_POINTS: [[0, 0], [16, 5], [32, 11], [48, 20], [64, 34], [80, 53], [96, 76], [112, 102], [128, 129], [144, 157],
        [160, 182], [176, 205], [192, 223], [208, 236], [224, 245], [255, 255]],
    BRUSH: { diameter: 300, hardness: 0, opacity: 100, flow: 1, spacing: 25 },
    // ------------------------------------------------------------------------------------------------------

    // One branch (Burn or Dodge): a Curves layer with a black mask, optionally wrapped in a group with Hue/Saturation.
    // Returns the layer whose mask is the paint target.
    makeBranch: function (o, curvesName, points, groupName) {
        var self = $._ext_DB, L = $._ext_DB_LAYERS, doc = app.activeDocument;
        var curves = L.makeCurves(curvesName, points);
        if (!o.color) { L.setMask(true); return curves; }
        var group = L.makeGroup(groupName);
        curves.move(group, ElementPlacement.INSIDE);
        var hueSat = L.makeHueSat(self.HUESAT_NAME, self.HUESAT_MASTER);
        hueSat.move(group, ElementPlacement.INSIDE);
        doc.activeLayer = group;
        L.setMask(true);
        return group;
    },

    // Hidden viewing group: grey Color-mode fill (mask follows the selection) under a contrast Curves layer
    makeViewGroup: function () {
        var self = $._ext_DB, L = $._ext_DB_LAYERS, doc = app.activeDocument;
        var group = L.makeGroup(self.VIEW_GROUP);
        var fill = L.makeSolidFill(self.GREY_NAME, self.GREY_LEVEL);
        if (!L.hasMask()) L.setMask(false);
        fill.blendMode = BlendMode.COLORBLEND;
        fill.move(group, ElementPlacement.INSIDE);
        doc.selection.deselect();
        var contrast = L.makeCurves(self.CONTRAST_NAME, self.CONTRAST_POINTS);
        contrast.move(group, ElementPlacement.INSIDE);
        fill.visible = false;
        contrast.visible = false;
        group.visible = false;
        return group;
    },

    // Runs in the global scope (suspendHistory): reads everything through $._ext_DB
    build: function () {
        var self = $._ext_DB, L = $._ext_DB_LAYERS, doc = app.activeDocument;
        var o = $._ext_DB_DIALOG.show();
        if (!o || (!o.group && !o.view)) return;
        var fg = app.foregroundColor, bg = app.backgroundColor, target = null, group;
        if (o.group) {
            doc.selection.deselect();
            var burnTop = self.makeBranch(o, self.BURN_NAME, self.BURN_POINTS, self.BURN_GROUP);
            target = self.makeBranch(o, self.DODGE_NAME, self.DODGE_POINTS, self.DODGE_GROUP);
            if (o.color) target.move(burnTop, ElementPlacement.PLACEBEFORE);   // sibling above, not nested inside
        }
        if (o.view) group = self.makeViewGroup();
        doc.selection.deselect();
        if (o.group) {
            app.currentTool = 'paintbrushTool';
            // A failed brush preset is reported, not thrown, so the layers built above stay in History
            if (o.brush) {
                try { L.applyBrush(self.BRUSH); }
                catch (e) { alert($._ext_DB_DIALOG.OPTIONS[3].label + ':\n' + e, $._ext_DB_DIALOG.TITLE); }
            }
        }
        if (o.view) {
            doc.activeLayer = group;
            group.visible = false;
            app.foregroundColor = fg;
            app.backgroundColor = bg;
        } else {
            doc.activeLayer = target;
            L.selectMaskChannel();
            var white = new SolidColor(), black = new SolidColor();
            white.rgb.red = white.rgb.green = white.rgb.blue = 255;
            black.rgb.red = black.rgb.green = black.rgb.blue = 0;
            app.foregroundColor = white;
            app.backgroundColor = black;
        }
    },

    run: function () {
        if (!app.documents.length) return '';
        var step = app.activeDocument.mode === DocumentMode.RGB ? 'build' : 'notRgb';
        app.activeDocument.suspendHistory($._ext_DB.HISTORY_NAME, '$._ext_DB.' + step + '()');
        return '';
    },

    notRgb: function () { alert($._ext_DB.MODE_MESSAGE, $._ext_DB.MODE_TITLE); }
};
