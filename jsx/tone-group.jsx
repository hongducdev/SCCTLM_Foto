/*
 * BTNPFSD2 - shared skin colour ("M\u00E0u t\u1ED5ng"). Panel calls $._ext_BTNPFSD2.run().
 * Builds group "Skin Color" (black group mask) with Curves c_1, fill Shadows, Curves c_2, fill Midtones & Highlights
 * as ONE History step. The brightness masks come from jsx/tone-group-masks.jsx. RGB documents only.
 */
$._ext_BTNPFSD2 = {
    // ---- TUNABLE SETTINGS -----------------------------------------------------------------------------------
    HISTORY_NAME: 'SCCTLM_Foto M\u00E0u t\u1ED5ng',
    GROUP_NAME: 'Skin Color',
    CURVES_1_NAME: 'c_1',
    CURVES_2_NAME: 'c_2',
    SHADOWS_NAME: 'Shadows',
    MIDTONES_NAME: 'Midtones & Highlights',
    SHADOWS_COLOR: [246, 211, 185],       // F6D3B9
    SHADOWS_OPACITY: 50,
    MIDTONES_COLOR: [246, 202, 173],      // F6CAAD
    MIDTONES_OPACITY: 50,
    CURVES_OPACITY: 100,
    IDENTITY_CURVE: [[0, 0], [255, 255]],
    RGB_ONLY_TITLE: 'Th\u00F4ng b\u00E1o',
    RGB_ONLY_TEXT: 'Xin l\u1ED7i, script ch\u1EC9 ch\u1EA1y \u1EDF ch\u1EBF \u0111\u1ED9 m\u00E0u RGB. ' +
        'Mu\u1ED1n \u0111\u1ED5i ch\u1EBF \u0111\u1ED9 m\u00E0u, v\u00E0o Image/Mode/RGB Color.',
    // ----------------------------------------------------------------------------------------------------------

    cid: function (id) { return charIDToTypeID(id); },

    execute: function (event, desc) { executeAction(charIDToTypeID(event), desc, DialogModes.NO); },

    // Curves adjustment layer; its mask comes from the selection (white when nothing is selected)
    makeCurves: function (name) {
        var points = new ActionList(), channel = new ActionDescriptor(), list = new ActionList();
        var settings = new ActionDescriptor(), inner = new ActionDescriptor(), desc = new ActionDescriptor();
        var layerRef = new ActionReference(), compRef = new ActionReference(), i;
        for (i = 0; i < this.IDENTITY_CURVE.length; i += 1) {
            var point = new ActionDescriptor();
            point.putDouble(this.cid('Hrzn'), this.IDENTITY_CURVE[i][0]);
            point.putDouble(this.cid('Vrtc'), this.IDENTITY_CURVE[i][1]);
            points.putObject(this.cid('Pnt '), point);
        }
        compRef.putEnumerated(this.cid('Chnl'), this.cid('Chnl'), this.cid('Cmps'));
        channel.putReference(this.cid('Chnl'), compRef);
        channel.putList(this.cid('Crv '), points);
        list.putObject(this.cid('CrvA'), channel);
        settings.putList(this.cid('Adjs'), list);
        layerRef.putClass(stringIDToTypeID('adjustmentLayer'));
        inner.putObject(this.cid('Type'), this.cid('Crvs'), settings);
        desc.putReference(this.cid('null'), layerRef);
        desc.putObject(this.cid('Usng'), stringIDToTypeID('adjustmentLayer'), inner);
        this.execute('Mk  ', desc);
        var layer = app.activeDocument.activeLayer;
        layer.name = name;
        layer.blendMode = BlendMode.COLORBLEND;
        layer.opacity = this.CURVES_OPACITY;
        return layer;
    },

    // Solid Color Fill layer; like Curves it takes its mask from the selection
    makeSolidFill: function (name, rgb, mode, opacity) {
        var color = new ActionDescriptor(), type = new ActionDescriptor(), using = new ActionDescriptor();
        var desc = new ActionDescriptor(), ref = new ActionReference();
        color.putDouble(this.cid('Rd  '), rgb[0]);
        color.putDouble(this.cid('Grn '), rgb[1]);
        color.putDouble(this.cid('Bl  '), rgb[2]);
        type.putObject(this.cid('Clr '), this.cid('RGBC'), color);
        using.putObject(this.cid('Type'), stringIDToTypeID('solidColorLayer'), type);
        ref.putClass(stringIDToTypeID('contentLayer'));
        desc.putReference(this.cid('null'), ref);
        desc.putObject(this.cid('Usng'), stringIDToTypeID('contentLayer'), using);
        this.execute('Mk  ', desc);
        var layer = app.activeDocument.activeLayer;
        layer.name = name;
        layer.blendMode = mode;
        layer.opacity = opacity;
        return layer;
    },

    makeGroup: function (name) {
        var ref = new ActionReference(), desc = new ActionDescriptor();
        ref.putClass(stringIDToTypeID('layerSection'));
        desc.putReference(this.cid('null'), ref);
        this.execute('Mk  ', desc);
        var group = app.activeDocument.activeLayer;
        group.name = name;
        return group;
    },

    // Mask that hides everything, added to the active layer
    addBlackMask: function () {
        var desc = new ActionDescriptor(), at = new ActionReference();
        desc.putClass(this.cid('Nw  '), this.cid('Chnl'));
        at.putEnumerated(this.cid('Chnl'), this.cid('Chnl'), this.cid('Msk '));
        desc.putReference(this.cid('At  '), at);
        desc.putEnumerated(this.cid('Usng'), this.cid('UsrM'), this.cid('HdAl'));
        this.execute('Mk  ', desc);
    },

    // A fill layer whose mask is the brightness picture `which` of the working copy, clipped to the layer below
    makeMaskedFill: function (doc, which, name, rgb, mode, opacity) {
        $._ext_BTNPFSD2_MASKS.selectMask(doc, $._ext_BTNPFSD2.source, which);
        var fill = this.makeSolidFill(name, rgb, mode, opacity);
        doc.selection.deselect();
        return fill;
    },

    // Runs in the global scope (suspendHistory), so it reads everything through $._ext_BTNPFSD2
    build: function () {
        var self = $._ext_BTNPFSD2, doc = app.activeDocument, group, c1, shadows, c2, midtones;
        group = self.makeGroup(self.GROUP_NAME);
        c1 = self.makeCurves(self.CURVES_1_NAME);              // selection becomes its mask
        c1.move(group, ElementPlacement.INSIDE);
        doc.selection.deselect();
        doc.activeLayer = c1;
        shadows = self.makeMaskedFill(doc, 'shadows', self.SHADOWS_NAME, self.SHADOWS_COLOR, BlendMode.MULTIPLY, self.SHADOWS_OPACITY);
        shadows.grouped = true;
        doc.activeLayer = shadows;
        c2 = self.makeCurves(self.CURVES_2_NAME);
        doc.activeLayer = c2;
        midtones = self.makeMaskedFill(doc, 'midtones', self.MIDTONES_NAME, self.MIDTONES_COLOR, BlendMode.COLORBLEND, self.MIDTONES_OPACITY);
        midtones.grouped = true;
        doc.activeLayer = group;
        self.addBlackMask();
    },

    run: function () {
        if (!app.documents.length) return '';
        var self = $._ext_BTNPFSD2, doc = app.activeDocument, dialogs = app.displayDialogs;
        if (doc.mode !== DocumentMode.RGB) {
            alert(self.RGB_ONLY_TEXT, self.RGB_ONLY_TITLE, false);
            return '';
        }
        app.displayDialogs = DialogModes.NO;
        try {
            self.source = $._ext_BTNPFSD2_MASKS.createSource(doc);
            doc.suspendHistory(self.HISTORY_NAME, '$._ext_BTNPFSD2.build()');
        } finally {
            $._ext_BTNPFSD2_MASKS.closeSource(self.source);
            self.source = null;
            app.activeDocument = doc;
            app.displayDialogs = dialogs;
        }
        return '';
    }
};
