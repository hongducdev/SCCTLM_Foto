// Run: node tests/check-explore-feed.js
// Runs the real js/explore-feed.js against a sample YouTube Atom feed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const store = new Map();
const window = {
    console,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) }
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/explore-feed.js'), 'utf8'), { window });
const feed = window.scctlmFotoExploreFeed;

const entry = (id, title) => '<entry><id>yt:video:' + id + '</id><yt:videoId>' + id + '</yt:videoId><title>' + title +
    '</title><published>2026-09-29T01:00:27+00:00</published></entry>';
const xml = '<feed><title>300 BÀI FX &amp; Typography</title>' +
    entry('KAMfVNKMzZE', '#29 Hướng Dẫn làm hiệu ứng chữ Vành Đai - god of war: laufey | Illustrator + Photoshop') +
    entry('abc123', '#28 Hướng Dẫn làm hiệu ứng chữ 85k Thành Viên | Illustrator + Photoshop') +
    entry('xyz789', 'Giới thiệu &quot;Typography&quot; cơ bản') + '</feed>';

const data = feed.parse(xml);
assert.equal(data.title, '300 BÀI FX & Typography');
assert.equal(data.videos.length, 3);
assert.equal(data.videos[0].id, 'KAMfVNKMzZE');
assert.equal(data.videos[0].url, 'https://www.youtube.com/watch?v=KAMfVNKMzZE');
assert.equal(data.videos[0].thumb, 'https://i.ytimg.com/vi/KAMfVNKMzZE/mqdefault.jpg');
assert.equal(data.videos[0].number, 29);
assert.equal(data.videos[2].number, null);
assert.equal(data.videos[2].title, 'Giới thiệu "Typography" cơ bản');

assert.equal(feed.shortTitle(data.videos[0].title), '#29 Hiệu ứng chữ Vành Đai - god of war: laufey');
assert.equal(feed.shortTitle(data.videos[1].title), '#28 Hiệu ứng chữ 85k Thành Viên');
assert.equal(feed.shortTitle(data.videos[2].title), 'Giới thiệu "Typography" cơ bản');

assert.equal(feed.filter(data.videos, '', '').length, 3);
assert.equal(feed.filter(data.videos, 'vành', '').length, 1);
assert.equal(feed.filter(data.videos, '', 'Photoshop').length, 2);
assert.equal(feed.filter(data.videos, '85K', 'illustrator').length, 1);
assert.equal(feed.filter(data.videos, 'không có', '').length, 0);

assert.equal(feed.readCache(), null);
feed.writeCache(data);
assert.deepEqual(feed.readCache(), data);
store.set('dr7.explore.playlist', '{bad json');
assert.equal(feed.readCache(), null);
assert.equal(feed.parse('<feed></feed>').videos.length, 0);
console.log('explore feed checks passed');
