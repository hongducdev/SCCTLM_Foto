/*
 * LS layer helpers - everything that touches pixels for the local smoother (jsx/local-smoother.jsx).
 * Look: the source is split into a fine-detail band and larger-scale tone. Tone variation between the detail
 * radius and the smoothing radius is removed, fine detail is kept. Built from a stamped copy of the source:
 *   result = source - Gaussian(detail radius) + Gaussian(smoothing radius * SMOOTH_SCALE), then masked by the selection
 * and scaled by the strength (the difference layer is blended Linear Light at strength % opacity). The difference is
 * weighted down next to strong fine detail (thin lines, hard edges) so those stay as they are.
 */
$._ext_LS_LAYERS = {
    // ---- TUNABLE SETTINGS ---------------------------------------------------------------------------------
    SMOOTH_SCALE: 1.0,       // effective Gaussian radius = smoothing radius * this (tuned on the stripe response table)
    CONTRAST_BLUR: 1.5,      // px: scale at which "fine detail" is measured
    NEAR_GROW: 2,            // px: protected zone around strong fine detail (thin lines, hard edges)
    NEAR_SOFTEN: 1,
    CONTRAST_LOW: 25,        // fine contrast below this: smoothed normally
    CONTRAST_HIGH: 60,       // fine contrast above this: left untouched
    NEUTRAL: 128,            // gray level meaning "no change" in the difference layer
    LIFT: 1,                 // gray level added to the difference layer to cancel the 8-bit rounding shift
    MASK_GROW: 0,            // px the selection is grown before feathering (0 = none)
    MASK_FEATHER: 30,        // px feather of the selection mask (soft edge, tuned on the baseline sample grid)
    // ------------------------------------------------------------------------------------------------------

    c: function (code) { return charIDToTypeID(code); },
    s: function (name) { return stringIDToTypeID(name); },

    // true when the selection exists and does not cover the whole canvas
    hasPartialSelection: function (doc) {
        try {
            var b = doc.selection.bounds;
            var w = doc.width.as('px'), h = doc.height.as('px');
            return !(b[0].as('px') <= 0 && b[1].as('px') <= 0 && b[2].as('px') >= w && b[3].as('px') >= h);
        } catch (e) {
            return false;
        }
    },

    // Layers are matched by id, not by name: renaming the Background layer would turn it into a normal layer
    contains: function (container, id) {
        for (var i = 0; i < container.layers.length; i += 1) {
            var l = container.layers[i];
            if (l.id === id) return true;
            if (l.typename === 'LayerSet' && this.contains(l, id)) return true;
        }
        return false;
    },

    // Hides every visible layer stacked above the layer with this id; returns what was hidden
    hideAbove: function (container, id, hidden) {
        for (var i = 0; i < container.layers.length; i += 1) {
            var l = container.layers[i];
            if (l.id === id) return true;
            if (l.typename === 'LayerSet' && this.contains(l, id)) { this.hideAbove(l, id, hidden); return true; }
            if (l.visible) { l.visible = false; hidden.push(l); }
        }
        return false;
    },

    // Fallback when Merge Visible cannot add a layer: flatten a scratch copy of the document instead (hidden layers drop out).
    // The copy lands at the top of `doc`, so it is read back from there rather than from doc.activeLayer.
    stampViaCopy: function (doc) {
        var scratch = doc.duplicate('dr7-ls-scratch', false);
        try {
            if (scratch.layers.length > 1) scratch.flatten();
            scratch.layers[0].duplicate(doc, ElementPlacement.PLACEATBEGINNING);
        } finally { scratch.close(SaveOptions.DONOTSAVECHANGES); }
        app.activeDocument = doc;
        return doc.layers[0];
    },

    // Flattened copy of the active layer and everything below it, placed right above the active layer
    stampBelow: function (doc, name) {
        var target = doc.activeLayer, hidden = [], stamp, i;
        doc.activeChannels = doc.componentChannels;
        var desc = new ActionDescriptor();
        desc.putBoolean(this.c('Dplc'), true);
        try {
            this.hideAbove(doc, target.id, hidden);
            // Merge Visible throws with a single layer, and stamps INTO an empty active layer instead of adding one
            if (this.isEmpty(target)) {
                stamp = this.stampViaCopy(doc);
            } else {
                try {
                    executeAction(this.c('MrgV'), desc, DialogModes.NO);
                    stamp = doc.activeLayer;
                } catch (e2) { stamp = this.stampViaCopy(doc); }
            }
        } finally { for (i = 0; i < hidden.length; i += 1) hidden[i].visible = true; }
        stamp.name = name;
        // Moving a layer onto the spot it already holds fails with "Internal error" inside a group
        if (!this.isRightAbove(stamp, target)) stamp.move(target, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = stamp;
        return stamp;
    },

    isEmpty: function (layer) {
        var b = layer.bounds;
        return b[2].as('px') <= b[0].as('px') || b[3].as('px') <= b[1].as('px');
    },

    isRightAbove: function (layer, below) {
        var siblings = below.parent.layers;
        for (var i = 1; i < siblings.length; i += 1) {
            if (siblings[i].id === below.id) return siblings[i - 1].id === layer.id;
        }
        return false;
    },

    // Gray layer: white where the picture is calm, black near strong fine detail. Fine contrast = |picture - slightly
    // blurred picture|, spread a little, then mapped by levels (below CONTRAST_LOW: white, above CONTRAST_HIGH: black).
    contrastWeight: function (doc, base) {
        var sharp = base.duplicate(), soft = base.duplicate();
        sharp.move(soft, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = soft;
        soft.applyGaussianBlur(this.CONTRAST_BLUR);
        sharp.blendMode = BlendMode.DIFFERENCE;
        var diff = sharp.merge();
        doc.activeLayer = diff;
        diff.desaturate();
        diff.applyMaximum(this.NEAR_GROW);
        diff.applyGaussianBlur(this.NEAR_SOFTEN);
        diff.adjustLevels(this.CONTRAST_LOW, this.CONTRAST_HIGH, 1, 0, 255);
        diff.invert();
        return diff;
    },

    // delta * w + neutral * (1 - w) with Multiply/Add (no layer mask needed); consumes the weight layer
    weighted: function (doc, delta, weight) {
        var scaled = weight.duplicate();
        scaled.move(delta, ElementPlacement.PLACEBEFORE);
        scaled.blendMode = BlendMode.MULTIPLY;
        var top = scaled.merge();
        var neutral = doc.artLayers.add();
        neutral.move(weight, ElementPlacement.PLACEAFTER);
        doc.activeLayer = neutral;
        var gray = new SolidColor();
        gray.rgb.red = gray.rgb.green = gray.rgb.blue = this.NEUTRAL;
        doc.selection.selectAll();
        doc.selection.fill(gray);
        doc.selection.deselect();
        weight.invert();
        weight.blendMode = BlendMode.MULTIPLY;
        var rest = weight.merge();
        rest.blendMode = BlendMode.LINEARDODGE;
        rest.move(top, ElementPlacement.PLACEBEFORE);
        return rest.merge();
    },

    // Returns a layer that, blended Linear Light over 'base', adds (Gaussian(smooth) - Gaussian(detail)) to it.
    // Build: inverted Gaussian(detail) at 50 % over Gaussian(smooth) gives 127.5 + difference / 2, and Linear Light
    // turns that into base + difference. No intermediate value is clipped, so bright and dark detail both survive.
    smooth: function (doc, base, detail, smooth) {
        var fine = base.duplicate(), wide = base.duplicate();
        fine.move(wide, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = wide;
        wide.applyGaussianBlur(Math.min(1000, smooth * this.SMOOTH_SCALE));
        doc.activeLayer = fine;
        fine.applyGaussianBlur(detail);
        fine.invert();
        fine.opacity = 50;
        var delta = fine.merge();
        // Photoshop's 8-bit rounding in the two steps above shifts the result down by LIFT levels; add it back
        var lift = doc.artLayers.add();
        lift.move(delta, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = lift;
        var level = new SolidColor();
        level.rgb.red = level.rgb.green = level.rgb.blue = this.LIFT;
        doc.selection.selectAll();
        doc.selection.fill(level);
        doc.selection.deselect();
        lift.blendMode = BlendMode.LINEARDODGE;
        delta = lift.merge();
        delta = this.weighted(doc, delta, this.contrastWeight(doc, base));
        delta.blendMode = BlendMode.LINEARLIGHT;
        return delta;
    },

    // Reveal-selection mask on the active layer
    maskFromSelection: function () {
        var desc = new ActionDescriptor(), at = new ActionReference();
        desc.putClass(this.c('Nw  '), this.c('Chnl'));
        at.putEnumerated(this.c('Chnl'), this.c('Chnl'), this.c('Msk '));
        desc.putReference(this.c('At  '), at);
        desc.putEnumerated(this.c('Usng'), this.c('UsrM'), this.c('RvlS'));
        executeAction(this.c('Mk  '), desc, DialogModes.NO);
    },

    // Selection -> temporary channel (filters must not be limited by it); returns the channel
    saveSelection: function (doc) {
        var ch = doc.channels.add();
        ch.name = '__dr7_ls_selection__';
        doc.selection.store(ch);
        doc.activeChannels = doc.componentChannels;
        return ch;
    },

    // Softened selection restored from the channel (grown, then feathered)
    loadSoftSelection: function (doc, ch) {
        doc.selection.load(ch);
        if (this.MASK_GROW > 0) { doc.selection.expand(this.MASK_GROW); }
        doc.selection.feather(this.MASK_FEATHER);
    }
};
