/*
 * Camera Raw Filter, default settings (DKACR). Opens its own dialog; action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
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
step1(true, true);
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.DKACR = DKACR;
