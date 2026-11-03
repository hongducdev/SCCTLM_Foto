/*
 * Camera Raw Filter, default settings (DKACR). Opens its own dialog; action replay moved verbatim from jsx/main.jsx.
 * Registered through $.scctlmFotoSkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.scctlmFotoBuildSkinCommands) turns the registry into $.scctlmFotoCommands.
 */
function DKACR() {
function step1(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putString(cTID("CMod"), "Filter");
desc1.putEnumerated(cTID("Sett"), cTID("Sett"), cTID("Defa"));
executeAction(sTID("Adobe Camera Raw Filter"), desc1, dialogMode);
}
var doc = app.activeDocument;
var before = doc.activeHistoryState;
// Smart Object keeps Camera Raw editable as a Smart Filter; only plain pixel layers need converting.
if (doc.activeLayer.kind === LayerKind.NORMAL) {
executeAction(sTID("newPlacedLayer"), new ActionDescriptor(), DialogModes.NO);
}
try {
step1(true, true);
} catch (e) {
doc.activeHistoryState = before;
throw e;
}
}

$.scctlmFotoSkinFns = $.scctlmFotoSkinFns || {};
$.scctlmFotoSkinFns.DKACR = DKACR;
