/*
 * Skin whitening (MBPF): action replay moved verbatim from jsx/main.jsx.
 * Registered through $.dr7SkinFns because evalFile scopes cannot see each other's declarations;
 * jsx/main.jsx ($.dr7BuildSkinCommands) turns the registry into $.dr7Commands.
 */
function MBPF() {
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
desc2.putString(cTID("Nm  "), "MBPF");
desc1.putObject(cTID("T   "), cTID("Lyr "), desc2);
executeAction(sTID("set"), desc1, dialogMode);
}

function step4(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putBoolean(cTID("Dplc"), true);
executeAction(sTID("mergeVisible"), desc1, dialogMode);
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
desc2.putString(cTID("Nm  "), "L\u00e0m tr\u1eafng da");
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
ref1.putName(cTID("Lyr "), "MBPF");
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
var list1 = new ActionList();
list1.putInteger(149);
desc1.putList(cTID("LyrI"), list1);
executeAction(sTID("select"), desc1, dialogMode);
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
var list1 = new ActionList();
list1.putInteger(149);
desc1.putList(cTID("LyrI"), list1);
executeAction(sTID("delete"), desc1, dialogMode);
}

function step8(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
var ref1 = new ActionReference();
ref1.putName(cTID("Lyr "), "L\u00e0m tr\u1eafng da");
desc1.putReference(cTID("null"), ref1);
desc1.putBoolean(cTID("MkVs"), false);
var list1 = new ActionList();
list1.putInteger(150);
desc1.putList(cTID("LyrI"), list1);
executeAction(sTID("select"), desc1, dialogMode);
}

