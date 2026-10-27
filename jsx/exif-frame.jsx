/*
 * EXIFFRAME - frames the active image and writes the camera lines under it (panel tab "Watermark").
 * read():  "<width>\t<height>" then one "<tag id>\t<value>" per EXIF entry, or DR7_NO_DOCUMENT.
 * fonts(): one "<PostScript name>\t<family> <style>" per installed font.
 * run(spec): spec is validated and laid out by js/exif-frame-layout.js (every size is in px):
 *   { srcW, srcH, style: 'bottom' | 'polaroid' | 'overlay', align: 'left' | 'center' | 'right', logoPos: 'left' | 'top' | 'right' | 'split', font (PostScript name),
 *     output: 'layers' | 'flatten', logo: { path } | null, background, text, muted: '#rrggbb',
 *     layout: { border, radius, canvasW, canvasH, areaLeft, areaWidth, inset, logoTop, logoHeight, side: { size, baseline } | null, lines: [{ size, baseline }] },
 *     lines: [[{ text, bold, muted }]], side: [{ text, bold, muted }] | null (the right column of 'split') }
 * bottom/polaroid grow the canvas around the photo; overlay leaves it alone. A Background layer is extended with the
 * background colour by Photoshop; any other document gets a solid backdrop layer at the bottom. Each text segment is
 * its own layer (textItem cannot mix fonts in one layer), grouped, so one Ctrl+Z undoes the lot. Rounded corners and
 * the logo live in jsx/exif-frame-decor.jsx.
 */
