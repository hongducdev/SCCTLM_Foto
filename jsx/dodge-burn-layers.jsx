/*
 * DB layer helpers - Action Manager wrappers used by jsx/dodge-burn.jsx (Curves / Hue-Saturation / solid fill /
 * groups / masks / brush options). All calls happen at run time, so load order does not matter.
 */
$._ext_DB_LAYERS = {
    c: function (code) { return charIDToTypeID(code); },
    s: function (name) { return stringIDToTypeID(name); },

    makeAdjustment: function (typeCode, settings) {
        // a previous layer's mask may still be the target channel, which makes the new settings invalid
        app.activeDocument.activeChannels = app.activeDocument.componentChannels;
        var ref = new ActionReference();
        ref.putClass(this.s('adjustmentLayer'));
        var inner = new ActionDescriptor();
        inner.putObject(this.c('Type'), this.c(typeCode), settings);
        var desc = new ActionDescriptor();
        desc.putReference(this.c('null'), ref);
        desc.putObject(this.c('Usng'), this.s('adjustmentLayer'), inner);
        executeAction(this.c('Mk  '), desc, DialogModes.NO);
        return app.activeDocument.activeLayer;
    },

    // points: [[input, output], ...] applied to the composite RGB curve (same response in R, G and B)
    makeCurves: function (name, points) {
        var list = new ActionList(), i;
        for (i = 0; i < points.length; i += 1) {
            var p = new ActionDescriptor();
            p.putDouble(this.c('Hrzn'), points[i][0]);
            p.putDouble(this.c('Vrtc'), points[i][1]);
            list.putObject(this.c('Pnt '), p);
        }
        var chRef = new ActionReference();
        chRef.putEnumerated(this.c('Chnl'), this.c('Chnl'), this.c('Cmps'));
        var channel = new ActionDescriptor();
        channel.putReference(this.c('Chnl'), chRef);
        channel.putList(this.c('Crv '), list);
        var adjs = new ActionList();
        adjs.putObject(this.c('CrvA'), channel);
        var settings = new ActionDescriptor();
        settings.putList(this.c('Adjs'), adjs);
        var layer = this.makeAdjustment('Crvs', settings);
        layer.name = name;
        return layer;
    },

    // Hue/Saturation with the given master values (all zero = neutral)
    makeHueSat: function (name, master) {
        var entry = new ActionDescriptor();
        entry.putInteger(this.c('H   '), master.hue);
        entry.putInteger(this.c('Strt'), master.sat);
        entry.putInteger(this.c('Lght'), master.light);
        var list = new ActionList();
        list.putObject(this.c('Hst2'), entry);
        var settings = new ActionDescriptor();
        settings.putBoolean(this.c('Clrz'), false);
        settings.putList(this.c('Adjs'), list);
        var layer = this.makeAdjustment('HStr', settings);
        layer.name = name;
        return layer;
    },

    // Solid colour fill layer (mask follows the current selection, as Photoshop does)
    makeSolidFill: function (name, grey) {
        var color = new ActionDescriptor();
        color.putDouble(this.c('Rd  '), grey);
        color.putDouble(this.c('Grn '), grey);
        color.putDouble(this.c('Bl  '), grey);
        var fill = new ActionDescriptor();
        fill.putObject(this.c('Clr '), this.c('RGBC'), color);
        var ref = new ActionReference();
        ref.putClass(this.s('contentLayer'));
        var inner = new ActionDescriptor();
        inner.putObject(this.c('Type'), this.s('solidColorLayer'), fill);
        var desc = new ActionDescriptor();
        desc.putReference(this.c('null'), ref);
        desc.putObject(this.c('Usng'), this.s('contentLayer'), inner);
        executeAction(this.c('Mk  '), desc, DialogModes.NO);
        var layer = app.activeDocument.activeLayer;
        layer.name = name;
        return layer;
    },

    makeGroup: function (name) {
        var ref = new ActionReference();
        ref.putClass(this.s('layerSection'));
        var desc = new ActionDescriptor();
        desc.putReference(this.c('null'), ref);
        executeAction(this.c('Mk  '), desc, DialogModes.NO);
        var group = app.activeDocument.activeLayer;
        group.name = name;
        return group;
    },

    hasMask: function () {
        try {
            var ref = new ActionReference();
            ref.putProperty(this.c('Prpr'), this.s('hasUserMask'));
            ref.putEnumerated(this.c('Lyr '), this.c('Ordn'), this.c('Trgt'));
            return executeActionGet(ref).getBoolean(this.s('hasUserMask'));
        } catch (e) {
            return false;
        }
    },

    selectMaskChannel: function () {
        var ref = new ActionReference();
        ref.putEnumerated(this.c('Chnl'), this.c('Chnl'), this.c('Msk '));
        var desc = new ActionDescriptor();
        desc.putReference(this.c('null'), ref);
        desc.putBoolean(this.c('MkVs'), false);
        executeAction(this.c('slct'), desc, DialogModes.NO);
    },

    // Active layer gets a fully black (hiding) or fully white mask; an existing mask is inverted when black is
    // wanted (a new adjustment layer starts with a white one). Leaves the mask channel targeted.
    setMask: function (black) {
        if (!this.hasMask()) {
            var desc = new ActionDescriptor();
            desc.putClass(this.c('Nw  '), this.c('Chnl'));
            var at = new ActionReference();
            at.putEnumerated(this.c('Chnl'), this.c('Chnl'), this.c('Msk '));
            desc.putReference(this.c('At  '), at);
            desc.putEnumerated(this.c('Usng'), this.c('UsrM'), this.c(black ? 'HdAl' : 'RvlA'));
            executeAction(this.c('Mk  '), desc, DialogModes.NO);
            return;
        }
        this.selectMaskChannel();
        if (black) executeAction(this.c('Invr'), new ActionDescriptor(), DialogModes.NO);
    },

    // Brush tool options through the helpers of jsx/brush-pen-pressure.jsx
    applyBrush: function (v) {
        var bpp = $._ext_BPP, options = bpp.readToolOptions(), key = this.s('brush');
        if (!options.hasKey(key)) return;
        var brush = options.getObjectValue(key);
        brush.putUnitDouble(this.s('diameter'), this.c('#Pxl'), v.diameter);
        brush.putUnitDouble(this.s('hardness'), this.c('#Prc'), v.hardness);
        brush.putUnitDouble(this.s('spacing'), this.c('#Prc'), v.spacing);
        options.putObject(key, options.getObjectType(key), brush);
        options.putInteger(this.s('opacity'), v.opacity);
        options.putInteger(this.s('flow'), v.flow);
        bpp.writeToolOptions(options);
    }
};
