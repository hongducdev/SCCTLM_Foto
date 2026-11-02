cTID = function(s) {
return app.charIDToTypeID(s);
};
sTID = function(s) {
return app.stringIDToTypeID(s);
};

// Da card commands without a dialog: one undo step per click, and RGB only, because in
// Gray/Lab/CMYK they stop halfway with a raw Photoshop error and leave half-built layers.
// The panel turns SCCTLM_NOT_RGB into a plain-language message (js/error-messages.js); a native alert() here would
// open a modal that blocks the script. Other errors still reach the panel bridge after suspendHistory.
$.scctlmFotoSkinStep = function (title, fn) {
    return function () {
        var doc = app.activeDocument;
        if (doc.mode !== DocumentMode.RGB) {
            throw new Error("SCCTLM_NOT_RGB:" + String(doc.mode));
        }
        $.scctlmFotoSkinStepBody = fn;
        try {
            doc.suspendHistory(title, "$.scctlmFotoSkinStepBody()");
        } finally {
            $.scctlmFotoSkinStepBody = null;
        }
    };
};

// Each skin-*.jsx file registers its function in $.scctlmFotoSkinFns (evalFile scopes cannot see each other's
// declarations, so the table below cannot name them directly). loader.jsx calls this after every file is loaded.
$.scctlmFotoSkinFns = $.scctlmFotoSkinFns || {};
$.scctlmFotoBuildSkinCommands = function () {
    var f = $.scctlmFotoSkinFns;
    var table = {
        GGXS: $.scctlmFotoSkinStep("SCCTLM_Foto Highlight", f.GGXS), TJSH: f.TJSH, JMXS: f.JMXS, TJYY: f.TJYY,
        FSJH: $.scctlmFotoSkinStep("SCCTLM_Foto Gi\u1ea3m v\u00e0ng", f.FSJH), MBPF: $.scctlmFotoSkinStep("SCCTLM_Foto Tr\u1eafng da", f.MBPF),
        ZCZQ: f.ZCZQ, DKACR: f.DKACR
    };
    for (var name in table) {
        if (!table.hasOwnProperty(name)) continue;
        if (typeof f[name] !== "function") {                 // its skin-*.jsx did not load: report, do not expose a broken button
            $.scctlmFotoLoadErrors.push("skin command not registered: " + name);
            continue;
        }
        $.scctlmFotoCommands[name] = table[name];
    }
};
