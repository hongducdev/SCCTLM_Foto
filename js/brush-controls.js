/*
 * Nhóm Brush Lab: khung xem trước nét cọ + thanh Kích thước / Độ cứng của cọ hiện tại trong Photoshop
 * ($._ext_BRUSH.get / set, xem jsx/brush-size-hardness.jsx).
 *
 * Giá trị đọc lại khi mở panel và khi quay lại panel (focus), vì đổi cọ trong Photoshop làm đổi giá trị.
 * Kéo thanh trượt chỉ ghi sang Photoshop sau một nhịp ngắn (WRITE_DELAY_MS) để không gửi mỗi pixel.
 * Công cụ hiện tại không có cọ ("none") thì thanh vẫn kéo được và áp khi bấm lại vào công cụ cọ.
 */
(function () {
    'use strict';

    var WRITE_DELAY_MS = 120;
    var MAX_PREVIEW_RADIUS = 9;                        // bán kính nét xem trước ở kích thước lớn nhất của thanh trượt

    var cs = new CSInterface();
    var sizeInput = null, hardInput = null, sizeValue = null, hardValue = null, canvas = null;
    var writeTimer = 0;

    function paintTrack(input) {
        var span = input.max - input.min;
        input.style.setProperty('--fill', ((input.value - input.min) / span * 100) + '%');
    }

    // Đường đi của nét (toạ độ theo tỉ lệ khung): đuôi trái thấp, vồng lên rồi trũng xuống và vút lên đầu phải
    var STROKE = [[0.08, 0.68], [0.2, 0.52], [0.34, 0.37], [0.48, 0.38], [0.6, 0.5], [0.72, 0.6], [0.83, 0.5], [0.94, 0.3]];
    var STEPS = 220;

    // Điểm thứ t (0..1) trên đường Catmull-Rom đi qua các điểm STROKE
    function strokePoint(t, width, height) {
        var segments = STROKE.length - 1;
        var f = Math.min(t * segments, segments - 1e-6), i = Math.floor(f), u = f - i;
        var p0 = STROKE[Math.max(0, i - 1)], p1 = STROKE[i], p2 = STROKE[i + 1], p3 = STROKE[Math.min(segments, i + 2)];
        function axis(k) {
            return 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u +
                (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u * u * u);
        }
        return { x: axis(0) * width, y: axis(1) * height };
    }

    function dab(ctx, x, y, radius, hard, alpha) {
        var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
        gradient.addColorStop(hard, 'rgba(255,255,255,' + alpha + ')');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Nét cọ trắng phát sáng: lõi sáng thon hai đầu (dày theo Kích thước, mép mờ theo Độ cứng) + quầng sáng mờ quanh lõi
    function drawPreview() {
        var width = canvas.clientWidth, height = canvas.clientHeight;
        if (!width || !height) return;
        var ratio = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
        if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
        var ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        var size = Number(sizeInput.value), hard = Number(hardInput.value) / 100;
        var maxR = 1.5 + (MAX_PREVIEW_RADIUS - 1.5) * Math.sqrt(size / sizeInput.max);
        var coreStop = Math.min(0.9, 0.15 + hard * 0.75);
        var i, t, point, r;
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i <= STEPS; i += 1) {                // quầng sáng
            t = i / STEPS;
            r = maxR * 2.3 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9);
            if (r < 0.5) continue;
            point = strokePoint(t, width, height);
            dab(ctx, point.x, point.y, r, 0, 0.07);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (i = 0; i <= STEPS; i += 1) {                // lõi sáng
            t = i / STEPS;
            r = maxR * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9);
            if (r < 0.3) continue;
            point = strokePoint(t, width, height);
            dab(ctx, point.x, point.y, r, coreStop, 0.5);
        }
    }

    function render() {
        sizeValue.textContent = sizeInput.value + ' px';
        hardValue.textContent = hardInput.value + '%';
        paintTrack(sizeInput);
        paintTrack(hardInput);
        drawPreview();
    }

    function write() {
        var size = Math.round(Number(sizeInput.value)), hard = Math.round(Number(hardInput.value));
        if (!isFinite(size) || !isFinite(hard)) return;
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.set(' + size + ',' + hard + '):"SCCTLM_MISSING"', function (res) {
            if (res !== 'ok') console.warn('SCCTLM_Foto: không ghi được Size/Hardness cho cọ', res);
        });
    }

    function onInput() {
        render();
        clearTimeout(writeTimer);
        writeTimer = setTimeout(write, WRITE_DELAY_MS);
    }

    function refresh() {
        cs.evalScript('typeof $._ext_BRUSH=="object"?$._ext_BRUSH.get():"SCCTLM_MISSING"', function (res) {
            var m = /^(\d+)\|(\d+)$/.exec(res);
            if (!m) return;                                     // "none" hoặc chưa nạp lõi: giữ giá trị đang hiện
            if (document.activeElement === sizeInput || document.activeElement === hardInput) return;
            sizeInput.value = Math.min(Number(m[1]), sizeInput.max);
            hardInput.value = Math.min(Number(m[2]), hardInput.max);
            render();
        });
    }

    window.scctlmFotoInitBrushControls = function () {
        sizeInput = document.querySelector('.brush-size');
        hardInput = document.querySelector('.brush-hardness');
        sizeValue = document.querySelector('.brush-size-value');
        hardValue = document.querySelector('.brush-hardness-value');
        canvas = document.querySelector('.brush-preview');
        if (!sizeInput || !hardInput || !sizeValue || !hardValue || !canvas) return;
        sizeInput.addEventListener('input', onInput);
        hardInput.addEventListener('input', onInput);
        window.addEventListener('focus', refresh);
        window.addEventListener('resize', drawPreview);
        render();
        refresh();
    };
}());
