/*
 * Khung ảnh: đổi danh sách EXIF do jsx/exif-frame.jsx trả về ("mã thẻ<TAB>giá trị" từng dòng) thành các trường hiển thị.
 * Thuần dữ liệu, không đụng DOM/Photoshop nên test được bằng Node (tests/check-exif-frame.js).
 */
(function (root) {
    'use strict';

    // Mã thẻ EXIF chuẩn; tên thẻ do Photoshop trả về thay đổi theo phiên bản nên khớp theo mã
    var TAG = { make: 271, model: 272, exposure: 33434, fnumber: 33437, iso: 34855, date: 36867, focal: 37386, focal35: 41989, lens: 42036 };
    var FIELDS = ['focal', 'fnumber', 'shutter', 'iso', 'lens', 'date'];
    var DEFAULT_PICKS = ['focal', 'fnumber', 'shutter', 'iso'];

    function parseTags(text) {
        var tags = {};
        String(text).split('\n').forEach(function (line) {
            var at = line.indexOf('\t');
            var id = parseInt(line.slice(0, at), 10);
            if (at > 0 && isFinite(id)) tags[id] = line.slice(at + 1).trim();
        });
        return tags;
    }

    function firstNumber(value) {
        var found = /\d+(?:\.\d+)?/.exec(String(value === undefined ? '' : value));
        return found ? parseFloat(found[0]) : NaN;
    }

    function trimNumber(number, digits) {
        return String(parseFloat(number.toFixed(digits)));
    }

    // Ưu tiên tiêu cự quy đổi 35mm: đó là con số máy điện thoại ghi trên ảnh ("121mm")
    function focalText(tags) {
        var mm = firstNumber(tags[TAG.focal35]);
        if (!(mm > 0)) mm = firstNumber(tags[TAG.focal]);
        return mm > 0 ? Math.round(mm) + 'mm' : '';
    }

    function fnumberText(tags) {
        var value = firstNumber(tags[TAG.fnumber]);
        return value > 0 ? 'f/' + trimNumber(value, 1) : '';
    }

    // "1/40", "0.025 (1/40) sec" hay "0.5" đều ra dạng ngắn "1/40s" / "1/2s" / "2s"
    function shutterText(tags) {
        var raw = String(tags[TAG.exposure] === undefined ? '' : tags[TAG.exposure]);
        var ratio = /(\d+)\s*\/\s*(\d+)/.exec(raw);
        if (ratio) return ratio[1] + '/' + ratio[2] + 's';
        var seconds = firstNumber(raw);
        if (!(seconds > 0)) return '';
        return seconds >= 1 ? trimNumber(seconds, 1) + 's' : '1/' + Math.round(1 / seconds) + 's';
    }

    // Thẻ ISO chuẩn (34855) trước; một số máy chỉ ghi ISOSpeed (34867) hoặc RecommendedExposureIndex (34866)
    function isoText(tags) {
        var value = [TAG.iso, 34867, 34866].map(function (id) { return firstNumber(tags[id]); }).filter(function (n) { return n > 0; })[0];
        return value > 0 ? 'ISO' + Math.round(value) : '';
    }

    // "2023:10:05 12:30:00" -> "2023-10-05"
    function dateText(tags) {
        var found = /(\d{4})\D(\d{2})\D(\d{2})/.exec(String(tags[TAG.date] === undefined ? '' : tags[TAG.date]));
        return found ? found[1] + '-' + found[2] + '-' + found[3] : '';
    }

    function join(fields, picks, separator) {
        return picks.map(function (key) { return fields[key]; }).filter(Boolean).join(separator);
    }

    // Hãng hay lặp trong tên máy ("Canon" / "Canon EOS R5"): bỏ phần lặp để dòng "Shot on" không bị đôi
    function describe(tags) {
        var make = tags[TAG.make] || '', model = tags[TAG.model] || '';
        if (make && model.toLowerCase().indexOf(make.toLowerCase()) === 0) model = model.slice(make.length).trim() || model;
        var fields = {
            focal: focalText(tags), fnumber: fnumberText(tags), shutter: shutterText(tags), iso: isoText(tags),
            lens: tags[TAG.lens] || '', date: dateText(tags)
        };
        return { make: make, model: model, fields: fields, settings: join(fields, DEFAULT_PICKS, ' ') };
    }

    root.dr7ExifFields = { FIELDS: FIELDS, DEFAULT_PICKS: DEFAULT_PICKS, parseTags: parseTags, describe: describe, join: join };
}(typeof window !== 'undefined' ? window : this));
