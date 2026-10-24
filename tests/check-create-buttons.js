// js/create-action-buttons.js + js/shortcut-key-capture.js + js/shortcut-conflicts.js: nút Tạo nạp bộ Action rồi mới chạy,
// ô phím gán đúng Action, phím trùng thì hỏi ghi đè. DOM giả tối thiểu và cầu nối Photoshop giả (window.dr7*), không cần Photoshop.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const conflicts = require(path.join(__dirname, '..', 'js', 'shortcut-conflicts.js'));
const rim = { set: 'Thumbnail action', action: 'YouTube Rim Light' };
const brush = { set: 'Thumbnail action', action: 'Stroke Brush Path' };
assert.deepEqual(conflicts.find('F9', rim, [], []), [], 'F9 is free');
assert.deepEqual(conflicts.find('F9', rim, [Object.assign({ key: 'F9' }, rim)], []), [], 'the action keeping its own key is no conflict');
assert.deepEqual(conflicts.find('F5', rim, [], []).map(c => c.kind), ['photoshop'], 'F5 = Brush Settings');
assert.deepEqual(conflicts.find('Shift+F7', rim, [Object.assign({ key: 'Shift+F7' }, brush)], ['Shift+F7']).map(c => c.kind),
    ['panel', 'photoshop', 'reserved'], 'every source is listed');
assert.deepEqual(conflicts.find('Ctrl+F5', rim, [], []), [], 'only the exact combination counts');

