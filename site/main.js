(function () {
  'use strict';
  var links = document.querySelectorAll('[data-release-link]');
  var labels = document.querySelectorAll('[data-release-version]');

  fetch('https://api.github.com/repos/hongducdev/SCCTLM_Foto/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (rel) {
      labels.forEach(function (l) { l.textContent = rel.tag_name || ''; });
      var zip = (rel.assets || []).filter(function (a) { return /\.zip$/i.test(a.name); })[0];
      if (zip) links.forEach(function (a) { a.href = zip.browser_download_url; });
    })
    .catch(function (err) { console.warn('Không đọc được bản phát hành mới nhất:', err.message); });
})();
