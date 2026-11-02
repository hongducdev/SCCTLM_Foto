// Run: node tests/check-error-messages.js
// Every error shown to a user must be a Vietnamese sentence with a next step, never code, a path or a raw Photoshop string.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
const context = vm.createContext({ window });
for (const file of ['color-mode-guard.js', 'error-messages.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const errors = window.scctlmFotoErrors;

const FORBIDDEN = /SCCTLM_[A-Z_]+\b|\bFile:|\bLine:|[A-Za-z]*Error\b|\bundefined\b|\bnull\b|\[object|\bat \S+:\d+|[A-Za-z]:[\\/]|\/Users\/|https?:\/\/|EvalScript|\(lỗi |\bNaN\b/;
const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function assertClear(result, input) {
    const shown = `${result.title}\n${result.message}\n${result.action}`;
    assert.ok(result.title && result.message && result.action, `title, message and action are all set for ${JSON.stringify(input)}`);
    assert.doesNotMatch(shown, FORBIDDEN, `no code in the text for ${JSON.stringify(input)}: ${shown}`);
    assert.match(result.message, VIETNAMESE, `message is Vietnamese for ${JSON.stringify(input)}`);
}

const photoshop = (text) => `SCCTLM_ERROR: Error: ${text}\nFile: C:\\Users\\Ai\\AppData\\Roaming\\Adobe\\CEP\\extensions\\SCCTLM_Foto\\jsx\\skin-lip-enhancer.jsx\nLine: 42`;
const raws = [
    [photoshop('General Photoshop error occurred. This functionality may not be available in this version of Photoshop.'), { source: 'command', label: 'Son môi' }],
    [photoshop('The command "Make" is not currently available'), { source: 'command', label: 'Phủ phấn' }],
    [photoshop('Could not complete the command because there is not enough memory (RAM)'), { source: 'command', label: 'Làm da' }],
    [photoshop('The target layer is locked'), { source: 'command', label: 'Highlight' }],
    [photoshop('No such element'), { source: 'command', label: 'Lông mi' }],
    [photoshop('The layer cannot contain text'), { source: 'command', label: 'Chữ' }],
    [photoshop('weird new thing nobody mapped'), { source: 'command', label: 'Trắng da' }],
    ['SCCTLM_ERROR#8800: ReferenceError: foo is not defined\nFile: x.jsx\nLine: 3', { source: 'command' }],
    ['SCCTLM_ERROR: Missing command: ZCZQ\nFile: undefined\nLine: undefined', { source: 'command', label: 'Son môi' }],
    ['SCCTLM_NOT_READY', { source: 'command' }],
    ['EvalScript error.', { source: 'command' }],
    ['SCCTLM_MISSING', { source: 'cep' }],
    ['SCCTLM_NOT_RGB:DocumentMode.CMYK', { source: 'command', label: 'Son môi' }],
    ['SCCTLM_NOT_RGB:DocumentMode.GRAYSCALE', { source: 'command' }],
    ['thiếu file loader.jsx trong thư mục panel', { source: 'load' }],
    ['C:\\Users\\Ai\\x\\jsx\\main.jsx: ReferenceError: x (line 9)\njsx/main.jsx did not define $.scctlmFotoBuildSkinCommands', { source: 'load' }],
    ['skin command not registered: ZCZQ', { source: 'load' }],
    [new Error('Không kết nối được GitHub'), { source: 'update' }],
    [new Error('GitHub 500: https://api.github.com/repos/x/y'), { source: 'update' }],
    [new Error('GitHub tạm giới hạn lượt kiểm tra từ mạng này, hãy thử lại sau ít phút.'), { source: 'update' }],
    [new Error('Bản cập nhật không có chữ ký hợp lệ — đã huỷ, không thay đổi file nào.'), { source: 'update' }],
    [new Error('File tải về không khớp chữ ký: index.html — đã huỷ, không thay đổi file nào.'), { source: 'update' }],
    [new Error('Không ghi được C:/Users/Ai/AppData/x/y.js (lỗi ERR_NO_ACCESS)'), { source: 'update' }],
    [new Error('File tạm ghi sai: js/panel.js — đã huỷ, không thay đổi file nào.'), { source: 'update' }],
    [new Error('Bản v1.0 không mới hơn bản đang cài (v1.0) — đã huỷ.'), { source: 'update' }],
    [new Error('YouTube 503'), { source: 'explore' }],
    [new Error('Không kết nối được YouTube'), { source: 'explore' }],
    [new TypeError("Cannot read properties of undefined (reading 'x')"), { source: 'update' }],
    [new TypeError("Cannot read properties of undefined (reading 'x')"), { source: 'cep' }],
    ['[object Object]', { source: 'command' }],
    ['', { source: 'command' }],
    [undefined, { source: 'command' }],
    [null, { source: 'load' }],
    [{ weird: true }, undefined],
    [photoshop('whatever'), { source: 'nonsense' }]
];
for (const [raw, ctx] of raws) assertClear(errors.explain(raw, ctx), raw);

const notRgb = errors.explain('SCCTLM_NOT_RGB:DocumentMode.CMYK', { label: 'Son môi' });
assert.match(notRgb.message, /CMYK/);
assert.match(notRgb.message, /«Son môi»/);
assert.match(notRgb.action, /Image > Mode > RGB Color/);

assert.match(errors.explain('SCCTLM_ERROR: ' + 'x'.repeat(5000), { label: 'A' }).message, /«A»/);
assert.match(errors.explain(photoshop('weird'), { source: 'command', label: 'Son môi' }).message, /«Son môi»/, 'a .jsx path in a command error is not a load failure');
assert.match(errors.explain('SCCTLM_ERROR#0: Error: SCCTLM_NOT_RGB:DocumentMode.LAB\nFile: a.jsx\nLine: 1', { label: 'Làm da' }).message, /Lab/);
assert.doesNotMatch(errors.line(photoshop('General Photoshop error'), { label: 'Son môi' }), /\n/, 'line() is single-line');

const kept = errors.recent();
assert.ok(kept.length > 0 && kept.length <= 20, 'raw strings are kept for the diagnostics report, capped at 20');
assert.ok(kept.every((item) => item.raw.length <= 600), 'each kept string is capped');
assert.ok(kept.some((item) => /General Photoshop error|loader|YouTube|GitHub|weird|nobody/.test(item.raw)), 'raw text is available there');

// Sentences written in jsx/ for users must survive the run() wrapper (SCCTLM_ERROR#n: Error: ...\nFile:...\nLine:...)
const written = errors.explain(photoshop('Ảnh đã đổi kích thước, hãy bấm Áp dụng lại.'), { source: 'command', label: 'Watermark' });
assert.equal(written.message, 'Ảnh đã đổi kích thước, hãy bấm Áp dụng lại.');
// Presets / MHK effects throw English "require RGB" text
const preset = errors.explain(photoshop('Presets require RGB 8-bit or 16-bit'), { source: 'command', label: 'Preset' });
assert.match(preset.action, /RGB Color/);
assert.match(preset.title, /RGB/);
// Patterns look at the message only, never at the file path of the failing script
const pathy = errors.explain('SCCTLM_ERROR#1: Error: weird\nFile: C:\\Users\\Ram\\Lock\\x.jsx\nLine: 1', { source: 'command', label: 'A' });
assert.match(pathy.message, /Không hoàn thành được «A»/);

// Missing bundled files are an install problem, not "pick the right layer"
for (const text of ['File not found: C:\\Users\\Ai\\ext\\presets\\a.xmp', 'Missing bundled preset: C:\\x\\a.xmp', 'Missing colour preset: fuji/001',
    'Missing mhk-patterns.pat', 'Cannot open file: C:\\x\\a.icc', 'Preset file is empty: C:\\x\\a.xmp', 'Missing bundled actions file: C:\\x\\a.atn']) {
    const missing = errors.explain(photoshop(text), { source: 'command', label: 'Preset' });
    assert.match(missing.title, /thiếu file/i, text);
    assert.match(missing.action, /Cai-dat-SCCTLM_Foto\.bat/, text);
    assertClear(missing, text);
}
assert.match(errors.explain(photoshop('No such element'), { source: 'command', label: 'A' }).title, /Chưa chọn đúng lớp/, 'real layer errors keep their own message');

// A sentence written for the user keeps its meaning when it carries a path; the path itself is dropped
const logo = errors.explain(photoshop('Không tìm thấy file logo: C:\\Users\\Ai\\Pictures\\logo.png'), { source: 'command', label: 'Khung ảnh' });
assert.equal(logo.message, 'Không tìm thấy file logo.');
assertClear(logo, 'logo');
const image = errors.explain(photoshop('Không tìm thấy ảnh: /Users/ai/Pictures/a.jpg'), { source: 'command', label: 'Watermark' });
assert.equal(image.message, 'Không tìm thấy ảnh.');
assertClear(image, 'image');
assert.equal(errors.explain(new Error('Hãy mở lại tệp C:\\x\\y rồi thử lại'), { source: 'update' }).message, 'Hãy mở lại tệp rồi thử lại', 'only the path token is removed');

console.log('check-error-messages: OK');
