// DR7: Apply Camera Raw Presets (.xmp) - picked by the user or bundled in /presets
(function () {
    var C = charIDToTypeID, S = stringIDToTypeID;

    function document() {
        if (!app.documents.length) throw new Error('Open an image first');
        var doc = app.activeDocument;
        if (doc.mode !== DocumentMode.RGB || doc.bitsPerChannel === BitsPerChannelType.THIRTYTWO) {
            throw new Error('Presets require RGB 8-bit or 16-bit');
        }
        return doc;
    }

    // Error number 8007 is how the panel bridge recognises a user cancel.
    function cancelled() {
        var error = new Error('User cancelled');
        error.number = 8007;
        return error;
    }

    // Accept a File or path; otherwise ask the user. Returns [file, pickedByUser].
    function resolveFile(fileOrPath, title, filter, startFolder) {
        var file = fileOrPath instanceof File ? fileOrPath :
            (typeof fileOrPath === 'string' && fileOrPath.length > 0 ? new File(fileOrPath) : null);
        if (file && file.exists) return [file, false];
        if (startFolder && startFolder.exists) Folder.current = startFolder;
        file = File.openDialog(title, filter);
        if (!file) throw cancelled();
        if (!file.exists) throw new Error('File not found: ' + file.fsName);
        return [file, true];
    }

    function displayName(file, extPattern) {
        var name = file.name;
        try { name = decodeURI(name); } catch (eUri) { /* keep the raw name when it has a stray % */ }
        return name.replace(extPattern, '');
    }

    function readText(file) {
        file.encoding = 'UTF-8';
        if (!file.open('r')) throw new Error('Cannot open file: ' + file.fsName);
        try { return file.read(); } finally { file.close(); }
    }

    // Duplicate or Stamp Visible layer to keep original image non-destructive
    function stamp(name) {
        var doc = document(), empty = doc.artLayers.add(), emptyId = empty.id;
        try {
            var desc = new ActionDescriptor();
            desc.putBoolean(C('Dplc'), true);
            executeAction(C('MrgV'), desc, DialogModes.NO);
            var layer = doc.activeLayer;
            for (var i = doc.artLayers.length - 1; i >= 0; i--) {
                if (doc.artLayers[i].id === emptyId && layer.id !== emptyId) {
                    doc.artLayers[i].remove();
                }
            }
            layer.name = name;
            return layer;
        } catch (error) {
            for (var j = doc.artLayers.length - 1; j >= 0; j--) {
                if (doc.artLayers[j].id === emptyId) doc.artLayers[j].remove();
            }
            throw error;
        }
    }

    // Convert the active layer to a Smart Object so the filter applied next stays editable (Smart Filter)
    // and the layer keeps its transparency instead of being baked into pixels.
    function toSmartObject() {
        executeAction(S('newPlacedLayer'), new ActionDescriptor(), DialogModes.NO);
        return app.activeDocument.activeLayer;
    }

    // Keep a copy of a hand-picked preset in Camera Raw's own preset list.
    // Failure only loses that convenience, so it is logged instead of thrown.
    function installXmpToCameraRaw(file) {
        try {
            var targetFolder = new Folder(Folder.userData.fsName + '/Adobe/CameraRaw/Settings/SCCTLM_Foto Presets');
            if (!targetFolder.exists) targetFolder.create();
            if (!file.copy(new File(targetFolder.fsName + '/' + file.name))) {
                $.writeln('DR7: could not copy preset to Camera Raw: ' + file.error);
            }
        } catch (e) {
            $.writeln('DR7: could not copy preset to Camera Raw: ' + e);
        }
    }

    // Camera Raw refuses settings whose crs:Version is newer than the installed
    // build ("Unsupported Edits / edited in a newer version of Camera Raw").
    // The blob handed to the filter is a transient input, never a stored file, so
    // dropping the version claim makes ACR read the settings with its own version.
    function sanitizeAcrXmp(xml) {
        var out = String(xml).replace(/\s*crs:Version\s*=\s*"[^"]*"/g, '');
        // A raw sidecar stores white balance in Kelvin (e.g. 7250); the filter only
        // understands a relative -100..+100 shift, so drop raw-only WB values.
        var kelvin = /crs:Temperature\s*=\s*"([^"]*)"/.exec(out);
        if (kelvin && Math.abs(parseFloat(kelvin[1])) > 100) {
            out = out.replace(/\s*crs:(Temperature|Tint)\s*=\s*"[^"]*"/g, '');
        }
        if (!/crs:HasSettings\s*=/.test(out)) {
            out = out.replace(/(xmlns:crs="[^"]*")/, '$1 crs:HasSettings="True"');
        }
        return out;
    }

    // Apply Camera Raw Preset (.xmp)
    function applyPresetXMP(fileOrPath, withDialog, asSmartObject) {
        document();
        var picked = resolveFile(fileOrPath, 'Chon Preset Camera Raw (.xmp)',
            'Camera Raw Preset:*.xmp,All Files:*.*', new Folder($.dr7Base + '/presets'));
        var file = picked[0];
        var xmpPayload = readText(file);
        if (!xmpPayload) throw new Error('Preset file is empty: ' + file.fsName);
        if (picked[1]) installXmpToCameraRaw(file);

        // The version claim is dropped so a preset exported by a newer Camera
        // Raw never triggers the Unsupported Edits prompt on a local build.
        var acrPayload = sanitizeAcrXmp(xmpPayload);
        var layer = stamp('Preset - ' + displayName(file, /\.xmp$/i));
        if (asSmartObject) layer = toSmartObject();

        // XMPp ("XMPParameters" in Camera Raw's scripting dictionary) carries
        // the whole settings block, so the filter renders it without a dialog.
        function runAcr(mode) {
            var desc = new ActionDescriptor();
            desc.putString(C('CMod'), 'Filter');
            desc.putString(C('XMPp'), acrPayload);
            executeAction(S('Adobe Camera Raw Filter'), desc, mode);
        }

        try {
            runAcr(DialogModes.NO);
            return 'DR7_OK';
        } catch (errSilent) {
            if (withDialog === false) {
                try { layer.remove(); } catch (eClean) { $.writeln('DR7: preset layer cleanup failed: ' + eClean); }
                throw errSilent;
            }
            try {
                runAcr(DialogModes.ALL);
                return 'DR7_OK';
            } catch (errDialog) {
                try { layer.remove(); } catch (eRem) { $.writeln('DR7: preset layer cleanup failed: ' + eRem); }
                if (errDialog.number === 8007 || String(errDialog).toLowerCase().indexOf('cancel') !== -1) {
                    throw cancelled();
                }
                throw errSilent;
            }
        }
    }

    // Panel buttons are generated from the files in /presets (see js/panel.js);
    // the name is re-checked here so no caller can reach outside that folder.
    var BUNDLED_PRESET = /^[A-Za-z0-9 _()-]+(\.[A-Za-z0-9 _()-]+)*\.xmp$/i;
    function applyBundledXmp(fileName) {
        if (!BUNDLED_PRESET.test(String(fileName))) throw new Error('Invalid preset name: ' + fileName);
        var file = new File($.dr7Base + '/presets/' + fileName);
        if (!file.exists) throw new Error('Missing bundled preset: ' + file.fsName);
        return applyPresetXMP(file, false);
    }

    var APPLY_PRESET_XMP = applyPresetXMP;

    // loader.jsx copies these into $.dr7Commands for the panel bridge.
    $.presetLutCommands = {
        APPLY_PRESET_XMP: APPLY_PRESET_XMP
    };

    $.dr7ApplyPresetXMP = applyPresetXMP;
    $.dr7StampVisible = stamp;
    $.dr7ToSmartObject = toSmartObject;
    $.dr7ApplyBundledXmp = applyBundledXmp;
    $.dr7SanitizeAcrXmp = sanitizeAcrXmp;
}());
