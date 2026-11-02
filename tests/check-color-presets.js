// Colour manifest must match the bundled files, and every id must be accepted by the mix validator.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'presets/colors/manifest.json'), 'utf8'));
const entry = /^[a-z]+\/\d{3}$/;
assert.strictEqual(manifest.groups.length, 6, 'six colour groups');
let total = 0;
manifest.groups.forEach((group) => {
    assert.ok(fs.existsSync(path.join(root, group.icon)), 'icon exists: ' + group.icon);
    assert.ok(group.items.length > 0, 'group has colours: ' + group.id);
    group.items.forEach((item) => {
        assert.match(item.id, entry, 'ASCII id: ' + item.id);
        assert.ok(item.id.startsWith(group.id + '/'), 'id belongs to group: ' + item.id);
        assert.ok(item.name.length > 0, 'name: ' + item.id);
        assert.ok(fs.existsSync(path.join(root, 'presets/colors', item.id + '.xmp')), 'xmp exists: ' + item.id);
        total += 1;
    });
});
const panel = fs.readFileSync(path.join(root, 'js/panel.js'), 'utf8');
const validator = new RegExp(/var COLOR_MIX = \/(.*)\/;/.exec(panel)[1]);
assert.ok(validator.test('fuji/001:60,dazz/003:40'), 'valid mix accepted');
['', '../x/001:50', 'fuji/001', 'fuji/001:101x', 'a/001:1,a/002:1,a/003:1,a/004:1,a/005:1'].forEach((bad) => {
    assert.ok(!validator.test(bad), 'rejected: ' + bad);
});
console.log('color presets: OK (' + total + ' colours)');
const legacy = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
assert.match(legacy, /float\s*:\s*none\s*;/, 'legacy button rule keeps float: none terminated');
const mixCss = fs.readFileSync(path.join(root, 'css/color-presets.css'), 'utf8');
assert.match(mixCss, /\.cp-mix-apply:hover\s*\{[^}]*background:\s*var\(--primary\)/, 'Mix apply hover keeps primary background');
assert.match(mixCss, /\.cp-mix-apply\[disabled\]:hover/, 'Mix apply disabled hover is pinned');
