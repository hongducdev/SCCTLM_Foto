// Live check for jsx/before-after.jsx. Run inside Photoshop (File > Scripts > Browse, or COM DoJavaScriptFile).
// Uses scratch documents only, closes them without saving and restores the user's active document.
// Result: a multi-line report in $.scctlmFotoBAReport, ending with "AUDIT PASS" or "AUDIT FAIL".
#target photoshop
(function () {
    var report = [], failed = 0;
    function check(ok, text) { report.push((ok ? 'ok   ' : 'FAIL ') + text); if (!ok) failed += 1; }

    var here = new File($.fileName).parent.parent;
    $.evalFile(new File(here + '/jsx/before-after.jsx'));
    var BA = $._ext_BEFOREAFTER;

    function vis(layer) { return layer.visible; }
    function scratch(bits) {
        var doc = app.documents.add(200, 200, 72, 'BA audit ' + bits, NewDocumentMode.RGB, DocumentFill.WHITE);
        doc.bitsPerChannel = bits === 16 ? BitsPerChannelType.SIXTEEN : BitsPerChannelType.EIGHT;
        return doc;
    }
    // Stand-in for a retouch command: one plain layer plus one group that holds a layer
    function fakeTool(doc, tag) {
        var plain = doc.artLayers.add(); plain.name = tag + ' plain';
        var group = doc.layerSets.add(); group.name = tag + ' group';
        var inner = group.artLayers.add(); inner.name = tag + ' inner';
        return { plain: plain, group: group, inner: inner };
    }
    function runTool(doc, tag) {
        var ids = BA.before();
        var made = fakeTool(doc, tag);
        BA.after(ids);
        return made;
    }

    var original = app.documents.length ? app.activeDocument : null;
    var bits;
    for (bits = 8; bits <= 16; bits += 8) {
        var doc = scratch(bits);
        var tag = bits + 'bit';
        var mine = doc.artLayers.add(); mine.name = 'user layer';
        var hidden = doc.artLayers.add(); hidden.name = 'user hidden'; hidden.visible = false;

        // Nothing created by the panel yet: the toggle reports empty and changes nothing
        var emptyRaised = false;
        try { BA.run(); } catch (e) { emptyRaised = String(e).indexOf('SCCTLM_BA_EMPTY') !== -1; }
        check(emptyRaised, tag + ': empty toggle raises SCCTLM_BA_EMPTY');

        var first = runTool(doc, 'one');
        var second = runTool(doc, 'two');
        var st = BA.state();
        check(st.owned.length === 4, tag + ': owned = 2 plain + 2 groups (children follow their group), got ' + st.owned.length);

        BA.run();
        check(!vis(first.plain) && !vis(first.group) && !vis(second.plain) && !vis(second.group), tag + ': Before hides every panel layer');
        check(vis(mine) && !vis(hidden), tag + ': user layers keep their visibility on Before');
        BA.run();
        check(vis(first.plain) && vis(first.group) && vis(second.plain) && vis(second.group), tag + ': After shows them again');
        check(vis(mine) && !vis(hidden), tag + ': user layers keep their visibility on After');

        // One History step per toggle
        var before = doc.historyStates.length;
        BA.run();
        var added = doc.historyStates.length - before;
        check(added === 1, tag + ': toggle adds one History step, added ' + added);
        BA.run();

        // Running a tool while hidden brings everything back first
        BA.run();
        var third = runTool(doc, 'three');
        check(vis(first.plain) && vis(second.group) && vis(third.plain), tag + ': a new tool restores layers hidden by Before');
        check(BA.stateName() === 'shown', tag + ': panel reports shown after a new tool');

        // A layer deleted by the user is skipped without an error
        first.plain.remove();
        var ok = true;
        try { BA.run(); BA.run(); } catch (e2) { ok = false; }
        check(ok, tag + ': a deleted panel layer does not break the toggle');
        check(BA.state().owned.length === 6, tag + ': owned keeps the deleted id so Redo can bring the layer back, got ' + BA.state().owned.length);

        // Layers made visible behind the panel's back (Undo with "layer visibility undoable", or the user): the next press hides
        BA.run();                                    // hide
        check(!vis(second.plain), tag + ': hidden before the outside change');
        second.plain.visible = true; second.group.visible = true; first.group.visible = true; third.plain.visible = true; third.group.visible = true;
        BA.run();
        check(!vis(second.plain) && !vis(second.group), tag + ': press after an outside show hides again (state follows the document)');
        BA.run();
        check(vis(second.plain) && vis(second.group), tag + ': next press shows them');

        // A command that rebuilds the document shows hidden layers first
        BA.run();
        BA.ensureShown();
        check(vis(second.plain) && vis(second.group) && BA.stateName() === 'shown', tag + ': ensureShown restores hidden layers');

        doc.close(SaveOptions.DONOTSAVECHANGES);
    }

    // Batch-style commands touch every open document: ensureShownAll restores a hidden document that is not active
    var docA = scratch(8), docB = scratch(8);
    app.activeDocument = docA;
    var toolA = runTool(docA, 'A');
    BA.run();
    check(!vis(toolA.plain), 'two documents: A hidden');
    app.activeDocument = docB;
    BA.ensureShownAll();
    check(app.activeDocument === docB, 'two documents: active document is kept');
    app.activeDocument = docA;
    check(vis(toolA.plain) && vis(toolA.group), 'two documents: ensureShownAll restores the inactive document');
    docB.close(SaveOptions.DONOTSAVECHANGES);
    docA.close(SaveOptions.DONOTSAVECHANGES);

    // Memory survives closing and reopening the file (owned ids live in the document XMP; hidden state is read from the layers)
    var saved = scratch(8);
    var toolS = runTool(saved, "saved");
    var stS = BA.state();
    var statesBefore = saved.historyStates.length;
    stS.written = "";                                  // force a write
    BA.persist(stS);
    check(saved.historyStates.length === statesBefore, "persist: writing the metadata adds no History step");
    BA.run();
    var psd = new File(Folder.temp + "/scctlm-ba-audit.psd");
    saved.saveAs(psd, new PhotoshopSaveOptions(), true);
    saved.close(SaveOptions.DONOTSAVECHANGES);
    $.scctlmFotoBA = {};                              // forget the session memory
    var reopened = app.open(psd);
    check(BA.stateName() === "hidden", "persist: reopened file is reported hidden");
    BA.run();
    var shownAgain = true, k;
    for (k = 0; k < reopened.layers.length; k += 1) if (!reopened.layers[k].visible) shownAgain = false;
    check(shownAgain, "persist: after reopening, the next press shows the panel layers");
    // A stored id whose layer now has another name is ignored (ids can be reused by other layers)
    var renamed = reopened.layers[0];
    renamed.name = "someone else";
    $.scctlmFotoBA = {};
    check(BA.state().owned.length === 1, "persist: of two stored ids the renamed layer is ignored, the other kept");
    check(BA.stateName() === "shown", "persist: so the button stays normal");
    reopened.close(SaveOptions.DONOTSAVECHANGES);
    psd.remove();

    // A panel layer the user hid on purpose is never switched back on by commands that flatten or merge
    var mine = scratch(8);
    var toolM = runTool(mine, "mine");
    toolM.plain.visible = false;
    toolM.group.visible = false;
    BA.ensureShown();
    BA.ensureShownAll();
    check(!vis(toolM.plain), "user-hidden panel layer: ensureShown / ensureShownAll leave it hidden");
    BA.run();                                          // none visible -> shows them (user asked for the toggle)
    check(vis(toolM.plain), "user-hidden panel layer: pressing the button shows it");
    mine.close(SaveOptions.DONOTSAVECHANGES);

    // Document without a Background layer
    var bare = app.documents.add(100, 100, 72, 'BA audit bare', NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    var bareTool = runTool(bare, 'bare');
    BA.run();
    check(!vis(bareTool.plain) && !vis(bareTool.group), 'no Background: Before hides panel layers');
    BA.run();
    check(vis(bareTool.plain) && vis(bareTool.group), 'no Background: After shows them');
    bare.close(SaveOptions.DONOTSAVECHANGES);
    if (original) { try { app.activeDocument = original; } catch (e3) { } }

    report.push(failed === 0 ? 'AUDIT PASS' : 'AUDIT FAIL (' + failed + ')');
    $.scctlmFotoBAReport = report.join('\n');
}());
