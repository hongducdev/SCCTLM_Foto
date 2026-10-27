/*
 * Khung ảnh: xem trước gần đúng ngay trong panel, dựng bằng HTML/CSS từ chính spec sẽ gửi sang Photoshop (không gọi Photoshop).
 * Ảnh chỉ là khối màu giữ đúng tỉ lệ và bo góc; font và độ rộng chữ chỉ xấp xỉ vì panel không có font của Photoshop.
 */
(function () {
    'use strict';

    var JUSTIFY = { left: 'flex-start', center: 'center', right: 'flex-end' };
    var LOGO_GAP = 0.9;
    var LOGO_MAX_WIDTH = 0.25;
    var MAX_HEIGHT = 280;

    function node(tag, className, style) {
        var element = document.createElement(tag);
        if (className) element.className = className;
        if (style) element.style.cssText = style;
        return element;
    }

    function px(value) { return Math.round(value * 100) / 100 + 'px'; }

    // Đỉnh của dòng i: đường chân chữ trừ 0.8 cỡ chữ, đúng công thức của layout()
    function rowTop(plan, index) {
        return plan.lines[index].baseline - Math.round(plan.lines[index].size * 0.8);
    }

    function row(spec, scale, index) {
        var plan = spec.layout, size = plan.lines[index].size, last = index === plan.lines.length - 1;
        var gap = last ? 0 : rowTop(plan, index + 1) - (rowTop(plan, index) + size);
        var element = node('div', 'ef-pv-row', 'height:' + px(size * scale) + ';line-height:' + px(size * scale) + ';font-size:' + px(size * scale) +
            ';margin-bottom:' + px(gap * scale));
        spec.lines[index].forEach(function (segment, i) {
            var span = node('span', '', 'color:' + (segment.muted ? spec.muted : spec.text) + (segment.bold ? ';font-weight:700' : '') +
                (i ? ';margin-left:' + px(size * 0.3 * scale) : ''));
            span.textContent = segment.text;
            element.appendChild(span);
        });
        return element;
    }

    // Cột phải của kiểu hai cột: logo, vạch đứng, rồi dòng thông số
    function sideColumn(spec, scale, top, last) {
        var plan = spec.layout, gap = plan.lines[0].size * LOGO_GAP * scale, height = (last - top) * scale;
        var column = node('div', 'ef-pv-side', 'right:' + px((plan.border + plan.inset) * scale) + ';top:' + px(top * scale) + ';height:' + px(height));
        if (spec.logo) {
            var logo = node('img', 'ef-pv-logo', 'height:' + px(height * 0.9) + ';max-width:' + px(plan.areaWidth * LOGO_MAX_WIDTH * scale));
            logo.src = 'file:///' + spec.logo.path;
            logo.alt = '';
            column.appendChild(logo);
        }
        if (spec.side) {
            if (spec.logo) column.appendChild(node('div', 'ef-pv-bar', 'margin:0 ' + px(gap) + ';width:' + px(Math.max(1, plan.lines[0].size * 0.08 * scale)) + ';background:' + spec.muted));
            var line = node('div', 'ef-pv-row', 'height:' + px(plan.side.size * scale) + ';line-height:' + px(plan.side.size * scale) + ';font-size:' + px(plan.side.size * scale));
            spec.side.forEach(function (segment) {
                var span = node('span', '', 'color:' + (segment.muted ? spec.muted : spec.text) + (segment.bold ? ';font-weight:700' : ''));
                span.textContent = segment.text;
                line.appendChild(span);
            });
            column.appendChild(line);
        }
        return column;
    }

    // box: phần tử chứa; spec: kết quả composer.compose (hoặc null để ẩn)
    window.dr7FramePreview = {
        render: function (box, spec) {
            box.textContent = '';
            box.hidden = !spec;
            if (!spec) return;
            var plan = spec.layout, scale = Math.min(((box.parentNode && box.parentNode.clientWidth) || 260) / plan.canvasW, MAX_HEIGHT / plan.canvasH), count = plan.lines.length, i;
            var top = rowTop(plan, 0), last = rowTop(plan, count - 1) + plan.lines[count - 1].size;
            box.style.width = px(plan.canvasW * scale);
            box.style.height = px(plan.canvasH * scale);
            box.style.background = spec.style === 'overlay' ? '#000000' : spec.background;
            box.appendChild(node('div', 'ef-pv-photo', 'left:' + px(plan.border * scale) + ';top:' + px(plan.border * scale) + ';width:' + px(spec.srcW * scale) +
                ';height:' + px(spec.srcH * scale) + ';border-radius:' + px(plan.radius * scale)));
            var stacked = !!spec.logo && spec.logoPos === 'top', wrapTop = stacked ? plan.logoTop : top, wrapHeight = last - wrapTop;
            var wrap = node('div', 'ef-pv-text', 'left:' + px(plan.areaLeft * scale) + ';width:' + px(plan.areaWidth * scale) + ';top:' + px(wrapTop * scale) +
                ';height:' + px(wrapHeight * scale) + ';padding:0 ' + px(plan.inset * scale) + ';justify-content:' + JUSTIFY[spec.align] +
                (stacked ? ';flex-direction:column;align-items:' + JUSTIFY[spec.align] : ''));
            if (spec.logo && spec.logoPos !== 'split') {
                var logoHeight = stacked ? plan.logoHeight : last - top, gap = plan.lines[0].size * LOGO_GAP;
                var logo = node('img', 'ef-pv-logo', 'height:' + px(logoHeight * scale) + ';max-width:' + px(plan.areaWidth * LOGO_MAX_WIDTH * scale) +
                    (stacked ? ';margin-bottom:' + px((top - plan.logoTop - plan.logoHeight) * scale) : spec.logoPos === 'right' ? '' : ';margin-right:' + px(gap * scale)));
                logo.src = 'file:///' + spec.logo.path;
                logo.alt = '';
                if (spec.logoPos === 'right') logo.style.cssText += ';position:absolute;top:' + px((top - wrapTop) * scale) + ';right:' + px(plan.inset * scale);
                wrap.appendChild(logo);
            }
            var column = node('div', 'ef-pv-column', 'text-align:' + spec.align);
            for (i = 0; i < count; i += 1) column.appendChild(row(spec, scale, i));
            wrap.appendChild(column);
            box.appendChild(wrap);
            if (spec.logoPos === 'split') box.appendChild(sideColumn(spec, scale, top, last));
        }
    };
}());
