/*
 * Watermark: bộ kiểm tra dữ liệu gửi sang Photoshop (xem panel.js, kind 'wm') — danh sách đo chữ và kế hoạch vẽ do js/wm-layout.js tạo.
 * Mọi thứ nhúng vào mã ExtendScript đều phải qua đây: số hữu hạn trong khoảng, chữ không có ký tự điều khiển, tên file đúng mẫu.
 */
(function (root) {
    'use strict';

    var MAX_SIZE = 30000;
    var MAX_OPS = 400;
    var TEXT_MAX = 300;
    var FONT = /^[A-Za-z0-9_.+-]{1,80}$/;
    var IMAGE_FILE = /^[0-9a-f]{12}\.png$/;
    var DIR_MAX = 400;
    var OUTPUTS = ['layers', 'flatten'];
    var CONTROL = new RegExp('[\\x00-\\x1f' + String.fromCharCode(0x2028, 0x2029) + ']');

    function inRange(value, min, max) { return typeof value === 'number' && isFinite(value) && value >= min && value <= max; }
    function isText(value) { return typeof value === 'string' && value.length <= TEXT_MAX && !CONTROL.test(value); }
    function isColor(c) { return !!c && [c.r, c.g, c.b].every(function (v) { return inRange(v, 0, 255) && Math.floor(v) === v; }) && inRange(c.a, 0, 1); }
    function isBox(op) { return inRange(op.x, -MAX_SIZE, MAX_SIZE) && inRange(op.y, -MAX_SIZE, MAX_SIZE) && inRange(op.w, 0, MAX_SIZE) && inRange(op.h, 0, MAX_SIZE); }
    function isRot(op) { return [0, 90, 180, 270].indexOf(op.rot) !== -1; }

    var OP = {
        fill: function (op) { return isColor(op.color); },
        rrect: function (op) {
            return inRange(op.radius, 0, MAX_SIZE) && inRange(op.lineWidth, 0, MAX_SIZE) && (op.fill === null || isColor(op.fill)) && (op.line === null || isColor(op.line));
        },
        image: function (op) { return IMAGE_FILE.test(op.file) && isRot(op) && op.w >= 1 && op.h >= 1; },
        text: function (op) {
            return isText(op.text) && op.text !== '' && isRot(op) && inRange(op.lw, 0, MAX_SIZE) && inRange(op.lh, 0, MAX_SIZE) && inRange(op.dx, -MAX_SIZE, MAX_SIZE) &&
                inRange(op.base, -MAX_SIZE, MAX_SIZE) && inRange(op.size, 1, 2000) && inRange(op.tracking, -1000, 1000) && typeof op.bold === 'boolean' && isColor(op.color);
        },
        photo: function () { return true; }
    };

    function isOp(op) {
        return !!op && Object.prototype.hasOwnProperty.call(OP, op.t) && isBox(op) && OP[op.t](op);
    }

    // plan: { width, height, srcW, srcH, photo: { x, y, w, h }, font: { regular }, imageDir, output, ops }
    var plan = {
        test: function (spec) {
            if (!spec || typeof spec !== 'object' || !inRange(spec.width, 1, MAX_SIZE) || !inRange(spec.height, 1, MAX_SIZE)) return false;
            if (!inRange(spec.srcW, 1, MAX_SIZE) || !inRange(spec.srcH, 1, MAX_SIZE) || !spec.photo || !isBox(spec.photo)) return false;
            if (!spec.font || !FONT.test(spec.font.regular) || OUTPUTS.indexOf(spec.output) === -1) return false;
            if (typeof spec.imageDir !== 'string' || spec.imageDir.length === 0 || spec.imageDir.length > DIR_MAX || CONTROL.test(spec.imageDir)) return false;
            return Array.isArray(spec.ops) && spec.ops.length >= 1 && spec.ops.length <= MAX_OPS && spec.ops.every(isOp) &&
                spec.ops.filter(function (op) { return op.t === 'photo'; }).length === 1;
        }
    };

    // list: [{ text, font, bold, size }] gửi cho jsx/wm-measure.jsx (bản đậm của font do Photoshop tự tìm)
    var measureList = {
        test: function (list) {
            return Array.isArray(list) && list.length <= MAX_OPS && list.every(function (e) { return !!e && isText(e.text) && FONT.test(e.font) && typeof e.bold === 'boolean' && inRange(e.size, 1, 2000); });
        }
    };

    root.dr7WmSpec = { plan: plan, measureList: measureList, FONT: FONT };
}(typeof window !== 'undefined' ? window : this));
