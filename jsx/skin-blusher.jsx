/*
 * Blusher (TJSH): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function TJSH() {
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
var desc4 = new ActionDescriptor();
desc4.putString(cTID("Nm  "), "Foreground to Background");
desc4.putEnumerated(cTID("GrdF"), cTID("GrdF"), cTID("CstS"));
desc4.putDouble(cTID("Intr"), 4096);
var list1 = new ActionList();
var desc5 = new ActionDescriptor();
var desc6 = new ActionDescriptor();
desc6.putDouble(cTID("Rd  "), 157.000005841255);
desc6.putDouble(cTID("Grn "), 106.0000012815);
desc6.putDouble(cTID("Bl  "), 78.0000029504299);
desc5.putObject(cTID("Clr "), sTID("RGBColor"), desc6);
desc5.putEnumerated(cTID("Type"), cTID("Clry"), cTID("UsrS"));
desc5.putInteger(cTID("Lctn"), 0);
desc5.putInteger(cTID("Mdpn"), 50);
list1.putObject(cTID("Clrt"), desc5);
var desc7 = new ActionDescriptor();
var desc8 = new ActionDescriptor();
desc8.putDouble(cTID("Rd  "), 0);
desc8.putDouble(cTID("Grn "), 0);
desc8.putDouble(cTID("Bl  "), 0);
desc7.putObject(cTID("Clr "), sTID("RGBColor"), desc8);
desc7.putEnumerated(cTID("Type"), cTID("Clry"), cTID("UsrS"));
desc7.putInteger(cTID("Lctn"), 4096);
desc7.putInteger(cTID("Mdpn"), 50);
list1.putObject(cTID("Clrt"), desc7);
desc4.putList(cTID("Clrs"), list1);
var list2 = new ActionList();
var desc9 = new ActionDescriptor();
desc9.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
desc9.putInteger(cTID("Lctn"), 0);
desc9.putInteger(cTID("Mdpn"), 50);
list2.putObject(cTID("TrnS"), desc9);
var desc10 = new ActionDescriptor();
desc10.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
desc10.putInteger(cTID("Lctn"), 4096);
desc10.putInteger(cTID("Mdpn"), 50);
list2.putObject(cTID("TrnS"), desc10);
desc4.putList(cTID("Trns"), list2);
desc3.putObject(cTID("Grad"), cTID("Grdn"), desc4);
desc2.putObject(cTID("Type"), cTID("GdMp"), desc3);
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
var desc3 = new ActionDescriptor();
desc3.putString(cTID("Nm  "), "Custom");
desc3.putEnumerated(cTID("GrdF"), cTID("GrdF"), cTID("CstS"));
desc3.putDouble(cTID("Intr"), 4096);
var list1 = new ActionList();
var desc4 = new ActionDescriptor();
var desc5 = new ActionDescriptor();
desc5.putDouble(cTID("Rd  "), 223.000001907349);
desc5.putDouble(cTID("Grn "), 39.3540854752064);
desc5.putDouble(cTID("Bl  "), 47.7782106399536);
desc4.putObject(cTID("Clr "), sTID("RGBColor"), desc5);
desc4.putEnumerated(cTID("Type"), cTID("Clry"), cTID("UsrS"));
desc4.putInteger(cTID("Lctn"), 0);
desc4.putInteger(cTID("Mdpn"), 50);
list1.putObject(cTID("Clrt"), desc4);
var desc6 = new ActionDescriptor();
var desc7 = new ActionDescriptor();
desc7.putDouble(cTID("Rd  "), 237.996368408203);
desc7.putDouble(cTID("Grn "), 211.996765136719);
desc7.putDouble(cTID("Bl  "), 187.997131347656);
desc6.putObject(cTID("Clr "), sTID("RGBColor"), desc7);
desc6.putEnumerated(cTID("Type"), cTID("Clry"), cTID("UsrS"));
desc6.putInteger(cTID("Lctn"), 4096);
desc6.putInteger(cTID("Mdpn"), 50);
list1.putObject(cTID("Clrt"), desc6);
desc3.putList(cTID("Clrs"), list1);
var list2 = new ActionList();
var desc8 = new ActionDescriptor();
desc8.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
desc8.putInteger(cTID("Lctn"), 0);
desc8.putInteger(cTID("Mdpn"), 50);
list2.putObject(cTID("TrnS"), desc8);
var desc9 = new ActionDescriptor();
desc9.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
desc9.putInteger(cTID("Lctn"), 4096);
desc9.putInteger(cTID("Mdpn"), 50);
list2.putObject(cTID("TrnS"), desc9);
desc3.putList(cTID("Trns"), list2);
desc2.putObject(cTID("Grad"), cTID("Grdn"), desc3);
desc1.putObject(cTID("T   "), cTID("GdMp"), desc2);
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
desc2.putString(cTID("Nm  "), "Blusher");
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
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 50);
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step6(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
executeAction(sTID("copyToLayer"), undefined, dialogMode);
}

function step7(enabled, withDialog) {
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
desc2.putString(cTID("Nm  "), "Darken");
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Drkn"));
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Mltp"));
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
ref1.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("null"), ref1);
var desc2 = new ActionDescriptor();
desc2.putUnitDouble(cTID("Opct"), cTID("#Prc"), 30);
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
desc2.putString(cTID("Nm  "), "Hue");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step15(enabled, withDialog) {
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
desc3.putInteger(cTID("H   "), -1);
desc3.putInteger(cTID("Strt"), 5);
desc3.putInteger(cTID("Lght"), 0);
list1.putObject(cTID("Hst2"), desc3);
var desc4 = new ActionDescriptor();
desc4.putInteger(cTID("LclR"), 2);
desc4.putInteger(cTID("BgnR"), 15);
desc4.putInteger(cTID("BgnS"), 45);
desc4.putInteger(cTID("EndS"), 75);
desc4.putInteger(cTID("EndR"), 105);
desc4.putInteger(cTID("H   "), -2);
desc4.putInteger(cTID("Strt"), 5);
desc4.putInteger(cTID("Lght"), 0);
list1.putObject(cTID("Hst2"), desc4);
desc2.putList(cTID("Adjs"), list1);
desc1.putObject(cTID("T   "), cTID("HStr"), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step16(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "Blusher");
desc1.putReference(cTID("null"), ref1);
desc1.putEnumerated(sTID("selectionModifier"), sTID("selectionModifierType"), sTID("addToSelectionContinuous"));
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
ref1.putClass(sTID("layerSection"));
desc1.putReference(cTID("null"), ref1);
var ref2 = new ActionReference();
ref2.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
desc1.putReference(cTID("From"), ref2);
executeAction(sTID("make"), desc1, dialogMode);
}

function step18(enabled, withDialog) {
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

function step19(enabled, withDialog) {
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
desc2.putString(cTID("Nm  "), "Blusher");
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
ref1.putProperty(cTID("Clr "), cTID("Clrs"));
desc1.putReference(cTID("null"), ref1);
executeAction(sTID("reset"), desc1, dialogMode);
}

function step22(enabled, withDialog) {
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
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.TJSH = TJSH;
