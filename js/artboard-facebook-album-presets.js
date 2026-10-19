/*
 * Bộ mẫu album Facebook MHK (27 mẫu) cho tab Artboard. Tọa độ tuyệt đối, gốc (0,0), thứ tự = thứ tự đăng.
 * Artboard ghép sát nhau; từ ảnh 06 trở đi (extra) đặt tách bên phải khối 5 ô đầu.
 * Nguồn số liệu: gói MHK_Facebook_Artboards_2026 (đối chiếu bằng tests/fixtures/facebook-album-layouts.json).
 * Kích thước chỉ là cỡ làm việc của bộ mẫu, không phải thông số Meta.
 */
(function (root) {
    'use strict';

    var BIG = 1800, UNIT = 1200;
    var EXTRA_SLOTS = [[3840, 0], [5160, 0], [3840, 1320], [5160, 1320], [3840, 2640]];

    function box(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
    function unit(x, y) { return box(x, y, UNIT, UNIT); }

    // 5 ô đầu: A = 2 vuông lớn trên + 3 ô dưới; B = 2 vuông lớn trái + 3 ô ngang 3:2 phải
    var MAIN_A = [box(0, 0, BIG, BIG), box(BIG, 0, BIG, BIG), unit(0, BIG), unit(UNIT, BIG), unit(2 * UNIT, BIG)];
    var MAIN_B = [box(0, 0, BIG, BIG), box(0, BIG, BIG, BIG), box(BIG, 0, BIG, UNIT), box(BIG, UNIT, BIG, UNIT), box(BIG, 2 * UNIT, BIG, UNIT)];

    function withExtras(main, count) {
        return main.concat(EXTRA_SLOTS.slice(0, count - 5).map(function (slot) {
            var extra = unit(slot[0], slot[1]);
            extra.extra = true;
            return extra;
        }));
    }

    function album(code, name, boards) {
        return { id: 'album-' + code.toLowerCase(), code: code, name: name, boards: boards };
    }

    function single(code, name, w, h) { return album(code, name, [box(0, 0, w, h)]); }

    var ONE_AND_STORY = [
        single('01A', 'Vuông 1:1', 1200, 1200),
        single('01B', 'Dọc 4:5', 1080, 1350),
        single('01C', 'Dọc 4:5 lớn', 1440, 1800),
        single('01D', 'Ngang / link', 1200, 630),
        single('01E', 'Ngang 16:9', 1920, 1080),
        single('11A', 'Story / Reels', 1080, 1920),
        single('11B', 'Story / Reels lớn', 1440, 2560)
    ];

    var TWO_THREE = [
        album('02A', '2 dọc cạnh nhau', [box(0, 0, UNIT, 2 * UNIT), box(UNIT, 0, UNIT, 2 * UNIT)]),
        album('02B', '2 ngang trên dưới', [box(0, 0, 2 * UNIT, UNIT), box(0, UNIT, 2 * UNIT, UNIT)]),
        album('02C', '2 vuông cạnh nhau', [unit(0, 0), unit(UNIT, 0)]),
        album('03A', '1 trên + 2 dưới', [box(0, 0, 2 * UNIT, UNIT), unit(0, UNIT), unit(UNIT, UNIT)]),
        album('03B', '1 trái + 2 phải', [box(0, 0, UNIT, 2 * UNIT), unit(UNIT, 0), unit(UNIT, UNIT)])
    ];

    var FOUR_FIVE = [
        album('04A', 'Lưới 2 × 2', [unit(0, 0), unit(UNIT, 0), unit(0, UNIT), unit(UNIT, UNIT)]),
        album('04B', '1 trên + 3 dưới', [box(0, 0, 3 * UNIT, 2 * UNIT), unit(0, 2 * UNIT), unit(UNIT, 2 * UNIT), unit(2 * UNIT, 2 * UNIT)]),
        album('04C', '1 trái + 3 phải', [box(0, 0, 2 * UNIT, 3 * UNIT), unit(2 * UNIT, 0), unit(2 * UNIT, UNIT), unit(2 * UNIT, 2 * UNIT)]),
        album('05A', '2 trên + 3 dưới', MAIN_A),
        album('05B', '2 trái + 3 phải', MAIN_B)
    ];

    var SIX_TEN = [];
    [6, 7, 8, 9, 10].forEach(function (count) {
        SIX_TEN.push(album(('0' + count).slice(-2) + 'A', '2 trên + 3 dưới', withExtras(MAIN_A, count)));
        SIX_TEN.push(album(('0' + count).slice(-2) + 'B', '2 trái + 3 phải', withExtras(MAIN_B, count)));
    });

    root.dr7ArtboardAlbums = [
        { id: 'album-single', title: 'Album · 1 ảnh & Story', cards: ONE_AND_STORY },
        { id: 'album-2-3', title: 'Album · 2–3 ảnh', cards: TWO_THREE },
        { id: 'album-4-5', title: 'Album · 4–5 ảnh', cards: FOUR_FIVE },
        { id: 'album-6-10', title: 'Album · 6–10 ảnh', cards: SIX_TEN }
    ];
}(typeof window !== 'undefined' ? window : this));
