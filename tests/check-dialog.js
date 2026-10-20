// js/dialog.js: kết quả Promise, Esc, 1 hộp mỗi lúc, trả focus. Dùng DOM giả tối thiểu, không cần Photoshop.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element(tag) {
    const el = {
        tag, children: [], listeners: {}, className: '', textContent: '', attrs: {}, removed: false, focused: false,
        setAttribute(k, v) { this.attrs[k] = v; },
        appendChild(child) { this.children.push(child); return child; },
        addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
        remove() { this.removed = true; },
        focus() { document.activeElement = this; },
        click() { (this.listeners.click || []).forEach(fn => fn({ target: this })); }
    };
    return el;
}
const docListeners = [];
const opener = element('button');
const document = {
    activeElement: opener,
    body: element('body'),
    createElement: element,
    addEventListener: (type, fn) => { if (type === 'keydown') docListeners.push(fn); },
    removeEventListener: (type, fn) => { const i = docListeners.indexOf(fn); if (i >= 0) docListeners.splice(i, 1); }
};
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'dialog.js'), 'utf8'), { window, document, Promise });

const overlays = () => document.body.children.filter(o => !o.removed);
const buttons = overlay => overlay.children[0].children[2].children;

(async () => {
    // Hộp thông báo: 1 nút, trả true, trả focus về nút mở hộp
    let p = window.dr7Dialog({ title: 'T', message: 'M\nline2', tone: 'error' });
    let [overlay] = overlays();
    assert.equal(overlay.children[0].className, 'dr7-dialog-box is-error');
    assert.equal(overlay.children[0].children[1].textContent, 'M\nline2');
    assert.equal(buttons(overlay).length, 1);
    assert.equal(buttons(overlay)[0].textContent, 'Đã hiểu');
    buttons(overlay)[0].click();
    assert.equal(await p, true);
    assert.equal(overlay.removed, true, 'closed dialog leaves the DOM');
    assert.equal(document.activeElement, opener, 'focus returns to the opener');
    assert.equal(docListeners.length, 0, 'keydown listener is released');

    // Hộp hỏi: focus ở "huỷ"; xác nhận = true, huỷ = false, Esc = false
    p = window.dr7Dialog({ title: 'Q', message: 'ok?', confirmText: 'Có', cancelText: 'Không' });
    [overlay] = overlays().slice(-1);
    assert.equal(buttons(overlay).length, 2);
    assert.equal(document.activeElement, buttons(overlay)[0], 'cancel button gets focus first');
    buttons(overlay)[1].click();
    assert.equal(await p, true, 'confirm button resolves true');

    p = window.dr7Dialog({ title: 'Q', message: 'ok?', confirmText: 'Có', cancelText: 'Không' });
    [overlay] = overlays().slice(-1);
    buttons(overlay)[0].click();
    assert.equal(await p, false, 'cancel button resolves false');

    p = window.dr7Dialog({ title: 'Q', message: 'ok?', confirmText: 'Có', cancelText: 'Không' });
    let prevented = false;
    docListeners[0]({ key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() {} });
    assert.equal(await p, false, 'Esc cancels a question');
    assert.equal(prevented, true);

    p = window.dr7Dialog({ title: 'N', message: 'notice' });
    docListeners[0]({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(await p, true, 'Esc on a notice still resolves true');

    // Chỉ 1 hộp mỗi lúc: hộp mới đóng hộp cũ (cũ trả false)
    const first = window.dr7Dialog({ title: '1', message: 'a', cancelText: 'x' });
    const second = window.dr7Dialog({ title: '2', message: 'b' });
    assert.equal(await first, false, 'replaced dialog resolves false');
    assert.equal(overlays().length, 1, 'only one dialog stays open');
    buttons(overlays()[0])[0].click();
    assert.equal(await second, true);

    console.log('PASS: shared dialog');
})().catch(error => { console.error(error); process.exit(1); });
