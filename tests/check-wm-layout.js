// Run: node tests/check-wm-layout.js
// Compares js/wm-layout.js with the original renderer (tests/fixtures/wm-reference.json, made by gen-wm-reference.py):
// for all 54 templates the result size and the position of the photo must match to the pixel.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
const context = vm.createContext({ window });
for (const file of ['wm-vars.js', 'wm-layout.js', 'wm-templates-data.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const reference = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/wm-reference.json'), 'utf8'));
const layout = window.dr7WmLayout, vars = window.dr7WmVars;
const plain = (value) => JSON.parse(JSON.stringify(value));

const measure = (text, font) => [...text].reduce((sum, ch) => sum + reference.advance[font.size][ch], 0);
const run = (template, extra) => plain(layout.plan(template, Object.assign({
    photo: { w: reference.photo[0], h: reference.photo[1] }, refWidth: 1080, brand: 'xiaomi', info: Object.assign({}, reference.info, { latlng: reference.info.location }), measure
}, extra)));

// Time formats come from each template's own i18n strings
assert.equal(vars.formatDate('yyyy.MM.dd HH:mm', '2022.08.16 18:33:00'), '2022.08.16 18:33');
assert.equal(vars.formatDate('EEEE', '2022.08.16 18:33:00'), 'Tuesday');
assert.equal(vars.formatDate('MM/dd/yyyy HH:mm', '2022.08.16 18:33'), '08/16/2022 18:33');
assert.deepEqual(plain(vars.modelVars({ make: 'Xiaomi', model: 'Xiaomi 17 Ultra' })), { series: '', versionNumber: '17', versionName: 'Ultra' });
assert.deepEqual(plain(vars.modelVars({ make: 'Xiaomi', model: 'Redmi Note 13 Pro' })), { series: 'Note ', versionNumber: '13', versionName: 'Pro' });

// EXIF as Photoshop returns it: GPS without the degree sign, all zeros when the photo has no position
const Q = String.fromCharCode(34), A = String.fromCharCode(39), DEG = String.fromCharCode(176);
assert.equal(vars.latlng({ 2: '0.00 0.00' + A + ' 0.00' + Q, 4: '0.00 0.00' + A + ' 0.00' + Q }), '');
assert.equal(vars.latlng({ 1: 'N', 2: '25 25' + A + ' 25.00' + Q, 3: 'W', 4: '118 59' + A + ' 37.00' + Q }), '118' + DEG + '59' + A + '37.00' + Q + 'W 25' + DEG + '25' + A + '25.00' + Q + 'N');
assert.equal(vars.dms('21.5', 'N'), '21' + DEG + '30' + A + '0.00' + Q + 'N');
assert.equal(vars.stamp({ 36867: '2026:10:28 01:33:12' }), '2026.10.28 01:33');
assert.equal(vars.stamp({}), '');

let checked = 0;
const wrong = [];
for (const group of window.dr7WmData.groups) {
    for (const template of group.templates) {
        const want = reference.templates[template.id];
        const got = run(template);
        const photo = got.photo && [got.photo.x, got.photo.y, got.photo.x + got.photo.w, got.photo.y + got.photo.h];
        const ok = got.width === want.size[0] && got.height === want.size[1] && JSON.stringify(photo) === JSON.stringify(want.photo);
        if (!ok) wrong.push(`${group.id}/${template.id}: size ${got.width}x${got.height} vs ${want.size}, photo ${photo} vs ${want.photo}`);
        checked += 1;
    }
}
assert.equal(checked, 54);
assert.deepEqual(wrong, [], 'templates that differ from the original renderer:\n' + wrong.join('\n'));
console.log('check-wm-layout: OK (' + checked + ' templates match the original renderer)');
