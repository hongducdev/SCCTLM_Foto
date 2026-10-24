/*
 * Loads an actions set (.atn) bundled in presets/ into the Actions panel the first time one of its
 * actions is needed (the "Tao ..." buttons of Brush Lab / Rim Light), then plays the action.
 *
 * The set name is read from the start of the .atn (Adobe Photoshop File Formats, "Actions file
 * format": version u32, then the set name as a Unicode string) so it is never loaded twice: when a
 * set with that name already exists, the user's copy (possibly edited) is kept and "DR7_EXISTS" is returned.
 */
(function () {
    // Bundled file names: plain characters only, so a name can never climb out of presets/
    var BUNDLED_ATN = /^[A-Za-z0-9 _()-]+(\.[A-Za-z0-9 _()-]+)*\.atn$/i;

    function byteAt(s, i) { return s.charCodeAt(i) & 255; }

    function actionSetName(file) {
        file.encoding = 'BINARY';
        if (!file.open('r')) throw new Error('Cannot open ' + file.fsName);
        try {
            var head = file.read(8);
            var count = ((byteAt(head, 4) << 24) | (byteAt(head, 5) << 16) | (byteAt(head, 6) << 8) | byteAt(head, 7)) >>> 0;
            if (head.length < 8 || count < 2 || count > 1024) throw new Error('Not an actions file: ' + file.fsName);
            var raw = file.read((count - 1) * 2);               // count includes the terminating 0
            var name = '';
            for (var i = 0; i + 1 < raw.length; i += 2) name += String.fromCharCode((byteAt(raw, i) << 8) | byteAt(raw, i + 1));
            return name;
        } finally {
            file.close();
        }
    }

    // { setName: File } for every .atn bundled in presets/ (js/create-action-buttons.js uses "Thumbnail action")
    $.dr7BundledSets = function () {
        var out = {};
        var files = new Folder($.dr7Base + '/presets').getFiles('*.atn');
        for (var i = 0; i < files.length; i += 1) {
            if (files[i] instanceof File && BUNDLED_ATN.test(files[i].name)) out[actionSetName(files[i])] = files[i];
        }
        return out;
    };

    // Replaces the bundled set in Photoshop by a copy of its .atn whose action headers carry the panel's keys, so a
    // shortcut lives on the action itself (no play wrapper in the SCCTLM_Foto set). keys: { actionName: "Ctrl+Shift+F5" },
    // actions not listed get no key. Action header: key u16, shift u8, ctrl u8, colour u16, name (u32 length incl. 0, UTF-16BE, 0).
    $.dr7InstallBundledKeys = function (setName, file, keys) {
        var setup = $.dr7ShortcutSetup;
        file.encoding = 'BINARY';
        if (!file.open('r')) throw new Error('Cannot open ' + file.fsName);
        var data = file.read();
        file.close();
        var start = 4 + setup.unicode(setName).length + 1 + 4;        // version, set name, expanded, action count
        var count = 0;
        for (var name in keys) {
            if (!keys.hasOwnProperty(name)) continue;
            var at = data.indexOf(setup.unicode(name), start);
            var m = setup.KEY.exec(keys[name]);
            if (at < 6 || !m) continue;
            var key = setup.u16(parseInt(m[3], 10)) + setup.u8(m[2] ? 1 : 0) + setup.u8(m[1] ? 1 : 0);
            data = data.substring(0, at - 6) + key + data.substring(at - 2);
            count += 1;
        }
        if (setup.exists(setName, null)) {
            var ref = new ActionReference();
            ref.putName(charIDToTypeID('ASet'), setName);
            var desc = new ActionDescriptor();
            desc.putReference(charIDToTypeID('null'), ref);
            executeAction(charIDToTypeID('Dlt '), desc, DialogModes.NO);
        }
        var copy = new File(Folder.temp + '/dr7-bundled-keys.atn');
        copy.encoding = 'BINARY';
        if (!copy.open('w')) throw new Error('Cannot write ' + copy.fsName);
        copy.write(data);
        copy.close();
        app.load(copy);
        copy.remove();
        return count;
    };

    $.dr7ImportBundledAtn = function (fileName) {
        if (!BUNDLED_ATN.test(String(fileName))) throw new Error('Invalid action file name: ' + fileName);
        var file = new File($.dr7Base + '/presets/' + fileName);
        if (!file.exists) throw new Error('Missing bundled actions file: ' + file.fsName);
        if ($.dr7ShortcutSetup.exists(actionSetName(file), null)) return 'DR7_EXISTS';
        app.load(file);
        return 'DR7_OK';
    };

    // spec "file.atn	set	action" from js/create-action-buttons.js: imports the bundled file when the
    // action is not in Photoshop yet. A set that exists without the action is left alone and reported.
    function parseSpec(spec) {
        var f = String(spec).split('	');
        if (f.length !== 3 || !f[1] || !f[2]) throw new Error('Invalid action spec: ' + spec);
        return { file: f[0], set: f[1], action: f[2] };
    }

    $.dr7EnsureBundledAction = function (spec) {
        var want = parseSpec(spec);
        if ($.dr7ShortcutSetup.exists(want.set, want.action)) return 'DR7_EXISTS';
        if ($.dr7ShortcutSetup.exists(want.set, null)) throw new Error('Set "' + want.set + '" has no action "' + want.action + '"');
        $.dr7ImportBundledAtn(want.file);
        return 'DR7_OK';
    };

    $.dr7PlayBundledAction = function (spec) {
        var want = parseSpec(spec);
        $.dr7EnsureBundledAction(spec);
        var ref = new ActionReference();
        ref.putName(charIDToTypeID('Actn'), want.action);
        ref.putName(charIDToTypeID('ASet'), want.set);
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        executeAction(charIDToTypeID('Ply '), desc, DialogModes.NO);
        return 'DR7_OK';
    };
}());
