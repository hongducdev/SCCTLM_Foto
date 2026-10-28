/*
 * Watermark: bộ tính bố cục của mẫu gốc (徕卡一瞬). Cổng của measure/render trong yishun-watermark-cli.py,
 * nhưng thay vì ghép ảnh thì trả về danh sách thao tác vẽ (nền, ảnh, chữ, khung bo) với toạ độ px tuyệt đối.
 * Thuần tính toán nên test được bằng Node; độ rộng chữ do bên gọi đo (Photoshop) qua measure(text, font).
 *
 * plan(template, options) -> { width, height, photo: { x, y, w, h }, ops: [...] }
 *   options: { layout, background (tên), brand, customName (tên hiện ở chỗ logo khi brand = 'custom'), photo: { w, h }, refWidth, info, measure }
 *   ops (px, gốc là góc trên trái của ảnh kết quả):
 *     { t: 'fill', x, y, w, h, color }                       color: { r, g, b, a }  (a 0..1)
 *     { t: 'rrect', x, y, w, h, radius, fill, line, lineWidth }
 *     { t: 'image', file, x, y, w, h, rot }                   file: tên ảnh trong img/wm
 *     { t: 'text', text, x, y, w, h, rot, lw, lh, dx, base, face, size, tracking, bold, color }   (x,y,w,h: hộp đã xoay; lw,lh,dx,base: hộp gốc)
 *     { t: 'photo', x, y, w, h }
 */
