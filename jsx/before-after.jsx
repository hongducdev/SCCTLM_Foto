/*
 * Before / After (panel button "Truoc / Sau"). Panel buttons call $._ext_BEFOREAFTER.run to hide or show the layers the panel created.
 * js/panel.js wraps every layer-creating command with before() / after(): the layers that appear during the command
 * are remembered per document, so the toggle never touches layers the user made.
 *
 * State per document, kept for the Photoshop session in $.scctlmFotoBA[documentId] and mirrored into the document XMP
 * (namespace NS) so it survives closing and reopening the file:
 *   owned      - ids of the layers the panel created (stored with their names; an id whose layer now has another name
 *                is ignored, because layer ids can be reused by other layers after a flatten or in another file)
 *   hiddenByUs - ids hidden by the last Before press
 * Whether panel layers are hidden is always read from the layers themselves. Commands that flatten or merge only show
 * back the layers a Before hid, never a layer the user hid on purpose.
 */
$._ext_BEFOREAFTER = {
    HISTORY_NAME: 'SCCTLM_Foto Before/After',
    EMPTY: 'SCCTLM_BA_EMPTY',
    NS: 'http://scctlm.vn/foto/before-after/1.0/',

    c: function (code) { return charIDToTypeID(code); },
    s: function (name) { return stringIDToTypeID(name); },
    t: function (typeId) { return typeIDToStringID(typeId); },

    has: function (list, id) {
        var i;
        for (i = 0; i < list.length; i += 1) if (list[i] === id) return true;
        return false;
    },

    // ---- one layer by id (cost does not depend on the number of layers) --------------------------------------
    layerProp: function (id, name) {
        var self = $._ext_BEFOREAFTER, ref = new ActionReference();
        ref.putProperty(self.c('Prpr'), self.s(name));
        ref.putIdentifier(self.c('Lyr '), id);
        return executeActionGet(ref);
    },

    // { name, visible } of a layer in the active document, or null when it no longer exists
    layerInfo: function (id) {
        var self = $._ext_BEFOREAFTER;
        try {
            return {
                name: self.layerProp(id, 'name').getString(self.s('name')),
                visible: self.layerProp(id, 'visible').getBoolean(self.s('visible'))
            };
        } catch (e) { return null; }
    },

    // ---- persistence in the document XMP ----------------------------------------------------------------------
    // The XMP scripting library, or false when Photoshop does not offer it (persistence is then skipped).
    xmpReady: function () {
        try {
            if (typeof XMPMeta === 'undefined' && ExternalObject.AdobeXMPScript === undefined) ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
            return typeof XMPMeta !== 'undefined';
        } catch (e) { return false; }
    },

    // Stored state of any open document: { owned: [{ id, name }], hidden: [id] } (nothing validated yet)
    readRaw: function (doc) {
        var self = $._ext_BEFOREAFTER, out = { owned: [], hidden: [] }, i;
        try {
            if (!self.xmpReady()) return out;
            var xmp = new XMPMeta(doc.xmpMetadata.rawData);
            var owned = xmp.getProperty(self.NS, 'ownedLayers'), hidden = xmp.getProperty(self.NS, 'hiddenLayers');
            var parts = owned ? String(owned.value).split(',') : [];
            for (i = 0; i < parts.length; i += 1) {
                var bar = parts[i].indexOf('|');
                if (bar > 0 && /^\d+$/.test(parts[i].substring(0, bar))) {
                    out.owned.push({ id: parseInt(parts[i].substring(0, bar), 10), name: decodeURIComponent(parts[i].substring(bar + 1)) });
                }
            }
            parts = hidden ? String(hidden.value).split(',') : [];
            for (i = 0; i < parts.length; i += 1) if (/^\d+$/.test(parts[i])) out.hidden.push(parseInt(parts[i], 10));
        } catch (e) { }
        return out;
    },

    // Writes the owned layers (with their current names) and the hidden ones of the active document
    persist: function (st) {
        var self = $._ext_BEFOREAFTER, i, entries = [], hidden = [];
        try {
            if (!self.xmpReady()) return;
            for (i = 0; i < st.owned.length; i += 1) {
                var info = self.layerInfo(st.owned[i]);
                if (info) entries.push(st.owned[i] + '|' + encodeURIComponent(info.name));
            }
            for (i = 0; i < st.hiddenByUs.length; i += 1) hidden.push(st.hiddenByUs[i]);
            var text = entries.join(';') + '#' + hidden.join(',');
            if (st.written === text) return;
            var doc = app.activeDocument, xmp = new XMPMeta(doc.xmpMetadata.rawData);
            XMPMeta.registerNamespace(self.NS, 'scctlmba');
            xmp.setProperty(self.NS, 'ownedLayers', entries.join(','));
            xmp.setProperty(self.NS, 'hiddenLayers', hidden.join(','));
            doc.xmpMetadata.rawData = xmp.serialize();
            st.written = text;
        } catch (e) { }
    },

    // State of the active document. A stored entry counts only when the layer with that id still has the stored name.
    state: function () {
        var self = $._ext_BEFOREAFTER;
        $.scctlmFotoBA = $.scctlmFotoBA || {};
        var key = String(app.activeDocument.id);
        if (!$.scctlmFotoBA[key]) {
            var raw = self.readRaw(app.activeDocument), st = { owned: [], hiddenByUs: [] }, i, info;
            for (i = 0; i < raw.owned.length; i += 1) {
                info = self.layerInfo(raw.owned[i].id);
                if (info && info.name === raw.owned[i].name) st.owned.push(raw.owned[i].id);
            }
            for (i = 0; i < raw.hidden.length; i += 1) if (self.has(st.owned, raw.hidden[i])) st.hiddenByUs.push(raw.hidden[i]);
            $.scctlmFotoBA[key] = st;
        }
        return $.scctlmFotoBA[key];
    },

    // True when a document has layers a Before hid (session state, or stored for a file opened from disk). Does not activate it.
    hasHidden: function (doc) {
        var self = $._ext_BEFOREAFTER, st = $.scctlmFotoBA && $.scctlmFotoBA[String(doc.id)];
        if (st) return st.hiddenByUs.length > 0;
        return self.readRaw(doc).hidden.length > 0;
    },

    // ---- layer list (only used to find the layers a command created) ------------------------------------------
    // One property of the layer at an index (property queries are far cheaper than the full layer descriptor).
    prop: function (index, name) {
        var self = $._ext_BEFOREAFTER, ref = new ActionReference();
        ref.putProperty(self.c('Prpr'), self.s(name));
        ref.putIndex(self.c('Lyr '), index);
        return executeActionGet(ref);
    },

    // Every real layer of the active document: { ids: [id], parent: {id: parentId} }.
    // Walks bottom to top; a group is a "section end" marker, its children, then the group layer itself.
    snapshot: function () {
        var self = $._ext_BEFOREAFTER, out = { ids: [], parent: {} };
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

    // The panel layers of the active document that still exist: [{ id, visible }]
    alive: function (st) {
        var self = $._ext_BEFOREAFTER, out = [], i, info;
        for (i = 0; i < st.owned.length; i += 1) {
            info = self.layerInfo(st.owned[i]);
            if (info) out.push({ id: st.owned[i], visible: info.visible });
        }
        return out;
    },

    // Show again what a Before left hidden (never a layer the user hid). Commands that rebuild or flatten the
    // document call this first, so hidden retouch is not merged away.
    ensureShown: function () {
        var self = $._ext_BEFOREAFTER, st = self.state(), alive, toShow = [], i;
        if (!st.hiddenByUs.length) return;
        alive = self.alive(st);
        for (i = 0; i < alive.length; i += 1) if (!alive[i].visible && self.has(st.hiddenByUs, alive[i].id)) toShow.push(alive[i].id);
        self.setVisible(toShow, true);
        st.hiddenByUs = [];
        self.persist(st);
    },

    // Same for every open document that has hidden layers, for commands that process all of them (batch, text / logo).
    ensureShownAll: function () {
        var self = $._ext_BEFOREAFTER, keep = app.activeDocument, i;
        try {
            for (i = 0; i < app.documents.length; i += 1) {
                if (!self.hasHidden(app.documents[i])) continue;
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
        if (added) self.persist(st);
    },

    // Runs in the global scope (suspendHistory): one History step per toggle.
    // Panel layers visible -> hide them. None visible -> show the ones the last Before hid (or all of them).
    toggle: function () {
        var self = $._ext_BEFOREAFTER, st = self.state(), alive = self.alive(st), visible = [], back = [], i;
        if (!alive.length) { $.scctlmFotoBAEmpty = true; return; }
        for (i = 0; i < alive.length; i += 1) if (alive[i].visible) visible.push(alive[i].id);
        if (visible.length) {
            self.setVisible(visible, false);
            st.hiddenByUs = visible;
        } else {
            for (i = 0; i < alive.length; i += 1) if (self.has(st.hiddenByUs, alive[i].id)) back.push(alive[i].id);
            if (!back.length) for (i = 0; i < alive.length; i += 1) back.push(alive[i].id);
            self.setVisible(back, true);
            st.hiddenByUs = [];
        }
        self.persist(st);
    },

    // 'hidden' when the document has panel layers and none of them is visible, else 'shown'. The panel button reads this.
    stateName: function () {
        var self = $._ext_BEFOREAFTER, alive, i;
        if (!app.documents.length) return 'shown';
        alive = self.alive(self.state());
        if (!alive.length) return 'shown';
        for (i = 0; i < alive.length; i += 1) if (alive[i].visible) return 'shown';
        return 'hidden';
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
