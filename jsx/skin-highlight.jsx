/*
 * Highlight (skin colour fill + white-brush mask group) (GGXS): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function GGXS() {
function step1(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(sTID("contentLayer"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
var desc3 = new ActionDescriptor();
var desc4 = new ActionDescriptor();
desc4.putDouble(cTID("Rd  "), 221.000518798828);
desc4.putDouble(cTID("Grn "), 161.001434326172);
desc4.putDouble(cTID("Bl  "), 129.001922607422);
desc3.putObject(cTID("Clr "), sTID("RGBColor"), desc4);
desc2.putObject(cTID("Type"), sTID("solidColorLayer"), desc3);
desc1.putObject(cTID("Usng"), sTID("contentLayer"), desc2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step2(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Skin Color");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
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
var list1 = new ActionList();
var desc3 = new ActionDescriptor();
var ref2 = new ActionReference();
ref2.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Gry "));
desc3.putReference(cTID("Chnl"), ref2);
desc3.putInteger(cTID("SrcB"), 0);
desc3.putInteger(cTID("Srcl"), 0);
desc3.putInteger(cTID("SrcW"), 255);
desc3.putInteger(cTID("Srcm"), 255);
desc3.putInteger(cTID("DstB"), 125);
desc3.putInteger(cTID("Dstl"), 255);
desc3.putInteger(cTID("DstW"), 255);
desc3.putInteger(cTID("Dstt"), 255);
list1.putObject(cTID("Blnd"), desc3);
desc2.putList(cTID("Blnd"), list1);
var desc4 = new ActionDescriptor();
desc4.putUnitDouble(cTID("Scl "), cTID("#Prc"), 416.666666666667);
desc2.putObject(cTID("Lefx"), cTID("Lefx"), desc4);
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
ref1.putClass(sTID("layerSection"));
desc1.putReference(cTID("null"), ref1);
var ref2 = new ActionReference();
ref2.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("From"), ref2);
executeAction(sTID("make"), desc1, dialogMode);
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
desc2.putString(cTID("Nm  "), "Mattifier Powder");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step6(enabled, withDialog) {
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

function step7(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(cTID("PbTl"));
desc1.putReference(cTID("null"), ref1);
executeAction(sTID("select"), desc1, dialogMode);
}

function step8(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putProperty(cTID("Clr "), cTID("FrgC"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("H   "), cTID("#Ang"), 0);
desc2.putDouble(cTID("Strt"), 0);
desc2.putDouble(cTID("Brgh"), 100);
desc1.putObject(cTID("T   "), cTID("HSBC"), desc2);
desc1.putString(cTID("Srce"), "photoshopPicker");
executeAction(sTID("set"), desc1, dialogMode);
}

function step9(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putProperty(cTID("Clr "), cTID("BckC"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("H   "), cTID("#Ang"), 0);
desc2.putDouble(cTID("Strt"), 0);
desc2.putDouble(cTID("Brgh"), 0);
desc1.putObject(cTID("T   "), cTID("HSBC"), desc2);
desc1.putString(cTID("Srce"), "photoshopPicker");
executeAction(sTID("set"), desc1, dialogMode);
}

function step10(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "Skin Color");
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
var list1 = new ActionList();
list1.putInteger(91);
desc1.putList(cTID("LyrI"), list1);
executeAction(sTID("select"), desc1, dialogMode);
}

function step11(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "L\u1ea5y m\u00e0u da");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step12(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "Mattifier Powder");
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
var list1 = new ActionList();
list1.putInteger(92);
desc1.putList(cTID("LyrI"), list1);
executeAction(sTID("select"), desc1, dialogMode);
}

function step13(enabled, withDialog) {
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

function step14(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "T\u1ea9y b\u1eb1ng c\u1ecd tr\u1eafng");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
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
step9();
step10();
step11();
step12();
step13();
step14();
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.GGXS = GGXS;
