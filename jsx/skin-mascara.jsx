/*
 * Mascara (JMXS): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function JMXS() {
function step1(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putClass(cTID("Lyr "));
desc1.putReference(cTID("null"), ref1);
executeAction(sTID("make"), desc1, dialogMode);
}

function step2(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putBoolean(cTID("Dplc"), true);
executeAction(sTID("mergeVisible"), desc1, dialogMode);
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
desc3.putInteger(cTID("SrcW"), 52);
desc3.putInteger(cTID("Srcm"), 109);
desc3.putInteger(cTID("DstB"), 0);
desc3.putInteger(cTID("Dstl"), 0);
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Mltp"));
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
desc3.putInteger(cTID("SrcW"), 50);
desc3.putInteger(cTID("Srcm"), 100);
desc3.putInteger(cTID("DstB"), 0);
desc3.putInteger(cTID("Dstl"), 0);
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
desc2.putString(cTID("Nm  "), "Mascara");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step7(enabled, withDialog) {
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

function step8(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Chnl"), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
executeAction(sTID("select"), desc1, dialogMode);
}

function step9(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 70);
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step10(enabled, withDialog) {
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
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.JMXS = JMXS;
