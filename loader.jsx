#target photoshop
/*
 * Retouch Panel — nạp lõi ExtendScript.
 * Thứ tự: 4.jsxbin (helper + hộp thoại Chữ/Logo), rồi toàn bộ *.jsx trong jsx/.
 * (main.jsx được nạp trong vòng lặp *.jsx nên thứ tự không phụ thuộc tên file.)
 *
 * LƯU Ý về đường dẫn: CEP có thể đưa $.fileName ở dạng URI
 *   "file:///e:/Programs/Adobe%20Photoshop%202022/loader.jsx"  hoặc  "/e/Programs/Adobe%20Photoshop%202022/loader.jsx"
 * nên phải giải %20 và đổi /e/ -> E:/ trước khi dùng. (Lỗi IOError trước đây do chỗ này.)
 */
if (typeof $ == 'undefined') { $ = {}; }
$._ext = $._ext || {};

// Thư mục chứa loader.jsx, chuẩn hoá từ mọi dạng $.fileName trả về
function dr7ScriptDir() {
    var p = String($.fileName == null ? '' : $.fileName);
    try { p = decodeURI(p); } catch (e) { }
    p = p.replace(/\\/g, '/');                        // \ -> /
    p = p.replace(/^file:\/\/\//i, '');              // file:///e:/... -> e:/...
    p = p.replace(/^file:\/\//i, '');                 // file://e:/...  -> e:/...
    if (/^\/[a-zA-Z]\//.test(p)) {                     // /e/Programs/... -> E:/Programs/...
        p = p.charAt(1).toUpperCase() + ':' + p.slice(2);
    }
    var i = p.lastIndexOf('/');
    return i > 0 ? p.substring(0, i) : '';
}

// Thư mục panel: ưu tiên $.dr7Base do js/panel.js truyền vào (lấy từ CEP),
// chỉ suy từ $.fileName khi chạy tay từ File > Scripts.
function dr7Here() {
    if (typeof $.dr7Base == 'string' && $.dr7Base.length > 0) {
        return String($.dr7Base).replace(/\\/g, '/').replace(/\/+$/, '');
    }
    return dr7ScriptDir();
}

$.dr7LoadErrors = [];
$.dr7Ready = false;
$.dr7Commands = {};
$._ext.evalFile = function (path) {
    try {
        $.evalFile(path);
    } catch (e) {
        $.dr7LoadErrors.push(String(path) + ': ' + e + ' (line ' + e.line + ')');
    }
};

$._ext.evalFiles = function (jsxFolderPath) {
    var folder = new Folder(jsxFolderPath);
    if (!folder.exists) {
        $._ext.evalFile(jsxFolderPath + '/main.jsx');    // báo lỗi 1 lần với đường dẫn rõ ràng
        return;
    }
    var files = folder.getFiles('*.jsx');
    for (var i = 0; i < files.length; i += 1) {
        $._ext.evalFile(files[i]);
    }
};

(function () {
    var here = dr7Here();
    $.dr7Base = here;                                    // lưu lại để lần sau/tiện debug
    // Cờ cho các file jsx/ chạy được độc lập (vd brush-pen-pressure.jsx):
    // đang nạp từ loader thì chỉ đăng ký lệnh, không tự chạy.
    $.dr7Loading = true;
    $.dr7SkinFns = {};                                   // a reload must not keep closures of a skin file that no longer loads
    try {
        $._ext.evalFile(here + '/jsx/4.jsxbin');
        $._ext.evalFiles(here + '/jsx');
    } finally {
        $.dr7Loading = false;
    }
    // jsx/main.jsx: skin-*.jsx register in $.dr7SkinFns while loading, the command table is built once all are in
    if (typeof $.dr7BuildSkinCommands === 'function') $.dr7BuildSkinCommands();
    else $.dr7LoadErrors.push('jsx/main.jsx did not define $.dr7BuildSkinCommands');
    for (var name in $.mhkReplacements) {
        if ($.mhkReplacements.hasOwnProperty(name)) $.dr7Commands[name] = $.mhkReplacements[name];
    }
    for (var pName in $.presetLutCommands) {
        if ($.presetLutCommands.hasOwnProperty(pName)) $.dr7Commands[pName] = $.presetLutCommands[pName];
    }
    $.dr7Ready = $.dr7LoadErrors.length === 0;
}());
