/*
 * WMDRAW - draws an original Xiaomi Leica watermark template (tab "Watermark") onto the active image.
 * run(spec): spec comes from js/wm-layout.js and was checked by js/wm-spec.js (all numbers in px):
 *   { width, height, srcW, srcH, photo: { x, y, w, h }, font: { regular }, imageDir, output: 'layers' | 'flatten', ops: [...] }
 * The canvas grows to width x height with the photo at "photo"; every op is its own layer (fill, text, image, rounded frame), all grouped,
 * and one Ctrl+Z undoes the lot.
 * Fills that come before the photo in the layout tree get a hole where the photo is instead of being slid under it, so the Background layer is never touched.
 * Rotated text and images (vertical text) are drawn upright and then turned about the centre of their final box.
 */
$._ext_WMDRAW = {
    GROUP_NAME: 'Watermark',
    FILL_NAME: 'Watermark - n\u1EC1n',
    FRAME_NAME: 'Watermark - khung',
    // Empty layer inside the group that remembers the canvas and photo box, so the watermark can be taken off again
    META_PREFIX: 'wm-meta:',

    color: function (c) {
        var color = new SolidColor();
        color.rgb.red = c.r;
        color.rgb.green = c.g;
        color.rgb.blue = c.b;
        return color;
    },

    rect: function (x, y, w, h) {
        return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    },

    box: function (layer) {
        var b = layer.bounds;
        return { left: b[0].as('px'), top: b[1].as('px'), right: b[2].as('px'), bottom: b[3].as('px') };
    },

    // Turn a layer rot degrees counter-clockwise about (cx, cy); Photoshop turns clockwise for positive angles
    turn: function (layer, rot, cx, cy) {
        if (!rot) return;
        var b = this.box(layer), px = (b.left + b.right) / 2, py = (b.top + b.bottom) / 2, a = rot * Math.PI / 180;
        var vx = px - cx, vy = py - cy;
        layer.rotate(-rot, AnchorPosition.MIDDLECENTER);
        layer.translate(UnitValue(cx + vx * Math.cos(a) + vy * Math.sin(a) - px, 'px'), UnitValue(cy - vx * Math.sin(a) + vy * Math.cos(a) - py, 'px'));
    },

    // Select a region; false when it is empty (the photo covers the whole fill)
    select: function (doc, points, hole) {
        doc.selection.select(points, SelectionType.REPLACE, 0, false);
        if (hole) doc.selection.select(this.rect(hole.x, hole.y, hole.w, hole.h), SelectionType.DIMINISH, 0, false);
        try { doc.selection.bounds; } catch (e) { return false; }
        return true;
    },

    fill: function (doc, op, hole) {
        if (!this.select(doc, this.rect(op.x, op.y, op.w, op.h), hole)) return null;
        var layer = doc.artLayers.add();
        layer.name = this.FILL_NAME;
        doc.selection.fill(this.color(op.color));
        doc.selection.deselect();
        layer.opacity = op.color.a * 100;
        return layer;
    },

    // Rounded frame: the fill and the outline (drawn inside the box) are separate layers
    frame: function (doc, op) {
        var points = $._ext_EXIFFRAME_DECOR.roundedPoints(op.x, op.y, op.x + op.w, op.y + op.h, Math.min(op.radius, op.w / 2, op.h / 2)), made = [], layer;
        if (op.fill) {
            doc.selection.select(points, SelectionType.REPLACE, 0, true);
            layer = doc.artLayers.add();
            layer.name = this.FRAME_NAME;
            doc.selection.fill(this.color(op.fill));
            layer.opacity = op.fill.a * 100;
            made.push(layer);
        }
        if (op.line && op.lineWidth > 0) {
            doc.selection.select(points, SelectionType.REPLACE, 0, true);
            layer = doc.artLayers.add();
            layer.name = this.FRAME_NAME;
            doc.selection.stroke(this.color(op.line), op.lineWidth, StrokeLocation.INSIDE, ColorBlendMode.NORMAL, 100, false);
            layer.opacity = op.line.a * 100;
            made.push(layer);
        }
        doc.selection.deselect();
        return made;
    },

    image: function (doc, op, dir) {
        var layer = $._ext_EXIFFRAME_DECOR.place(dir + '/' + op.file), size = this.box(layer);
        var swap = op.rot === 90 || op.rot === 270, w = swap ? op.h : op.w, h = swap ? op.w : op.h, cx = op.x + op.w / 2, cy = op.y + op.h / 2;
        layer.resize(w / (size.right - size.left) * 100, h / (size.bottom - size.top) * 100, AnchorPosition.TOPLEFT);
        size = this.box(layer);
        layer.translate(UnitValue(cx - w / 2 - size.left, 'px'), UnitValue(cy - h / 2 - size.top, 'px'));
        this.turn(layer, op.rot, cx, cy);
        return layer;
    },

    text: function (doc, op, font) {
        var cx = op.x + op.w / 2, cy = op.y + op.h / 2, layer = doc.artLayers.add(), item;
        layer.kind = LayerKind.TEXT;
        item = layer.textItem;
        item.contents = op.text;
        item.font = op.bold ? $._ext_EXIFFRAME.boldOf(op.font || font.regular) : op.font || font.regular;
        item.size = op.size;
        item.tracking = op.tracking;
        item.color = this.color(op.color);
        item.justification = Justification.LEFT;
        item.position = [UnitValue(cx - op.lw / 2 + op.dx, 'px'), UnitValue(cy - op.lh / 2 + op.base, 'px')];
        layer.opacity = op.color.a * 100;
        this.turn(layer, op.rot, cx, cy);
        return layer;
    },

    // Add the margins one side at a time: each resize has a single anchor so only one side grows
    growCanvas: function (doc, spec) {
        var p = spec.photo, w = spec.srcW, h = spec.srcH, right = spec.width - p.x - p.w, bottom = spec.height - p.y - p.h;
        var steps = [[p.x, 0, AnchorPosition.MIDDLERIGHT], [right, 0, AnchorPosition.MIDDLELEFT], [0, p.y, AnchorPosition.BOTTOMCENTER], [0, bottom, AnchorPosition.TOPCENTER]], i;
        for (i = 0; i < steps.length; i += 1) {
            if (steps[i][0] > 0 || steps[i][1] > 0) {
                w += steps[i][0];
                h += steps[i][1];
                doc.resizeCanvas(UnitValue(w, 'px'), UnitValue(h, 'px'), steps[i][2]);
            }
        }
    },

    // { group, meta: [width, height, photoX, photoY, srcW, srcH] } of the newest watermark that still matches the canvas, else null
    find: function (doc) {
        var sets = doc.layerSets, i, j, layers, parts;
        for (i = 0; i < sets.length; i += 1) {
            if (sets[i].name !== this.GROUP_NAME) continue;
            layers = sets[i].artLayers;
            for (j = 0; j < layers.length; j += 1) {
                if (layers[j].name.indexOf(this.META_PREFIX) !== 0) continue;
                parts = layers[j].name.substring(this.META_PREFIX.length).split(',');
                if (parts.length === 6 && Math.round(doc.width.as('px')) === +parts[0] && Math.round(doc.height.as('px')) === +parts[1]) {
                    return { group: sets[i], meta: [+parts[0], +parts[1], +parts[2], +parts[3], +parts[4], +parts[5]] };
                }
            }
        }
        return null;
    },

    // "1" when the open image carries a watermark made by this tab, else ""
    existing: function () {
        if (!app.documents.length) return '';
        app.preferences.rulerUnits = Units.PIXELS;
        return this.find(app.activeDocument) ? '1' : '';
    },

    takeOff: function () {
        var doc = app.activeDocument, found = $._ext_WMDRAW.find(doc), m;
        if (!found) return;
        m = found.meta;
        found.group.remove();
        doc.crop([m[2], m[3], m[2] + m[4], m[3] + m[5]]);
    },

    // Removes the watermark group and crops the canvas back to the photo; one history step
    remove: function () {
        app.preferences.rulerUnits = Units.PIXELS;
        if (!app.documents.length || !this.find(app.activeDocument)) return 'DR7_NONE';
        app.activeDocument.suspendHistory('G\u1EE1 watermark', '$._ext_WMDRAW.takeOff()');
        return 'DR7_OK';
    },

    // Runs in the global scope (suspendHistory), so the spec travels on the object
    build: function () {
        var self = $._ext_WMDRAW, spec = self.spec, doc = app.activeDocument, hole = spec.photo, under = true, made = [], i, op, result, group, meta;
        var savedBackground = app.backgroundColor, savedType = app.preferences.typeUnits, savedDialogs = app.displayDialogs;
        try {
            app.preferences.typeUnits = TypeUnits.PIXELS;
            app.displayDialogs = DialogModes.NO;
            if (spec.ops[0].t === 'fill' && spec.ops[0].color.a > 0) app.backgroundColor = self.color(spec.ops[0].color);
            self.growCanvas(doc, spec);
            doc.activeLayer = doc.layers[0];
            for (i = 0; i < spec.ops.length; i += 1) {
                op = spec.ops[i];
                if (op.t === 'photo') { under = false; continue; }
                if (op.t === 'fill') result = self.fill(doc, op, under ? hole : null);
                else if (op.t === 'rrect') result = self.frame(doc, op);
                else if (op.t === 'image') result = self.image(doc, op, spec.imageDir);
                else result = self.text(doc, op, spec.font);
                if (result) made = made.concat(result);
            }
            meta = doc.artLayers.add();
            meta.name = self.META_PREFIX + [spec.width, spec.height, spec.photo.x, spec.photo.y, spec.srcW, spec.srcH].join(',');
            made.push(meta);
            group = doc.layerSets.add();
            group.name = self.GROUP_NAME;
            for (i = 0; i < made.length; i += 1) made[i].move(group, ElementPlacement.INSIDE);
            if (spec.output === 'flatten') doc.flatten();
        } finally {
            app.backgroundColor = savedBackground;
            app.preferences.typeUnits = savedType;
            app.displayDialogs = savedDialogs;
        }
    },

    run: function (spec) {
        var self = $._ext_WMDRAW;
        app.preferences.rulerUnits = Units.PIXELS;
        var doc = app.activeDocument, i;
        if ($._ext_EXIFFRAME.hasArtboard(doc)) throw new Error('T\u00E0i li\u1EC7u c\u00F3 artboard, ch\u01B0a h\u1ED7 tr\u1EE3 watermark.');
        if (Math.round(doc.width.as('px')) !== spec.srcW || Math.round(doc.height.as('px')) !== spec.srcH) {
            throw new Error('\u1EA2nh \u0111\u00E3 \u0111\u1ED5i k\u00EDch th\u01B0\u1EDBc, h\u00E3y b\u1EA5m \u00C1p d\u1EE5ng l\u1EA1i.');
        }
        for (i = 0; i < spec.ops.length; i += 1) {
            if (spec.ops[i].t === 'image' && !new File(spec.imageDir + '/' + spec.ops[i].file).exists) throw new Error('Kh\u00F4ng t\u00ECm th\u1EA5y \u1EA3nh: ' + spec.ops[i].file);
        }
        self.spec = spec;
        doc.suspendHistory('Watermark', '$._ext_WMDRAW.build()');
    }
};
