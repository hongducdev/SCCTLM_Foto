/*
 * Loads an actions set (.atn) bundled in presets/ into the Actions panel in one click (the panel's
 * "Nap Action" buttons).
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

    // Quick import: pick any .atn file and load it straight into the Actions panel (skips Photoshop's Load Actions)
    $.dr7ImportAtnDialog = function () {
        var file = File.openDialog('Select an Actions file (.atn)', 'Photoshop Actions:*.atn');
        if (!file) {
            var cancel = new Error('cancel');
            cancel.number = 8007;                               // run() in js/panel.js treats 8007 as "user cancelled"
            throw cancel;
        }
        if ($.dr7ShortcutSetup.exists(actionSetName(file), null)) return 'DR7_EXISTS';
        app.load(file);
        return 'DR7_OK';
    };

    $.dr7ImportBundledAtn = function (fileName) {
        if (!BUNDLED_ATN.test(String(fileName))) throw new Error('Invalid action file name: ' + fileName);
        var file = new File($.dr7Base + '/presets/' + fileName);
        if (!file.exists) throw new Error('Missing bundled actions file: ' + file.fsName);
        if ($.dr7ShortcutSetup.exists(actionSetName(file), null)) return 'DR7_EXISTS';
        app.load(file);
        return 'DR7_OK';
    };
}());
