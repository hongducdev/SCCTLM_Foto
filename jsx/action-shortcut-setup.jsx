/*
 * Function-key shortcuts (F2-F12, optionally with Shift and/or Ctrl/Cmd) that PLAY any action.
 *
 * Scripts cannot set a key on an existing action ("Set" is not available for actions), but an
 * .atn file can carry one. Actions of a set bundled in presets/ get the key in a reloaded copy of that
 * set (jsx/action-set-import.jsx). For any other action we generate the set "SCCTLM_Foto" with one action per binding,
 * "\u25B6 <action> (<set>)", that has the key and whose only step plays the target, and load it,
 * replacing the previous "SCCTLM_Foto" set (and the legacy "MHK DR7" set of older versions) (removed when no binding is left).
 * The user's own actions are never touched.
 * .atn layout: Adobe Photoshop File Formats, "Actions file format".
 */
$.dr7ShortcutSetup = {
    SET_NAME: 'SCCTLM_Foto',
    LEGACY_SET_NAME: 'MHK DR7',                                // set name before the rename; removed on the next install
    PLAY_PREFIX: '\u25B6 ',
    KEY: /^(Ctrl\+)?(Shift\+)?F([2-9]|1[0-2])$/,

    u8: function (n) { return String.fromCharCode(n & 255); },
    u16: function (n) { return String.fromCharCode((n >>> 8) & 255, n & 255); },
    u32: function (n) { return String.fromCharCode((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255); },
    // Unicode string: length (including the terminator) + UTF-16BE chars + 0
    unicode: function (s) {
        var out = this.u32(s.length + 1);
        for (var i = 0; i < s.length; i += 1) out += this.u16(s.charCodeAt(i));
        return out + this.u16(0);
    },
    ascii: function (s) { return this.u32(s.length) + s; },

    // One step: expanded, enabled, dialog, dialog options, event (4-char id), display name, descriptor
    step: function (charId, displayName, desc) {
        return this.u8(0) + this.u8(1) + this.u8(0) + this.u8(0) + 'long' + charId + this.ascii(displayName) +
            this.u32(0xFFFFFFFF) + desc.toStream().substring(4);       // toStream() starts with a 4-byte version
    },

    // Play <setName> > <actionName>
    playStep: function (setName, actionName) {
        var ref = new ActionReference();
        ref.putName(charIDToTypeID('Actn'), actionName);
        ref.putName(charIDToTypeID('ASet'), setName);
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        return this.step('Ply ', 'Play', desc);
    },

    // key: null for no shortcut, otherwise a KEY match
    action: function (name, key, stepBytes) {
        var m = key ? this.KEY.exec(key) : null;
        return this.u16(m ? parseInt(m[3], 10) : 0) + this.u8(m && m[2] ? 1 : 0) + this.u8(m && m[1] ? 1 : 0) +
            this.u16(0) + this.unicode(name) + this.u8(0) + this.u32(1) + stepBytes;   // colour none, collapsed, 1 step
    },

    // Visits every action as fn(setName, actionName); stops early when fn returns true
    eachAction: function (fn) {
        for (var i = 1; ; i += 1) {
            var setRef = new ActionReference();
            setRef.putIndex(charIDToTypeID('ASet'), i);
            var set;
            try {
                set = executeActionGet(setRef);
            } catch (e) {
                return;                                         // past the last action set
            }
            var setName = set.getString(charIDToTypeID('Nm  '));
            var count = set.hasKey(stringIDToTypeID('numberOfChildren')) ? set.getInteger(stringIDToTypeID('numberOfChildren')) : 0;
            for (var j = 1; j <= count; j += 1) {
                var ref = new ActionReference();
                ref.putIndex(charIDToTypeID('Actn'), j);
                ref.putIndex(charIDToTypeID('ASet'), i);
                if (fn(setName, executeActionGet(ref).getString(charIDToTypeID('Nm  ')))) return;
            }
        }
    },

    // "set\taction\n..." for the panel's picker, without our own play wrappers
    listActions: function () {
        var self = $.dr7ShortcutSetup, out = [];
        self.eachAction(function (setName, actionName) {
            if (setName === self.SET_NAME || setName === self.LEGACY_SET_NAME) return false;   // our generated play wrappers
            out.push(setName + '\t' + actionName);
            return false;
        });
        return out.join('\n');
    },

    // true while our set still holds a play wrapper for a bundled action (made before keys went onto the bundled set)
    hasBundledWrapper: function () {
        var self = $.dr7ShortcutSetup, found = false;
        var bundled = typeof $.dr7BundledSets === 'function' ? $.dr7BundledSets() : {};
        self.eachAction(function (setName, actionName) {
            if (setName !== self.SET_NAME) return false;
            for (var name in bundled) {
                var tail = ' (' + name + ')';
                if (bundled.hasOwnProperty(name) && actionName.slice(-tail.length) === tail) found = true;
            }
            return found;
        });
        return found;
    },

    exists: function (setName, actionName) {
        var found = false;
        this.eachAction(function (s, a) {
            found = s === setName && (actionName === null || a === actionName);
            return found;
        });
        return found;
    },

    // bindings: "key\tset\taction\n..." (built by js/shortcut-key-capture.js)
    // Keys for actions of a set bundled in presets/ go straight onto that set ($.dr7InstallBundledKeys);
    // only other actions get a play wrapper.
    install: function (bindings) {
        var self = $.dr7ShortcutSetup;
        var actions = [];
        var bundled = typeof $.dr7BundledSets === 'function' ? $.dr7BundledSets() : {};
        var baked = {}, bakedCount = 0;
        var lines = String(bindings).split('\n');
        for (var i = 0; i < lines.length; i += 1) {
            var f = lines[i].split('\t');
            // Our own set is rebuilt below, so it can never be a target; missing targets are dropped
            if (f.length !== 3 || !self.KEY.test(f[0]) || f[1] === self.SET_NAME || f[1] === self.LEGACY_SET_NAME || !self.exists(f[1], f[2])) continue;
            if (bundled.hasOwnProperty(f[1])) {
                (baked[f[1]] = baked[f[1]] || {})[f[2]] = f[0];
                continue;
            }
            actions.push(self.action(self.PLAY_PREFIX + f[2] + ' (' + f[1] + ')', f[0], self.playStep(f[1], f[2])));
        }
        var stale = [self.SET_NAME, self.LEGACY_SET_NAME];
        for (var k = 0; k < stale.length; k += 1) {
            if (!self.exists(stale[k], null)) continue;
            var ref = new ActionReference();
            ref.putName(charIDToTypeID('ASet'), stale[k]);
            var desc = new ActionDescriptor();
            desc.putReference(charIDToTypeID('null'), ref);
            executeAction(charIDToTypeID('Dlt '), desc, DialogModes.NO);
        }
        // Every bundled set in Photoshop is rebuilt, so a removed key (or a key an older copy carried) goes away too
        for (var setName in bundled) {
            if (bundled.hasOwnProperty(setName) && self.exists(setName, null)) {
                bakedCount += $.dr7InstallBundledKeys(setName, bundled[setName], baked[setName] || {});
            }
        }
        if (!actions.length) return bakedCount;                   // no wrappers left: no empty set
        var atn = new File(Folder.temp + '/dr7-shortcut.atn');
        atn.encoding = 'BINARY';
        if (!atn.open('w')) throw new Error('Kh\u00F4ng ghi \u0111\u01B0\u1EE3c ' + atn.fsName);
        atn.write(self.u32(16) + self.unicode(self.SET_NAME) + self.u8(1) + self.u32(actions.length) + actions.join(''));
        atn.close();
        app.load(atn);
        atn.remove();
        return actions.length + bakedCount;                       // number of shortcuts installed
    }
};
