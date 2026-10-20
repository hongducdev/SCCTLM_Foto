// Phím người dùng đánh dấu: lọc dữ liệu hỏng, bật/tắt, lưu bền. Không cần Photoshop.
const assert = require('node:assert/strict');
const path = require('node:path');

const store = {};
global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
};
const reserved = require(path.join(__dirname, '..', 'js', 'shortcut-reserved-keys.js'));

assert.deepEqual(reserved.clean(['F4', 'F4', 'Shift+F7', 'F1', 'F13', 'Alt+F4', 7, null, 'Ctrl+Shift+F12']), ['F4', 'Shift+F7', 'Ctrl+Shift+F12'],
    'keep only valid, unique F2-F12 keys');
assert.deepEqual(reserved.clean('not a list'), [], 'non-array data is ignored');

assert.deepEqual(reserved.toggle([], 'F4'), { list: ['F4'], reserved: true }, 'unmarked key becomes marked');
assert.deepEqual(reserved.toggle(['F4', 'F5'], 'F4'), { list: ['F5'], reserved: false }, 'marked key is unmarked');
assert.deepEqual(reserved.toggle(['F4'], 'F1'), { list: ['F4'], reserved: false }, 'invalid key is never added');
const input = ['F4'];
reserved.toggle(input, 'F5');
assert.deepEqual(input, ['F4'], 'toggle does not mutate its input');

assert.deepEqual(reserved.list(), [], 'empty store');
assert.equal(reserved.flip('F4'), true);
assert.equal(reserved.has('F4'), true);
assert.equal(reserved.has('Shift+F4'), false, 'Shift+F4 is a different key from F4');
assert.equal(reserved.flip('F4'), false);
assert.equal(reserved.has('F4'), false);

store.dr7ReservedKeys = '{broken';
const warn = console.warn;
console.warn = () => {};                                   // the corrupt-data warning is expected here
assert.deepEqual(reserved.list(), [], 'corrupt storage falls back to empty');
console.warn = warn;

console.log('PASS: reserved shortcut keys');
