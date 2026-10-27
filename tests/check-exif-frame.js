// Run: node tests/check-exif-frame.js
// Runs the real js/exif-frame-*.js modules: EXIF fields, frame geometry, form-to-spec composition and the spec validator.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = {};
const context = vm.createContext({ window });
for (const file of ['exif-frame-fields.js', 'exif-frame-layout.js', 'exif-frame-compose.js', 'exif-frame-presets.js', 'exif-frame-templates.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const exif = window.dr7ExifFields, frame = window.dr7ExifFrame, compose = window.dr7ExifFrameCompose, presets = window.dr7FramePresets, templates = window.dr7FrameTemplates;
const plain = (value) => JSON.parse(JSON.stringify(value));
const describe = (text) => plain(exif.describe(exif.parseTags(text)));

// iPhone sample from the feature brief: 35mm-equivalent focal length wins over the physical one
const iphone = describe('271\tApple\n272\tiPhone 15 Pro Max\n33434\t1/40\n33437\t2.8\n34855\t1250\n37386\t15.66\n41989\t121');
assert.deepEqual([iphone.make, iphone.model, iphone.settings], ['Apple', 'iPhone 15 Pro Max', '121mm f/2.8 1/40s ISO1250']);

// Photoshop formats vary: "0.025 (1/40) sec", "f/2.8", "6.765 mm"; the make is dropped from a model that repeats it
const verbose = describe('271\tSONY\n272\tSONY ILCE-7M4\n33434\t0.025 (1/40) sec\n33437\tf/2.8\n34855\t100\n37386\t6.765 mm');
assert.deepEqual([verbose.make, verbose.model, verbose.settings], ['SONY', 'ILCE-7M4', '7mm f/2.8 1/40s ISO100']);

// Plain seconds: fraction below one second, whole value above
assert.equal(describe('33434\t0.5').fields.shutter, '1/2s');
assert.equal(describe('33434\t2').fields.shutter, '2s');
assert.equal(describe('33434\t0.004').fields.shutter, '1/250s');

// Missing tags give empty strings, never "NaN"; a file with no camera EXIF at all
const bare = describe('256\t3588\n257\t4485');
assert.deepEqual([bare.make, bare.model, bare.settings], ['', '', '']);
assert.equal(describe('37386\t50').settings, '50mm');
assert.deepEqual(plain(exif.parseTags('')), {});

// Optional fields: lens and date, picked and joined with any separator
const full = describe('42036\tEF 24-70mm f/2.8L\n36867\t2023:10:05 12:30:00\n34855\t200\n33437\t4');
assert.equal(full.fields.lens, 'EF 24-70mm f/2.8L');
assert.equal(full.fields.date, '2023-10-05');
assert.equal(exif.join(full.fields, ['date', 'iso', 'lens'], ' · '), '2023-10-05 · ISO200 · EF 24-70mm f/2.8L');
assert.equal(exif.join(full.fields, ['shutter'], ' '), '');

// Geometry, bottom: the photo keeps its size, the border is even on three sides and the band is taller than the border
const geo = (style, extra) => frame.layout(3000, 2000, Object.assign({ style, border: 4, lineCount: 2 }, extra));
const bottom = geo('bottom');
assert.equal(bottom.border, 80);
assert.equal(bottom.canvasW, 3000 + 160);
assert.equal(bottom.canvasH, 2000 + 80 + bottom.band);
assert.ok(bottom.band > bottom.border);
assert.ok(bottom.lines[0].baseline > 2000 + bottom.border && bottom.lines[1].baseline > bottom.lines[0].baseline);
assert.ok(bottom.lines[1].baseline < bottom.canvasH);
assert.ok(bottom.lines[1].size < bottom.lines[0].size);

// Polaroid has a taller band; overlay keeps the canvas and puts the text inside the photo
assert.ok(geo('polaroid').band >= geo('polaroid').border * 3);
const overlay = geo('overlay');
assert.deepEqual([overlay.border, overlay.band, overlay.canvasW, overlay.canvasH], [0, 0, 3000, 2000]);
assert.ok(overlay.lines[1].baseline < 2000 && overlay.lines[0].baseline > 1500);

// Corner radius: percent of the short side, capped, and never on overlay (the photo fills the canvas)
assert.equal(bottom.radius, 0);
assert.equal(geo('bottom', { radius: 2 }).radius, 40);
assert.equal(geo('bottom', { radius: 99 }).radius, 100);
assert.equal(geo('overlay', { radius: 3 }).radius, 0);

// Text size, line gap and line count move the numbers the right way; unknown values fall back to safe defaults
assert.ok(geo('bottom', { size: 200 }).lines[0].size > bottom.lines[0].size);
assert.ok(geo('bottom', { gap: 200 }).lines[1].baseline > bottom.lines[1].baseline);
assert.equal(geo('bottom', { lineCount: 3 }).lines.length, 3);
assert.ok(geo('bottom', { lineCount: 3 }).band > bottom.band);
assert.equal(frame.layout(3000, 2000, { style: 'nope' }).lines.length, 2);
assert.equal(frame.layout(100, 80, { border: 1 }).border, 1);
assert.ok(frame.layout(100, 80, { border: 1 }).lines[0].size >= 12);

// Form values to spec: line 1 has three segments, empty parts drop out, no text means nothing to draw
const values = {
    style: 'bottom', prefix: 'Shot on', model: 'iPhone', make: 'Apple', settings: '121mm', extra: '',
    border: 3, radius: 0, logo: '', size: 100, gap: 100, align: 'center', logoPos: 'left', font: 'ArialMT', output: 'layers', background: '#ffffff', text: '#111111', muted: '#8a8a8a'
};
const spec = compose.compose(values, { w: 3000, h: 2000 });
assert.deepEqual(plain(spec.lines.map((line) => line.map((s) => s.text))), [['Shot on', 'iPhone', 'Apple'], ['121mm']]);
assert.deepEqual(plain(spec.lines[0].map((s) => [s.bold, s.muted])), [[false, true], [true, false], [false, true]]);
assert.equal(spec.layout.lines.length, 2);
assert.equal(frame.spec.test(spec), true);
assert.equal(compose.compose(Object.assign({}, values, { model: '', make: '', settings: ' ', extra: '' }), { w: 10, h: 10 }), null);
assert.deepEqual(plain(compose.lines(Object.assign({}, values, { prefix: '', make: '', settings: '', extra: 'a\nb' }))), [[{ text: 'iPhone', bold: true, muted: false }], [{ text: 'a b', bold: false, muted: true }]]);
assert.equal(compose.compose(Object.assign({}, values, { extra: 'Photo by X' }), { w: 3000, h: 2000 }).layout.lines.length, 3);

// Validator
const fresh = () => plain(spec);
assert.equal(frame.spec.test(fresh()), true);
assert.equal(frame.spec.test(null), false);
for (const mutate of [
    (s) => { s.background = 'white'; },
    (s) => { s.srcW = 0; },
    (s) => { s.srcH = 1.5; },
    (s) => { s.style = 'polaroidish'; },
    (s) => { s.align = 'top'; },
    (s) => { s.output = 'psd'; },
    (s) => { s.font = 'Arial; evil()'; },
    (s) => { s.layout.lines.pop(); },
    (s) => { s.layout.inset = -1; },
    (s) => { s.lines = []; },
    (s) => { s.lines[0][0].text = '   '; },
    (s) => { s.lines[0][0].text = 'a\nb'; },
    (s) => { s.lines[0][0].text = 'a' + String.fromCharCode(0x2028) + 'b'; },
    (s) => { s.lines[0][0].text = 'x'.repeat(frame.TEXT_MAX + 1); },
    (s) => { s.lines[0][1].bold = 'yes'; },
    (s) => { s.lines[0] = new Array(4).fill({ text: 'a', bold: false, muted: false }); }
]) {
    const bad = fresh();
    mutate(bad);
    assert.equal(frame.spec.test(bad), false);
}
// Logo: a Windows path is normalised, only image files are accepted, anything else fails the spec
const withLogo = (logo) => compose.compose(Object.assign({}, values, { logo }), { w: 3000, h: 2000 });
assert.deepEqual(plain(withLogo('C:\\Users\\me\\logo.PNG').logo), { path: 'C:/Users/me/logo.PNG' });
assert.equal(frame.spec.test(withLogo('C:\\Users\\me\\logo.PNG')), true);
assert.equal(frame.spec.test(withLogo('/home/me/mark.svg')), true);
assert.equal(withLogo('').logo, null);
for (const path of ['C:/x/logo.exe', 'C:/x/logo', 'C:/x/lo\ngo.png', '/x/' + 'a'.repeat(400) + '.png']) assert.equal(frame.spec.test(withLogo(path)), false);
for (const logo of [undefined, {}, { path: 5 }, 'logo.png']) {
    const bad = fresh();
    bad.logo = logo;
    assert.equal(frame.spec.test(bad), false);
}

// Overlay with zero border is a valid spec
assert.equal(frame.spec.test(compose.compose(Object.assign({}, values, { style: 'overlay' }), { w: 3000, h: 2000 })), true);

// Readable text colour on any background
assert.equal(frame.contrast('#ffffff').text, '#111111');
assert.equal(frame.contrast('#000000').text, '#f2f2f2');
assert.equal(frame.contrast('#e08a2c').text, '#111111');
assert.equal(frame.contrast('#1b2a4a').text, '#f2f2f2');

for (const preset of Object.values(frame.BACKGROUNDS)) {
    assert.ok([preset.fill, preset.text, preset.muted].every((hex) => /^#[0-9a-f]{6}$/i.test(hex)));
}

// Saved presets: round trip, junk is dropped on load, limits and storage failures are reported not thrown
const memory = () => {
    const data = {};
    return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};
const style = { style: 'polaroid', align: 'left', output: 'flatten', background: 'custom', bgColor: '#102030', text: '#ffffff', muted: '#cccccc',
    border: 4, radius: 2, size: 120, gap: 80, font: 'Georgia', prefix: 'Chụp bằng', separator: ' · ', picks: ['focal', 'iso'], logo: 'C:/x/logo.png' };
const store = memory();
assert.deepEqual(plain(presets.load(store)), {});
assert.equal(presets.save(store, '  Polaroid  ', style).name, 'Polaroid');
assert.deepEqual(plain(presets.load(store)), { Polaroid: style });
assert.equal(presets.save(store, '   ', style).ok, false);
assert.equal(presets.remove(store, 'Polaroid').ok, true);
assert.deepEqual(plain(presets.load(store)), {});

assert.deepEqual(plain(presets.sanitize(Object.assign({}, style, { style: 'x', border: 999, text: 'red', picks: ['nope'], evil: 1, font: 'a b' }))),
    { align: 'left', output: 'flatten', background: 'custom', bgColor: '#102030', muted: '#cccccc', radius: 2, size: 120, gap: 80,
        prefix: 'Chụp bằng', separator: ' · ', logo: 'C:/x/logo.png' });
assert.deepEqual(plain(presets.sanitize(null)), {});

const broken = memory();
broken.setItem('dr7.frame.presets', '{not json');
assert.deepEqual(plain(presets.load(broken)), {});
broken.setItem('dr7.frame.presets', '[1,2]');
assert.deepEqual(plain(presets.load(broken)), {});
broken.setItem('dr7.frame.presets', JSON.stringify({ ok: style, junk: 7 }));
assert.deepEqual(plain(presets.load(broken)), { ok: style, junk: {} });

const crowded = memory();
for (let i = 0; i < presets.MAX_PRESETS; i += 1) assert.equal(presets.save(crowded, 'p' + i, style).ok, true);
assert.equal(presets.save(crowded, 'one more', style).ok, false);
assert.equal(presets.save(crowded, 'p0', style).ok, true);
assert.equal(presets.save(crowded, 'x'.repeat(100), style).ok, false);
assert.equal(presets.save({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, 'a', style).ok, false);

// Logo above the text: the band grows by the logo block and the text moves down; without a logo nothing changes
const stackedPlan = (extra) => frame.layout(3000, 2000, Object.assign({ style: 'bottom', border: 3, lineCount: 2, hasLogo: true, logoPos: 'top' }, extra));
const plainPlan = frame.layout(3000, 2000, { style: 'bottom', border: 3, lineCount: 2, hasLogo: true, logoPos: 'left' });
assert.ok(stackedPlan().logoHeight > 0 && plainPlan.logoHeight === 0);
assert.ok(stackedPlan().band > plainPlan.band);
assert.ok(stackedPlan().lines[0].baseline > stackedPlan().logoTop + stackedPlan().logoHeight);
assert.ok(stackedPlan().lines[1].baseline < stackedPlan().canvasH);
assert.ok(stackedPlan({ style: 'overlay' }).logoTop > 1000 && stackedPlan({ style: 'overlay' }).lines[1].baseline < 2000);
const topSpec = compose.compose(Object.assign({}, values, { logo: 'C:/x/logo.png', logoPos: 'top' }), { w: 3000, h: 2000 });
assert.equal(topSpec.layout.logoHeight, stackedPlan().logoHeight);
assert.equal(frame.spec.test(topSpec), true);
for (const logoPos of ['right', 'left']) assert.equal(frame.spec.test(compose.compose(Object.assign({}, values, { logo: 'C:/x/logo.png', logoPos }), { w: 3000, h: 2000 })), true);
assert.equal(frame.spec.test(Object.assign({}, plain(topSpec), { logoPos: 'middle' })), false);
assert.equal(presets.sanitize({ logoPos: 'top' }).logoPos, 'top');
assert.equal('logoPos' in presets.sanitize({ logoPos: 'middle' }), false);

// Built-in watermark templates pass the same filters as saved presets and name a bundled logo
assert.deepEqual([...new Set(templates.TEMPLATES.map((t) => t.group))], ['Hasselblad']);
assert.equal(templates.TEMPLATES.length, 3);
assert.equal(new Set(templates.TEMPLATES.map((t) => t.group + t.name)).size, templates.TEMPLATES.length);
const logoFiles = fs.readdirSync(path.join(__dirname, '../img/logos'));
for (const file of templates.LOGOS.map((l) => l.file)) assert.ok(logoFiles.includes(file), file);
for (const t of templates.TEMPLATES) {
    const clean = plain(presets.sanitize(t));
    for (const key of ['style', 'logoPos', 'align', 'background', 'bgColor', 'text', 'muted', 'border']) assert.deepEqual(clean[key], t[key], t.name + ' ' + key);
    assert.ok(t.logo === undefined || logoFiles.includes(t.logo), t.name);
    assert.equal(frame.spec.test(compose.compose(Object.assign({}, values, clean, { background: clean.bgColor, logo: t.logo ? 'C:/x/' + t.logo : '' }), { w: 3000, h: 2000 })), true, t.name);
}
// Two columns: the title and extra line stay on the left, the settings go to the right column, centred on the left block
const splitValues = Object.assign({}, values, { logo: 'C:/x/logo.png', logoPos: 'split', align: 'right', model: 'Xiaomi 17 Ultra', make: 'by Leica', prefix: '', settings: '24mm f/1.4', extra: '2022.08.16' });
const split = compose.compose(splitValues, { w: 3000, h: 2000 });
assert.equal(split.align, 'left');
assert.deepEqual(plain(split.lines.map((l) => l.map((s) => s.text))), [['Xiaomi 17 Ultra', 'by Leica'], ['2022.08.16']]);
assert.deepEqual(plain(split.side.map((s) => s.text)), ['24mm f/1.4']);
assert.equal(split.layout.side.size, split.layout.lines[0].size);
assert.ok(split.layout.side.baseline > split.layout.lines[0].baseline && split.layout.side.baseline < split.layout.lines[1].baseline + split.layout.lines[1].size);
assert.equal(frame.spec.test(split), true);
const noSide = compose.compose(Object.assign({}, splitValues, { settings: '' }), { w: 3000, h: 2000 });
assert.equal(noSide.side, null);
assert.equal(frame.spec.test(noSide), true);
const onlySettings = compose.compose(Object.assign({}, splitValues, { model: '', make: '', extra: '' }), { w: 3000, h: 2000 });
assert.deepEqual([onlySettings.lines.length, onlySettings.side], [1, null]);
assert.equal(compose.compose(Object.assign({}, splitValues, { model: '', make: '', extra: '', settings: '' }), { w: 3000, h: 2000 }), null);
for (const bad of [Object.assign({}, plain(split), { side: null }), Object.assign({}, plain(split), { logoPos: 'left' }), Object.assign({}, plain(split), { side: [] })]) assert.equal(frame.spec.test(bad), false);
assert.equal(frame.spec.test(Object.assign({}, plain(topSpec), { side: [{ text: 'x', bold: false, muted: false }] })), false);
assert.equal(templates.logoPath('/C:/Program%20Files/Adobe/ext', 'a.png'), 'C:/Program Files/Adobe/ext/img/logos/a.png');
assert.equal(templates.logoPath('file:///C:/ext', 'a.png'), 'C:/ext/img/logos/a.png');
assert.equal(templates.logoPath('/Users/me/ext', ''), '');

console.log('check-exif-frame: OK');
