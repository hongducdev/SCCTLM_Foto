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

    // Several Rim Light groups can coexist: prefer the one holding the active layer, else the first by name
    // The action names the group "Rim Light"; finish() renames it "Rim Light for <layer>"
    isGroup: function (node) {
        var n = node.name, g = $._ext_RIMCOLOR.GROUP;
        return node.typename === 'LayerSet' && (n === g || n.indexOf(g + ' for ') === 0);
    },

    findGroup: function () {
        var doc = app.activeDocument, node = doc.activeLayer, i;
        while (node && node.typename !== 'Document') {
            if ($._ext_RIMCOLOR.isGroup(node)) return node;
            node = node.parent;
        }
        for (i = 0; i < doc.layerSets.length; i += 1) {
            if ($._ext_RIMCOLOR.isGroup(doc.layerSets[i])) return doc.layerSets[i];
        }
        throw new Error('No Rim Light group');
    },

    labelColor: function (id) {
        var ref = new ActionReference();
        ref.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('Clr '));
        ref.putIdentifier(charIDToTypeID('Lyr '), id);
        return typeIDToCharID(executeActionGet(ref).getEnumerationValue(charIDToTypeID('Clr ')));
    },

    // Taken before the Action runs: name and label color of the layer the Rim Light is made for
    source: function () {
        var layer = app.activeDocument.activeLayer;
        return { name: layer.name, color: this.labelColor(layer.id) };
    },

    // "" when the active layer can take a Rim Light, else the sentence to show. The Action starts from the
    // active layer's transparency: with no pixels there Photoshop stops on "Delete/Make is not currently available".
    targetProblem: function () {
        var doc = app.activeDocument, layer = doc.activeLayer, node, w, h;
        if (layer.typename !== 'ArtLayer' || layer.isBackgroundLayer) {
            return 'H\u00E3y ch\u1ECDn l\u1EDBp c\u00F3 h\u00ECnh c\u1EA7n l\u00E0m Rim Light (l\u1EDBp \u1EA3nh, Smart Object ho\u1EB7c ch\u1EEF), kh\u00F4ng ph\u1EA3i nh\u00F3m hay l\u1EDBp n\u1EC1n.';
        }
        if (layer.kind !== LayerKind.NORMAL && layer.kind !== LayerKind.SMARTOBJECT && layer.kind !== LayerKind.TEXT) {
            return 'L\u1EDBp \u0111i\u1EC1u ch\u1EC9nh kh\u00F4ng c\u00F3 h\u00ECnh \u0111\u1EC3 l\u00E0m Rim Light. H\u00E3y ch\u1ECDn l\u1EDBp \u1EA3nh, Smart Object ho\u1EB7c ch\u1EEF.';
        }
        w = layer.bounds[2].as('px') - layer.bounds[0].as('px');
        h = layer.bounds[3].as('px') - layer.bounds[1].as('px');
        if (w <= 0 || h <= 0) return 'L\u1EDBp \u0111ang ch\u1ECDn tr\u1ED1ng n\u00EAn ch\u01B0a c\u00F3 g\u00EC \u0111\u1EC3 l\u00E0m Rim Light. H\u00E3y ch\u1ECDn l\u1EDBp c\u00F3 h\u00ECnh.';
        for (node = layer.parent; node && node.typename !== 'Document'; node = node.parent) {
            if (this.isGroup(node)) return '\u0110ang ch\u1ECDn l\u1EDBp b\u00EAn trong nh\u00F3m Rim Light. H\u00E3y ch\u1ECDn l\u1EDBp b\u1EA1n mu\u1ED1n l\u00E0m Rim Light r\u1ED3i b\u1EA5m l\u1EA1i.';
        }
        return '';
    },

    LABELS: ['Rd  ', 'Orng', 'Ylw ', 'Grn ', 'Bl  ', 'Vlt '],

    // After the Action: name the new group "Rim Light for <layer>", collapse it, and label it with the source layer's
    // color, or a color that cycles per Rim Light when the source has none
    finish: function (source) {
        var doc = app.activeDocument, group = this.findGroup(), id = group.id, count = 0, i;
        for (i = 0; i < doc.layerSets.length; i += 1) {
            if (this.isGroup(doc.layerSets[i])) count += 1;
        }
        group.name = this.GROUP + ' for ' + source.name;
        var label = source.color !== 'None' ? source.color : this.LABELS[Math.max(0, count - 1) % this.LABELS.length];
        var ref = new ActionReference();
        ref.putIdentifier(charIDToTypeID('Lyr '), id);
        var color = new ActionDescriptor();
        color.putEnumerated(charIDToTypeID('Clr '), charIDToTypeID('Clr '), charIDToTypeID(label));
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putObject(charIDToTypeID('T   '), charIDToTypeID('Lyr '), color);
        executeAction(charIDToTypeID('setd'), desc, DialogModes.NO);

        var prop = new ActionReference();
        prop.putProperty(charIDToTypeID('Prpr'), stringIDToTypeID('layerSectionExpanded'));
        prop.putIdentifier(charIDToTypeID('Lyr '), id);
        var collapse = new ActionDescriptor();
        collapse.putReference(charIDToTypeID('null'), prop);
        collapse.putBoolean(charIDToTypeID('T   '), false);
        executeAction(charIDToTypeID('setd'), collapse, DialogModes.NO);
    },

    findLayer: function () {
        var group, layer;
        try {
            group = this.findGroup();
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
        return String(Math.round($._ext_RIMCOLOR.findGroup().opacity));
    },

    setOpacity: function (value) {
        var group = $._ext_RIMCOLOR.findGroup();
        group.opacity = Math.max(0, Math.min(100, Number(value)));
        return 'ok';
    }
};
