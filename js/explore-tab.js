/* Tab Khám phá: vẽ danh sách video SCCTLM từ js/explore-feed.js, tìm kiếm, lọc chủ đề, mở link bằng trình duyệt. */
(function () {
    'use strict';

    var feed = window.dr7ExploreFeed;
    var videos = [];
    var topic = '';

    function $(selector) { return document.querySelector('.explore ' + selector); }

    function openUrl(url) {
        if (window.__adobe_cep__ && window.CSInterface) new window.CSInterface().openURLInDefaultBrowser(url);
        else window.open(url, '_blank');
    }

    function el(name, className, text) {
        var node = document.createElement(name);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    // Cả dòng là một liên kết: bấm hoặc Enter/Space đều mở video.
    function row(video) {
        var item = el('div', 'explore-row');
        item.setAttribute('role', 'link');
        item.tabIndex = 0;
        item.title = 'Mở video trên YouTube';
        var thumb = el('img', 'explore-thumb');
        thumb.src = video.thumb;
        thumb.alt = '';
        var info = el('div', 'explore-row-info');
        info.appendChild(el('strong', '', feed.shortTitle(video.title)));
        info.appendChild(el('span', 'explore-row-cta', 'Xem trên YouTube'));
        item.appendChild(thumb);
        item.appendChild(info);
        item.onclick = function () { openUrl(video.url); };
        item.onkeydown = function (event) {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openUrl(video.url); }
        };
        return item;
    }

    function render() {
        var list = $('.explore-list');
        var state = $('.explore-state');
        var shown = feed.filter(videos, $('.explore-search').value, topic);
        list.textContent = '';
        shown.forEach(function (video) { list.appendChild(row(video)); });
        if (videos.length) {
            state.hidden = shown.length > 0;
            state.textContent = 'Không có bài nào khớp.';
        }
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    function showData(data) {
        videos = data.videos;
        var featured = $('.explore-featured');
        featured.hidden = !videos.length;
        if (videos.length) featured.querySelector('img').src = videos[0].thumb;
        render();
    }

    function showError(error) {
        window.console.warn('DR7 explore:', error);
        if (videos.length) return; // đang hiện bản lưu, giữ nguyên
        var state = $('.explore-state');
        state.hidden = false;
        state.textContent = 'Không tải được danh sách (' + error.message + '). ';
        var retry = el('button', 'explore-link', 'Thử lại');
        retry.onclick = refresh;
        state.appendChild(retry);
        if (window.dr7FitHeight) window.dr7FitHeight();
    }

    function refresh() {
        feed.load().then(function (data) { feed.writeCache(data); showData(data); }).catch(showError);
    }

    var TARGETS = {
        facebook: feed && feed.FACEBOOK_URL,
        channel: feed && feed.CHANNEL_URL,
        'channel-videos': feed && feed.CHANNEL_URL + '/videos',
        playlist: feed && feed.PLAYLIST_URL
    };

    window.dr7InitExplore = function () {
        var root = document.querySelector('.explore');
        if (!root || !feed) return;
        root.addEventListener('click', function (event) {
            var button = event.target.closest ? event.target.closest('button') : null;
            if (!button) return;
            if (button.hasAttribute('data-open')) openUrl(TARGETS[button.getAttribute('data-open')]);
            else if (button.hasAttribute('data-topic')) {
                topic = button.getAttribute('data-topic');
                Array.prototype.forEach.call(root.querySelectorAll('.explore-chip'), function (chip) {
                    chip.classList.toggle('is-active', chip === button);
                });
                render();
            } else if (button.classList.contains('explore-learn-head')) {
                var open = button.getAttribute('aria-expanded') !== 'true';
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
                $('.explore-learn-body').hidden = !open;
                if (window.dr7FitHeight) window.dr7FitHeight();
            }
        });
        $('.explore-search').addEventListener('input', render);
        var cached = feed.readCache();
        if (cached) showData(cached);
        refresh();
    };
}());
