/*
 * Tab Khung ảnh: nối form (js/exif-frame-form.js) với EXIF của ảnh đang mở, xem trước, mẫu đã lưu và lệnh vẽ.
 * EXIF ở js/exif-frame-fields.js, ghép spec ở js/exif-frame-compose.js, xem trước ở js/exif-frame-preview.js,
 * mẫu ở js/exif-frame-presets.js, mẫu dựng sẵn và logo ở js/exif-frame-templates.js, font ở js/exif-frame-fonts.js; phần vẽ thật ở jsx/exif-frame.jsx (qua window.dr7RunFrame).
 */
(function () {
    'use strict';

    var DEFAULT_FONT = 'ArialMT';
    var PLACEHOLDER_DOC = { w: 1200, h: 800 };
    var SIZE_LINE = /^(\d+)\t(\d+)(?:\n|$)/;
    var LOGO_TYPES = ['png', 'jpg', 'jpeg', 'svg'];

    var fields = window.dr7ExifFields, composer = window.dr7ExifFrameCompose, presets = window.dr7FramePresets, templates = window.dr7FrameTemplates;
    var cs = new CSInterface();
    var form, el, ui = {};
    var state = { fields: null, touched: false, doc: PLACEHOLDER_DOC };

    function status(text, isError) {
        if (!window.dr7Status) return;
        if (isError || !window.dr7FlashStatus) window.dr7Status(text, isError);
        else window.dr7FlashStatus(text);
    }

    // done({ w, h, tags }) hoặc done(null) sau khi đã báo lỗi
    function readDocument(done) {
        cs.evalScript('typeof $._ext_EXIFFRAME=="object"?$._ext_EXIFFRAME.read():"DR7_MISSING"', function (res) {
            if (res === 'DR7_NO_DOCUMENT') { status('Hãy mở ảnh trong Photoshop trước.', true); done(null); return; }
            var size = SIZE_LINE.exec(String(res));
            if (!size) { status('Không đọc được ảnh: ' + res, true); done(null); return; }
            state.doc = { w: parseInt(size[1], 10), h: parseInt(size[2], 10) };
            done({ w: state.doc.w, h: state.doc.h, tags: fields.parseTags(String(res).slice(size[0].length)) });
        });
    }

    function refreshSettings() {
        if (state.fields) el.settings.value = fields.join(state.fields, form.pickedFields(), el.separator.value);
    }

    function fillFromExif(doc) {
        if (!doc) return;
        var info = fields.describe(doc.tags);
        if (!info.make && !info.model && !info.settings) { status('Ảnh không có EXIF máy ảnh, hãy nhập chữ tay.'); refresh(); return; }
        el.model.value = info.model;
        el.make.value = info.make;
        state.fields = info.fields;
        state.touched = false;
        refreshSettings();
        refresh();
        status('Đã đọc EXIF: ' + (info.model || info.make || info.settings));
    }

    function refresh() {
        var spec = composer.compose(form.values(), state.doc);
        ui.apply.disabled = !spec;
        ui.summary.textContent = spec ? 'Sẵn sàng vẽ watermark cho ảnh đang mở' : 'Nhập ít nhất một dòng chữ';
        ui.summaryIcon.classList.toggle('is-empty', !spec);
        window.dr7FramePreview.render(ui.preview, spec);
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    function apply() {
        if (ui.apply.disabled || (window.dr7IsBusy && window.dr7IsBusy())) return;
        var chosen = form.values();
        ui.apply.disabled = true;
        readDocument(function (doc) {
            var spec = doc && composer.compose(chosen, doc);
            if (!spec) { refresh(); return; }
            window.dr7RunFrame(spec, function (res) {
                refresh();
                if (res === 'DR7_OK') status('✓ Đã vẽ watermark');
            });
        });
    }

    function pickLogo() {
        var fs = window.cep && window.cep.fs;
        if (!fs || !fs.showOpenDialog) { status('Không mở được hộp chọn file.', true); return; }
        var chosen = fs.showOpenDialog(false, false, 'Chọn logo (PNG, JPG hoặc SVG)', '', LOGO_TYPES);
        if (chosen.err || !chosen.data || !chosen.data.length) return;
        form.setLogo(chosen.data[0]);
        refresh();
    }

    function storage() {
        try { return window.localStorage; } catch (e) { return null; }
    }

    function renderPresets(selected) {
        var names = Object.keys(presets.load(storage()));
        ui.presetList.textContent = '';
        var first = document.createElement('option');
        first.value = '';
        first.textContent = names.length ? 'Chọn mẫu đã lưu…' : 'Chưa có mẫu nào';
        ui.presetList.appendChild(first);
        names.forEach(function (name) {
            var option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            ui.presetList.appendChild(option);
        });
        ui.presetList.value = names.indexOf(selected) === -1 ? '' : selected;
        ui.presetDelete.disabled = !ui.presetList.value;
    }

    // Mục có group thì xếp vào optgroup cùng tên (giữ thứ tự xuất hiện); value là chỉ số trong items
    function fillSelect(select, first, items) {
        var groups = {};
        select.textContent = '';
        select.appendChild(new Option(first, ''));
        items.forEach(function (item, index) {
            var parent = select;
            if (item.group) {
                if (!groups[item.group]) {
                    groups[item.group] = document.createElement('optgroup');
                    groups[item.group].label = item.group;
                    select.appendChild(groups[item.group]);
                }
                parent = groups[item.group];
            }
            parent.appendChild(new Option(item.name, String(index)));
        });
    }

    function extensionPath() { return cs.getSystemPath(SystemPath.EXTENSION); }

    function pickBrandLogo() {
        var brand = templates.LOGOS[parseInt(el.logoBrand.value, 10)];
        if (!brand) return;
        form.setLogo(templates.logoPath(extensionPath(), brand.file));
        refresh();
    }

    function applyTemplate() {
        var chosen = templates.TEMPLATES[parseInt(ui.templateList.value, 10)];
        if (!chosen) return;
        el.logoBrand.value = '';
        form.restore(Object.assign({}, chosen, { logo: templates.logoPath(extensionPath(), chosen.logo) }));
        if (chosen.make) { el.make.value = chosen.make; state.touched = true; }
        refresh();
    }

    function savePreset() {
        var result = presets.save(storage(), ui.presetName.value, form.snapshot());
        if (!result.ok) { status(result.error, true); return; }
        ui.presetName.value = '';
        renderPresets(result.name);
        status('✓ Đã lưu mẫu "' + result.name + '"');
    }

    function bind(root) {
        ui.reload.addEventListener('click', function () { readDocument(fillFromExif); });
        ui.apply.addEventListener('click', apply);
        el.eyedropper.addEventListener('click', function () {
            window.dr7Eyedropper(el.eyedropper, function (hex) { form.pickBackground(hex); refresh(); });
        });
        el.logoPick.addEventListener('click', pickLogo);
        el.logoBrand.addEventListener('change', pickBrandLogo);
        ui.templateList.addEventListener('change', applyTemplate);
        el.separator.addEventListener('change', refreshSettings);
        Array.prototype.forEach.call(root.querySelectorAll('.ef-chip input'), function (box) { box.addEventListener('change', function () { refreshSettings(); refresh(); }); });
        [el.prefix, el.model, el.make, el.settings, el.extra].forEach(function (input) {
            input.maxLength = window.dr7ExifFrame.TEXT_MAX;
            input.addEventListener('input', function () { state.touched = true; });
        });
        ui.presetSave.addEventListener('click', savePreset);
        ui.presetName.addEventListener('keydown', function (event) { if (event.key === 'Enter') savePreset(); });
        ui.presetList.addEventListener('change', function () {
            var saved = presets.load(storage())[ui.presetList.value];
            ui.presetDelete.disabled = !saved;
            if (saved) { form.restore(saved); refresh(); }
        });
        ui.presetDelete.addEventListener('click', function () {
            var result = presets.remove(storage(), ui.presetList.value);
            if (!result.ok) status(result.error, true);
            renderPresets('');
        });
        form.onChange(refresh);
    }

    window.dr7InitFrame = function () {
        var root = document.querySelector('.exif-frame');
        if (!root || !window.dr7ExifFrame || !fields || !composer || !presets || !templates || !window.dr7FrameForm) return;
        form = window.dr7FrameForm(root);
        el = form.el;
        ['apply', 'summary', 'summary-icon', 'reload', 'preview', 'template-list', 'preset-list', 'preset-name', 'preset-save', 'preset-delete'].forEach(function (key) {
            ui[key.replace(/-(\w)/g, function (m, c) { return c.toUpperCase(); })] = root.querySelector('.ef-' + key);
        });
        fillSelect(ui.templateList, 'Chọn kiểu watermark…', templates.TEMPLATES);
        fillSelect(el.logoBrand, 'Chọn logo có sẵn…', templates.LOGOS);
        bind(root);
        renderPresets('');
        var tab = document.querySelector('.tab-button[data-tab="frame"]');
        if (tab) {
            tab.addEventListener('click', function () {
                window.dr7LoadFrameFonts(el.font, DEFAULT_FONT);
                if (!state.touched) readDocument(fillFromExif);
                else readDocument(function () { refresh(); });
            });
        }
        refresh();
    };
}());
