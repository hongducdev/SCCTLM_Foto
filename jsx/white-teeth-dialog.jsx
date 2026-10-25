/*
 * WT dialog - modal how-to window shown after the whitening layers exist (see white-teeth.jsx).
 * Checkbox 1 (default on): set the brush to the recommended values; off leaves the brush as it is. Checkbox 2
 * (default off): never show again, remembered with the brush choice in Photoshop's persistent custom options under SKIP_KEY.
 */
$._ext_WT_DIALOG = {
    TITLE: 'SCCTLM_Foto: L\u00E0m tr\u1EAFng r\u0103ng',
    LINES: [
        'V\u1EABn ch\u01B0a th\u1EA5y thay \u0111\u1ED5i!',
        'H\u00E3y ch\u1ECDn m\u1EB7t n\u1EA1 l\u1EDBp \'L\u00E0m tr\u1EAFng r\u0103ng\' r\u1ED3i t\u00F4 l\u00EAn v\u00F9ng r\u0103ng.',
        'B\u1EA1n c\u0169ng c\u00F3 th\u1EC3 m\u1EDF nh\u00F3m ra v\u00E0 ch\u1EC9nh opacity c\u1EE7a l\u1EDBp \u0111\u1EC3 \u0111i\u1EC1u ch\u1EC9nh hi\u1EC7u \u1EE9ng.'
    ],
    BRUSH_LABEL: '\u0110\u1EB7t c\u1ECD theo th\u00F4ng s\u1ED1 khuy\u1EBFn ngh\u1ECB',
    SKIP_LABEL: 'Kh\u00F4ng hi\u1EC7n l\u1EA1i c\u1EEDa s\u1ED5 n\u00E0y',
    OK_LABEL: '\u0110\u1ED3ng \u00FD',
    SKIP_KEY: 'SCCTLM_WT_SKIP_DIALOG',

    // -> { brush } when the dialog was turned off, null otherwise (getCustomOptions throws for a key never saved)
    savedSkip: function () {
        var saved, brushKey = stringIDToTypeID('brush');
        try {
            saved = app.getCustomOptions($._ext_WT_DIALOG.SKIP_KEY);
        } catch (e) {
            return null;
        }
        if (!saved.hasKey(0) || !saved.getBoolean(0)) return null;
        return { brush: saved.hasKey(brushKey) ? saved.getBoolean(brushKey) : true };
    },

    saveSkip: function (brush) {
        var desc = new ActionDescriptor();
        desc.putBoolean(0, true);
        desc.putBoolean(stringIDToTypeID('brush'), brush);
        app.putCustomOptions(this.SKIP_KEY, desc, true);
    },

    // Brush tool options through the helpers of jsx/brush-pen-pressure.jsx (read/write the tool descriptor)
    applyBrush: function () {
        var v = $._ext_WT.BRUSH, bpp = $._ext_BPP;
        var options = bpp.readToolOptions();
        var brushKey = stringIDToTypeID('brush');
        if (!options.hasKey(brushKey)) return;
        var brush = options.getObjectValue(brushKey);
        brush.putUnitDouble(stringIDToTypeID('diameter'), charIDToTypeID('#Pxl'), v.diameter);
        brush.putUnitDouble(stringIDToTypeID('hardness'), charIDToTypeID('#Prc'), v.hardness);
        options.putObject(brushKey, options.getObjectType(brushKey), brush);
        options.putInteger(stringIDToTypeID('opacity'), v.opacity);
        options.putInteger(stringIDToTypeID('flow'), v.flow);
        bpp.writeToolOptions(options);
    },

    // The whitening layers are already built in this History step: a brush failure is reported, not thrown, so it does not undo them
    setBrush: function () {
        try {
            this.applyBrush();
        } catch (e) {
            alert(this.BRUSH_LABEL + ':\n' + e, this.TITLE);
        }
    },

    show: function () {
        var self = $._ext_WT_DIALOG, i, skipped = self.savedSkip();
        if (skipped) {
            if (skipped.brush) self.setBrush();
            return;
        }
        var win = new Window('dialog', self.TITLE, undefined, { closeButton: true });
        win.preferredSize = [446, 266];
        win.orientation = 'column';
        win.alignChildren = ['left', 'top'];
        win.margins = 20;
        win.spacing = 12;
        win.graphics.backgroundColor = win.graphics.newBrush(win.graphics.BrushType.SOLID_COLOR, [0.16, 0.16, 0.16, 1]);
        for (i = 0; i < self.LINES.length; i += 1) {
            var label = win.add('statictext', undefined, self.LINES[i], { multiline: true });
            label.preferredSize = [406, i === 0 ? 20 : 36];
            label.graphics.foregroundColor = label.graphics.newPen(label.graphics.PenType.SOLID_COLOR, [0.9, 0.9, 0.9, 1], 1);
        }
        var brushBox = win.add('checkbox', undefined, self.BRUSH_LABEL);
        var skipBox = win.add('checkbox', undefined, self.SKIP_LABEL);
        brushBox.value = true;
        skipBox.value = false;
        brushBox.graphics.foregroundColor = brushBox.graphics.newPen(brushBox.graphics.PenType.SOLID_COLOR, [0.9, 0.9, 0.9, 1], 1);
        skipBox.graphics.foregroundColor = skipBox.graphics.newPen(skipBox.graphics.PenType.SOLID_COLOR, [0.9, 0.9, 0.9, 1], 1);
        var ok = win.add('button', undefined, self.OK_LABEL, { name: 'ok' });
        win.defaultElement = ok;
        win.cancelElement = ok;
        win.show();
        if (skipBox.value) self.saveSkip(brushBox.value);
        if (brushBox.value) self.setBrush();
    }
};
