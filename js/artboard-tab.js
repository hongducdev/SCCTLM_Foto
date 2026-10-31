/*
 * Tab Artboard: chọn một khổ, tìm kiếm, lọc theo chip, thiết lập rồi tạo artboard trong Photoshop.
 * Dữ liệu mẫu và cách xếp nằm ở js/artboard-layout.js; phần tạo thật ở jsx/artboard-create.jsx (qua window.dr7RunArtboard).
 */
(function () {
    'use strict';

    var CUSTOM_ID = 'custom';
    var DEFAULT_NAME = 'SCCTLM_Social';
    var ICON_BOX = { w: 64, h: 34 };
    var STATUS_MS = 3000;
    var STARS_KEY = 'dr7ArtboardFavorites';
    var STAR_PATH = 'M8 1.8l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.4l-3.9 2.2.9-4.3-3.200-3 4.300-.5z';

    var data = window.dr7Artboard;
    var state = { selected: ['square'], starred: loadStars(), filter: 'all', query: '', mode: 'new', customW: 1080, customH: 1080, nameEdited: false };
    var el = {};

    function loadStars() {
        try {
            var list = JSON.parse(window.localStorage.getItem(STARS_KEY));
            return Array.isArray(list) ? list.filter(function (id) { return typeof id === 'string'; }) : [];
        } catch (e) { return []; }
    }

    function saveStars() {
        try { window.localStorage.setItem(STARS_KEY, JSON.stringify(state.starred)); } catch (e) { console.warn('DR7 artboard: không lưu được mẫu yêu thích', e); }
    }

    // Ba khổ mặc định của nhóm Hay dùng luôn nằm đó, không cần gắn sao
    function pinnedIds() {
        return data.SECTIONS[0].cards.map(function (template) { return template.id; });
    }

    function toggleStar(id) {
        var at = state.starred.indexOf(id);
        if (at === -1) state.starred.push(id); else state.starred.splice(at, 1);
        saveStars();
        renderSections();
    }

    function plain(text) {
        return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    }

    function customTemplate() {
        var ok = data.isSize(state.customW) && data.isSize(state.customH);
        return ok ? { id: CUSTOM_ID, name: 'Tùy chỉnh', rows: [[{ w: state.customW, h: state.customH }]] } : null;
    }

    function chosenTemplates() {
        var chosen = data.pick(state.selected);
        var custom = state.selected.indexOf(CUSTOM_ID) !== -1 ? customTemplate() : null;
        return custom ? chosen.concat([custom]) : chosen;
    }

    function sizeLabel(template) {
        var count = data.countBoards(template), size = data.extentOf(template);
        if (template.boards) return count > 1 ? count + ' ảnh · ' + size.w + ' × ' + size.h : size.w + ' × ' + size.h;
        return count > 1 ? count + ' artboard' : size.w + ' × ' + size.h;
    }

    // Hình thu nhỏ khổ giấy: vẽ lại đúng bố cục xếp thật, co vừa khung icon
    function shapeIcon(template) {
        var boards = data.layout([template], 100), width = 0, height = 0;
        boards.forEach(function (b) { width = Math.max(width, b.x + b.w); height = Math.max(height, b.y + b.h); });
        var scale = Math.min(ICON_BOX.w / width, ICON_BOX.h / height);
        var icon = document.createElement('span');
        icon.className = 'ab-shape';
        boards.forEach(function (b) {
            var rect = document.createElement('i');
            rect.style.cssText = 'left:' + Math.round(b.x * scale) + 'px;top:' + Math.round(b.y * scale) + 'px;width:' +
                Math.max(2, Math.round(b.w * scale)) + 'px;height:' + Math.max(2, Math.round(b.h * scale)) + 'px';
            if (b.extra) rect.className = 'is-extra';
            icon.appendChild(rect);
        });
        icon.style.width = Math.round(width * scale) + 'px';
        icon.style.height = Math.round(height * scale) + 'px';
        return icon;
    }

    // Dòng chú thích dưới thẻ: album ghi "5 ô đầu + N bổ sung" rồi tới kích thước khối ghép, như bảng bố cục của gói MHK
    function cardLines(template, isCustom) {
        if (isCustom) return ['Nhập kích thước'];
        if (!template.boards) return [sizeLabel(template)];
        var size = data.extentOf(template), extras = template.boards.filter(function (b) { return b.extra; }).length;
        var lines = [size.w + ' × ' + size.h + ' px'];
        if (extras) lines.unshift(template.boards.length - extras + ' ô đầu + ' + extras + ' bổ sung');
        else if (template.boards.length > 1) lines.unshift(template.boards.length + ' ảnh');
        return lines;
    }

    function starFor(template) {
        var on = state.starred.indexOf(template.id) !== -1;
        var star = document.createElement('span');
        star.className = 'ab-fav' + (on ? ' is-on' : '');
        star.setAttribute('role', 'button');
        star.tabIndex = 0;
        star.setAttribute('aria-pressed', on ? 'true' : 'false');
        star.setAttribute('aria-label', (on ? 'Bỏ khỏi Hay dùng: ' : 'Thêm vào Hay dùng: ') + template.name);
        star.title = on ? 'Bỏ khỏi Hay dùng' : 'Thêm vào Hay dùng';
        star.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
        return star;
    }

    function cardFor(template) {
        var card = document.createElement('button');
        var isCustom = template.id === CUSTOM_ID;
        card.className = 'ab-card' + (isCustom ? ' is-custom' : '');
        card.setAttribute('data-id', template.id);
        card.title = template.name;
        var frame = document.createElement('span');
        frame.className = 'ab-card-art';
        if (isCustom) { frame.className += ' is-dashed'; frame.textContent = '+'; } else frame.appendChild(shapeIcon(template));
        var name = document.createElement('strong');
        if (template.code) {
            var code = document.createElement('span');
            code.className = 'ab-code';
            code.textContent = template.code;
            name.appendChild(code);
            name.appendChild(document.createTextNode(' ' + template.name));
            card.title = template.code + ' · ' + template.name + ' · ' + sizeLabel(template);
        } else name.textContent = template.name;
        if (!isCustom && pinnedIds().indexOf(template.id) === -1) card.appendChild(starFor(template));
        card.appendChild(frame);
        card.appendChild(name);
        cardLines(template, isCustom).forEach(function (line) {
            var size = document.createElement('em');
            size.textContent = line;
            card.appendChild(size);
        });
        return card;
    }

    function matches(template) {
        if (!state.query) return true;
        var size = data.extentOf(template);
        var haystack = plain((template.code || '') + ' ' + template.name + ' ' + size.w + 'x' + size.h + ' ' + data.countBoards(template) + ' anh');
        return haystack.indexOf(plain(state.query)) !== -1;
    }

    function visibleSections() {
        var customCard = { id: CUSTOM_ID, name: 'Tùy chỉnh', rows: [[{ w: 1, h: 1 }]] };
        var list = [];
        data.SECTIONS.forEach(function (section) {
            var show = state.filter === 'all' ? true : section.tags.indexOf(state.filter) !== -1;
            if (!show) return;
            var cards = section.cards.slice();
            if (section.id === 'favorites') {
                data.pick(state.starred).forEach(function (template) {
                    if (pinnedIds().indexOf(template.id) === -1) cards.push(template);
                });
            }
            list.push({ id: section.id, title: section.title, cards: cards });
        });
        if (state.filter === 'all' || state.filter === 'custom') list.push({ id: 'custom', title: 'Tùy chỉnh', cards: [customCard] });
        return list;
    }

    function sectionNode(section, cards) {
        var group = document.createElement('section');
        group.className = 'group ab-group';
        var title = document.createElement('div');
        title.className = 'section-title';
        title.setAttribute('role', 'button');
        title.tabIndex = 0;
        var collapsed = section.id !== 'favorites' && state.filter === 'all' && !state.query;
        group.classList.toggle('is-collapsed', collapsed);
        title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        title.innerHTML = '<svg class="section-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>' +
            (section.id === 'favorites' ? '<svg class="ab-star" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.4l-3.9 2.2.9-4.3-3.200-3 4.300-.5z"/></svg>' : '');
        title.appendChild(document.createTextNode(section.title));
        var grid = document.createElement('div');
        grid.className = 'ab-grid ab-cols-' + (section.id === 'favorites' && !cards.some(function (template) { return template.code; }) ? 3 : 2);
        cards.forEach(function (template) { grid.appendChild(cardFor(template)); });
        group.appendChild(title);
        group.appendChild(grid);
        return group;
    }

    function renderSections() {
        el.sections.textContent = '';
        var any = false;
        visibleSections().forEach(function (section) {
            var cards = section.cards.filter(matches);
            if (!cards.length) return;
            any = true;
            el.sections.appendChild(sectionNode(section, cards));
        });
        el.empty.hidden = any;
        refreshSelection();
    }

    function refreshSelection() {
        Array.prototype.forEach.call(el.sections.querySelectorAll('.ab-card'), function (card) {
            var on = state.selected.indexOf(card.getAttribute('data-id')) !== -1;
            card.classList.toggle('is-selected', on);
            card.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var customOn = state.selected.indexOf(CUSTOM_ID) !== -1;
        el.customGroup.hidden = !customOn;
        var chosen = chosenTemplates();
        var boards = chosen.reduce(function (sum, template) { return sum + data.countBoards(template); }, 0);
        var tooMany = boards > data.MAX_BOARDS;
        el.summary.textContent = tooMany ? 'Tối đa ' + data.MAX_BOARDS + ' artboard mỗi lần (đang chọn ' + boards + ')' :
            chosen.length ? 'Đã chọn ' + chosen.length + ' mẫu · ' + boards + ' artboard' : 'Chưa chọn mẫu nào';
        el.create.textContent = boards ? 'Tạo ' + boards + ' artboard' : 'Tạo artboard';
        el.create.disabled = !boards || tooMany;
        el.summaryIcon.classList.toggle('is-empty', !boards || tooMany);
        if (!state.nameEdited) el.name.value = chosen.length === 1 && chosen[0].code ? 'MHK_FB_' + chosen[0].code : DEFAULT_NAME;
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    // Chỉ một mẫu được chọn mỗi lần; bấm lại mẫu đang chọn thì bỏ chọn
    function toggle(id) {
        state.selected = state.selected[0] === id ? [] : [id];
        refreshSelection();
    }

    function readNumber(input, fallback, min, max) {
        var value = parseInt(input.value, 10);
        return isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    }

    function status(text, isError) {
        if (!window.dr7Status) return;
        window.dr7Status(text, isError);
        if (!isError && text) setTimeout(function () { window.dr7Status(''); }, STATUS_MS);
    }

    function create() {
        var templates = chosenTemplates();
        if (!templates.length || (window.dr7IsBusy && window.dr7IsBusy())) return;
        var gap = readNumber(el.gap, 40, 0, data.MAX_GAP);
        el.gap.value = gap;
        var spec = {
            mode: state.mode,
            name: (el.name.value.trim() || DEFAULT_NAME).slice(0, data.NAME_MAX).replace(/[\x00-\x1f]/g, ' '),
            gap: gap,
            background: el.background.value,
            guides: el.guides.checked,
            boards: data.layout(templates, gap, { prefix: templates.length > 1 || state.mode === 'current' })
        };
        el.create.disabled = true;
        window.dr7RunArtboard(spec, function (res) {
            refreshSelection();
            if (res === 'DR7_OK') status('✓ Đã tạo ' + spec.boards.length + ' artboard');
        });
    }

    function setMode(mode) {
        state.mode = mode;
        Array.prototype.forEach.call(el.modes, function (button) {
            var on = button.getAttribute('data-mode') === mode;
            button.classList.toggle('is-active', on);
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        el.name.disabled = mode === 'current';
    }

    window.dr7InitArtboard = function () {
        var root = document.querySelector('.artboard');
        if (!root || !data) return;
        ['sections', 'empty', 'customGroup', 'summary', 'summaryIcon', 'create', 'name', 'gap', 'background', 'guides', 'search'].forEach(function (key) {
            el[key] = root.querySelector('.ab-' + key.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }));
        });
        el.modes = root.querySelectorAll('.ab-mode');
        var customW = root.querySelector('.ab-custom-w'), customH = root.querySelector('.ab-custom-h');

        root.querySelector('.ab-chips').addEventListener('click', function (event) {
            var chip = event.target.closest ? event.target.closest('.ab-chip') : null;
            if (!chip) return;
            state.filter = chip.getAttribute('data-filter');
            Array.prototype.forEach.call(root.querySelectorAll('.ab-chip'), function (item) { item.classList.toggle('is-active', item === chip); });
            renderSections();
        });
        el.search.addEventListener('input', function () { state.query = el.search.value.trim(); renderSections(); });
        el.sections.addEventListener('click', function (event) {
            var star = event.target.closest ? event.target.closest('.ab-fav') : null;
            if (star) {
                event.stopPropagation();
                toggleStar(star.parentNode.getAttribute('data-id'));
                return;
            }
            var card = event.target.closest ? event.target.closest('.ab-card') : null;
            if (card) toggle(card.getAttribute('data-id'));
        });
        el.sections.addEventListener('keydown', function (event) {
            if (event.code !== 'Enter' && event.code !== 'Space') return;
            var star = event.target.closest ? event.target.closest('.ab-fav') : null;
            if (!star) return;
            event.preventDefault();
            event.stopPropagation();
            toggleStar(star.parentNode.getAttribute('data-id'));
        });
        [[customW, 'customW'], [customH, 'customH']].forEach(function (pair) {
            pair[0].addEventListener('input', function () { state[pair[1]] = parseInt(pair[0].value, 10); refreshSelection(); });
            pair[0].addEventListener('change', function () {
                state[pair[1]] = readNumber(pair[0], 1080, 1, data.MAX_SIZE);
                pair[0].value = state[pair[1]];
                refreshSelection();
            });
        });
        Array.prototype.forEach.call(el.modes, function (button) {
            button.addEventListener('click', function () { setMode(button.getAttribute('data-mode')); });
        });
        el.name.addEventListener('input', function () { state.nameEdited = true; });
        el.create.addEventListener('click', create);
        setMode('new');
        renderSections();
    };
}());
