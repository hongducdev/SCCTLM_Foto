/*
 * Nhóm Màu & Preset: 6 bộ màu (Fuji, Dazz, Kodak, Leica, Ricoh, Hồng Kông) dạng thẻ có icon, bấm 1 bộ
 * để xem các màu nhỏ bên dưới. Danh sách lấy từ presets/colors/manifest.json (xem
 * _dev/tools/build-color-presets.js).
 *
 * Mặc định bấm 1 màu là áp ngay (100%). Bật "Mix màu" thì bấm màu để thêm vào giỏ (tối đa 4): mỗi màu có
 * thanh độ mờ riêng, "Áp dụng Mix" tạo mỗi màu 1 layer (jsx/color-mix.jsx) rồi hạ độ mờ để pha thành màu mới.
 */
(function () {
    'use strict';

    var MAX_MIX = 4;
    var MIX_DEFAULT_OPACITY = 50;

    var manifest = null;
    var root, groupGrid, list, mixSwitch, basketBox, basketRows, applyButton;
    var activeGroup = null;
    var basket = [];                                    // [{id, name, opacity}]

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function mixMode() { return mixSwitch.checked; }

    function spec() {
        return basket.map(function (item) { return item.id + ':' + item.opacity; }).join(',');
    }

    function indexInBasket(id) {
        for (var i = 0; i < basket.length; i++) if (basket[i].id === id) return i;
        return -1;
    }

    function applyNow(item) {
        window.dr7ApplyColorMix(item.id + ':100');
    }

    function onChipClick(item) {
        if (!mixMode()) { applyNow(item); return; }
        var at = indexInBasket(item.id);
        if (at >= 0) basket.splice(at, 1);
        else if (basket.length < MAX_MIX) basket.push({ id: item.id, name: item.name, opacity: MIX_DEFAULT_OPACITY });
        renderBasket();
        markChips();
    }

    function markChips() {
        var chips = list.querySelectorAll('.cp-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.toggle('is-mixed', indexInBasket(chips[i].getAttribute('data-id')) >= 0);
        }
    }

    function renderList() {
        list.innerHTML = '';
        list.hidden = !activeGroup;
        if (!activeGroup) return;
        var ordered = activeGroup.items.filter(function (i) { return !i.unsupported; })
            .concat(activeGroup.items.filter(function (i) { return i.unsupported; }));
        ordered.forEach(function (item) {
            var chip = el('button', 'cp-chip', item.name);
            chip.setAttribute('data-id', item.id);
            chip.title = item.name;
            if (item.unsupported) {
                chip.disabled = true;
                chip.classList.add('is-unsupported');
                chip.title = item.name + ' — chưa hỗ trợ (thiếu dữ liệu LUT trong file preset)';
            } else {
                chip.onclick = function () { onChipClick(item); };
            }
            list.appendChild(chip);
        });
        markChips();
    }

    function selectGroup(group) {
        activeGroup = activeGroup === group ? null : group;
        var cards = groupGrid.querySelectorAll('.cp-group');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.toggle('is-selected', !!activeGroup && cards[i].getAttribute('data-group') === activeGroup.id);
        }
        renderList();
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    function renderGroups() {
        manifest.groups.forEach(function (group) {
            var card = el('button', 'cp-group');
            card.setAttribute('data-group', group.id);
            card.setAttribute('aria-label', group.name);
            card.title = group.name + ' · ' + group.items.length + ' màu';
            var icon = el('img');
            icon.src = group.icon;
            icon.alt = '';
            var check = el('i', 'cp-check');
            check.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5l3 3 5-6"/></svg>';
            card.appendChild(check);
            card.appendChild(icon);
            card.onclick = function () { selectGroup(group); };
            groupGrid.appendChild(card);
        });
    }

    function paintSlider(slider, output, value) {
        slider.style.setProperty('--fill', value + '%');
        output.textContent = value + '%';
    }

    function renderBasket() {
        basketRows.innerHTML = '';
        basket.forEach(function (item) {
            var row = el('div', 'cp-mix-row');
            var head = el('div', 'cp-mix-head');
            head.appendChild(el('span', 'cp-mix-name', item.name));
            var remove = el('button', 'cp-mix-remove', '×');
            remove.title = 'Bỏ màu này khỏi Mix';
            remove.setAttribute('aria-label', 'Bỏ ' + item.name);
            remove.onclick = function () {
                basket.splice(indexInBasket(item.id), 1);
                renderBasket();
                markChips();
            };
            head.appendChild(remove);
            var slide = el('div', 'slider-row');
            var slider = el('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = String(item.opacity);
            slider.setAttribute('aria-label', 'Độ mờ ' + item.name);
            var output = el('output');
            paintSlider(slider, output, item.opacity);
            slider.oninput = function () {
                item.opacity = Math.round(Number(slider.value));
                paintSlider(slider, output, item.opacity);
            };
            slide.appendChild(slider);
            slide.appendChild(output);
            row.appendChild(head);
            row.appendChild(slide);
            basketRows.appendChild(row);
        });
        basketBox.hidden = !mixMode();
        applyButton.disabled = basket.length === 0;
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    function buildMixControls() {
        var toggle = el('label', 'ab-switch cp-mix-toggle');
        toggle.title = 'Bật để chọn nhiều màu, mỗi màu 1 layer rồi chỉnh độ mờ để pha thành màu mới';
        toggle.appendChild(el('span', '', 'Mix màu'));
        mixSwitch = el('input');
        mixSwitch.type = 'checkbox';
        toggle.appendChild(mixSwitch);
        toggle.appendChild(el('i'));
        mixSwitch.onchange = function () {
            if (!mixMode()) { basket = []; markChips(); }
            renderBasket();
        };
        root.appendChild(toggle);

        basketBox = el('div', 'cp-mix');
        basketBox.hidden = true;
        basketRows = el('div', 'cp-mix-rows');
        basketBox.appendChild(el('p', 'cp-mix-hint', 'Chọn tối đa ' + MAX_MIX + ' màu, kéo độ mờ từng layer. Màu sau nằm trên màu trước.'));
        basketBox.appendChild(basketRows);
        applyButton = el('button', 'cp-mix-apply', 'Áp dụng Mix');
        applyButton.onclick = function () { if (basket.length) window.dr7ApplyColorMix(spec()); };
        basketBox.appendChild(applyButton);
        root.appendChild(basketBox);
    }

    window.dr7InitColorPresets = function (base) {
        root = document.querySelector('.color-presets');
        if (!root || !window.cep || !window.cep.fs || !base) return;
        var file = window.cep.fs.readFile(base + '/presets/colors/manifest.json', window.cep.encoding.UTF8);
        if (file.err) { window.console.warn('DR7 colour manifest:', file.err); return; }
        try {
            manifest = JSON.parse(file.data);
        } catch (error) {
            window.console.warn('DR7 colour manifest is not valid JSON:', error);
            return;
        }
        groupGrid = el('div', 'cp-groups');
        root.appendChild(groupGrid);
        list = el('div', 'cp-list');
        list.hidden = true;
        root.appendChild(list);
        renderGroups();
        buildMixControls();
        renderBasket();
    };
}());