function step9(enabled, withDialog) {
if ((enabled != undefined) && (!enabled)) {
return;
}
var dialogMode = withDialog ? DialogModes.ALL : DialogModes.NO;
var desc1 = new ActionDescriptor();
desc1.putString(cTID("CMod"), "Filter");
desc1.putEnumerated(cTID("Sett"), cTID("Sett"), cTID("Cst "));
desc1.putEnumerated(cTID("WBal"), cTID("WBal"), cTID("Cst "));
desc1.putInteger(cTID("Temp"), -2);
desc1.putInteger(cTID("Tint"), 0);
desc1.putBoolean(cTID("CtoG"), false);
desc1.putInteger(cTID("Strt"), 0);
desc1.putInteger(cTID("Shrp"), 0);
desc1.putInteger(cTID("LNR "), 0);
desc1.putInteger(cTID("CNR "), 0);
desc1.putInteger(cTID("VigA"), 0);
desc1.putInteger(cTID("BlkB"), 0);
desc1.putInteger(cTID("RHue"), 0);
desc1.putInteger(cTID("RSat"), -18);
desc1.putInteger(cTID("GHue"), 0);
desc1.putInteger(cTID("GSat"), 0);
desc1.putInteger(cTID("BHue"), 0);
desc1.putInteger(cTID("BSat"), 0);
desc1.putInteger(cTID("Vibr"), 0);
desc1.putInteger(cTID("HA_R"), 0);
desc1.putInteger(cTID("HA_O"), 0);
desc1.putInteger(cTID("HA_Y"), 0);
desc1.putInteger(cTID("HA_G"), 0);
desc1.putInteger(cTID("HA_A"), 0);
desc1.putInteger(cTID("HA_B"), 0);
desc1.putInteger(cTID("HA_P"), 0);
desc1.putInteger(cTID("HA_M"), 0);
desc1.putInteger(cTID("SA_R"), 0);
desc1.putInteger(cTID("SA_O"), -13);
desc1.putInteger(cTID("SA_Y"), 0);
desc1.putInteger(cTID("SA_G"), 0);
desc1.putInteger(cTID("SA_A"), 0);
desc1.putInteger(cTID("SA_B"), 0);
desc1.putInteger(cTID("SA_P"), 0);
desc1.putInteger(cTID("SA_M"), 0);
desc1.putInteger(cTID("LA_R"), 0);
desc1.putInteger(cTID("LA_O"), 20);
desc1.putInteger(cTID("LA_Y"), 0);
desc1.putInteger(cTID("LA_G"), 0);
desc1.putInteger(cTID("LA_A"), 0);
desc1.putInteger(cTID("LA_B"), 0);
desc1.putInteger(cTID("LA_P"), 0);
desc1.putInteger(cTID("LA_M"), 0);
desc1.putInteger(cTID("STSH"), 0);
desc1.putInteger(cTID("STSS"), 0);
desc1.putInteger(cTID("STHH"), 0);
desc1.putInteger(cTID("STHS"), 0);
desc1.putInteger(cTID("STB "), 0);
desc1.putInteger(cTID("PC_S"), 0);
desc1.putInteger(cTID("PC_D"), 0);
desc1.putInteger(cTID("PC_L"), 0);
desc1.putInteger(cTID("PC_H"), 0);
desc1.putInteger(cTID("PC_1"), 25);
desc1.putInteger(cTID("PC_2"), 50);
desc1.putInteger(cTID("PC_3"), 75);
desc1.putDouble(cTID("ShpR"), 1);
desc1.putInteger(cTID("ShpD"), 25);
desc1.putInteger(cTID("ShpM"), 0);
desc1.putInteger(cTID("PCVA"), 0);
desc1.putInteger(cTID("GRNA"), 0);
desc1.putInteger(cTID("LPEn"), 0);
desc1.putInteger(cTID("MDis"), 0);
desc1.putInteger(cTID("PerV"), 0);
desc1.putInteger(cTID("PerH"), 0);
desc1.putDouble(cTID("PerR"), 0);
desc1.putInteger(cTID("PerS"), 100);
desc1.putInteger(cTID("PerA"), 0);
desc1.putInteger(cTID("PerU"), 0);
desc1.putDouble(cTID("PerX"), 0);
desc1.putDouble(cTID("PerY"), 0);
desc1.putInteger(cTID("AuCA"), 0);
desc1.putDouble(cTID("Ex12"), 0.25);
desc1.putInteger(cTID("Cr12"), 0);
desc1.putInteger(cTID("Hi12"), 0);
desc1.putInteger(cTID("Sh12"), 27);
desc1.putInteger(cTID("Wh12"), 0);
desc1.putInteger(cTID("Bk12"), 16);
desc1.putInteger(cTID("Cl12"), 0);
desc1.putInteger(cTID("DfPA"), 0);
desc1.putInteger(cTID("DPHL"), 30);
desc1.putInteger(cTID("DPHH"), 70);
desc1.putInteger(cTID("DfGA"), 0);
desc1.putInteger(cTID("DPGL"), 40);
desc1.putInteger(cTID("DPGH"), 60);
desc1.putInteger(cTID("Dhze"), 0);
var list1 = new ActionList();
list1.putInteger(0);
list1.putInteger(0);
list1.putInteger(255);
list1.putInteger(255);
desc1.putList(cTID("Crv "), list1);
var list2 = new ActionList();
list2.putInteger(0);
list2.putInteger(0);
list2.putInteger(255);
list2.putInteger(255);
desc1.putList(cTID("CrvR"), list2);
var list3 = new ActionList();
list3.putInteger(0);
list3.putInteger(0);
list3.putInteger(255);
list3.putInteger(255);
desc1.putList(cTID("CrvG"), list3);
var list4 = new ActionList();
list4.putInteger(0);
list4.putInteger(0);
list4.putInteger(255);
list4.putInteger(255);
desc1.putList(cTID("CrvB"), list4);
desc1.putString(cTID("CamP"), "Embedded");
desc1.putString(cTID("CP_D"), "54650A341B5B5CCAE8442D0B43A92BCE");
desc1.putInteger(cTID("PrVe"), 167772160);
desc1.putString(cTID("Rtch"), "");
desc1.putString(cTID("REye"), "");
desc1.putString(cTID("LCs "), "");
desc1.putString(cTID("Upri"), "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.6-c128 79.159124, 2016/03/18-14:01:55        \">\n <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n  <rdf:Description rdf:about=\"\"\n    xmlns:crs=\"http://ns.adobe.com/camera-raw-settings/1.0/\"\n   crs:UprightVersion=\"151388160\"\n   crs:UprightCenterMode=\"0\"\n   crs:UprightCenterNormX=\"0.5\"\n   crs:UprightCenterNormY=\"0.5\"\n   crs:UprightFocalMode=\"0\"\n   crs:UprightFocalLength35mm=\"35\"\n   crs:UprightPreview=\"False\"\n   crs:UprightTransformCount=\"6\"/>\n </rdf:RDF>\n</x:xmpmeta>\n");
desc1.putString(cTID("GuUr"), "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\" x:xmptk=\"Adobe XMP Core 5.6-c128 79.159124, 2016/03/18-14:01:55        \">\n <rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n  <rdf:Description rdf:about=\"\"\n    xmlns:crs=\"http://ns.adobe.com/camera-raw-settings/1.0/\"\n   crs:UprightFourSegmentsCount=\"0\"/>\n </rdf:RDF>\n</x:xmpmeta>\n");
executeAction(sTID("Adobe Camera Raw Filter"), desc1, dialogMode);
}
// The recorded action ended with "select current state" + "Clear History",
// which wiped the user's whole undo history; those two steps were removed.
step1();
step2();
step3();
step4();
step5();
step6();
step7();
step8();
step9();
}

$.dr7SkinFns = $.dr7SkinFns || {};
$.dr7SkinFns.MBPF = MBPF;
