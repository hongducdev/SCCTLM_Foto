/*
 * Lip Enhancer (ZCZQ): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function ZCZQ() {
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
desc4.putDouble(cTID("Hrzn"), 15);
desc4.putDouble(cTID("Vrtc"), 0);
list2.putObject(cTID("Pnt "), desc4);
var desc5 = new ActionDescriptor();
desc5.putDouble(cTID("Hrzn"), 140);
desc5.putDouble(cTID("Vrtc"), 113);
list2.putObject(cTID("Pnt "), desc5);
var desc6 = new ActionDescriptor();
desc6.putDouble(cTID("Hrzn"), 255);
desc6.putDouble(cTID("Vrtc"), 247);
list2.putObject(cTID("Pnt "), desc6);
desc3.putList(cTID("Crv "), list2);
list1.putObject(cTID("CrvA"), desc3);
var desc7 = new ActionDescriptor();
var ref3 = new ActionReference();
ref3.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Rd  "));
desc7.putReference(cTID("Chnl"), ref3);
var list3 = new ActionList();
var desc8 = new ActionDescriptor();
desc8.putDouble(cTID("Hrzn"), 0);
desc8.putDouble(cTID("Vrtc"), 0);
list3.putObject(cTID("Pnt "), desc8);
var desc9 = new ActionDescriptor();
desc9.putDouble(cTID("Hrzn"), 115);
desc9.putDouble(cTID("Vrtc"), 142);
list3.putObject(cTID("Pnt "), desc9);
var desc10 = new ActionDescriptor();
desc10.putDouble(cTID("Hrzn"), 255);
desc10.putDouble(cTID("Vrtc"), 255);
list3.putObject(cTID("Pnt "), desc10);
desc7.putList(cTID("Crv "), list3);
list1.putObject(cTID("CrvA"), desc7);
var desc11 = new ActionDescriptor();
var ref4 = new ActionReference();
ref4.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Grn "));
desc11.putReference(cTID("Chnl"), ref4);
var list4 = new ActionList();
var desc12 = new ActionDescriptor();
desc12.putDouble(cTID("Hrzn"), 0);
desc12.putDouble(cTID("Vrtc"), 0);
list4.putObject(cTID("Pnt "), desc12);
var desc13 = new ActionDescriptor();
desc13.putDouble(cTID("Hrzn"), 135);
desc13.putDouble(cTID("Vrtc"), 141);
list4.putObject(cTID("Pnt "), desc13);
var desc14 = new ActionDescriptor();
desc14.putDouble(cTID("Hrzn"), 255);
desc14.putDouble(cTID("Vrtc"), 255);
list4.putObject(cTID("Pnt "), desc14);
desc11.putList(cTID("Crv "), list4);
list1.putObject(cTID("CrvA"), desc11);
var desc15 = new ActionDescriptor();
var ref5 = new ActionReference();
ref5.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Bl  "));
desc15.putReference(cTID("Chnl"), ref5);
var list5 = new ActionList();
var desc16 = new ActionDescriptor();
desc16.putDouble(cTID("Hrzn"), 0);
desc16.putDouble(cTID("Vrtc"), 0);
list5.putObject(cTID("Pnt "), desc16);
var desc17 = new ActionDescriptor();
desc17.putDouble(cTID("Hrzn"), 146);
desc17.putDouble(cTID("Vrtc"), 145);
list5.putObject(cTID("Pnt "), desc17);
var desc18 = new ActionDescriptor();
desc18.putDouble(cTID("Hrzn"), 255);
desc18.putDouble(cTID("Vrtc"), 255);
list5.putObject(cTID("Pnt "), desc18);
desc15.putList(cTID("Crv "), list5);
list1.putObject(cTID("CrvA"), desc15);
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
desc2.putString(cTID("Nm  "), "Dudak belirginle\u015ftirici");
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Lip Enhancer");
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 60);
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
ref1.putClass(cTID("AdjL"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
var desc3 = new ActionDescriptor();
desc3.putEnumerated(sTID("presetKind"), sTID("presetKindType"), sTID("presetKindDefault"));
desc3.putBoolean(cTID("Clrz"), false);
desc2.putObject(cTID("Type"), cTID("HStr"), desc3);
desc1.putObject(cTID("Usng"), cTID("AdjL"), desc2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step9(enabled, withDialog) {
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
desc3.putInteger(cTID("LclR"), 1);
desc3.putInteger(cTID("BgnR"), 315);
desc3.putInteger(cTID("BgnS"), 345);
desc3.putInteger(cTID("EndS"), 15);
desc3.putInteger(cTID("EndR"), 45);
desc3.putInteger(cTID("H   "), 0);
desc3.putInteger(cTID("Strt"), 15);
desc3.putInteger(cTID("Lght"), 0);
list1.putObject(cTID("Hst2"), desc3);
desc2.putList(cTID("Adjs"), list1);
desc1.putObject(cTID("T   "), cTID("HStr"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step10(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("AdjL"), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
var list1 = new ActionList();
var desc3 = new ActionDescriptor();
desc3.putInteger(cTID("LclR"), 1);
desc3.putInteger(cTID("BgnR"), 315);
desc3.putInteger(cTID("BgnS"), 345);
desc3.putInteger(cTID("EndS"), 15);
desc3.putInteger(cTID("EndR"), 45);
desc3.putInteger(cTID("H   "), -2);
desc3.putInteger(cTID("Strt"), 15);
desc3.putInteger(cTID("Lght"), 0);
list1.putObject(cTID("Hst2"), desc3);
desc2.putList(cTID("Adjs"), list1);
desc1.putObject(cTID("T   "), cTID("HStr"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
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
desc2.putString(cTID("Nm  "), "Hue");
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
ref1.putClass(cTID("Lyr "));
desc1.putReference(cTID("null"), ref1);
executeAction(sTID("make"), desc1, dialogMode);
}

function step13(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putBoolean(cTID("Dplc"), true);
executeAction(sTID("mergeVisible"), desc1, dialogMode);
}

function step14(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putUnitDouble(cTID("Rds "), cTID("#Pxl"), 40);
executeAction(sTID("highPass"), desc1, dialogMode);
}

function step15(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putUnitDouble(cTID("Rds "), cTID("#Pxl"), 3);
executeAction(sTID("gaussianBlur"), desc1, dialogMode);
}

function step16(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("SftL"));
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
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
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 40);
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Detay G\xfc\xe7lendirici");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step19(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), sTID("vividLight"));
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step20(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Detail Enhancer");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step21(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "Lip Enhancer");
desc1.putReference(cTID("null"), ref1);
desc1.putEnumerated(sTID("selectionModifier"), sTID("selectionModifierType"), sTID("addToSelectionContinuous"));
desc1.putBoolean(cTID("MkVs"), false);
executeAction(sTID("select"), desc1, dialogMode);
}

function step22(enabled, withDialog) {
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

function step23(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putString(cTID("Nm  "), "Lip Enhancer");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step24(enabled, withDialog) {
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

function step25(enabled, withDialog) {
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
step19();
step20();
step21();
step22();
step23();
step24();
step25();
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.ZCZQ = ZCZQ;
