/*
 * Tab Watermark, mục "Mẫu gốc Xiaomi Leica": chọn một trong 54 mẫu của app 徕卡一瞬 rồi vẽ đúng bố cục của nó.
 * Luồng: đọc EXIF của ảnh đang mở -> bố cục lượt 1 để gom mọi dòng chữ cần đo -> Photoshop đo bằng font thật (jsx/wm-measure.jsx)
 * -> bố cục lượt 2 với độ rộng thật (js/wm-layout.js) -> js/wm-spec.js kiểm tra -> jsx/wm-draw.jsx vẽ (qua window.dr7RunWm).
 * Dữ liệu mẫu ở js/wm-templates-data.js (sinh bởi scripts/build-watermark-templates.py), ảnh logo ở img/wm.
 */
(function () {
    'use strict';

    var DEFAULT_FONT = 'ArialMT';
    var MISANS = 'MiSans-Normal';
    var FACE_FONTS = { lg1056: 'LG1056-Regular', oxanium: 'Oxanium-Regular' };
    var SIZE_LINE = /^(\d+)\t(\d+)(?:\n|$)/;
    var PREVIEW_DIR = 'img/wm-preview/';
    var LAYOUT_NAMES = {
        layout: 'Mặc định', layout_loc_off: 'Không có GPS', outer_border_right: 'Dải bên phải', outer_border_left: 'Dải bên trái',
        inner_border_right: 'Viền trong, bên phải', inner_border_left: 'Viền trong, bên trái', center_top: 'Giữa, phía trên',
        top: 'Phía trên', center: 'Giữa', bottom: 'Phía dưới', top_left: 'Trên trái', top_middle: 'Trên giữa', top_right: 'Trên phải',
        center_left: 'Giữa trái', center_middle: 'Chính giữa', center_right: 'Giữa phải', bottom_left: 'Dưới trái', bottom_middle: 'Dưới giữa', bottom_right: 'Dưới phải'
    };
    var BACKGROUND_NAMES = { white: 'Trắng', black: 'Đen', transparent: 'Trong suốt', transparent_white: 'Chữ sáng trên ảnh', transparent_black: 'Chữ tối trên ảnh' };

    var data = window.dr7WmData, layout = window.dr7WmLayout, spec = window.dr7WmSpec, fields = window.dr7ExifFields, vars = window.dr7WmVars;
    var cs = new CSInterface();
    var ui = {}, state = { busy: false, manual: false, installed: null };

    function status(text, isError) {
        if (!window.dr7Status) return;
        if (isError || !window.dr7FlashStatus) window.dr7Status(text, isError);
        else window.dr7FlashStatus(text);
    }

    function templateOf(value) {
        var at = String(value).split('/');
        var group = data.groups.filter(function (g) { return g.id === at[0]; })[0];
        return group ? group.templates.filter(function (t) { return t.id === at[1]; })[0] : null;
    }

    function option(select, value, text) {
        var node = document.createElement('option');
        node.value = value;
        node.textContent = text;
        select.appendChild(node);
    }

    function fillTemplates() {
        data.groups.forEach(function (group) {
            var node = document.createElement('optgroup');
            node.label = group.name;
            group.templates.forEach(function (t) { option(node, group.id + '/' + t.id, t.name); });
            ui.template.appendChild(node);
        });
    }

    // Chỉ liệt kê nền là một màu đặc (nền mờ, gradient, họa tiết cần xử lý ảnh nên chưa hỗ trợ)
    function solidBackgrounds(template) {
        var seen = {};
        return template.backgrounds.filter(function (b) {
            var solid = /^@color=#[0-9A-Fa-f]{6,8}$/.test(b.value);
            if (!solid || seen[b.name]) return false;
            seen[b.name] = true;
            return true;
        });
    }

    function fillOptions(template) {
        var keys = layout.layoutKeys(template), manual = keys.filter(function (k) { return k !== 'layout' && k !== 'layout_loc_off'; });
        var show = manual.length > 0;
        state.manual = show;
        ui.layout.textContent = '';
        (show ? manual : keys).forEach(function (key) { option(ui.layout, key, LAYOUT_NAMES[key] || key); });
        ui.layoutField.hidden = !show || manual.length < 2;
        ui.background.textContent = '';
        solidBackgrounds(template).forEach(function (b) { option(ui.background, b.name, BACKGROUND_NAMES[b.name] || b.name); });
        ui.background.parentNode.hidden = ui.background.options.length < 2;
        ui.thumb.hidden = false;
        ui.thumbImage.onerror = function () { ui.thumb.hidden = true; };
        ui.thumbImage.src = PREVIEW_DIR + ui.template.value.replace('/', '_') + '.jpg';
    }

    // done({ w, h, tags }) hoặc done(null) sau khi đã báo lỗi
    function readDocument(done) {
        cs.evalScript('typeof $._ext_EXIFFRAME=="object"?$._ext_EXIFFRAME.read():"DR7_MISSING"', function (res) {
            if (res === 'DR7_NO_DOCUMENT') { status('Hãy mở ảnh trong Photoshop trước.', true); done(null); return; }
            var size = SIZE_LINE.exec(String(res));
            if (!size) { status('Không đọc được ảnh: ' + res, true); done(null); return; }
            done({ w: parseInt(size[1], 10), h: parseInt(size[2], 10), tags: fields.parseTags(String(res).slice(size[0].length)) });
        });
    }

    function modelText(tags) {
        var make = tags[271] || '', model = tags[272] || '';
        return make && model.toLowerCase().indexOf(make.toLowerCase()) !== 0 ? make + ' ' + model : model || make;
    }

    function infoOf(tags) {
        var fieldsOf = fields.describe(tags).fields, typedIso = /\d+/.exec(ui.iso.value);
        return {
            make: tags[271] || '', model: ui.model.value || modelText(tags), date: vars.stamp(tags), focal: fieldsOf.focal, aperture: fieldsOf.fnumber,
            exposure: fieldsOf.shutter.replace(/s$/, ''), iso: typedIso ? 'ISO' + typedIso[0] : fieldsOf.iso, latlng: vars.latlng(tags), address: ui.address.value
        };
    }

    function fillFromExif(doc) {
        if (!doc) return;
        if (!ui.model.value) ui.model.value = modelText(doc.tags);
    }

    // measure(text, font) ghi lại yêu cầu ở lượt 1, trả độ rộng thật ở lượt 2
    function planFor(template, doc, tags, measure) {
        var info = infoOf(tags);
        return layout.plan(template, {
            photo: { w: doc.w, h: doc.h }, refWidth: 1080, brand: ui.brand.value, customName: info.model, info: info, measure: measure,
            layout: state.manual ? ui.layout.value : undefined, background: ui.background.value || undefined
        });
    }

    function extensionRoot() {
        return window.dr7FrameTemplates.extensionRoot(cs.getSystemPath(SystemPath.EXTENSION));
    }

    // Font Photoshop cho từng font của mẫu: font riêng của mẫu nếu đã cài, còn lại (gồm 'default') dùng font đang chọn
    function fontMap(installed, fallback) {
        var map = { default: fallback };
        Object.keys(FACE_FONTS).forEach(function (face) { map[face] = installed[FACE_FONTS[face]] ? FACE_FONTS[face] : fallback; });
        return map;
    }

    function missingFonts(template, installed) {
        var used = { lg1056: ui.brand.value === 'custom' };
        Object.keys(template.fonts).forEach(function (key) { used[layout.faceOf(template.fonts[key].typeface)] = true; });
        return Object.keys(FACE_FONTS).filter(function (face) { return used[face] && !installed[FACE_FONTS[face]]; }).map(function (face) { return FACE_FONTS[face]; });
    }

    // { postScriptName: true } của mọi font Photoshop đang thấy
    function readInstalled(done) {
        if (state.installed) { done(state.installed); return; }
        cs.evalScript('typeof $._ext_EXIFFRAME=="object"?$._ext_EXIFFRAME.fonts():"DR7_MISSING"', function (res) {
            var installed = {};
            String(res).split('\n').forEach(function (line) { installed[line.split('\t')[0]] = true; });
            if (res !== 'DR7_MISSING' && !/^EvalScript error/.test(String(res))) state.installed = installed;
            done(installed);
        });
    }

    // Ô font còn là Arial mặc định thì chuyển sang MiSans khi đã cài, vì mẫu gốc vẽ bằng font hệ thống của Xiaomi
    function defaultFont(installed) {
        var chosen = document.querySelector('.exif-frame .ef-font').value || DEFAULT_FONT;
        return chosen === DEFAULT_FONT && installed[MISANS] ? MISANS : chosen;
    }

    function draw(template, doc, font, map, widths, missing) {
        var next = 0, result = planFor(template, doc, doc.tags, function () { return widths[next++]; });
        result.ops.forEach(function (op) { if (op.t === 'text') op.font = map[op.face]; });
        var plan = {
            width: result.width, height: result.height, srcW: doc.w, srcH: doc.h, photo: result.photo, font: { regular: font },
            imageDir: extensionRoot() + '/img/wm', output: 'layers', ops: result.ops
        };
        if (!spec.plan.test(plan)) { status('Kế hoạch vẽ không hợp lệ cho mẫu này.', true); finish(); return; }
        window.dr7RunWm(plan, function (res) {
            finish();
            if (res !== 'DR7_OK') return;
            if (missing.length) status('Đã vẽ ' + template.name + ' nhưng chưa cài font ' + missing.join(', ') + ' nên dùng font đang chọn.', true);
            else status('✓ Đã vẽ watermark ' + template.name + (infoOf(doc.tags).iso ? '' : '. Ảnh không có ISO, nhập vào ô ISO nếu cần.'));
        });
    }

    function setMode(mode) {
        var custom = mode === 'custom';
        ui.wmGroup.hidden = custom;
        ui.customGroup.hidden = !custom;
        ui.fontField.parentNode.removeChild(ui.fontField);
        (custom ? ui.customFontSlot : ui.wmFontSlot).appendChild(ui.fontField);
        Array.prototype.forEach.call(ui.modeButtons, function (button) {
            var active = button.getAttribute('data-mode') === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function finish() {
        state.busy = false;
        ui.apply.disabled = false;
    }

    function apply() {
        if (state.busy || (window.dr7IsBusy && window.dr7IsBusy())) return;
        var template = templateOf(ui.template.value);
        if (!template) { status('Hãy chọn một mẫu.', true); return; }
        state.busy = true;
        ui.apply.disabled = true;
        askTakeOff(function (go) {
            if (!go) { finish(); return; }
            drawFresh(template);
        });
    }

    // Ảnh đã có watermark của tab này: hỏi gỡ rồi mới vẽ lại; false = người dùng huỷ hoặc gỡ lỗi
    function askTakeOff(done) {
        cs.evalScript('typeof $._ext_WMDRAW=="object"?$._ext_WMDRAW.existing():""', function (res) {
            if (res !== '1' || !window.dr7Dialog) { done(true); return; }
            window.dr7Dialog({
                title: 'Ảnh đã có watermark', message: 'Gỡ watermark trước đó rồi vẽ lại?', confirmText: 'Gỡ và vẽ lại', cancelText: 'Huỷ'
            }).then(function (confirmed) {
                if (!confirmed) { done(false); return; }
                cs.evalScript('$._ext_WMDRAW.remove()', function (removed) {
                    if (removed === 'DR7_OK') { done(true); return; }
                    status('Không gỡ được watermark cũ: ' + removed, true);
                    done(false);
                });
            });
        });
    }

    function drawFresh(template) {
        readDocument(function (doc) {
            if (!doc) { finish(); return; }
            readInstalled(function (installed) {
                var font = defaultFont(installed), map = fontMap(installed, font), missing = missingFonts(template, installed), requests = [];
                planFor(template, doc, doc.tags, function (text, f) { requests.push({ text: text, font: map[f.face], bold: f.bold, size: f.size }); return text.length * f.size * 0.5; });
                if (!spec.measureList.test(requests)) { status('Chữ trong mẫu không hợp lệ.', true); finish(); return; }
                cs.evalScript('$._ext_WMMEASURE.measure(' + JSON.stringify(requests) + ')', function (res) {
                    var widths;
                    try { widths = JSON.parse(res); } catch (e) { widths = null; }
                    if (!Array.isArray(widths) || widths.length !== requests.length) { status('Không đo được chữ: ' + res, true); finish(); return; }
                    state.doc = doc;
                    draw(template, doc, font, map, widths, missing);
                });
            });
        });
    }

    window.dr7InitWm = function () {
        var root = document.querySelector('.exif-frame .ef-wm');
        if (!root || !data || !layout || !spec || !vars || !fields || !window.dr7FrameTemplates) return;
        [['template', 'wm-template'], ['layout', 'wm-layout'], ['layoutField', 'wm-layout-field'], ['background', 'wm-background'], ['brand', 'wm-brand'],
            ['model', 'wm-model'], ['address', 'wm-address'], ['iso', 'wm-iso'], ['apply', 'wm-apply'], ['thumb', 'wm-thumb'], ['thumbImage', 'wm-thumb-img']].forEach(function (pair) {
            ui[pair[0]] = root.querySelector('.ef-' + pair[1]);
        });
        var frame = root.parentNode;
        ui.wmGroup = root;
        ui.customGroup = frame.querySelector('.ef-mode-custom');
        ui.fontField = frame.querySelector('.ef-font-field');
        ui.wmFontSlot = root.querySelector('.ef-wm-font-slot');
        ui.customFontSlot = frame.querySelector('.ef-custom-font-slot');
        ui.modeButtons = frame.querySelectorAll('.ef-mode-btn');
        Array.prototype.forEach.call(ui.modeButtons, function (button) {
            button.addEventListener('click', function () { setMode(button.getAttribute('data-mode')); });
        });
        setMode('wm');
        fillTemplates();
        ui.template.addEventListener('change', function () { fillOptions(templateOf(ui.template.value)); });
        ui.apply.addEventListener('click', apply);
        ui.template.value = data.groups[0].id + '/' + data.groups[0].templates[0].id;
        fillOptions(templateOf(ui.template.value));
        var tab = document.querySelector('.tab-button[data-tab="frame"]');
        if (tab) tab.addEventListener('click', function () { readDocument(fillFromExif); });
    };
}());
