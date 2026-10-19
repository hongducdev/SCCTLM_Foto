/*
 * Tab Artboard - dữ liệu mẫu, xếp artboard và kiểm tra spec gửi sang jsx/artboard-create.jsx.
 * Không đụng tới DOM nên chạy được trong Node (tests/check-artboard-layout.js).
 *
 * Mẫu: { id, name, rows } với rows = các hàng artboard [[{w,h}, ...], ...]; mỗi hàng xếp ngang, các hàng xếp dọc.
 * Nhiều mẫu được chọn thì xếp chồng dọc, cách nhau `gap` px.
 */
(function (root) {
    'use strict';

    var MAX_SIZE = 20000;           // px mỗi cạnh
    var MAX_BOARDS = 40;
    var MAX_GAP = 1000;
    var NAME_MAX = 60;

    function box(w, h) { return { w: w, h: h }; }

    function single(id, name, w, h) { return { id: id, name: name, w: w, h: h, rows: [[box(w, h)]] }; }

    var ALBUMS = root.dr7ArtboardAlbums || [];

    var SECTIONS = [
        { id: 'favorites', title: 'Hay dùng', tags: [], cards: [
            single('square', 'Bài vuông', 1080, 1080),
            single('portrait', 'Bài dọc', 1080, 1350),
            single('story', 'Story / Reels', 1080, 1920)
        ] },
    ].concat(ALBUMS.map(function (group) {
        return { id: group.id, title: group.title, tags: ['album'], cards: group.cards };
    }), [
        { id: 'youtube', title: 'YouTube', tags: ['youtube'], cards: [
            single('yt-thumbnail', 'Thumbnail', 1280, 720),
            single('yt-banner', 'Banner kênh', 2560, 1440),
            single('yt-shorts', 'Shorts', 1080, 1920)
        ] }
    ]);

    function countBoards(template) {
        if (template.boards) return template.boards.length;
        return template.rows.reduce(function (sum, row) { return sum + row.length; }, 0);
    }

    function allTemplates() {
        return SECTIONS.reduce(function (list, section) { return list.concat(section.cards); }, []);
    }

    // Mẫu theo danh sách id, đúng thứ tự trong SECTIONS (không phụ thuộc thứ tự bấm)
    function pick(ids) {
        return allTemplates().filter(function (template) { return ids.indexOf(template.id) !== -1; });
    }

    function boardName(template, index, total) {
        return total > 1 ? template.name + ' ' + (index + 1) : template.name;
    }

    function pad2(number) { return ('0' + number).slice(-2); }

    // Album: NN_Anh_WxH[_Bo-sung] như artboard trong PSD của gói MHK (tên ASCII, xuất file đúng thứ tự đăng);
    // thêm tiền tố <mã>_ khi tài liệu có thể chứa nhiều album để tên không trùng
    function albumBoardName(template, board, index, prefix) {
        return (prefix ? template.code + '_' : '') + pad2(index + 1) + '_Anh_' + board.w + 'x' + board.h + (board.extra ? '_Bo-sung' : '');
    }

    // Xếp các mẫu thành danh sách artboard {name, x, y, w, h}, gốc (0,0) là góc trên trái artboard đầu tiên
    // options.prefix: có tiền tố mã album trong tên artboard (mặc định khi xếp từ 2 mẫu trở lên)
    function layout(templates, gap, options) {
        var boards = [], y = 0;
        var prefix = options && typeof options.prefix === 'boolean' ? options.prefix : templates.length > 1;
        templates.forEach(function (template) {
            if (template.boards) {
                var albumHeight = 0;
                template.boards.forEach(function (item, at) {
                    var placed = { name: albumBoardName(template, item, at, prefix), x: item.x, y: y + item.y, w: item.w, h: item.h, scaffold: true };
                    if (item.extra) placed.extra = true;
                    boards.push(placed);
                    albumHeight = Math.max(albumHeight, item.y + item.h);
                });
                y += albumHeight + gap;
                return;
            }
            var total = countBoards(template), index = 0, blockHeight = 0;
            template.rows.forEach(function (row, rowIndex) {
                var x = 0, rowHeight = 0;
                row.forEach(function (size) {
                    boards.push({ name: boardName(template, index, total), x: x, y: y + blockHeight, w: size.w, h: size.h });
                    x += size.w + gap;
                    rowHeight = Math.max(rowHeight, size.h);
                    index += 1;
                });
                blockHeight += rowHeight + (rowIndex < template.rows.length - 1 ? gap : 0);
            });
            y += blockHeight + gap;
        });
        return boards;
    }

    // Khối bao ngoài của một mẫu (px), gốc (0,0)
    function extentOf(template) {
        var width = 0, height = 0;
        layout([template], 0).forEach(function (b) { width = Math.max(width, b.x + b.w); height = Math.max(height, b.y + b.h); });
        return { w: width, h: height };
    }

    function isSize(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 1 && value <= MAX_SIZE;
    }

    function isCoordinate(value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0 && value <= MAX_SIZE * MAX_BOARDS;
    }

    // Tên bộ/artboard chỉ cần là chuỗi một dòng, không ký tự điều khiển
    function isName(value) {
        return typeof value === 'string' && value.length > 0 && value.length <= NAME_MAX && !/[\x00-\x1f\u2028\u2029]/.test(value);
    }

    var validator = {
        test: function (spec) {
            if (!spec || typeof spec !== 'object') return false;
            if (spec.mode !== 'new' && spec.mode !== 'current') return false;
            if (!isName(spec.name)) return false;
            if (!(typeof spec.gap === 'number' && Math.floor(spec.gap) === spec.gap && spec.gap >= 0 && spec.gap <= MAX_GAP)) return false;
            if (['white', 'black', 'transparent'].indexOf(spec.background) === -1) return false;
            if (typeof spec.guides !== 'boolean') return false;
            if (!Array.isArray(spec.boards) || spec.boards.length < 1 || spec.boards.length > MAX_BOARDS) return false;
            return spec.boards.every(function (board) {
                return board && isName(board.name) && isCoordinate(board.x) && isCoordinate(board.y) && isSize(board.w) && isSize(board.h) &&
                    (board.scaffold === undefined || board.scaffold === true);
            });
        }
    };

    root.dr7Artboard = {
        SECTIONS: SECTIONS, MAX_SIZE: MAX_SIZE, MAX_GAP: MAX_GAP, MAX_BOARDS: MAX_BOARDS, NAME_MAX: NAME_MAX,
        countBoards: countBoards, extentOf: extentOf, pick: pick, layout: layout, isSize: isSize, spec: validator
    };
}(typeof window !== 'undefined' ? window : this));
