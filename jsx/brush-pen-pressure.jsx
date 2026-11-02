/*
 * BPP - turn on Shape Dynamics for the current brush and set every Control
 * (Size Jitter, Angle Jitter, Roundness Jitter) to Pen Pressure.
 *
 * Two entry points:
 *  - SCCTLM_Foto panel "Setup Brush" / "Reset default" buttons (loader evaluates this file and only
 *    registers $._ext_BPP / $._ext_BPPRESET).
 *  - Run directly (File > Scripts > Browse) -> runs immediately because the loader's
 *    $.scctlmFotoLoading flag is not set.
 */
$._ext_BPP = {
    // Photoshop bVTy: 0 Off, 1 Fade, 2 Pen Pressure, 3 Pen Tilt, 4 Stylus Wheel
    PEN_PRESSURE: 2,
    // Size Jitter only has the charID 'szVr'; Angle/Roundness have stringIDs
    SHAPE_CONTROLS: [charIDToTypeID('szVr'), stringIDToTypeID('angleDynamics'), stringIDToTypeID('roundnessDynamics')],

    readToolOptions: function () {
        var ref = new ActionReference();
        ref.putProperty(stringIDToTypeID('property'), stringIDToTypeID('currentToolOptions'));
        ref.putEnumerated(stringIDToTypeID('application'), stringIDToTypeID('ordinal'), stringIDToTypeID('targetEnum'));
        return executeActionGet(ref).getObjectValue(stringIDToTypeID('currentToolOptions'));
    },

    writeToolOptions: function (options) {
        var target = new ActionReference();
        target.putClass(stringIDToTypeID(app.currentTool));
        var desc = new ActionDescriptor();
        desc.putReference(stringIDToTypeID('null'), target);
        desc.putObject(stringIDToTypeID('to'), stringIDToTypeID('null'), options);
        executeAction(stringIDToTypeID('set'), desc, DialogModes.NO);
    },

    run: function () {
        var self = $._ext_BPP;
        var tipKey = stringIDToTypeID('useTipDynamics');
        var options = self.readToolOptions();
        // Tools without Shape Dynamics (Move, Marquee...) -> switch to the Brush and re-read
        if (!options.hasKey(tipKey)) {
            app.currentTool = 'paintbrushTool';
            options = self.readToolOptions();
        }
        // While Shape Dynamics is off Photoshop omits the Control keys,
        // so enable it first, re-read, then set Pen Pressure.
        if (!options.getBoolean(tipKey)) {
            options.putBoolean(tipKey, true);
            self.writeToolOptions(options);
            options = self.readToolOptions();
        }
        for (var i = 0; i < self.SHAPE_CONTROLS.length; i += 1) {
            var key = self.SHAPE_CONTROLS[i];
            if (!options.hasKey(key)) continue;
            var control = options.getObjectValue(key);
            control.putInteger(charIDToTypeID('bVTy'), self.PEN_PRESSURE);
            options.putObject(key, options.getObjectType(key), control);
        }
        self.writeToolOptions(options);
    },

    // Panel button state: "setup" (Shape Dynamics on + every Control = Pen Pressure),
    // "default" (anything else), "none" (current tool has no Shape Dynamics)
    state: function () {
        var self = $._ext_BPP;
        var options = self.readToolOptions();
        var tipKey = stringIDToTypeID('useTipDynamics');
        if (!options.hasKey(tipKey)) return 'none';
        if (!options.getBoolean(tipKey)) return 'default';
        for (var i = 0; i < self.SHAPE_CONTROLS.length; i += 1) {
            var key = self.SHAPE_CONTROLS[i];
            if (!options.hasKey(key) ||
                options.getObjectValue(key).getInteger(charIDToTypeID('bVTy')) !== self.PEN_PRESSURE) return 'default';
        }
        return 'setup';
    },

    // Undo the setup: every Control back to Off, then Shape Dynamics off (Photoshop defaults).
    // Controls are only present while Shape Dynamics is on, so both change in one write.
    reset: function () {
        var self = $._ext_BPP;
        var options = self.readToolOptions();
        var tipKey = stringIDToTypeID('useTipDynamics');
        if (!options.hasKey(tipKey) || !options.getBoolean(tipKey)) return;
        for (var i = 0; i < self.SHAPE_CONTROLS.length; i += 1) {
            var key = self.SHAPE_CONTROLS[i];
            if (!options.hasKey(key)) continue;
            var control = options.getObjectValue(key);
            control.putInteger(charIDToTypeID('bVTy'), 0);
            options.putObject(key, options.getObjectType(key), control);
        }
        options.putBoolean(tipKey, false);
        self.writeToolOptions(options);
    }
};

// Panel "Reset default" button (run('ext', 'BPPRESET'))
$._ext_BPPRESET = { run: function () { $._ext_BPP.reset(); } };

if ($.scctlmFotoLoading !== true) {
    try {
        $._ext_BPP.run();
    } catch (e) {
        $.writeln('SCCTLM_Foto: pen pressure failed: ' + e);
        alert('Kh\u00f4ng \u0111\u1eb7t \u0111\u01b0\u1ee3c Pen Pressure cho c\u1ecd.\nH\u00e3y ch\u1ecdn c\u00f4ng c\u1ee5 Brush trong Photoshop r\u1ed3i th\u1eed l\u1ea1i. N\u1ebfu v\u1eabn l\u1ed7i, m\u1edf Ch\u1ea9n \u0111o\u00e1n \u1edf cu\u1ed1i panel v\u00e0 g\u1eedi b\u00e1o c\u00e1o.');
    }
}
