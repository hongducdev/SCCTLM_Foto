/*
 * ARTBOARD - creates the artboards chosen in the panel's Artboard tab.
 * spec (validated and laid out by js/artboard-layout.js):
 *   { mode: 'new' | 'current', name, gap, background: 'white' | 'black' | 'transparent', guides: bool,
 *     boards: [{ name, x, y, w, h }] }  - x/y/w/h in px, relative to the top-left of the first artboard.
 * 'new' opens one document sized to all artboards; 'current' appends them to the right of everything already in
 * the active document so nothing is covered. Photoshop's Make command cannot set an artboard's background, so
 * white/black are real solid-colour layers (NEN TRANG / NEN DEN) inside each artboard. A board with scaffold: true
 * (album templates) also gets the MHK pack's empty drop layer. Returns the number of artboards made.
 */
$._ext_ARTBOARD = {
    FILL: { white: [255, 255, 255], black: [0, 0, 0] },
    FILL_NAME: { white: 'NỀN TRẮNG', black: 'NỀN ĐEN' },
    DROP_NAME: 'ĐẶT ẢNH / THIẾT KẾ TẠI ĐÂY',
    SAFE_MARGIN: 0.05,

    make: function (board) {
        var rect = new ActionDescriptor();
        rect.putDouble(stringIDToTypeID('top'), board.y);
        rect.putDouble(stringIDToTypeID('left'), board.x);
        rect.putDouble(stringIDToTypeID('bottom'), board.y + board.h);
        rect.putDouble(stringIDToTypeID('right'), board.x + board.w);
        var ref = new ActionReference();
        ref.putClass(stringIDToTypeID('artboardSection'));
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putObject(stringIDToTypeID('artboardRect'), stringIDToTypeID('classFloatRect'), rect);
        executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
        // The Make descriptor ignores a name; the new artboard is the active layer
        app.activeDocument.activeLayer.name = board.name;
    },

    // Solid-colour layer inside the active artboard, named after the colour
    fill: function (rgbValues, layerName) {
        var rgb = new ActionDescriptor();
        rgb.putDouble(charIDToTypeID('Rd  '), rgbValues[0]);
        rgb.putDouble(charIDToTypeID('Grn '), rgbValues[1]);
        rgb.putDouble(charIDToTypeID('Bl  '), rgbValues[2]);
        var solid = new ActionDescriptor();
        solid.putObject(charIDToTypeID('Clr '), charIDToTypeID('RGBC'), rgb);
        var layer = new ActionDescriptor();
        layer.putObject(charIDToTypeID('Type'), stringIDToTypeID('solidColorLayer'), solid);
        var ref = new ActionReference();
        ref.putClass(stringIDToTypeID('contentLayer'));
        var desc = new ActionDescriptor();
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putObject(charIDToTypeID('Usng'), stringIDToTypeID('contentLayer'), layer);
        executeAction(charIDToTypeID('Mk  '), desc, DialogModes.NO);
        app.activeDocument.activeLayer.name = layerName;
    },

    // Empty layer inside the active artboard, so Place Embedded / painting lands in the board
    // (doc.artLayers.add() would land at the document's top level, so it is added through the artboard set)
    addEmptyLayer: function (artboard, layerName) {
        var layer = artboard.artLayers.add();
        layer.name = layerName;
        return layer;
    },

    // Four guides inset from each artboard edge: the safe area for text and faces
    addGuides: function (doc, board) {
        var insetX = Math.round(board.w * this.SAFE_MARGIN), insetY = Math.round(board.h * this.SAFE_MARGIN);
        doc.guides.add(Direction.VERTICAL, UnitValue(board.x + insetX, 'px'));
        doc.guides.add(Direction.VERTICAL, UnitValue(board.x + board.w - insetX, 'px'));
        doc.guides.add(Direction.HORIZONTAL, UnitValue(board.y + insetY, 'px'));
        doc.guides.add(Direction.HORIZONTAL, UnitValue(board.y + board.h - insetY, 'px'));
    },

    // Runs in the global scope (suspendHistory), so the spec travels on the object
    build: function () {
        var self = $._ext_ARTBOARD, spec = self.spec, doc = app.activeDocument, i;
        if (spec.wrap) self.make(spec.wrap);
        for (i = 0; i < spec.boards.length; i += 1) {
            self.make(spec.boards[i]);
            var artboard = doc.activeLayer;
            if (self.FILL[spec.background]) self.fill(self.FILL[spec.background], self.FILL_NAME[spec.background]);
            if (spec.boards[i].scaffold) self.addEmptyLayer(artboard, self.DROP_NAME);
            if (spec.guides) self.addGuides(doc, spec.boards[i]);
        }
    },

    // Rect {left, top, right, bottom} of a top-level artboard, or null for any other layer
    artboardRect: function (layer) {
        var ref = new ActionReference();
        ref.putIdentifier(charIDToTypeID('Lyr '), layer.id);
        var desc = executeActionGet(ref);
        if (!desc.hasKey(stringIDToTypeID('artboard'))) return null;
        var rect = desc.getObjectValue(stringIDToTypeID('artboard')).getObjectValue(stringIDToTypeID('artboardRect'));
        return { left: rect.getDouble(stringIDToTypeID('left')), top: rect.getDouble(stringIDToTypeID('top')),
            right: rect.getDouble(stringIDToTypeID('right')), bottom: rect.getDouble(stringIDToTypeID('bottom')) };
    },

    // Right edge of the existing artboards (0 when none). A document without artboards gets its current
    // content wrapped in one by Photoshop's first Make, so that artboard is made explicitly, canvas-sized.
    existingRight: function (doc) {
        var right = 0, found = false, i, rect;
        for (i = 0; i < doc.layerSets.length; i += 1) {
            rect = this.artboardRect(doc.layerSets[i]);
            if (rect) { found = true; right = Math.max(right, rect.right); }
        }
        return found ? right : -1;
    },

    shift: function (boards, dx) {
        var moved = [], i;
        for (i = 0; i < boards.length; i += 1) {
            moved.push({ name: boards[i].name, x: boards[i].x + dx, y: boards[i].y, w: boards[i].w, h: boards[i].h,
                scaffold: boards[i].scaffold });
        }
        return moved;
    },

    // Bounding box of the laid-out artboards
    extent: function (boards) {
        var width = 0, height = 0, i;
        for (i = 0; i < boards.length; i += 1) {
            width = Math.max(width, boards[i].x + boards[i].w);
            height = Math.max(height, boards[i].y + boards[i].h);
        }
        return { width: width, height: height };
    },

    run: function (spec) {
        var self = $._ext_ARTBOARD;
        app.preferences.rulerUnits = Units.PIXELS;
        if (spec.mode === 'current') {
            if (!app.documents.length) throw new Error('H\u00E3y m\u1EDF m\u1ED9t t\u00E0i li\u1EC7u tr\u01B0\u1EDBc, ho\u1EB7c ch\u1ECDn "T\u00E0i li\u1EC7u m\u1EDBi".');
            var doc = app.activeDocument, right = self.existingRight(doc), wrap = null;
            if (right < 0) {
                right = doc.width.as('px');
                wrap = { name: 'T\u00E0i li\u1EC7u g\u1ED1c', x: 0, y: 0, w: right, h: doc.height.as('px') };
            }
            self.spec = { wrap: wrap, boards: self.shift(spec.boards, right + spec.gap), background: spec.background, guides: spec.guides };
            doc.suspendHistory('T\u1EA1o artboard', '$._ext_ARTBOARD.build()');
        } else {
            var size = self.extent(spec.boards);
            var created = app.documents.add(size.width, size.height, 72, spec.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1);
            // The first Make wraps the empty "Layer 1" into the first artboard. Deleting the document's only
            // layer pops a confirmation, so it is removed from inside the artboard afterwards.
            var initial = created.artLayers.length === 1 ? created.artLayers[0] : null;
            self.spec = spec;
            self.build();
            if (initial) initial.remove();
        }
        return String(spec.boards.length);
    }
};
