/*
 * WT - teeth whitening ("Tr\u1EAFng R\u0103ng"). Panel calls $._ext_WT.run().
 * Builds group "L\u00E0m tr\u1EAFng r\u0103ng" (black group mask) holding Curves + Hue/Saturation, as ONE History step,
 * then shows the how-to dialog (jsx/white-teeth-dialog.jsx). RGB documents only; any other mode does nothing.
 */
$._ext_WT = {
    // ---- TUNABLE SETTINGS (everything that shapes the look lives here) --------------------------------------
    GROUP_NAME: 'L\u00E0m tr\u1EAFng r\u0103ng',
    CURVES_NAME: 'T\u0103ng \u0111\u1ED9 b\u00F3ng',
    HUESAT_NAME: 'Whiten Teeth',
    HISTORY_NAME: 'DR7 Whiten Teeth',
    CURVES_OPACITY: 50,
    // Curves: [input, output] on the composite RGB channel, measured at layer opacity 100
    CURVES_POINTS: [[0, 0], [32, 32], [64, 66], [96, 103], [128, 142], [160, 178], [192, 208], [224, 230], [255, 255]],
    // Hue/Saturation: master, then colour ranges. range = [index, beginFalloff, beginFull, endFull, endFalloff]
    // (degrees, Photoshop's default range for that colour). Yellows -100 gives grey between 45 and 75 degrees.
    HUESAT_MASTER: { hue: 0, sat: -20, light: 0 },
    HUESAT_RANGES: [
        { range: [2, 315, 345, 15, 45], hue: 0, sat: 10, light: 0 },      // reds
        { range: [3, 15, 45, 75, 105], hue: 0, sat: -100, light: 0 },    // yellows (the teeth)
        { range: [4, 75, 105, 135, 165], hue: 0, sat: 20, light: 0 },    // greens: cancels the master drop
        { range: [7, 255, 285, 315, 345], hue: 0, sat: 10, light: 0 }     // magentas
    ],
    BRUSH: { diameter: 100, hardness: 0, opacity: 100, flow: 15 },
    // ----------------------------------------------------------------------------------------------------------

    id: function (name) { return stringIDToTypeID(name); },

    channelRef: function (kind) {
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID(kind));
        return ref;
    },

    makeAdjustmentLayer: function (typeCharId, settings) {
        var layerRef = new ActionReference();
        layerRef.putClass(this.id('adjustmentLayer'));
        var inner = new ActionDescriptor();
        inner.putObject(charIDToTypeID('Type'), charIDToTypeID(typeCharId), settings);
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), layerRef);
        desc.putObject(charIDToTypeID('Usng'), this.id('adjustmentLayer'), inner);
        executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
        return app.activeDocument.activeLayer;
    },

    curvesSettings: function () {
        var points = new ActionList(), i;
        for (i = 0; i < this.CURVES_POINTS.length; i += 1) {
            var point = new ActionDescriptor();
            point.putDouble(charIDToTypeID('Hrzn'), this.CURVES_POINTS[i][0]);
            point.putDouble(charIDToTypeID('Vrtc'), this.CURVES_POINTS[i][1]);
            points.putObject(charIDToTypeID('Pnt '), point);
        }
        var channel = new ActionDescriptor();
        channel.putReference(charIDToTypeID('Chnl'), this.channelRef('Cmps'));
        channel.putList(charIDToTypeID('Crv '), points);
        var adjustments = new ActionList();
        adjustments.putObject(charIDToTypeID('CrvA'), channel);
        var settings = new ActionDescriptor();
        settings.putList(charIDToTypeID('Adjs'), adjustments);
        return settings;
    },

    hueSatEntry: function (values, range) {
        var entry = new ActionDescriptor();
        if (range) {
            entry.putInteger(charIDToTypeID('LclR'), range[0]);
            entry.putInteger(charIDToTypeID('BgnR'), range[1]);
            entry.putInteger(charIDToTypeID('BgnS'), range[2]);
            entry.putInteger(charIDToTypeID('EndS'), range[3]);
            entry.putInteger(charIDToTypeID('EndR'), range[4]);
        }
        entry.putInteger(charIDToTypeID('H   '), values.hue);
        entry.putInteger(charIDToTypeID('Strt'), values.sat);
        entry.putInteger(charIDToTypeID('Lght'), values.light);
        return entry;
    },

    hueSatSettings: function () {
        var list = new ActionList(), i;
        list.putObject(charIDToTypeID('Hst2'), this.hueSatEntry(this.HUESAT_MASTER, null));
        for (i = 0; i < this.HUESAT_RANGES.length; i += 1) {
            list.putObject(charIDToTypeID('Hst2'), this.hueSatEntry(this.HUESAT_RANGES[i], this.HUESAT_RANGES[i].range));
        }
        var settings = new ActionDescriptor();
        settings.putBoolean(charIDToTypeID('Clrz'), false);
        settings.putList(charIDToTypeID('Adjs'), list);
        return settings;
    },

    makeGroup: function (name) {
        var ref = new ActionReference();
        ref.putClass(this.id('layerSection'));
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
        var group = app.activeDocument.activeLayer;
        group.name = name;
        return group;
    },

    // Layer mask that hides everything, on the active layer; the mask becomes the target channel
    addBlackMask: function () {
        var desc = new ActionDescriptor();
        desc.putClass(charIDToTypeID('Nw  '), charIDToTypeID('Chnl'));
        var at = new ActionReference();
        at.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk '));
        desc.putReference(charIDToTypeID('At  '), at);
        desc.putEnumerated(charIDToTypeID('Usng'), charIDToTypeID('UsrM'), charIDToTypeID('HdAl'));
        executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
    },

    // Runs in the global scope (suspendHistory), so it reads everything through $._ext_WT
    build: function () {
        var self = $._ext_WT, doc = app.activeDocument;
        var group = self.makeGroup(self.GROUP_NAME);
        // Hue/Sat first: it takes its mask from the selection, which is dropped before the Curves layer is made
        var hueSat = self.makeAdjustmentLayer('HStr', self.hueSatSettings());
        hueSat.name = self.HUESAT_NAME;
        hueSat.move(group, ElementPlacement.INSIDE);
        doc.selection.deselect();
        var curves = self.makeAdjustmentLayer('Crvs', self.curvesSettings());
        curves.name = self.CURVES_NAME;
        curves.opacity = self.CURVES_OPACITY;
        curves.move(group, ElementPlacement.INSIDE);
        doc.activeLayer = group;
        self.addBlackMask();
        app.currentTool = 'paintbrushTool';
        $._ext_WT_DIALOG.show();
    },

    run: function () {
        if (!app.documents.length || app.activeDocument.mode !== DocumentMode.RGB) return '';
        app.activeDocument.suspendHistory($._ext_WT.HISTORY_NAME, '$._ext_WT.build()');
        return '';
    }
};
