// DR7: Apply one or more bundled colour presets (presets/colors/<group>/NNN.xmp), one layer each.
// Every preset is rendered from the original picture (earlier colour layers are hidden while the
// next one is stamped), so lowering the opacity of the layers blends the looks into a new colour.
(function () {
    var ENTRY = /^([a-z]+\/\d{3}):(\d{1,3})$/;
    var MAX_ITEMS = 4;

    // "fuji/001:60,dazz/003:40" -> [{id, opacity}]; anything else is rejected so the
    // panel can never make this command read outside presets/colors.
    function parse(spec) {
        var parts = String(spec).split(','), items = [];
        if (parts.length < 1 || parts.length > MAX_ITEMS) throw new Error('Invalid colour list: ' + spec);
        for (var i = 0; i < parts.length; i++) {
            var m = ENTRY.exec(parts[i]);
            if (!m || Number(m[2]) > 100) throw new Error('Invalid colour entry: ' + parts[i]);
            items.push({ id: m[1], opacity: Number(m[2]) });
        }
        return items;
    }

    function removeAll(layers) {
        for (var i = layers.length - 1; i >= 0; i--) {
            try { layers[i].remove(); } catch (e) { $.writeln('DR7: colour layer cleanup failed: ' + e); }
        }
    }

    // Camera Raw ignores the Look table inside a preset, so the build step also writes it as an
    // ICC device-link profile (presets/colors/<group>/NNN.icc) that a Color Lookup layer accepts.
    var ACR_SETTINGS = /crs:(Exposure2012|Contrast2012|Highlights2012|Shadows2012|Whites2012|Blacks2012|Clarity2012|Vibrance|Saturation|Temperature|Tint|ToneCurvePV2012|HueAdjustment|SaturationAdjustment|LuminanceAdjustment|SplitToning|ColorGrade)/;

    function needsAcr(xmp) {
        xmp.encoding = 'UTF-8';
        if (!xmp.open('r')) throw new Error('Cannot open file: ' + xmp.fsName);
        try { return ACR_SETTINGS.test(xmp.read()); } finally { xmp.close(); }
    }

    // Colour Lookup adjustment clipped to the Smart Object below it. It stays a live adjustment layer
    // (no merge), so the stamped pixels keep their transparency and the look can be tuned later.
    function addLookTable(icc) {
        var S = stringIDToTypeID, doc = app.activeDocument;
        icc.encoding = 'BINARY';
        if (!icc.open('r')) throw new Error('Cannot open file: ' + icc.fsName);
        var data;
        try { data = icc.read(); } finally { icc.close(); }
        var before = doc.layers.length;
        var ref = new ActionReference();
        ref.putClass(S('adjustmentLayer'));
        var lookup = new ActionDescriptor();
        lookup.putEnumerated(S('lookupType'), S('colorLookupType'), S('deviceLinkProfile'));
        lookup.putString(charIDToTypeID('Nm  '), icc.name);
        lookup.putData(S('profile'), data);
        var adjustment = new ActionDescriptor();
        adjustment.putObject(S('type'), S('colorLookup'), lookup);
        var desc = new ActionDescriptor();
        desc.putReference(S('null'), ref);
        desc.putObject(S('using'), S('adjustmentLayer'), adjustment);
        executeAction(S('make'), desc, DialogModes.NO);
        var layer = doc.activeLayer;
        if (layer.kind !== LayerKind.COLORLOOKUP) throw new Error('Colour lookup layer was not created');
        layer.grouped = true;
        return layer;
    }

    // Stamped Smart Object (+ clipped Look table) wrapped in one group named after the preset, so the
    // opacity slider and the mix work on a single unit. Returns the layer the caller names / fades.
    function applyOne(id) {
        var doc = app.activeDocument;
        var xmp = new File($.dr7Base + '/presets/colors/' + id + '.xmp');
        var icc = new File($.dr7Base + '/presets/colors/' + id + '.icc');
        if (!xmp.exists) throw new Error('Missing colour preset: ' + id);
        if (!icc.exists) { $.dr7ApplyPresetXMP(xmp, false, true); return doc.activeLayer; }
        if (needsAcr(xmp)) {
            $.dr7ApplyPresetXMP(xmp, false, true);
        } else {
            $.dr7StampVisible('Preset - ' + id);
            $.dr7ToSmartObject();
        }
        var base = doc.activeLayer;
        var group = doc.layerSets.add();
        try {
            base.move(group, ElementPlacement.INSIDE);
            doc.activeLayer = base;
            var look = addLookTable(icc);
            look.name = 'Look ' + id.replace('/', ' ');
        } catch (error) {
            try { group.remove(); } catch (eClean) { $.writeln('DR7: colour group cleanup failed: ' + eClean); }
            throw error;
        }
        doc.activeLayer = group;
        return group;
    }

    function applyColorMix(spec) {
        if (typeof $.dr7ApplyPresetXMP !== 'function' || typeof $.dr7StampVisible !== 'function' || typeof $.dr7ToSmartObject !== 'function') throw new Error('Missing command: preset engine');
        var items = parse(spec), made = [];
        try {
            for (var i = 0; i < items.length; i++) {
                for (var h = 0; h < made.length; h++) made[h].visible = false;
                var layer = applyOne(items[i].id);
                layer.name = 'Color ' + items[i].id.replace('/', ' ');
                layer.opacity = items[i].opacity;
                made.push(layer);
            }
        } catch (error) {
            removeAll(made);
            throw error;
        }
        for (var v = 0; v < made.length; v++) made[v].visible = true;
        return 'DR7_OK';
    }

    $.dr7ApplyColorMix = applyColorMix;
}());
