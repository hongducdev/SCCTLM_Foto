/*
 * Before / After (panel button "Truoc / Sau"). Panel buttons call $._ext_BEFOREAFTER.run to hide or show the layers the panel created.
 * js/panel.js wraps every layer-creating command with before() / after(): the layers that appear during the command
 * are remembered per document, so the toggle never touches layers the user made or hid themselves.
 * State lives in $.scctlmFotoBA[documentId] for the Photoshop session: { owned: [layerId], hiddenByUs: [layerId], showing }.
 */
$._ext_BEFOREAFTER = {
    HISTORY_NAME: 'SCCTLM_Foto Before/After',
    EMPTY: 'SCCTLM_BA_EMPTY',

    c: function (code) { return charIDToTypeID(code); },
    s: function (name) { return stringIDToTypeID(name); },

    state: function () {
        $.scctlmFotoBA = $.scctlmFotoBA || {};
        var key = String(app.activeDocument.id);
        if (!$.scctlmFotoBA[key]) $.scctlmFotoBA[key] = { owned: [], hiddenByUs: [], showing: true };
        return $.scctlmFotoBA[key];
    },

    // Every real layer of the active document: { ids: [id], parent: {id: parentId}, visible: {id: bool} }.
    // Walks bottom to top; a group is a "section end" marker, its children, then the group layer itself.
    snapshot: function () {
        var self = $._ext_BEFOREAFTER, out = { ids: [], parent: {}, visible: {} };
        var countRef = new ActionReference();
        countRef.putProperty(self.c('Prpr'), self.s('numberOfLayers'));
        countRef.putEnumerated(self.c('Dcmn'), self.c('Ordn'), self.c('Trgt'));
        var count = executeActionGet(countRef).getInteger(self.s('numberOfLayers'));
        var stack = [], root = [], i;
        for (i = 0; i <= count; i += 1) {
            var desc;
            try {
                var ref = new ActionReference();
                ref.putIndex(self.c('Lyr '), i);
                desc = executeActionGet(ref);
            } catch (e) { continue; }        // index 0 only exists when the document has a Background layer
            var section = '';
            if (desc.hasKey(self.s('layerSection'))) section = self.t(desc.getEnumerationValue(self.s('layerSection')));
            if (section === 'layerSectionEnd') { stack.push([]); continue; }
            var id = desc.getInteger(self.s('layerID'));
            out.ids.push(id);
            out.visible[id] = desc.getBoolean(self.s('visible'));
            if (section === 'layerSectionStart') {
                var children = stack.pop() || [], j;
                for (j = 0; j < children.length; j += 1) out.parent[children[j]] = id;
            }
            (stack.length ? stack[stack.length - 1] : root).push(id);
        }
        return out;
    },

    t: function (typeId) { return typeIDToStringID(typeId); },

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

    // Call before a layer-creating command: shows the layers a previous Before left hidden, returns the layer ids now.
    before: function () {
        var self = $._ext_BEFOREAFTER, st = self.state();
        if (!st.showing) self.restore(st, self.snapshot());
        return self.snapshot().ids;
    },

    // Call after the command: layers that appeared and sit at the top of the new set are now owned by the panel.
    after: function (idsBefore) {
        var self = $._ext_BEFOREAFTER, st = self.state(), now = self.snapshot(), created = {}, i, id;
        var known = {};
        for (i = 0; i < idsBefore.length; i += 1) known[idsBefore[i]] = true;
        for (i = 0; i < now.ids.length; i += 1) if (!known[now.ids[i]]) created[now.ids[i]] = true;
        for (i = 0; i < now.ids.length; i += 1) {
            id = now.ids[i];
            if (created[id] && !created[now.parent[id]] && !self.has(st.owned, id)) st.owned.push(id);
        }
    },

    // Show again the layers hidden by the last Before that still exist.
    restore: function (st, now) {
        var self = $._ext_BEFOREAFTER, still = [], i;
        for (i = 0; i < st.hiddenByUs.length; i += 1) if (self.has(now.ids, st.hiddenByUs[i])) still.push(st.hiddenByUs[i]);
        self.setVisible(still, true);
        st.hiddenByUs = [];
        st.showing = true;
    },

    // Runs in the global scope (suspendHistory): one History step per toggle
    toggle: function () {
        var self = $._ext_BEFOREAFTER, st = self.state(), now = self.snapshot(), alive = [], i;
        for (i = 0; i < st.owned.length; i += 1) if (self.has(now.ids, st.owned[i])) alive.push(st.owned[i]);
        st.owned = alive;
        if (!st.owned.length) { $.scctlmFotoBAEmpty = true; return; }
        if (st.showing) {
            var visible = [];
            for (i = 0; i < st.owned.length; i += 1) if (now.visible[st.owned[i]]) visible.push(st.owned[i]);
            self.setVisible(visible, false);
            st.hiddenByUs = visible;
            st.showing = false;
        } else {
            self.restore(st, now);
        }
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
