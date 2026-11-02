/* Tab Khám phá: tải và phân tích feed RSS của kênh YouTube SCCTLM (không cần API key).
 * Thuần logic, không đụng DOM. */
(function () {
    'use strict';

    var PLAYLIST_ID = 'PLbVYhTfm4LRryXdgIl3Hzzyuk0nvcPTWe';
    var FEED = 'https://www.youtube.com/feeds/videos.xml?playlist_id=';
    var CACHE_KEY = 'dr7.explore.playlist';

    var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

    function decode(text) {
        return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (all, code) {
            if (code.charAt(0) === '#') {
                var hex = code.charAt(1).toLowerCase() === 'x';
                return String.fromCharCode(parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
            }
            return ENTITIES[code.toLowerCase()] || all;
        });
    }

    function tag(block, name) {
        var m = new RegExp('<' + name + '>([^<]*)</' + name + '>').exec(block);
        return m ? decode(m[1]).trim() : '';
    }

    function thumbnail(id) { return 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'; }

    // Feed Atom -> { title, videos: [{ id, title, url, thumb, number, published }] }
    function parse(xml) {
        var head = String(xml).split('<entry>')[0];
        var videos = [];
        var re = /<entry>([\s\S]*?)<\/entry>/g;
        var m;
        while ((m = re.exec(xml))) {
            var id = tag(m[1], 'yt:videoId');
            if (!id) continue;
            var title = tag(m[1], 'title');
            var num = /^#(\d+)/.exec(title);
            videos.push({
                id: id,
                title: title,
                url: 'https://www.youtube.com/watch?v=' + id,
                thumb: thumbnail(id),
                number: num ? +num[1] : null,
                published: tag(m[1], 'published')
            });
        }
        return { title: tag(head, 'title'), videos: videos };
    }

    // "#29 Hướng Dẫn làm hiệu ứng chữ X | Illustrator + Photoshop" -> "#29 Hiệu ứng chữ X"
    function shortTitle(title) {
        var num = /^(#\d+)\s*/.exec(title);
        var body = title.replace(/^#\d+\s*[-–]?\s*/, '').replace(/\s*[|-]\s*text effects.*$/i, '')
            .replace(/\s*\|[^|]*$/, '')
            .replace(/^Hướng Dẫn\s+(làm\s+)?/i, '').trim();
        body = body.charAt(0).toUpperCase() + body.slice(1);
        return num ? num[1] + ' ' + body : body;
    }

    // Lọc theo ô tìm kiếm (không phân biệt hoa thường) và chip chủ đề; chip rỗng = tất cả.
    function filter(videos, query, topic) {
        var q = String(query || '').trim().toLowerCase();
        var t = String(topic || '').toLowerCase();
        return videos.filter(function (video) {
            var title = video.title.toLowerCase();
            return (!q || title.indexOf(q) !== -1) && (!t || title.indexOf(t) !== -1);
        });
    }

    function load() {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', FEED + PLAYLIST_ID);
            xhr.timeout = 15000;
            xhr.onload = function () {
                if (xhr.status !== 200) return reject(new Error('YouTube ' + xhr.status));
                var data = parse(xhr.responseText);
                if (!data.videos.length) return reject(new Error('Feed không có video'));
                resolve(data);
            };
            xhr.onerror = xhr.ontimeout = function () { reject(new Error('Không kết nối được YouTube')); };
            xhr.send();
        });
    }

    function readCache() {
        try {
            var data = JSON.parse(window.localStorage.getItem(CACHE_KEY));
            return data && data.videos ? data : null;
        } catch (error) {
            window.console.warn('SCCTLM_Foto explore cache:', error);
            return null;
        }
    }

    function writeCache(data) {
        try {
            window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            window.console.warn('SCCTLM_Foto explore cache:', error);
        }
    }

    window.scctlmFotoExploreFeed = {
        CHANNEL_URL: 'https://www.youtube.com/@scctlm',
        PLAYLIST_URL: 'https://www.youtube.com/playlist?list=' + PLAYLIST_ID,
        FACEBOOK_URL: 'https://www.facebook.com/groups/397097171270586/user/61567413460933/',
        parse: parse,
        shortTitle: shortTitle,
        filter: filter,
        load: load,
        readCache: readCache,
        writeCache: writeCache
    };
}());
