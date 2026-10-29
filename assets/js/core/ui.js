/* ui.js — সব পেজের ছোট সাধারণ টুল: বাংলা সংখ্যা, তারিখ, ছবির বিকল্প, টেমপ্লেট ক্লোন */
(function () {
  'use strict';
  var DIG = '০১২৩৪৫৬৭৮৯';
  var MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23C9A98A'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%23F7F3EC'/%3E%3Cpath d='M6 40c2-10 9-13 14-13s12 3 14 13z' fill='%23F7F3EC'/%3E%3C/svg%3E";
  var COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23C9A98A'/%3E%3C/svg%3E";
  var STAR = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>';

  window.PDUI = {
    bn: function (n) { return String(n).replace(/\d/g, function (d) { return DIG[d]; }); },
    date: function (s) {
      var d = new Date(s);
      if (isNaN(d)) return '';
      return this.bn(d.getDate()) + ' ' + MON[d.getMonth()] + ', ' + this.bn(d.getFullYear());
    },
    qs: function (k) { return new URLSearchParams(location.search).get(k); },
    avatar: function (u) { return u || AVATAR; },
    cover: function (u) { return u || COVER; },
    /* <template id="..."> থেকে প্রথম এলিমেন্টের কপি */
    tpl: function (id) { return document.getElementById(id).content.firstElementChild.cloneNode(true); },
    set: function (root, sel, text) { var e = root.querySelector(sel); if (e) e.textContent = text == null ? '' : text; return e; },
    img: function (root, sel, src, alt) {
      var e = root.querySelector(sel);
      if (e) { e.src = src; if (alt != null) e.alt = alt; }
      return e;
    },
    /* তারা: filled=true হলে ভরাট */
    starSVG: function (filled) {
      return '<svg viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.5">' + STAR + '</svg>';
    },
    starsHTML: function (n) {
      var o = '';
      for (var i = 1; i <= 5; i++) o += this.starSVG(i <= Math.round(n));
      return o;
    },
    /* সম্পাদকের HTML ছেঁকে শুধু নিরাপদ ট্যাগ রাখা (স্ক্রিপ্ট, ইভেন্ট, অচেনা লিংক সব বাদ) */
    sanitize: function (html) {
      var doc = new DOMParser().parseFromString('<body>' + html, 'text/html');
      var KEEP = { P: 1, BR: 1, STRONG: 1, EM: 1, U: 1, MARK: 1, H3: 1, BLOCKQUOTE: 1, UL: 1, OL: 1, LI: 1, A: 1 };
      var RENAME = { B: 'strong', I: 'em', H1: 'h3', H2: 'h3', H4: 'h3', DIV: 'p' };
      function clean(node, out) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) { out.appendChild(document.createTextNode(n.nodeValue)); return; }
          if (n.nodeType !== 1) return;
          var tag = n.tagName, name = KEEP[tag] ? tag.toLowerCase() : RENAME[tag];
          if (tag === 'SPAN' || tag === 'FONT') {
            var bg = (n.getAttribute('style') || '') + ' ' + (n.getAttribute('color') || '');
            name = /background/i.test(bg) ? 'mark' : null;
          }
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') return;
          if (!name) { clean(n, out); return; }
          var el = document.createElement(name);
          if (name === 'a') {
            var href = n.getAttribute('href') || '';
            if (!/^(https?:|mailto:)/i.test(href)) { clean(n, out); return; }
            el.setAttribute('href', href); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
          }
          clean(n, el);
          out.appendChild(el);
        });
      }
      var box = document.createElement('div');
      clean(doc.body, box);
      return box;
    },
    /* লেখার মূল অংশ কি সম্পাদকের HTML? (না হলে সাধারণ টেক্সট) */
    isHtml: function (s) { return /^\s*</.test(s || ''); },
    plainText: function (s) { var d = document.createElement('div'); d.appendChild(this.sanitize(s || '')); return (d.textContent || '').replace(/\s+/g, ' ').trim(); },
    articleUrl: function (a) { return 'article.html?id=' + encodeURIComponent(a.id); },
    authorUrl: function (u) { return 'author.html?slug=' + encodeURIComponent(u.slug); },
    /* ছোট ফাংশন: বার্তা দেখানো (PD.toast-এর সংক্ষিপ্ত রূপ) */
    toast: function (m, bad) { if (window.PD) window.PD.toast(m, bad); },
    needLogin: function () {
      if (window.PD && window.PD.user) return false;
      this.toast('আগে লগইন করুন', 1);
      setTimeout(function () { location.href = 'auth.html'; }, 900);
      return true;
    }
  };
})();