(function (root) {
    'use strict';

    // Ascent/descent theo em (hhea) của từng font; FreeType đo theo 1/64 px rồi làm tròn lên. 'default' là MiSans, font hệ thống của app
    var FACES = {
        default: { ascent: 1.044, descent: 0.282 },
        lg1056: { ascent: 1.009, descent: 0.211 },
        oxanium: { ascent: 0.79, descent: 0.21 }
    };
    var BOLD_FROM = 550;
    var HIDDEN_TYPES = { type_custom_signature: 1, type_custom_text: 1, type_leica_looks_container: 1, type_leica_lens_container: 1 };
    var DP = /^-?[\d.]+dp$/;
    var PERCENT_W = /^([\d.]+)%w$/;

    // typeface trong mẫu: '@file=lg1056_regular.otf', 'oxanium' hoặc 'default' (font hệ thống)
    function faceOf(typeface) {
        var name = String(typeface || '').replace(/^@file=/, '').toLowerCase();
        return name.indexOf('lg1056') === 0 ? 'lg1056' : name === 'oxanium' ? 'oxanium' : 'default';
    }

    // round() của Python: làm tròn về số chẵn khi đúng .5
    function pyRound(value) {
        var floor = Math.floor(value), diff = value - floor;
        if (diff < 0.5) return floor;
        if (diff > 0.5) return floor + 1;
        return floor % 2 === 0 ? floor : floor + 1;
    }

    function parseColor(value) {
        var found = /^#?([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6})$/.exec(String(value).trim());
        if (!found) return null;
        var hex = found[1].length === 6 ? 'FF' + found[1] : found[1], at = function (i) { return parseInt(hex.slice(i, i + 2), 16); };
        return { r: at(2), g: at(4), b: at(6), a: at(0) / 255 };
    }

    function gravity(node) {
        var flags = {};
        String(node.layout_gravity || node.gravity || '').split('|').forEach(function (flag) { if (flag) flags[flag] = true; });
        return flags;
    }

    function place(flags, axis, slack) {
        if (axis === 'x') return flags.center || flags.center_horizontal ? slack / 2 : flags.right ? slack : 0;
        return flags.center || flags.center_vertical ? slack / 2 : flags.bottom ? slack : 0;
    }

    function isModelText(node) { return node.type === 'TextView' && String(node.text || '').indexOf('@model=') === 0; }

    // Logo hãng 'custom': chỗ ảnh logo hiện tên máy bằng LG1056; hai dòng tên máy gốc (series/số, phiên bản) bị ẩn để khỏi lặp
    function withCustomName(node, name) {
        var children = node.childViews || [], logo = children.filter(function (c) { return c.type === 'ImageView' && c.id === 'logo'; })[0];
        var model = children.filter(isModelText)[0], swap = !!logo && !!model;
        return Object.assign({}, node, {
            childViews: children.map(function (child) {
                if (swap && child === logo) return Object.assign({}, logo, { type: 'TextView', text: name, font_ref: model.font_ref, face: 'lg1056' });
                return swap && isModelText(child) ? null : withCustomName(child, name);
            }).filter(Boolean)
        });
    }

    function plan(template, options) {
        var photo = options.photo, u = photo.w / (options.refWidth || 1080), info = options.info;
        var strings = template.strings, resolver = root.dr7WmVars.resolver(info, strings), fonts = template.fonts;
        var backgrounds = template.backgrounds.length ? template.backgrounds : [{ name: 'none', value: '@color=#00FFFFFF', foreground: [] }];
        var bg = backgrounds.filter(function (b) { return b.name === options.background; })[0] || backgrounds[0];
        var hasLocation = resolver.hasLocation();

        function color(spec) {
            var fg = /^@foreground=(\d+)$/.exec(spec);
            if (fg) spec = (bg.foreground || [])[+fg[1]] || '';
            return parseColor(String(spec).replace(/^@color=/, '')) || { r: 0, g: 0, b: 0, a: 0 };
        }

        function foregroundName(index) { return String((bg.foreground || [])[index] || '').replace(/^#/, ''); }

        function dp(value) {
            if (typeof value === 'number') return value * u;
            if (typeof value === 'string' && DP.test(value)) return parseFloat(value) * u;
            var percent = typeof value === 'string' && PERCENT_W.exec(value);
            return percent ? parseFloat(percent[1]) / 100 * photo.w : null;
        }

        function imageFile(path) {
            var opts = {};
            path.split(';').forEach(function (pair) { var at = pair.indexOf('='); if (at > 0) opts[pair.slice(0, at)] = pair.slice(at + 1); });
            var file = opts.pathType === 'fill' ? options.brand + '_' + foregroundName(+opts.foreground) + '.webp' :
                opts.pathType === 'select' ? opts.path + '_' + foregroundName(+opts.foreground) + '.webp' : opts.path || '';
            return file.indexOf('@') !== -1 || file.indexOf('$') !== -1 || !template.files[file] ? null : { name: file, info: template.files[file] };
        }

        function fontOf(ref, face) {
            var spec = fonts[ref], size = Math.max(1, pyRound(spec.size * u)), weight = /(\d+)/.exec(spec.variation || '');
            return { face: face || faceOf(spec.typeface), size: size, tracking: (spec.letterSpacing || 0) * 1000, spacing: (spec.letterSpacing || 0) * size, bold: !!weight && +weight[1] >= BOLD_FROM, color: color(spec.color) };
        }

        function textOf(node) {
            var text = resolver.text(node.text);
            return node.text_upper ? text.toUpperCase() : text;
        }

        function visible(node) {
            if (node.enable === false || HIDDEN_TYPES[node.setting_optional_type]) return false;
            if (node.setting_optional_type === 'type_time' && options.hideDate) return false;
            if (node.setting_optional_type === 'type_location' && !hasLocation) return false;
            if (node.type === 'TextView') return textOf(node) !== '';
            if (node.type === 'ImageView') return node.id === 'src_image_view' || imageFile(node.path) !== null;
            return true;
        }

        function kids(node) { return (node.childViews || []).filter(visible); }
        function margin(node, key) { return dp(node[key]) || 0; }

        function ceil64(value) { return Math.ceil(Math.round(value * 64) / 64); }
        function ascent(font) { return ceil64(FACES[font.face].ascent * font.size); }
        function lineHeight(font) { return ascent(font) + ceil64(FACES[font.face].descent * font.size); }

        function textWidth(text, font) {
            return options.measure(text, font) + font.spacing * text.length;
        }

        function textSize(node) {
            var font = fontOf(node.font_ref, node.face), text = textOf(node), width = textWidth(text, font), rect = node.rect_params;
            if (rect) {
                var gap = rect.rect_text_width_gap * u;
                return [pyRound(width + 2 * gap), pyRound(dp(rect.rect_height) || lineHeight(font) + 2 * (rect.rect_text_height_gap || 0) * u)];
            }
            return [pyRound(width), lineHeight(font)];
        }

        function imageSize(node) {
            if (node.id === 'src_image_view') return [photo.w, photo.h];
            var size = imageFile(node.path).info, h = dp(node.display_height), w = dp(node.display_width) || h * size[1] / size[2];
            return [pyRound(w), pyRound(h)];
        }

        function measure(node) {
            if (node.type === 'TextView') return textSize(node);
            if (node.type === 'ImageView') return imageSize(node);
            var horizontal = node.orientation === 'horizontal', vertical = node.orientation === 'vertical', w = 0, h = 0;
            kids(node).forEach(function (child) {
                var size = measure(child), cw = margin(child, 'margin_left') + size[0], ch = margin(child, 'margin_top') + size[1];
                if (horizontal) { w += cw; h = Math.max(h, ch); } else if (vertical) { w = Math.max(w, cw); h += ch; } else { w = Math.max(w, cw); h = Math.max(h, ch); }
            });
            w = pyRound(dp(node.layout_width) || w);
            h = pyRound(dp(node.layout_height) || h);
            return node.degree === 90 || node.degree === 270 ? [h, w] : [w, h];
        }

        function backgroundOf(node, w, h) {
            var spec = node.background;
            if (!spec || !/^@(foreground|background|color)/.test(spec)) return null;
            var fill = color(spec);
            if (/^@background=/.test(spec)) {
                var name = spec.split('=')[1], named = node.background_optional ? bg : backgrounds.filter(function (b) { return b.name === name; })[0] || bg;
                fill = parseColor(String(named.value).split(';')[0].replace(/^@color=/, '')) || fill;
            }
            return fill.a > 0 ? { t: 'fill', x: 0, y: 0, w: w, h: h, color: fill } : null;
        }

        function textOps(node, w, h) {
            var font = fontOf(node.font_ref, node.face), text = textOf(node), rect = node.rect_params, ops = [], dx = 0, width = textWidth(text, font);
            if (rect) {
                dx = rect.rect_text_width_gap * u;
                ops.push({ t: 'rrect', x: 0, y: 0, w: w, h: h, radius: rect.rect_radius[0] * u,
                    fill: rect.rect_fill_color ? color(rect.rect_fill_color) : null, line: rect.rect_line_color ? color(rect.rect_line_color) : null,
                    lineWidth: Math.max(1, pyRound((rect.rect_line_width || 0) * u)) });
                dx = Math.max(dx, (w - width) / 2);
            }
            ops.push({ t: 'text', text: text, x: 0, y: 0, w: w, h: h, rot: 0, lw: w, lh: h, dx: dx,
                base: (h - lineHeight(font)) / 2 + ascent(font), face: font.face, size: font.size, tracking: font.tracking, bold: font.bold, color: font.color });
            return ops;
        }

        // Quay cả khối con 90/270 độ ngược chiều kim đồng hồ như PIL rotate(expand=True); (cw, ch) là canvas trước khi quay
        function rotate(ops, degree, cw, ch) {
            return ops.map(function (op) {
                var next = Object.assign({}, op);
                if (degree === 90) { next.x = op.y; next.y = cw - (op.x + op.w); } else { next.x = ch - (op.y + op.h); next.y = op.x; }
                next.w = op.h;
                next.h = op.w;
                if (op.rot !== undefined) next.rot = (op.rot + degree) % 360;
                return next;
            });
        }

        function render(node, w, h) {
            if (node.type === 'ImageView') {
                if (node.id === 'src_image_view') return [{ t: 'photo', x: 0, y: 0, w: w, h: h }];
                return [{ t: 'image', file: imageFile(node.path).info[0], x: 0, y: 0, w: Math.max(1, w), h: Math.max(1, h), rot: 0 }];
            }
            if (node.type === 'TextView') return textOps(node, w, h);
            var turned = node.degree === 90 || node.degree === 270, cw = turned ? h : w, ch = turned ? w : h, ops = [];
            var fill = backgroundOf(node, cw, ch);
            if (fill) ops.push(fill);
            var children = kids(node).map(function (child) { return [child, measure(child)]; });
            var horizontal = node.orientation === 'horizontal', vertical = node.orientation === 'vertical', used = 0, anchored = false;
            children.forEach(function (pair) {
                var flags = gravity(pair[0]);
                used += horizontal ? margin(pair[0], 'margin_left') + pair[1][0] : margin(pair[0], 'margin_top') + pair[1][1];
                if (horizontal ? flags.right || flags.center_horizontal : flags.bottom || flags.center_vertical) anchored = true;
            });
            var own = gravity(node), cursor = anchored ? 0 : horizontal ? place(own, 'x', cw - used) : vertical ? place(own, 'y', ch - used) : 0;
            children.forEach(function (pair) {
                var child = pair[0], size = pair[1], flags = gravity(child), x, y;
                var fw = child.layout_width === 'match_parent' ? cw : size[0], fh = child.layout_height === 'match_parent' ? ch : size[1];
                if (horizontal) {
                    y = place(flags, 'y', ch - fh) + margin(child, 'margin_top');
                    x = (flags.right ? place(flags, 'x', cw - fw) : flags.center_horizontal ? cursor + (cw - used) / 2 : cursor) + margin(child, 'margin_left');
                    cursor = x + fw;
                } else if (vertical) {
                    x = place(flags, 'x', cw - fw) + margin(child, 'margin_left');
                    y = (flags.bottom ? place(flags, 'y', ch - fh) : flags.center_vertical ? cursor + (ch - used) / 2 : cursor) + margin(child, 'margin_top');
                    cursor = y + fh;
                } else {
                    x = place(flags, 'x', cw - fw) + margin(child, 'margin_left');
                    y = place(flags, 'y', ch - fh) + margin(child, 'margin_top');
                }
                var ox = pyRound(x), oy = pyRound(y);
                render(child, fw, fh).forEach(function (op) {
                    var moved = Object.assign({}, op);
                    moved.x = op.x + ox;
                    moved.y = op.y + oy;
                    ops.push(moved);
                });
            });
            return turned ? rotate(ops, node.degree, cw, ch) : ops;
        }

        var key = options.layout || (!hasLocation && template.layouts.layout_loc_off ? 'layout_loc_off' : template.layouts.layout ? 'layout' : Object.keys(template.layouts)[0]);
        var rootNode = template.layouts[key][0];
        if (options.brand === 'custom' && options.customName) rootNode = withCustomName(rootNode, options.customName);
        var size = measure(rootNode), ops = render(rootNode, size[0], size[1]);
        var photoOp = ops.filter(function (op) { return op.t === 'photo'; })[0];
        return { width: size[0], height: size[1], photo: photoOp ? { x: photoOp.x, y: photoOp.y, w: photoOp.w, h: photoOp.h } : null, ops: ops, layout: key };
    }

    function layoutKeys(template) { return Object.keys(template.layouts); }

    root.dr7WmLayout = { plan: plan, layoutKeys: layoutKeys, pyRound: pyRound, faceOf: faceOf };
}(typeof window !== 'undefined' ? window : this));
