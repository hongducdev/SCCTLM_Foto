/*
 * Tab Watermark, mục "Mẫu gốc Xiaomi Leica": chọn một trong 54 mẫu của app 徕卡一瞬 rồi vẽ đúng bố cục của nó.
 * Luồng: đọc EXIF của ảnh đang mở -> bố cục lượt 1 để gom mọi dòng chữ cần đo -> Photoshop đo bằng font thật (jsx/wm-measure.jsx)
 * -> bố cục lượt 2 với độ rộng thật (js/wm-layout.js) -> js/wm-spec.js kiểm tra -> jsx/wm-draw.jsx vẽ (qua window.dr7RunWm).
 * Dữ liệu mẫu ở js/wm-templates-data.js (sinh bởi scripts/build-watermark-templates.py), ảnh logo ở img/wm.
 */
(function () {
    'use strict';

    var DEFAULT_FONT = 'ArialMT';
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
    var ui = {}, state = { busy: false, manual: false };

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
            group.templates.forEach(function (t) { option(node, group.id + '/' + t.id, t.name + ' · ' + t.id); });
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
        ui.background.disabled = ui.background.options.length < 2;
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
        var fieldsOf = fields.describe(tags).fields;
        return {
            make: tags[271] || '', model: ui.model.value || modelText(tags), date: vars.stamp(tags), focal: fieldsOf.focal, aperture: fieldsOf.fnumber,
            exposure: fieldsOf.shutter.replace(/s$/, ''), iso: fieldsOf.iso, latlng: vars.latlng(tags), address: ui.address.value
        };
    }

    function fillFromExif(doc) {
        if (!doc) return;
        if (!ui.model.value) ui.model.value = modelText(doc.tags);
    }

    // measure(text, font) ghi lại yêu cầu ở lượt 1, trả độ rộng thật ở lượt 2
    function planFor(template, doc, tags, measure) {
        return layout.plan(template, {
            photo: { w: doc.w, h: doc.h }, refWidth: 1080, brand: ui.brand.value, info: infoOf(tags), measure: measure,
            layout: state.manual ? ui.layout.value : undefined, background: ui.background.value || undefined
        });
    }

    function extensionRoot() {
        return window.dr7FrameTemplates.extensionRoot(cs.getSystemPath(SystemPath.EXTENSION));
    }

    function draw(template, doc, font, widths) {
        var next = 0, result = planFor(template, doc, doc.tags, function () { return widths[next++]; });
        var plan = {
            width: result.width, height: result.height, srcW: doc.w, srcH: doc.h, photo: result.photo, font: { regular: font },
            imageDir: extensionRoot() + '/img/wm', output: 'layers', ops: result.ops
        };
        if (!spec.plan.test(plan)) { status('Kế hoạch vẽ không hợp lệ cho mẫu này.', true); finish(); return; }
        window.dr7RunWm(plan, function (res) {
            finish();
            if (res === 'DR7_OK') status('✓ Đã vẽ watermark ' + template.name);
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
        readDocument(function (doc) {
            if (!doc) { finish(); return; }
            var font = document.querySelector('.exif-frame .ef-font').value || DEFAULT_FONT, requests = [];
            planFor(template, doc, doc.tags, function (text, f) { requests.push({ text: text, font: font, bold: f.bold, size: f.size }); return text.length * f.size * 0.5; });
            if (!spec.measureList.test(requests)) { status('Chữ trong mẫu không hợp lệ.', true); finish(); return; }
            cs.evalScript('$._ext_WMMEASURE.measure(' + JSON.stringify(requests) + ')', function (res) {
                var widths;
                try { widths = JSON.parse(res); } catch (e) { widths = null; }
                if (!Array.isArray(widths) || widths.length !== requests.length) { status('Không đo được chữ: ' + res, true); finish(); return; }
                state.doc = doc;
                draw(template, doc, font, widths);
            });
        });
    }

    window.dr7InitWm = function () {
        var root = document.querySelector('.exif-frame .ef-wm');
        if (!root || !data || !layout || !spec || !vars || !fields || !window.dr7FrameTemplates) return;
        [['template', 'wm-template'], ['layout', 'wm-layout'], ['layoutField', 'wm-layout-field'], ['background', 'wm-background'], ['brand', 'wm-brand'],
            ['model', 'wm-model'], ['address', 'wm-address'], ['apply', 'wm-apply'], ['thumb', 'wm-thumb'], ['thumbImage', 'wm-thumb-img']].forEach(function (pair) {
            ui[pair[0]] = root.querySelector('.ef-' + pair[1]);
        });
        fillTemplates();
        ui.template.addEventListener('change', function () { fillOptions(templateOf(ui.template.value)); });
        ui.apply.addEventListener('click', apply);
        ui.template.value = data.groups[0].id + '/' + data.groups[0].templates[0].id;
        fillOptions(templateOf(ui.template.value));
        var tab = document.querySelector('.tab-button[data-tab="frame"]');
        if (tab) tab.addEventListener('click', function () { readDocument(fillFromExif); });
    };
}());
