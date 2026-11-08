/*
 * Before / After (panel button "Truoc / Sau"). Panel buttons call $._ext_BEFOREAFTER.run to hide or show the layers the panel created.
 * js/panel.js wraps every layer-creating command with before() / after(): the layers that appear during the command
 * are remembered per document, so the toggle never touches layers the user made or hid themselves.
 * State lives in $.scctlmFotoBA[documentId] for the Photoshop session: { owned: [layerId], hiddenByUs: [layerId] }.
 * The owned ids are also written into the document's XMP metadata (namespace NS), so the memory survives closing and
 * reopening the file. Whether the layers are hidden is always read from the document, never from stored state.
 */
$._ext_BEFOREAFTER = {
    HISTORY_NAME: 'SCCTLM_Foto Before/After',
    EMPTY: 'SCCTLM_BA_EMPTY',
    NS: 'http://scctlm.vn/foto/before-after/1.0/',

    c: function (code) { return charIDToTypeID(code); },
    s: function (name) { return stringIDToTypeID(name); },
    t: function (typeId) { return typeIDToStringID(typeId); },

    // The XMP scripting library, or false when Photoshop does not offer it (persistence is then skipped).
    xmpReady: function () {
        try {
            if (typeof XMPMeta === 'undefined' && ExternalObject.AdobeXMPScript === undefined) ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
            return typeof XMPMeta !== 'undefined';
        } catch (e) { return false; }
    },

    readOwned: function () {
        var self = $._ext_BEFOREAFTER, out = [], i;
        try {
            if (!self.xmpReady()) return out;
            var prop = new XMPMeta(app.activeDocument.xmpMetadata.rawData).getProperty(self.NS, 'ownedLayers');
            var parts = prop ? String(prop.value).split(',') : [];
            for (i = 0; i < parts.length; i += 1) if (/^\d+$/.test(parts[i])) out.push(parseInt(parts[i], 10));
        } catch (e) { }
        return out;
    },

    writeOwned: function (owned) {
        var self = $._ext_BEFOREAFTER;
        try {
            if (!self.xmpReady()) return;
            var doc = app.activeDocument, xmp = new XMPMeta(doc.xmpMetadata.rawData);
            XMPMeta.registerNamespace(self.NS, 'scctlmba');
            xmp.setProperty(self.NS, 'ownedLayers', owned.join(','));
            doc.xmpMetadata.rawData = xmp.serialize();
        } catch (e) { }
    },

    state: function () {
        $.scctlmFotoBA = $.scctlmFotoBA || {};
        var key = String(app.activeDocument.id);
        if (!$.scctlmFotoBA[key]) $.scctlmFotoBA[key] = { owned: $._ext_BEFOREAFTER.readOwned(), hiddenByUs: [] };
        return $.scctlmFotoBA[key];
    },

    // One property of the layer at an index (property queries are far cheaper than the full layer descriptor).
    prop: function (index, name) {
        var self = $._ext_BEFOREAFTER, ref = new ActionReference();
        ref.putProperty(self.c('Prpr'), self.s(name));
        ref.putIndex(self.c('Lyr '), index);
        return executeActionGet(ref);
    },

    // Every real layer of the active document: { ids: [id], parent: {id: parentId}, visible: {id: bool} }.
    // Walks bottom to top; a group is a "section end" marker, its children, then the group layer itself.
    // visible is only read when withVisible is true.
    snapshot: function (withVisible) {
        var self = $._ext_BEFOREAFTER, out = { ids: [], parent: {}, visible: {} };
        var countRef = new ActionReference();
        countRef.putProperty(self.c('Prpr'), self.s('numberOfLayers'));
        countRef.putEnumerated(self.c('Dcmn'), self.c('Ordn'), self.c('Trgt'));
        var count = executeActionGet(countRef).getInteger(self.s('numberOfLayers'));
        var stack = [], i;
        for (i = 0; i <= count; i += 1) {
            var section = '', id;
            try {
                var sec = self.prop(i, 'layerSection');
                if (sec.hasKey(self.s('layerSection'))) section = self.t(sec.getEnumerationValue(self.s('layerSection')));
                if (section === 'layerSectionEnd') { stack.push([]); continue; }
                id = self.prop(i, 'layerID').getInteger(self.s('layerID'));
                if (withVisible) out.visible[id] = self.prop(i, 'visible').getBoolean(self.s('visible'));
            } catch (e) { continue; }        // index 0 only exists when the document has a Background layer
            out.ids.push(id);
            if (section === 'layerSectionStart') {
                var children = stack.pop() || [], j;
                for (j = 0; j < children.length; j += 1) out.parent[children[j]] = id;
            }
            if (stack.length) stack[stack.length - 1].push(id);
        }
        return out;
    },

    has: function (list, id) {
        var i;
        for (i = 0; i < list.length; i += 1) if (list[i] === id) return true;
        return false;
    },

    setVisible: function (ids, show) {
        if (!ids.length) return;
        var self = $._ext_BEFOREAFTER, list = new ActionList(), i;
        for (i = 0; i < ids.length; i += 1) {
            var ref = new ActionReference();
            ref.putIdentifier(self.c('Lyr '), ids[i]);
            list.putReference(ref);
        }
        var desc = new ActionDescriptor();
        desc.putList(self.c('null'), list);
        executeAction(self.c(show ? 'Shw ' : 'Hd  '), desc, DialogModes.NO);
    },

    // Panel layers that exist now: the ones recorded for this document that are still in it.
    alive: function (st, now) {
        var self = $._ext_BEFOREAFTER, out = [], i;
        for (i = 0; i < st.owned.length; i += 1) if (self.has(now.ids, st.owned[i])) out.push(st.owned[i]);
        return out;
    },

    // The layers a Before hid, when the document is in the "before" state (panel layers exist and none is visible); else [].
    // Read from the document, so it also works after Undo, a reopened file, or layers the user hid themselves.
    hiddenSet: function (st, now) {
        var self = $._ext_BEFOREAFTER, alive = self.alive(st, now), mine = [], i;
        if (!alive.length) return [];
        for (i = 0; i < alive.length; i += 1) if (now.visible[alive[i]]) return [];
        for (i = 0; i < alive.length; i += 1) if (self.has(st.hiddenByUs, alive[i])) mine.push(alive[i]);
        return mine.length ? mine : alive;
    },

    // Show again what a Before left hidden. Commands that rebuild or flatten the document call this first,
    // so hidden retouch is never merged away.
    ensureShown: function () {
        var self = $._ext_BEFOREAFTER, st = self.state();
        if (!st.owned.length) return;
        self.setVisible(self.hiddenSet(st, self.snapshot(true)), true);
        st.hiddenByUs = [];
    },

    // Same for every open document, for commands that process all of them (batch, text / logo).
    ensureShownAll: function () {
        var self = $._ext_BEFOREAFTER, keep = app.activeDocument, i;
        try {
            for (i = 0; i < app.documents.length; i += 1) {
                app.activeDocument = app.documents[i];
                self.ensureShown();
            }
        } finally { app.activeDocument = keep; }
    },

    // Call before a layer-creating command: shows hidden layers, returns the document and its layer ids now.
    before: function () {
        var self = $._ext_BEFOREAFTER;
        self.ensureShown();
        return { doc: app.activeDocument.id, ids: self.snapshot().ids };
    },

    // Call after the command: layers that appeared and sit at the top of the new set are now owned by the panel.
    after: function (prev) {
        var self = $._ext_BEFOREAFTER;
        if (!app.documents.length || app.activeDocument.id !== prev.doc) return;   // the command left another document active
        var st = self.state(), now = self.snapshot(), created = {}, i, id, idsBefore = prev.ids, added = false;
        var known = {};
        for (i = 0; i < idsBefore.length; i += 1) known[idsBefore[i]] = true;
        for (i = 0; i < now.ids.length; i += 1) if (!known[now.ids[i]]) created[now.ids[i]] = true;
        for (i = 0; i < now.ids.length; i += 1) {
            id = now.ids[i];
            if (created[id] && !created[now.parent[id]] && !self.has(st.owned, id)) { st.owned.push(id); added = true; }
        }
        if (added) self.writeOwned(st.owned);
    },

    // Runs in the global scope (suspendHistory): one History step per toggle.
    // Whether the panel layers are hidden is decided from what is visible in the document right now.
    toggle: function () {
        var self = $._ext_BEFOREAFTER, st = self.state(), now = self.snapshot(true), alive = self.alive(st, now), i;
        if (!alive.length) { $.scctlmFotoBAEmpty = true; return; }
        var visible = [];
        for (i = 0; i < alive.length; i += 1) if (now.visible[alive[i]]) visible.push(alive[i]);
        if (visible.length) {
            self.setVisible(visible, false);
            st.hiddenByUs = visible;
        } else {
            self.setVisible(self.hiddenSet(st, now), true);
            st.hiddenByUs = [];
        }
    },

    // 'hidden' when the panel layers of the active document are all hidden, else 'shown'. The panel button reads this.
    stateName: function () {
        var self = $._ext_BEFOREAFTER;
        if (!app.documents.length) return 'shown';
        var st = self.state();
        if (!st.owned.length) return 'shown';
        return self.hiddenSet(st, self.snapshot(true)).length ? 'hidden' : 'shown';
    },

    run: function () {
        var self = $._ext_BEFOREAFTER;
        if (!app.documents.length) return '';
        $.scctlmFotoBAEmpty = false;
        app.activeDocument.suspendHistory(self.HISTORY_NAME, '$._ext_BEFOREAFTER.toggle()');
        if ($.scctlmFotoBAEmpty) throw new Error(self.EMPTY);
        return '';
    }
};
