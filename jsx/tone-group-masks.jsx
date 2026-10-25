/*
 * Brightness masks for the "M\u00E0u t\u1ED5ng" command (see tone-group.jsx).
 * Technique: a throw-away flattened copy of the document is turned into a grey picture of the brightness
 *   Y = 255 * sqrt(a*R^2 + b*G^2 + c*B^2)
 * using only Photoshop operations: Multiply of the picture with itself (gives R^2,G^2,B^2), a monochrome Channel Mixer
 * (weighted sum), then Levels gamma 2.0 (square root). A second copy goes through a Curves table to give the
 * shadows mask. To use a mask, its grey picture is pasted into a temporary alpha channel of the real document,
 * loaded as a selection, and the fill layer is made while that selection is active (so Photoshop bakes the grey
 * values into the layer's pixel mask). Later image edits therefore never change the masks.
 */
$._ext_BTNPFSD2_MASKS = {
    // ---- TUNABLE SETTINGS -----------------------------------------------------------------------------------
    // Brightness weights for R^2, G^2, B^2, in percent (they add up to 100)
    Y_WEIGHTS: { red: 24.5, green: 69.3, blue: 6.2 },
    ROOT_GAMMA: 2.0,                 // Levels midtone value that takes the square root
    // Shadows mask: [brightness, mask value] points of the Curves applied to the brightness picture (at most 16)
    SHADOW_POINTS: [[0, 255], [16, 246], [32, 238], [48, 229], [64, 219], [80, 208], [96, 196], [112, 183],
        [128, 169], [144, 154], [160, 137], [176, 121], [192, 101], [216, 69], [240, 29], [255, 0]],
    // ---------------------------------------------------------------------------------------------------------

    cid: function (id) { return charIDToTypeID(id); },

    run: function (event, desc) { executeAction(charIDToTypeID(event), desc, DialogModes.NO); },

    compositeRef: function () {
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Cmps'));
        return ref;
    },

    // Adjusts the active pixel layer: Channel Mixer in monochrome mode with the brightness weights
    mixToGrey: function () {
        var w = this.Y_WEIGHTS, grey = new ActionDescriptor(), desc = new ActionDescriptor();
        grey.putDouble(this.cid('Rd  '), w.red);
        grey.putDouble(this.cid('Grn '), w.green);
        grey.putDouble(this.cid('Bl  '), w.blue);
        grey.putDouble(this.cid('Cnst'), 0);
        desc.putBoolean(this.cid('Mnch'), true);
        desc.putObject(this.cid('Gry '), this.cid('SmmC'), grey);
        this.run('ChnM', desc);
    },

    // Levels with only the midtone (gamma) changed
    applyGamma: function (gamma) {
        var level = new ActionDescriptor(), list = new ActionList(), desc = new ActionDescriptor();
        level.putReference(this.cid('Chnl'), this.compositeRef());
        level.putDouble(this.cid('Gmm '), gamma);
        list.putObject(this.cid('LvlA'), level);
        desc.putList(this.cid('Adjs'), list);
        this.run('Lvls', desc);
    },

    applyCurve: function (pairs) {
        var points = new ActionList(), channel = new ActionDescriptor(), list = new ActionList(), desc = new ActionDescriptor(), i;
        for (i = 0; i < pairs.length; i += 1) {
            var point = new ActionDescriptor();
            point.putDouble(this.cid('Hrzn'), pairs[i][0]);
            point.putDouble(this.cid('Vrtc'), pairs[i][1]);
            points.putObject(this.cid('Pnt '), point);
        }
        channel.putReference(this.cid('Chnl'), this.compositeRef());
        channel.putList(this.cid('Crv '), points);
        list.putObject(this.cid('CrvA'), channel);
        desc.putList(this.cid('Adjs'), list);
        this.run('Crvs', desc);
    },

    // Squares the picture of the active layer by multiplying a copy of it into itself
    squareActiveLayer: function (tmp) {
        var base = tmp.activeLayer, copy = base.duplicate();
        copy.blendMode = BlendMode.MULTIPLY;
        tmp.activeLayer = copy;
        copy.merge();
        return tmp.activeLayer;
    },

    // Makes the working copy of `doc` and returns { doc, midtones, shadows } (layers holding the two grey pictures).
    // The caller's active document is restored, and on failure the working copy is closed before the error is rethrown.
    createSource: function (doc) {
        var tmp = doc.duplicate('luma-work', true), midtones, shadows;
        try {
            tmp.selection.deselect();
            if (tmp.layers.length > 1) { tmp.flatten(); }
            if (tmp.bitsPerChannel !== BitsPerChannelType.SIXTEEN) { tmp.bitsPerChannel = BitsPerChannelType.SIXTEEN; }
            app.activeDocument = tmp;
            tmp.activeLayer = tmp.layers[tmp.layers.length - 1];
            this.squareActiveLayer(tmp);
            this.mixToGrey();
            this.applyGamma(this.ROOT_GAMMA);
            tmp.bitsPerChannel = BitsPerChannelType.EIGHT;
            midtones = tmp.activeLayer;
            shadows = midtones.duplicate();
            tmp.activeLayer = shadows;
            this.applyCurve(this.SHADOW_POINTS);
        } catch (error) {
            this.closeSource({ doc: tmp });
            app.activeDocument = doc;
            throw error;
        }
        app.activeDocument = doc;
        return { doc: tmp, midtones: midtones, shadows: shadows };
    },

    closeSource: function (source) {
        if (!source) { return; }
        source.doc.close(SaveOptions.DONOTSAVECHANGES);
    },

    // Makes the selection of `doc` equal to the grey picture `which` ('midtones' | 'shadows') of the source
    selectMask: function (doc, source, which) {
        var layer = source[which], channel;
        app.activeDocument = source.doc;
        source.doc.activeLayer = layer;
        source.doc.selection.selectAll();
        source.doc.selection.copy();
        source.doc.selection.deselect();
        app.activeDocument = doc;
        doc.selection.deselect();
        channel = doc.channels.add();
        doc.activeChannels = [channel];
        doc.paste();
        doc.selection.deselect();
        doc.selection.load(channel, SelectionType.REPLACE, false);
        doc.activeChannels = doc.componentChannels;
        channel.remove();
    }
};
