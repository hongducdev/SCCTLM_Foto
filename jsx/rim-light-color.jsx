/*
 * RIMCOLOR - recolors the "Color" layer inside the "Rim Light" group (made by the bundled
 * "Thumbnail action" > "YouTube Rim Light") with the "#rrggbb" color given by the panel's picker,
 * or the current Foreground color when none is given. One History step.
 * The action leaves "Color" as a pixel layer (Fill), so its pixels are refilled keeping transparency;
 * a Solid Color fill layer is also supported by changing its color.
 */
$._ext_RIMCOLOR = {
    GROUP: 'Rim Light',
    LAYER: 'Color',

    findLayer: function () {
        var group, layer;
        try {
            group = app.activeDocument.layerSets.getByName(this.GROUP);
            layer = group.artLayers.getByName(this.LAYER);
        } catch (e) {
            throw new Error('Kh\u00F4ng th\u1EA5y l\u1EDBp "' + this.LAYER + '" trong nh\u00F3m "' + this.GROUP + '". H\u00E3y ch\u1EA1y Action YouTube Rim Light tr\u01B0\u1EDBc.');
        }
        return layer;
    },

    rgbDescriptor: function (color) {
        var rgb = new ActionDescriptor();
        rgb.putDouble(charIDToTypeID('Rd  '), color.red);
        rgb.putDouble(charIDToTypeID('Grn '), color.green);
        rgb.putDouble(charIDToTypeID('Bl  '), color.blue);
        return rgb;
    },

    // Both paint functions target the active layer: run() selects the Color layer first and restores the selection after
    paintPixels: function (color) {
        var desc = new ActionDescriptor();
        desc.putEnumerated(charIDToTypeID('Usng'), charIDToTypeID('FlCn'), charIDToTypeID('Clr '));
        desc.putObject(charIDToTypeID('Clr '), charIDToTypeID('RGBC'), this.rgbDescriptor(color));
        desc.putUnitDouble(charIDToTypeID('Opct'), charIDToTypeID('#Prc'), 100);
        desc.putEnumerated(charIDToTypeID('Md  '), charIDToTypeID('BlnM'), charIDToTypeID('Nrml'));
        desc.putBoolean(charIDToTypeID('PrsT'), true);                 // keep transparency
        executeAction(charIDToTypeID('Fl  '), desc, DialogModes.NO);
    },

    paintSolidFill: function (color) {
        var fill = new ActionDescriptor();
        fill.putObject(charIDToTypeID('Clr '), charIDToTypeID('RGBC'), this.rgbDescriptor(color));
        var ref = new ActionReference();
        ref.putEnumerated(stringIDToTypeID('contentLayer'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putObject(charIDToTypeID('T   '), stringIDToTypeID('solidColorLayer'), fill);
        executeAction(charIDToTypeID('setd'), desc, DialogModes.NO);
    },

    // "1" when the active document has the Rim Light > Color layer, otherwise "0" (panel shows its row only then)
    available: function () {
        try {
            this.findLayer();
            return '1';
        } catch (e) {
            return '0';
        }
    },

    // hex: "#rrggbb" from the panel; anything else = Foreground color
    run: function (hex) {
        var self = $._ext_RIMCOLOR;
        var layer = self.findLayer();
        var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex));
        // suspendHistory evaluates its script in the global scope, so the color is passed through the object
        self.color = m ? { red: parseInt(m[1], 16), green: parseInt(m[2], 16), blue: parseInt(m[3], 16) } : app.foregroundColor.rgb;
        self.paintKind = layer.kind === LayerKind.SOLIDFILL ? 'paintSolidFill' : 'paintPixels';
        var doc = app.activeDocument, previous = doc.activeLayer;
        try {
            doc.activeLayer = layer;
            doc.suspendHistory('Rim Light color', '$._ext_RIMCOLOR.' + self.paintKind + '($._ext_RIMCOLOR.color)');
        } finally {
            doc.activeLayer = previous;
        }
    },

    // Opacity (0-100) of the whole "Rim Light" group: the panel's Cuong do slider
    getOpacity: function () {
        return String(Math.round(app.activeDocument.layerSets.getByName($._ext_RIMCOLOR.GROUP).opacity));
    },

    setOpacity: function (value) {
        var group = app.activeDocument.layerSets.getByName($._ext_RIMCOLOR.GROUP);
        group.opacity = Math.max(0, Math.min(100, Number(value)));
        return 'ok';
    }
};
