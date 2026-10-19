// Run: node tests/check-artboard-layout.js
// Runs the real js/artboard-layout.js (+ album presets): preset data, stacking of several templates and the spec validator.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
const context = vm.createContext({ window });
for (const file of ['artboard-facebook-album-presets.js', 'artboard-layout.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const ab = window.dr7Artboard;
// Objects built inside the vm context have another Object prototype; compare plain copies
const plain = (value) => JSON.parse(JSON.stringify(value));

// One square: a single 1080x1080 board at the origin
const square = ab.pick(['square']);
assert.deepEqual(plain(ab.layout(square, 40)), [{ name: 'Bài vuông', x: 0, y: 0, w: 1080, h: 1080 }]);

// Order follows the preset list, not the order of ids; every preset has a unique id
assert.deepEqual(plain(ab.pick(['story', 'square']).map(t => t.id)), ['square', 'story']);
const ids = ab.SECTIONS.flatMap(s => s.cards.map(c => c.id));
assert.equal(new Set(ids).size, ids.length);

// Album templates: absolute coordinates, names, extents all come from the MHK pack list (fixture)
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/facebook-album-layouts.json'), 'utf8'));
assert.equal(fixture.length, 27);
assert.equal(fixture.reduce((sum, a) => sum + a.boards.length, 0), 121);
const albums = ab.SECTIONS.flatMap(s => s.cards).filter(c => c.boards);
assert.equal(albums.length, 27);
for (const expected of fixture) {
    const template = albums.find(t => t.code === expected.code);
    assert.ok(template, 'missing album ' + expected.code);
    for (const gap of [0, 40]) {
        const placed = plain(ab.layout([template], gap));
        assert.deepEqual(placed.map(b => [b.x, b.y, b.w, b.h, !!b.extra]), expected.boards.map(b => [b.x, b.y, b.w, b.h, b.extra]), expected.code);
    }
    assert.deepEqual(plain(ab.extentOf(template)), expected.doc, expected.code + ' document size');
    const placed = ab.layout([template], 0);
    placed.forEach((p, i) => placed.slice(i + 1).forEach(q => {
        const apart = p.x + p.w <= q.x || q.x + q.w <= p.x || p.y + p.h <= q.y || q.y + q.h <= p.y;
        assert.ok(apart, expected.code + ' boards overlap');
    }));
}

// Names follow the PSDs of the pack: NN_Anh_WxH, extras get _Bo-sung; the album code prefix is added when the
// document may hold several albums (2+ templates, or an explicit prefix for "File hiện tại")
const album08a = albums.find(t => t.code === '08A');
assert.deepEqual(plain(ab.layout([album08a], 40).map(b => b.name)),
    ['01_Anh_1800x1800', '02_Anh_1800x1800', '03_Anh_1200x1200', '04_Anh_1200x1200', '05_Anh_1200x1200',
        '06_Anh_1200x1200_Bo-sung', '07_Anh_1200x1200_Bo-sung', '08_Anh_1200x1200_Bo-sung']);
assert.equal(ab.layout([album08a], 40, { prefix: true })[5].name, '08A_06_Anh_1200x1200_Bo-sung');
const stackedNames = ab.layout([albums.find(t => t.code === '05A'), album08a], 40).map(b => b.name);
assert.equal(new Set(stackedNames).size, stackedNames.length);
assert.equal(stackedNames[0], '05A_01_Anh_1800x1800');
// Every album board carries the scaffold flag (empty drop layer inside the artboard)
assert.ok(ab.layout([album08a], 40).every(b => b.scaffold === true));
assert.ok(!('scaffold' in ab.layout(ab.pick(['square']), 40)[0]));
// Longest name stays within the validator limit
for (const t of albums) assert.ok(ab.layout([t, t], 0).every(b => b.name.length <= ab.NAME_MAX), t.code);

// Stacking: the second template sits one gap below the first block, whatever its own inner gaps
const stacked = ab.layout([albums.find(t => t.code === '05A'), album08a], 40);
assert.equal(stacked.length, 13);
assert.equal(stacked[5].y, 3000 + 40);
assert.equal(stacked[5].x, 0);
assert.equal(ab.countBoards(album08a), 8);

// Old row-based templates keep working next to albums: Bai vuong 1080 + a 4-board album
const mixed = ab.layout(ab.pick(['square', 'album-04a']), 40);
assert.equal(mixed.length, 5);
assert.equal(mixed[0].y, 0);
assert.equal(mixed[1].y, 1080 + 40);
const boards = ab.layout([album08a], 40);

const spec = (over) => Object.assign({ mode: 'new', name: 'SCCTLM_Social', gap: 40, background: 'white', guides: false, boards }, over);
assert.equal(ab.spec.test(spec()), true);
assert.equal(ab.spec.test(spec({ mode: 'other' })), false);
assert.equal(ab.spec.test(spec({ name: '' })), false);
assert.equal(ab.spec.test(spec({ name: 'a\nb' })), false);
assert.equal(ab.spec.test(spec({ gap: -1 })), false);
assert.equal(ab.spec.test(spec({ background: 'red' })), false);
assert.equal(ab.spec.test(spec({ guides: 'yes' })), false);
assert.equal(ab.spec.test(spec({ boards: [] })), false);
assert.equal(ab.spec.test(spec({ boards: [{ name: 'x', x: 0, y: 0, w: 0, h: 10 }] })), false);
assert.equal(ab.spec.test(spec({ boards: [{ name: 'x', x: 0, y: 0, w: 10.5, h: 10 }] })), false);
assert.equal(ab.spec.test(spec({ boards: [{ name: 'x', x: 0, y: 0, w: 99999, h: 10 }] })), false);
assert.equal(ab.spec.test(null), false);
assert.equal(ab.spec.test(spec({ boards: ab.layout([album08a], 40) })), true);
assert.equal(ab.spec.test(spec({ boards: [{ name: 'x', x: 0, y: 0, w: 10, h: 10, scaffold: 'yes' }] })), false);

console.log('artboard layout: OK');