function element() {
    const classes = new Set();
    return {
        listeners: {}, textContent: '', title: '',
        classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)), contains: name => classes.has(name) },
        querySelector(selector) { return selector === '.create-key-text' ? this.label : null; },
        addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
        click() { (this.listeners.click || []).forEach(fn => fn({})); }
    };
}
const buttons = {};
for (const id of ['brush', 'rim']) {
    buttons['create-' + id] = element();
    buttons['key-' + id] = element();
    buttons['key-' + id].label = element();
}
let keyListener = null;
const document = {
    querySelector(selector) {
        const m = /^\.create-(btn|key)\[data-create="(\w+)"\]$/.exec(selector);
        return m ? buttons[(m[1] === 'btn' ? 'create-' : 'key-') + m[2]] : null;
    },
    addEventListener: (type, fn) => { if (type === 'keydown') keyListener = fn; },
    removeEventListener: (type, fn) => { if (keyListener === fn) keyListener = null; }
};
const store = {};
const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const log = [];
const pending = [];                        // bridge calls waiting for a reply, answered in order by reply()
const dialogs = [];                        // popups shown; answer(true|false) closes the last one
const window = {
    addEventListener() {}, removeEventListener() {},
    localStorage,
    dr7IsBusy: () => pending.length > 0,
    dr7FlashStatus() {},
    dr7Dialog: opts => new Promise(resolve => dialogs.push(Object.assign({ resolve }, opts))),
    dr7EnsureAction: (spec, done) => { log.push('ensure ' + spec.split('\t')[2]); pending.push(done); },
    dr7PlayAction: (spec, done) => { log.push('play ' + spec.split('\t')[2]); pending.push(done); },
    dr7SetupShortcut: (text, done) => { log.push('shortcuts ' + JSON.stringify(text)); pending.push(done); }
};
function CSInterface() {}
CSInterface.prototype.evalScript = (code, done) => done('false');
CSInterface.prototype.registerKeyEventsInterest = () => {};
const context = { window, document, localStorage, CSInterface, console, Promise };
for (const file of ['shortcut-reserved-keys.js', 'shortcut-conflicts.js', 'shortcut-key-capture.js', 'create-action-buttons.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), context);
}
const reply = res => pending.shift()(res);
const press = (keyCode, extra) => keyListener(Object.assign({ keyCode, key: '', preventDefault() {}, stopPropagation() {} }, extra));
const tick = () => new Promise(resolve => setImmediate(resolve));
const answer = async yes => { dialogs[dialogs.length - 1].resolve(yes); await tick(); };
const listen = id => { buttons['key-' + id].click(); reply('DR7_EXISTS'); };
const F5 = 116, F6 = 117, F9 = 120;

(async () => {
    window.dr7InitCreateButtons();
    assert.equal(buttons['key-rim'].label.textContent, '', 'no key yet: the keycap shows its keyboard icon');

    // Tạo khi Photoshop đã có bộ Action: chạy ngay, không dựng lại bộ phím
    buttons['create-rim'].click();
    reply('DR7_EXISTS');
    reply('DR7_OK');
    assert.deepEqual(log.splice(0), ['ensure YouTube Rim Light', 'play YouTube Rim Light']);

    // Phím trống: gán ngay, không hỏi
    listen('rim');
    assert.equal(buttons['key-rim'].label.textContent, '…');
    press(F9);
    reply('DR7_OK');
    assert.equal(dialogs.length, 0);
    assert.deepEqual(log.splice(0), ['ensure YouTube Rim Light', 'shortcuts "F9\\tThumbnail action\\tYouTube Rim Light"']);
    assert.equal(buttons['key-rim'].label.textContent, 'F9');
    assert.ok(buttons['key-rim'].classList.contains('has-key'));

    // F9 đã thuộc Rim Light → hỏi; "Không gán" thì giữ nguyên
    listen('brush');
    press(F9);
    assert.equal(dialogs.length, 1);
    assert.match(dialogs[0].message, /Action "YouTube Rim Light"/);
    assert.doesNotMatch(dialogs[0].message, /Remove the conflicting/, 'no Photoshop menu note for a panel-only clash');
    assert.deepEqual([dialogs[0].confirmText, dialogs[0].cancelText], ['Ghi đè', 'Không gán']);
    assert.equal(keyListener, null, 'the keycap stops listening while the popup is open');
    await answer(false);
    assert.deepEqual(log.splice(0), ['ensure Stroke Brush Path'], 'cancel must not rebuild the shortcut set');
    assert.equal(buttons['key-brush'].label.textContent, '');

    // Hỏi lại, "Ghi đè" → phím chuyển sang Brush, Rim Light mất phím
    listen('brush');
    press(F9);
    await answer(true);
    reply('DR7_OK');
    assert.deepEqual(log.splice(0), ['ensure Stroke Brush Path', 'shortcuts "F9\\tThumbnail action\\tStroke Brush Path"']);
    assert.equal(buttons['key-brush'].label.textContent, 'F9');
    assert.equal(buttons['key-rim'].label.textContent, '');

    // Phím menu của Photoshop (F5 = Brush Settings): hỏi kèm lời nhắc chọn No ở câu hỏi của Photoshop
    listen('rim');
    press(F5);
    assert.match(dialogs[2].message, /Window > Brush Settings/);
    assert.match(dialogs[2].message, /chọn No/);
    await answer(true);
    reply('DR7_OK');
    assert.deepEqual(log.splice(0), ['ensure YouTube Rim Light',
        'shortcuts "F9\\tThumbnail action\\tStroke Brush Path\\nF5\\tThumbnail action\\tYouTube Rim Light"']);

    // Phím đã đánh dấu (bản cũ): ghi đè thì bỏ đánh dấu
    store.dr7ReservedKeys = JSON.stringify(['F6']);
    listen('rim');
    press(F6);
    assert.match(dialogs[3].message, /đánh dấu/);
    await answer(true);
    reply('DR7_OK');
    assert.equal(store.dr7ReservedKeys, '[]');
    assert.equal(buttons['key-rim'].label.textContent, 'F6');
    log.splice(0);

    // Bộ Action vừa được nạp (người dùng đã xoá bộ cũ): dựng lại bộ phím XONG rồi mới chạy Action
    buttons['create-brush'].click();
    reply('DR7_OK');
    assert.equal(log.length, 2, 'playing must wait for the shortcut set rebuild, otherwise the bridge is busy');
    reply('DR7_OK');
    reply('DR7_OK');
    assert.deepEqual(log.splice(0).map(l => l.split(' ')[0]), ['ensure', 'shortcuts', 'play']);

    // Backspace xoá phím của Rim Light
    listen('rim');
    press(8);
    reply('DR7_OK');
    assert.deepEqual(log.splice(0), ['ensure YouTube Rim Light', 'shortcuts "F9\\tThumbnail action\\tStroke Brush Path"']);
    assert.equal(buttons['key-rim'].label.textContent, '');
    assert.equal(pending.length, 0);

    console.log('PASS: create buttons import before playing, conflict lookup, overwrite / keep popup, clear');
})().catch(error => { console.error(error); process.exit(1); });
