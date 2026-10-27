/*
 * Watermark: biến văn bản của mẫu gốc (徕卡一瞬) — tên máy, thông số, ngày giờ, GPS.
 * Cổng của Context.text/_text_vars/_time trong yishun-watermark-cli.py; thuần dữ liệu nên test được bằng Node.
 * info: { make, model, date "YYYY.MM.DD HH:MM[:SS]", focal "24mm", aperture "f/1.4", exposure "1/25", iso "ISO850", latlng, address }
 */
(function (root) {
    'use strict';

    var BRAND_WORDS = ['xiaomi', 'redmi', 'poco'];
    var MODEL_PARTS = /^([^\d]*?)(\d+\w*)\s*(.*)$/;
    var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var TIME_TOKEN = /^@time=@?(.*)$/;

    // Mẫu kiểu SimpleDateFormat: yyyy MM dd HH mm EEEE; ký tự khác giữ nguyên
    function formatDate(pattern, date) {
        var found = /^(\d{4})\D(\d{2})\D(\d{2})(?:\D+(\d{2})\D(\d{2}))?/.exec(date || '');
        if (!found) return '';
        var weekday = WEEKDAYS[new Date(+found[1], +found[2] - 1, +found[3]).getDay()];
        var fields = { yyyy: found[1], MM: found[2], dd: found[3], HH: found[4] === undefined ? '' : found[4], mm: found[5] === undefined ? '' : found[5], EEEE: weekday };
        return pattern.replace(/yyyy|MM|dd|HH|mm|EEEE/g, function (key) { return fields[key]; });
    }

    // "Xiaomi 17 Ultra" -> series "", number "17", name "Ultra"
    function modelVars(info) {
        var model = String(info.model || '').trim(), lower = model.toLowerCase();
        BRAND_WORDS.concat([String(info.make || '').toLowerCase()]).forEach(function (word) {
            if (word && lower.indexOf(word) === 0) { model = model.slice(word.length).trim(); lower = model.toLowerCase(); }
        });
        var parts = MODEL_PARTS.exec(model);
        return { series: parts ? parts[1] : '', versionNumber: parts ? parts[2] : model, versionName: parts ? parts[3] : '' };
    }

    function exifVars(info) {
        return {
            focal: String(info.focal || '').replace(/mm$/, ''), aperture: String(info.aperture || '').replace(/^f\//, ''),
            speed: String(info.exposure || '').replace(/s$/, ''), iso: String(info.iso || '').replace(/^ISO/, '')
        };
    }

    // Photoshop trả toạ độ dạng 21 35' 6.00" hoặc 21.5833; ref là chữ N/S/E/W (thẻ GPS 1 và 3). Toàn số 0 nghĩa là ảnh không có GPS.
    function dms(value, ref) {
        var parts = String(value === undefined ? '' : value).match(/\d+(?:\.\d+)?/g);
        if (!parts) return '';
        var nums = parts.map(parseFloat), degrees = nums[0], minutes = nums[1], seconds = nums[2];
        if (nums.length === 1) { minutes = (degrees % 1) * 60; seconds = (minutes % 1) * 60; }
        degrees = Math.floor(degrees);
        minutes = Math.floor(minutes || 0);
        seconds = seconds || 0;
        if (degrees + minutes + seconds === 0) return '';
        var letter = String(ref === undefined ? '' : ref).replace(/[^NSEW]/gi, '').toUpperCase() || (/[NSEW]\s*$/i.exec(String(value)) || [''])[0].toUpperCase();
        return degrees + '°' + minutes + "'" + seconds.toFixed(2) + '"' + letter;
    }

    // Kinh độ trước, vĩ độ sau, như app gốc; tags theo mã thẻ EXIF (1 vĩ ref, 2 vĩ độ, 3 kinh ref, 4 kinh độ)
    function latlng(tags) {
        return [dms(tags[4], tags[3]), dms(tags[2], tags[1])].filter(Boolean).join(' ');
    }

    // Thẻ 36867 "2026:10:28 01:33:12" -> "2026.10.28 01:33"
    function stamp(tags) {
        var found = /(\d{4})\D(\d{2})\D(\d{2})\D+(\d{2})\D(\d{2})/.exec(String(tags[36867] === undefined ? '' : tags[36867]));
        return found ? found[1] + '.' + found[2] + '.' + found[3] + ' ' + found[4] + ':' + found[5] : '';
    }

    // strings: bảng i18n của mẫu (tên khoá -> mẫu ngày); resolver trả về hàm text(raw) cho một ảnh
    function resolver(info, strings) {
        var vars = Object.assign(modelVars(info), exifVars(info));

        function substitute(body) {
            return body.replace(/@\{(\w+)\}/g, function (all, name) { return vars[name] === undefined ? '' : vars[name]; });
        }

        function time(raw) {
            return formatDate(strings[TIME_TOKEN.exec(raw)[1]] || '', info.date).replace(/\s+$/, '');
        }

        function location(raw) {
            var kind = raw.slice('@location='.length).split(';')[0];
            var address = String(info.address || '').trim();
            if (/^location_address/.test(kind)) return address || String(info.latlng || '');
            return String(info.latlng || '');
        }

        function text(raw) {
            if (raw.indexOf('@time=') === 0) return time(raw);
            if (raw.indexOf('@location=') === 0) return location(raw);
            if (raw.indexOf('@filter=') === 0 || raw.indexOf('@custom=') === 0) return '';
            return substitute(raw.indexOf('@model=') === 0 || raw.indexOf('@exif=') === 0 ? raw.slice(raw.indexOf('=') + 1) : raw);
        }

        return { text: text, vars: vars, hasLocation: function () { return location('@location=location_latlng') !== '' || String(info.address || '').trim() !== ''; } };
    }

    root.dr7WmVars = { resolver: resolver, formatDate: formatDate, modelVars: modelVars, dms: dms, latlng: latlng, stamp: stamp };
}(typeof window !== 'undefined' ? window : this));
