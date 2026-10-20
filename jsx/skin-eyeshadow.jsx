/*
 * Eyeshadow (TJYY): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function TJYY() {
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
desc2.putObject(cTID("Type"), cTID("Crvs"), desc3);
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
ref1.putEnumerated(cTID("AdjL"), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindCustom"));
var list1 = new ActionList();
var desc3 = new ActionDescriptor();
var ref2 = new ActionReference();
ref2.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Cmps"));
desc3.putReference(cTID("Chnl"), ref2);
var list2 = new ActionList();
var desc4 = new ActionDescriptor();
desc4.putDouble(cTID("Hrzn"), 35);
desc4.putDouble(cTID("Vrtc"), 0);
list2.putObject(cTID("Pnt "), desc4);
var desc5 = new ActionDescriptor();
desc5.putDouble(cTID("Hrzn"), 145);
desc5.putDouble(cTID("Vrtc"), 108);
list2.putObject(cTID("Pnt "), desc5);
var desc6 = new ActionDescriptor();
desc6.putDouble(cTID("Hrzn"), 220);
desc6.putDouble(cTID("Vrtc"), 255);
list2.putObject(cTID("Pnt "), desc6);
desc3.putList(cTID("Crv "), list2);
list1.putObject(cTID("CrvA"), desc3);
desc2.putList(cTID("Adjs"), list1);
desc1.putObject(cTID("T   "), cTID("Crvs"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step3(enabled, withDialog) {
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

function step4(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Darken I");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step5(enabled, withDialog) {
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

function step6(enabled, withDialog) {
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
desc3.putInteger(cTID("Rd  "), 40);
desc3.putInteger(cTID("Yllw"), 60);
desc3.putInteger(cTID("Grn "), 40);
desc3.putInteger(cTID("Cyn "), 60);
desc3.putInteger(cTID("Bl  "), 20);
desc3.putInteger(cTID("Mgnt"), 80);
desc3.putBoolean(sTID("useTint"), false);
var desc4 = new ActionDescriptor();
desc4.putDouble(cTID("Rd  "), 225.000457763672);
desc4.putDouble(cTID("Grn "), 211.000671386719);
desc4.putDouble(cTID("Bl  "), 179.001159667969);
desc3.putObject(sTID("tintColor"), sTID("RGBColor"), desc4);
desc2.putObject(cTID("Type"), cTID("BanW"), desc3);
desc1.putObject(cTID("Usng"), cTID("AdjL"), desc2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step7(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Mltp"));
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step8(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 75);
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step9(enabled, withDialog) {
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

function step10(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Darken II");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step11(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "Darken I");
desc1.putReference(cTID("null"), ref1);
desc1.putEnumerated(sTID("selectionModifier"), sTID("selectionModifierType"), sTID("addToSelectionContinuous"));
desc1.putBoolean(cTID("MkVs"), false);
executeAction(sTID("select"), desc1, dialogMode);
}

function step12(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(sTID("layerSection"));
desc1.putReference(cTID("null"), ref1);
var ref2 = new ActionReference();
ref2.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("From"), ref2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step13(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putClass(cTID("Nw  "), cTID("Chnl"));
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
desc1.putReference(cTID("At  "), ref1);
desc1.putEnumerated(cTID("Usng"), cTID("UsrM"), cTID("HdAl"));
executeAction(sTID("make"), desc1, dialogMode);
}

function step14(enabled, withDialog) {
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

function step15(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Eyeshadow");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step16(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
executeAction(sTID("select"), desc1, dialogMode);
}

function step17(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 75);
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step18(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putProperty(cTID("Clr "), cTID("Clrs"));
desc1.putReference(cTID("null"), ref1);
executeAction(sTID("reset"), desc1, dialogMode);
}
step1();
step2();
step3();
step4();
step5();
step6();
step7();
step8();
step9();
step10();
step11();
step12();
step13();
step14();
step15();
step16();
step17();
step18();
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.TJYY = TJYY;
