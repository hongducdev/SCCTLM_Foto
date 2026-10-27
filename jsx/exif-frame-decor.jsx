/*
 * EXIFFRAME_DECOR - the optional parts of the frame drawn by jsx/exif-frame.jsx: rounded photo corners and a logo.
 * Both take the validated spec described in exif-frame.jsx. Called at run time, so file load order does not matter.
 */
$._ext_EXIFFRAME_DECOR = {
    BAR_NAME: 'Watermark - v\u1EA1ch',
    BAR_WIDTH: 0.08,
    SPLIT_LOGO: 0.9,
    CORNERS_NAME: 'Watermark - bo g\u00F3c',
    ARC_STEPS_MAX: 24,
    LOGO_MAX_WIDTH: 0.25,
    LOGO_GAP: 0.9,

    // DOM selections are polygons, so each corner is an arc of short straight steps
    roundedPoints: function (left, top, right, bottom, radius) {
        var steps = Math.max(6, Math.min(this.ARC_STEPS_MAX, Math.round(radius / 2))), points = [], c, k, angle;
        var corners = [[right - radius, top + radius, -90], [right - radius, bottom - radius, 0],
            [left + radius, bottom - radius, 90], [left + radius, top + radius, 180]];
        for (c = 0; c < corners.length; c += 1) {
            for (k = 0; k <= steps; k += 1) {
                angle = (corners[c][2] + 90 * k / steps) * Math.PI / 180;
                points.push([corners[c][0] + radius * Math.cos(angle), corners[c][1] + radius * Math.sin(angle)]);
            }
        }
        return points;
    },

    // A layer of the background colour with a rounded window onto the photo; null when the corners are square
    roundPhoto: function (doc, spec) {
        var plan = spec.layout, layer;
        if (plan.radius <= 0) return null;
        doc.activeLayer = doc.layers[0];
        doc.selection.select(this.roundedPoints(plan.border, plan.border, plan.border + spec.srcW, plan.border + spec.srcH, plan.radius),
            SelectionType.REPLACE, 0, true);
        doc.selection.invert();
        layer = doc.artLayers.add();
        layer.name = this.CORNERS_NAME;
        doc.selection.fill($._ext_EXIFFRAME.color(spec.background));
        doc.selection.deselect();
        return layer;
    },

    // Smart object, centred and at its native size, on top of the document
    place: function (path) {
        var desc = new ActionDescriptor(), offset = new ActionDescriptor();
        desc.putPath(charIDToTypeID('null'), new File(path));
        desc.putEnumerated(charIDToTypeID('FTcs'), charIDToTypeID('QCSt'), charIDToTypeID('Qcsa'));
        offset.putUnitDouble(charIDToTypeID('Hrzn'), charIDToTypeID('#Pxl'), 0);
        offset.putUnitDouble(charIDToTypeID('Vrtc'), charIDToTypeID('#Pxl'), 0);
        desc.putObject(charIDToTypeID('Ofst'), charIDToTypeID('Ofst'), offset);
        executeAction(charIDToTypeID('Plc '), desc, DialogModes.NO);
        return app.activeDocument.activeLayer;
    },

    box: function (layer) {
        var b = layer.bounds;
        return { left: b[0].as('px'), top: b[1].as('px'), right: b[2].as('px'), bottom: b[3].as('px') };
    },

    // Ink bounds of all the text layers together
    block: function (layers) {
        var all = this.box(layers[0]), i, b;
        for (i = 1; i < layers.length; i += 1) {
            b = this.box(layers[i]);
            all = { left: Math.min(all.left, b.left), top: Math.min(all.top, b.top), right: Math.max(all.right, b.right), bottom: Math.max(all.bottom, b.bottom) };
        }
        return all;
    },

    // Thin vertical rule: a filled rectangle on its own layer
    bar: function (doc, left, top, width, height, hex) {
        doc.selection.select([[left, top], [left + width, top], [left + width, top + height], [left, top + height]], SelectionType.REPLACE, 0, false);
        var layer = doc.artLayers.add();
        layer.name = this.BAR_NAME;
        doc.selection.fill($._ext_EXIFFRAME.color(hex));
        doc.selection.deselect();
        return layer;
    },

    // Two columns: the left text stays put; at the right edge sit the logo, a rule and the side text, as tall as the left block.
    // Returns every layer it made.
    placeSplit: function (doc, spec, leftLayers) {
        var self = $._ext_EXIFFRAME, plan = spec.layout, block = this.block(leftLayers), height = block.bottom - block.top;
        var right = plan.areaLeft + plan.areaWidth - plan.inset, gap = Math.round(plan.lines[0].size * this.LOGO_GAP);
        var barWidth = Math.max(1, Math.round(plan.lines[0].size * this.BAR_WIDTH)), layers = [], texts, edge = right, logo, size, i;
        if (spec.side) {
            texts = self.drawLine(doc, spec.side, plan.side, spec);
            size = this.block(texts);
            edge = right - (size.right - size.left);
            for (i = 0; i < texts.length; i += 1) texts[i].translate(UnitValue(right - size.right, 'px'), UnitValue(0, 'px'));
            layers = layers.concat(texts);
        }
        if (spec.logo) {
            if (spec.side) {
                edge -= gap + barWidth;
                layers.push(this.bar(doc, edge, block.top, barWidth, height, spec.muted));
            }
            logo = this.place(spec.logo.path);
            size = this.fit(logo, height * this.SPLIT_LOGO, plan);
            this.move(logo, size, edge - gap - (size.right - size.left), block.top + (height - (size.bottom - size.top)) / 2);
            layers.push(logo);
        }
        return layers;
    },

    // Logo scaled to a height and capped to a share of the frame width; returns the layer at its resized bounds
    fit: function (layer, height, plan) {
        var size = this.box(layer);
        var scale = Math.min(height / (size.bottom - size.top), plan.areaWidth * this.LOGO_MAX_WIDTH / (size.right - size.left));
        layer.resize(scale * 100, scale * 100, AnchorPosition.TOPLEFT);
        return this.box(layer);
    },

    move: function (layer, size, left, top) {
        layer.translate(UnitValue(left - size.left, 'px'), UnitValue(top - size.top, 'px'));
    },

    // left: logo as tall as the text block, to its left; the text moves aside so that, per the chosen alignment, the
    // logo and the text still sit where a text-only frame would put them.
    // top: logo above the text, centred or pushed to the side per the alignment.
    // right: logo at the far right edge of the frame, centred on the text block; the text stays put.
    // Returns the logo layer, or null.
    placeLogo: function (doc, spec, textLayers) {
        if (!spec.logo) return null;
        var plan = spec.layout, text = this.block(textLayers), layer = this.place(spec.logo.path), size, width, height, left, shift = 0, i;
        var gap = Math.round(plan.lines[0].size * this.LOGO_GAP);
        if (spec.logoPos === 'top') {
            size = this.fit(layer, plan.logoHeight, plan);
            width = size.right - size.left;
            left = spec.align === 'left' ? plan.areaLeft + plan.inset :
                spec.align === 'right' ? plan.areaLeft + plan.areaWidth - plan.inset - width : plan.areaLeft + (plan.areaWidth - width) / 2;
            this.move(layer, size, left, plan.logoTop);
            return layer;
        }
        size = this.fit(layer, text.bottom - text.top, plan);
        width = size.right - size.left;
        height = size.bottom - size.top;
        if (spec.logoPos === 'right') {
            left = plan.areaLeft + plan.areaWidth - plan.inset - width;
        } else if (spec.align === 'right') {
            left = text.left - gap - width;
        } else {
            left = spec.align === 'left' ? plan.areaLeft + plan.inset : plan.areaLeft + (plan.areaWidth - (width + gap + text.right - text.left)) / 2;
            shift = left + width + gap - text.left;
        }
        for (i = 0; i < textLayers.length; i += 1) textLayers[i].translate(UnitValue(shift, 'px'), UnitValue(0, 'px'));
        this.move(layer, size, left, text.top + (text.bottom - text.top - height) / 2);
        return layer;
    }
};
