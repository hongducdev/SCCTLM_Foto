/*
 * LS dialogs. show() returns { detail, smooth, strength } after "Apply" (and remembers them), or null after Cancel / Esc.
 * The spec's "Xem truoc" checkbox is left out until a real live preview exists: the spec measured the same result with
 * it on or off (docs/clean-room/specs/ls.md, section 2). showHint() is the how-to box shown when there is no usable selection.
 */
$._ext_LS_DIALOG = {
    // ---- TUNABLE SETTINGS ---------------------------------------------------------------------------------
    TITLE: 'SCCTLM_Foto: L\u00E0m m\u1ECBn c\u1EE5c b\u1ED9',
    MEMORY_KEY: 'SCCTLM_LS_SETTINGS',
    DEFAULTS: { detail: 10, smooth: 20, strength: 100 },
    DETAIL: { label: 'B\u00E1n k\u00EDnh chi ti\u1EBFt:', min: 0.1, max: 50 },
    SMOOTH: { label: 'B\u00E1n k\u00EDnh l\u00E0m m\u1ECBn', min: 0.1, max: 200 },
    STRENGTH_LABEL: '\u0110\u1ED9 m\u1EA1nh l\u00E0m m\u1ECBn:',
    OK_LABEL: '\u00C1p d\u1EE5ng',
    CANCEL_LABEL: 'Hu\u1EF7',
    CLOSE_LABEL: '\u0110\u00F3ng',
    WARN_SMOOTH: 'B\u00E1n k\u00EDnh l\u00E0m m\u1ECBn kh\u00F4ng \u0111\u01B0\u1EE3c nh\u1ECF h\u01A1n b\u00E1n k\u00EDnh chi ti\u1EBFt',
    WARN_DETAIL: 'B\u00E1n k\u00EDnh chi ti\u1EBFt kh\u00F4ng \u0111\u01B0\u1EE3c l\u1EDBn h\u01A1n b\u00E1n k\u00EDnh l\u00E0m m\u1ECBn',
    HINT_LINES: [
        'Tr\u01B0\u1EDBc khi d\u00F9ng c\u00F4ng c\u1EE5, h\u00E3y d\u00F9ng Lasso t\u1EA1o v\u00F9ng ch\u1ECDn quanh khu v\u1EF1c c\u1EA7n l\u00E0m m\u1ECBn.',
        '\u0110\u1EC3 tr\u00E1nh bi\u1EBFn d\u1EA1ng, \u0111\u1EEBng ch\u1ECDn c\u1EA3 khu\u00F4n m\u1EB7t hay c\u1EA3 c\u01A1 th\u1EC3, ch\u1EC9 ch\u1ECDn t\u1EEBng v\u00F9ng nh\u1ECF \u0111\u1EC3 gi\u1EEF \u0111\u1ED9 trung th\u1EF1c c\u1EE7a \u1EA3nh.'
    ],
    SLIDER_STEPS: 1000,      // slider resolution; value = min + (max - min) * t^2 (finer at small radii)
    // ------------------------------------------------------------------------------------------------------

    toSlider: function (v, r) { return Math.round(Math.sqrt(Math.max(0, (v - r.min) / (r.max - r.min))) * this.SLIDER_STEPS); },
    fromSlider: function (p, r) { var t = p / this.SLIDER_STEPS; return r.min + (r.max - r.min) * t * t; },
    pixels: function (v) { return (v <= 10 ? Math.round(v * 10) / 10 : Math.round(v)) + ' pixel'; },

    load: function () {
        var d = this.DEFAULTS, out;
        try {
            var saved = app.getCustomOptions(this.MEMORY_KEY);
            out = { detail: saved.getDouble(stringIDToTypeID('detail')), smooth: saved.getDouble(stringIDToTypeID('smooth')),
                strength: saved.getDouble(stringIDToTypeID('strength')) };
        } catch (e) { out = { detail: d.detail, smooth: d.smooth, strength: d.strength }; }
        return out;
    },

    save: function (o) {
        var desc = new ActionDescriptor();
        desc.putDouble(stringIDToTypeID('detail'), o.detail);
        desc.putDouble(stringIDToTypeID('smooth'), o.smooth);
        desc.putDouble(stringIDToTypeID('strength'), o.strength);
        app.putCustomOptions(this.MEMORY_KEY, desc, true);
    },

    paint: function (win) {
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.16, 0.16, 0.16, 1]);
    },

    ink: function (item, color) {
        item.graphics.foregroundColor = item.graphics.newPen(item.graphics.PenType.SOLID_COLOR, color || [0.9, 0.9, 0.9, 1], 1);
    },

    show: function () {
        var self = $._ext_LS_DIALOG, start = self.load();
        var win = new Window('dialog', self.TITLE, undefined, { closeButton: true });
        win.orientation = 'column';
        win.alignChildren = ['fill', 'top'];
        win.margins = [15, 12, 15, 12];
        win.spacing = 2;
        self.paint(win);
        var addRow = function (label, range, value) {
            var head = win.add('group');
            head.alignChildren = ['left', 'center'];
            var name = head.add('statictext', undefined, label);
            name.preferredSize = [210, 16];
            var shown = head.add('statictext', undefined, '', { justify: 'right' });
            shown.preferredSize = [90, 16];
            self.ink(name); self.ink(shown);
            var slider = win.add('slider', undefined, 0, 0, self.SLIDER_STEPS);
            slider.preferredSize = [300, 20];
            return { slider: slider, shown: shown, range: range };
        };
        var detail = addRow(self.DETAIL.label, self.DETAIL);
        var smooth = addRow(self.SMOOTH.label, self.SMOOTH);
        var strength = addRow(self.STRENGTH_LABEL, { min: 0, max: 100 });
        detail.slider.value = self.toSlider(start.detail, self.DETAIL);
        smooth.slider.value = self.toSlider(start.smooth, self.SMOOTH);
        strength.slider.value = Math.round(start.strength * self.SLIDER_STEPS / 100);
        var warning = win.add('statictext', undefined, '');
        warning.preferredSize = [300, 14];
        self.ink(warning, [1, 0.3, 0.3, 1]);
        var buttons = win.add('group');
        buttons.alignment = 'fill';
        var ok = buttons.add('button', undefined, self.OK_LABEL, { name: 'ok' });
        var cancel = buttons.add('button', undefined, self.CANCEL_LABEL, { name: 'cancel' });
        win.defaultElement = ok;
        win.cancelElement = cancel;

        var read = function (row) { return self.fromSlider(row.slider.value, row.range); };
        var percent = function () { return Math.round(strength.slider.value * 100 / self.SLIDER_STEPS); };
        var refresh = function () {
            detail.shown.text = self.pixels(read(detail));
            smooth.shown.text = self.pixels(read(smooth));
            strength.shown.text = percent() + ' %';
        };
        detail.slider.onChanging = detail.slider.onChange = function () {
            if (read(detail) < read(smooth) * 0.95) warning.text = '';
            if (read(detail) > read(smooth)) {
                detail.slider.value = Math.min(detail.slider.value, self.toSlider(read(smooth), self.DETAIL));
                warning.text = self.WARN_DETAIL;
            }
            refresh();
        };
        smooth.slider.onChanging = smooth.slider.onChange = function () {
            if (read(smooth) > read(detail) * 1.05) warning.text = '';
            if (read(smooth) < read(detail)) {
                smooth.slider.value = Math.max(smooth.slider.value, self.toSlider(read(detail), self.SMOOTH));
                warning.text = self.WARN_SMOOTH;
            }
            refresh();
        };
        strength.slider.onChanging = strength.slider.onChange = function () { warning.text = ''; refresh(); };
        refresh();
        if (win.show() !== 1) return null;
        var result = { detail: Math.min(read(detail), read(smooth)), smooth: read(smooth), strength: percent() };
        self.save(result);
        return result;
    },

    showHint: function () {
        var self = $._ext_LS_DIALOG, i;
        var win = new Window('dialog', self.TITLE, undefined, { closeButton: true });
        win.orientation = 'column';
        win.alignChildren = ['fill', 'top'];
        win.margins = 20;
        self.paint(win);
        var row = win.add('group');
        row.orientation = 'row';
        row.alignChildren = ['left', 'top'];
        var art = row.add('group');
        art.preferredSize = [140, 140];
        art.onDraw = function () {   // face outline with a lasso loop around one eye
            var g = this.graphics, pen = g.newPen(g.PenType.SOLID_COLOR, [0.9, 0.75, 0.6, 1], 2);
            var lasso = g.newPen(g.PenType.SOLID_COLOR, [0.4, 0.8, 1, 1], 1);
            g.newPath(); g.ellipsePath(20, 6, 100, 128); g.strokePath(pen);
            g.newPath(); g.ellipsePath(36, 44, 28, 16); g.strokePath(pen);
            g.newPath(); g.ellipsePath(76, 44, 28, 16); g.strokePath(pen);
            g.newPath(); g.ellipsePath(28, 34, 44, 36); g.strokePath(lasso);
        };
        var texts = row.add('group');
        texts.orientation = 'column';
        texts.alignChildren = ['left', 'top'];
        for (i = 0; i < self.HINT_LINES.length; i += 1) {
            var line = texts.add('statictext', undefined, self.HINT_LINES[i], { multiline: true });
            line.preferredSize = [220, i === 0 ? 50 : 80];
            self.ink(line);
        }
        var close = win.add('button', undefined, self.CLOSE_LABEL, { name: 'cancel' });
        close.alignment = ['fill', 'bottom'];
        win.cancelElement = close;
        win.show();
    }
};