$._ext_EXIFFRAME = {
    GROUP_NAME: 'Watermark',
    BACKDROP_NAME: 'Watermark - n\u1EC1n',
    WORD_GAP: 0.3,

    read: function () {
        if (!app.documents.length) return 'DR7_NO_DOCUMENT';
        var doc = app.activeDocument, exif = doc.info.exif, lines = [], i;
        lines.push(Math.round(doc.width.as('px')) + '\t' + Math.round(doc.height.as('px')));
        for (i = 0; i < exif.length; i += 1) {
            lines.push(exif[i][2] + '\t' + String(exif[i][1]).replace(/[\x00-\x1f]/g, ' '));
        }
        return lines.join('\n');
    },

    fonts: function () {
        var list = app.fonts, lines = [], i;
        for (i = 0; i < list.length; i += 1) lines.push(list[i].postScriptName + '\t' + list[i].family + ' ' + list[i].style);
        return lines.join('\n');
    },

    // Bold face of the same family, or the font itself when the family has none
    boldOf: function (postScriptName) {
        var list = app.fonts, family = null, i;
        for (i = 0; i < list.length; i += 1) {
            if (list[i].postScriptName === postScriptName) { family = list[i].family; break; }
        }
        if (family === null) return postScriptName;
        for (i = 0; i < list.length; i += 1) {
            if (list[i].family === family && /^bold$/i.test(list[i].style)) return list[i].postScriptName;
        }
        return postScriptName;
    },

    color: function (hex) {
        var color = new SolidColor();
        color.rgb.hexValue = hex.substring(1);
        return color;
    },

    hasArtboard: function (doc) {
        var i;
        if (typeof $._ext_ARTBOARD !== 'object') return false;
        for (i = 0; i < doc.layerSets.length; i += 1) {
            if ($._ext_ARTBOARD.artboardRect(doc.layerSets[i])) return true;
        }
        return false;
    },

    // Photoshop extends only a Background layer; any other layer leaves the new canvas transparent
    ensureBackdrop: function (doc, hex) {
        var bottom = doc.layers[doc.layers.length - 1];
        if (bottom.isBackgroundLayer) return;
        var rgb = this.color(hex).rgb;
        doc.activeLayer = bottom;
        $._ext_ARTBOARD.fill([rgb.red, rgb.green, rgb.blue], this.BACKDROP_NAME);
        doc.activeLayer.move(bottom, ElementPlacement.PLACEAFTER);
    },

    growCanvas: function (doc, spec) {
        var plan = spec.layout;
        app.backgroundColor = this.color(spec.background);
        doc.resizeCanvas(UnitValue(plan.canvasW, 'px'), UnitValue(spec.srcH + plan.border * 2, 'px'), AnchorPosition.MIDDLECENTER);
        doc.resizeCanvas(UnitValue(plan.canvasW, 'px'), UnitValue(plan.canvasH, 'px'), AnchorPosition.TOPCENTER);
        this.ensureBackdrop(doc, spec.background);
    },

    addText: function (doc, text, size, font, color, baseline) {
        var layer = doc.artLayers.add();
        layer.kind = LayerKind.TEXT;
        var item = layer.textItem;
        item.contents = text;
        item.font = font;
        item.size = size;
        item.color = color;
        item.justification = Justification.LEFT;
        item.position = [UnitValue(0, 'px'), UnitValue(baseline, 'px')];
        return layer;
    },

    width: function (layer) {
        return layer.bounds[2].as('px') - layer.bounds[0].as('px');
    },

    // Left edge of a row of the given width, per the chosen alignment
    startX: function (total, plan, align) {
        if (align === 'left') return plan.areaLeft + plan.inset;
        if (align === 'right') return plan.areaLeft + plan.areaWidth - plan.inset - total;
        return plan.areaLeft + (plan.areaWidth - total) / 2;
    },

    // Segments of one line sit side by side as one row
    drawLine: function (doc, segments, metrics, spec) {
        var layers = [], total = 0, i, layer, gap = Math.round(metrics.size * this.WORD_GAP), x, bold = this.boldOf(spec.font);
        for (i = 0; i < segments.length; i += 1) {
            layer = this.addText(doc, segments[i].text, metrics.size, segments[i].bold ? bold : spec.font,
                this.color(segments[i].muted ? spec.muted : spec.text), metrics.baseline);
            total += this.width(layer);
            layers.push(layer);
        }
        total += gap * (layers.length - 1);
        x = this.startX(total, spec.layout, spec.align);
        for (i = 0; i < layers.length; i += 1) {
            layers[i].textItem.position = [UnitValue(Math.round(x), 'px'), UnitValue(metrics.baseline, 'px')];
            x += this.width(layers[i]) + gap;
        }
        return layers;
    },

    // Runs in the global scope (suspendHistory), so the spec travels on the object
    build: function () {
        var self = $._ext_EXIFFRAME, spec = self.spec, plan = spec.layout, doc = app.activeDocument;
        var savedBackground = app.backgroundColor, savedType = app.preferences.typeUnits;
        var decor = $._ext_EXIFFRAME_DECOR, texts = [], layers = [], extra, i, group;
        try {
            app.preferences.typeUnits = TypeUnits.PIXELS;
            if (spec.style !== 'overlay') {
                self.growCanvas(doc, spec);
                extra = decor.roundPhoto(doc, spec);
                if (extra) layers.push(extra);
            }
            doc.activeLayer = doc.layers[0];
            for (i = 0; i < spec.lines.length; i += 1) {
                texts = texts.concat(self.drawLine(doc, spec.lines[i], plan.lines[i], spec));
            }
            layers = layers.concat(texts);
            if (spec.logoPos === 'split') {
                layers = layers.concat(decor.placeSplit(doc, spec, texts));
            } else {
                extra = decor.placeLogo(doc, spec, texts);
                if (extra) layers.push(extra);
            }
            group = doc.layerSets.add();
            group.name = self.GROUP_NAME;
            for (i = 0; i < layers.length; i += 1) layers[i].move(group, ElementPlacement.INSIDE);
            if (spec.output === 'flatten') doc.flatten();
        } finally {
            app.backgroundColor = savedBackground;
            app.preferences.typeUnits = savedType;
        }
    },

    run: function (spec) {
        var self = $._ext_EXIFFRAME;
        app.preferences.rulerUnits = Units.PIXELS;
        var doc = app.activeDocument;
        if (self.hasArtboard(doc)) throw new Error('T\u00E0i li\u1EC7u c\u00F3 artboard, ch\u01B0a h\u1ED7 tr\u1EE3 watermark.');
        if (Math.round(doc.width.as('px')) !== spec.srcW || Math.round(doc.height.as('px')) !== spec.srcH) {
            throw new Error('\u1EA2nh \u0111\u00E3 \u0111\u1ED5i k\u00EDch th\u01B0\u1EDBc, h\u00E3y b\u1EA5m \u00C1p d\u1EE5ng l\u1EA1i.');
        }
        if (spec.logo && !new File(spec.logo.path).exists) throw new Error('Kh\u00F4ng t\u00ECm th\u1EA5y file logo: ' + spec.logo.path);
        self.spec = spec;
        doc.suspendHistory('Watermark', '$._ext_EXIFFRAME.build()');
    }
};
