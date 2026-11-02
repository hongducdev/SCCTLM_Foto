// MHK-authored effects (replacements for DR6 actions that are not available).
// Only commands that still have a button on the panel:
//   CGYSB (Glow), MLXG (Grain), mcwl (Coarse), sfb (Dots), PP_DETAIL (Detail)
(function () {
    var C = charIDToTypeID, S = stringIDToTypeID;
    function document() {
        if (!app.documents.length) throw new Error('Open an image first');
        var doc = app.activeDocument;
        if (doc.mode !== DocumentMode.RGB || doc.bitsPerChannel === BitsPerChannelType.THIRTYTWO) {
            throw new Error('MHK effects require RGB 8-bit or 16-bit');
        }
        return doc;
    }
    function patterns() {
        var file = new File($.scctlmFotoBase + '/jsx/pj/mhk-patterns.pat');
        if (!file.exists) throw new Error('Missing mhk-patterns.pat');
        var stamp = String(file.modified) + ':' + file.length;
        var ref = new ActionReference();
        ref.putProperty(C('Prpr'),S('presetManager')); ref.putEnumerated(C('capp'),C('Ordn'),C('Trgt'));
        var list = executeActionGet(ref).getList(S('presetManager')), count = 0;
        var wanted = ['Grain','Coarse','Dots'];
        for (var i = 0; i < list.count; i++) if (list.getObjectType(i) === C('PttR')) {
            var names = list.getObjectValue(i).getList(S('name'));
            for (var w = 0; w < wanted.length; w++) for (var j = 0; j < names.count; j++) {
                if (names.getString(j) === 'MHK '+wanted[w]+' v1') { count++; break; }
            }
        }
        if (count !== wanted.length || $.mhkPatternStamp !== stamp) app.load(file);
        $.mhkPatternStamp = stamp;
    }
    function texture(name, opacity) {
        var doc = document(); patterns();
        var layer = doc.artLayers.add(); layer.name = 'MHK Texture - '+name;
        try {
            var fill = new ActionDescriptor(), pattern = new ActionDescriptor();
            fill.putEnumerated(C('Usng'),C('FlCn'),C('Ptrn'));
            var ids = { Grain:0, Coarse:2, Dots:4 };
            pattern.putString(C('Nm  '),'MHK '+name+' v1');
            pattern.putString(C('Idnt'),'7153d9a1-6e46-4cbc-a782-00000000000'+ids[name]);
            fill.putObject(C('Ptrn'),C('Ptrn'),pattern);
            fill.putUnitDouble(C('Opct'),C('#Prc'),100); fill.putEnumerated(C('Md  '),C('BlnM'),C('Nrml'));
            executeAction(C('Fl  '),fill,DialogModes.NO);
            layer.blendMode = BlendMode.SOFTLIGHT; layer.opacity = opacity;
        } catch (error) { layer.remove(); throw error; }
    }
    function stamp(name) {
        var doc = document(), empty = doc.artLayers.add(), emptyId = empty.id;
        try {
            var desc = new ActionDescriptor(); desc.putBoolean(C('Dplc'),true);
            executeAction(C('MrgV'),desc,DialogModes.NO);
            var layer = doc.activeLayer;
            // Photoshop may reuse the temporary layer for the merged result;
            // DOM wrappers are not stable identities, compare persistent layer IDs.
            for (var i = doc.artLayers.length-1; i >= 0; i--) {
                if (doc.artLayers[i].id === emptyId && layer.id !== emptyId) doc.artLayers[i].remove();
            }
            layer.name = 'MHK - '+name;
            return layer;
        } catch (error) {
            for (var i = doc.artLayers.length-1; i >= 0; i--) if (doc.artLayers[i].id === emptyId) doc.artLayers[i].remove();
            throw error;
        }
    }
    function effect(name, kind) {
        var layer = stamp(name);
        try {
            if (kind === 'glow') { layer.applyGaussianBlur(8); layer.blendMode = BlendMode.SCREEN; layer.opacity = 25; }
            if (kind === 'detail') { layer.applyHighPass(2); layer.blendMode = BlendMode.OVERLAY; layer.opacity = 40; }
        } catch (error) { layer.remove(); throw error; }
    }
    $.mhkReplacements = {
        CGYSB: function () { effect('Glow','glow'); },
        MLXG: function () { texture('Grain',30); },
        mcwl: function () { texture('Coarse',35); },
        sfb: function () { texture('Dots',30); }
    };
    $._ext_PP_DETAIL = { run: function () { effect('Detail','detail'); } };
}());
