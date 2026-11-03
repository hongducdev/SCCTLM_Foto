/*
 * Redness Reducer (FSJH) part 1/3: action steps 1-8, moved verbatim from jsx/skin-redness-reducer.jsx.
 * Run in order by FSJH() in jsx/skin-redness-reducer.jsx through $.scctlmFotoSkinFns.
 */
function FSJH_part1() {
function step1(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(cTID("AdjL"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
var desc3 = new ActionDescriptor();
desc3.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindDefault"));
var desc4 = new ActionDescriptor();
desc4.putUnitDouble(cTID("Rd  "), cTID("#Prc"), 100);
desc3.putObject(cTID("Rd  "), cTID("ChMx"), desc4);
var desc5 = new ActionDescriptor();
desc5.putUnitDouble(cTID("Grn "), cTID("#Prc"), 100);
desc3.putObject(cTID("Grn "), cTID("ChMx"), desc5);
var desc6 = new ActionDescriptor();
desc6.putUnitDouble(cTID("Bl  "), cTID("#Prc"), 100);
desc3.putObject(cTID("Bl  "), cTID("ChMx"), desc6);
desc2.putObject(cTID("Type"), cTID("ChnM"), desc3);
desc1.putObject(cTID("Usng"), cTID("AdjL"), desc2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step2(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Chnl"), cTID("Chnl"), sTID("RGB"));
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
executeAction(sTID("select"), desc1, dialogMode);
}

function step3(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step4(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("AdjL"), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindCustom"));
var desc3 = new ActionDescriptor();
desc3.putUnitDouble(cTID("Grn "), cTID("#Prc"), 47);
desc3.putUnitDouble(cTID("Bl  "), cTID("#Prc"), 50);
desc2.putObject(cTID("Bl  "), cTID("ChMx"), desc3);
desc1.putObject(cTID("T   "), cTID("ChnM"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step5(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 50);
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step6(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Redness Reducer");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step7(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(cTID("AdjL"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
var desc3 = new ActionDescriptor();
desc3.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindDefault"));
var desc4 = new ActionDescriptor();
desc4.putUnitDouble(cTID("Rd  "), cTID("#Prc"), 100);
desc3.putObject(cTID("Rd  "), cTID("ChMx"), desc4);
var desc5 = new ActionDescriptor();
desc5.putUnitDouble(cTID("Grn "), cTID("#Prc"), 100);
desc3.putObject(cTID("Grn "), cTID("ChMx"), desc5);
var desc6 = new ActionDescriptor();
desc6.putUnitDouble(cTID("Bl  "), cTID("#Prc"), 100);
desc3.putObject(cTID("Bl  "), cTID("ChMx"), desc6);
desc2.putObject(cTID("Type"), cTID("ChnM"), desc3);
desc1.putObject(cTID("Usng"), cTID("AdjL"), desc2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step8(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("AdjL"), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindCustom"));
var desc3 = new ActionDescriptor();
desc3.putUnitDouble(cTID("Rd  "), cTID("#Prc"), 50);
desc3.putUnitDouble(cTID("Grn "), cTID("#Prc"), 50);
desc2.putObject(cTID("Rd  "), cTID("ChMx"), desc3);
desc1.putObject(cTID("T   "), cTID("ChnM"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}
step1();
step2();
step3();
step4();
step5();
step6();
step7();
step8();
}

$.scctlmFotoSkinFns = $.scctlmFotoSkinFns || {};
$.scctlmFotoSkinFns.FSJH_part1 = FSJH_part1;
