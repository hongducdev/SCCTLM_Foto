(function () {
  'use strict';
  var links = document.querySelectorAll('[data-release-link]');
  var labels = document.querySelectorAll('[data-release-version]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fetch('https://api.github.com/repos/hongducdev/SCCTLM_Foto/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (rel) {
      labels.forEach(function (l) { l.textContent = rel.tag_name || ''; });
      var zip = (rel.assets || []).filter(function (a) { return /\.zip$/i.test(a.name); })[0];
      if (zip) links.forEach(function (a) { a.href = zip.browser_download_url; });
    })
    .catch(function (err) { console.warn('Không đọc được bản phát hành mới nhất:', err.message); });

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null;
    var duration = 1400;
    function tick(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (!reduced && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObserver.observe(c); });
  }

  var faqs = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
  var EASE = 'cubic-bezier(.2, .8, .2, 1)';

  function slide(d, toOpen) {
    var from = d.getBoundingClientRect().height;
    if (d._anim) d._anim.cancel();
    if (toOpen) d.open = true;
    d.classList.toggle('is-open', toOpen);
    var to = toOpen ? d.getBoundingClientRect().height : d.querySelector('summary').offsetHeight;
    if (reduced) { d.open = toOpen; return; }
    d.style.overflow = 'hidden';
    var anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 480, easing: EASE });
    d._anim = anim;
    anim.onfinish = function () {
      d._anim = null;
      d.style.overflow = '';
      d.style.height = '';
      if (!toOpen) d.open = false;
    };
  }

  faqs.forEach(function (d) {
    d.removeAttribute('name');
    d.classList.toggle('is-open', d.open);
    d.querySelector('summary').addEventListener('click', function (ev) {
      ev.preventDefault();
      var toOpen = !d.classList.contains('is-open');
      if (toOpen) faqs.forEach(function (o) { if (o !== d && o.classList.contains('is-open')) slide(o, false); });
      slide(d, toOpen);
    });
  });

  var items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.remove('reveal'); });
    return;
  }

  items.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.classList.contains('reveal'); });
    el.style.setProperty('--d', Math.min(siblings.indexOf(el), 5) * 80 + 'ms');
  });

  var revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      obs.unobserve(el);
      el.classList.add('in');
      setTimeout(function () {
        el.classList.remove('reveal', 'in');
        el.style.removeProperty('--d');
      }, 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el) { revealObserver.observe(el); });
})();
