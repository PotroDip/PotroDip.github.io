/* ui.js — সব পেজের ছোট সাধারণ টুল: বাংলা সংখ্যা, তারিখ, ছবির বিকল্প, টেমপ্লেট ক্লোন */
(function () {
  'use strict';
  var DIG = '০১২৩৪৫৬৭৮৯';
  var MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23C9A98A'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%23F7F3EC'/%3E%3Cpath d='M6 40c2-10 9-13 14-13s12 3 14 13z' fill='%23F7F3EC'/%3E%3C/svg%3E";
  var COVER = "assets/img/placeholder.svg";
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
      var KEEP = { P: 1, BR: 1, STRONG: 1, EM: 1, U: 1, S: 1, SUB: 1, SUP: 1, MARK: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, PRE: 1, CODE: 1, HR: 1, UL: 1, OL: 1, LI: 1, A: 1, SPAN: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1, FIGURE: 1, FIGCAPTION: 1, IMG: 1, ASIDE: 1 };
      var RENAME = { B: 'strong', I: 'em', STRIKE: 's', DEL: 's', H1: 'h2', H5: 'h4', H6: 'h4', DIV: 'p' };
      var FONT_PX = { 1: 10, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 48 };
      var COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}(\s*,\s*\d{1,3}){2}(\s*,\s*[01]?\.?\d*)?\s*\)|[a-z]{3,20})$/i;
      var BADCOLOR = /^(inherit|initial|unset|transparent|currentcolor|revert)$/i;
      /* শুধু নিরাপদ স্টাইল রাখা হয় — বাকি সব ফেলে দেওয়া হয় */
      var STYLE_OK = {
        'color': function (v) { return COLOR.test(v) && !BADCOLOR.test(v); },
        'background-color': function (v) { return COLOR.test(v) && !BADCOLOR.test(v); },
        'font-size': function (v) { var m = /^(\d{1,3}(?:\.\d+)?)(px|pt|em|rem|%)$/i.exec(v); if (!m) return false; var n = parseFloat(m[1]); return m[2] === 'px' || m[2] === 'pt' ? (n >= 8 && n <= 140) : m[2] === '%' ? (n >= 50 && n <= 400) : (n >= .5 && n <= 8); },
        'font-family': function (v) { return /^[\w\s,'"\-ঀ-৿]{1,160}$/.test(v) && !/inherit|initial/i.test(v); },
        'text-align': function (v) { return /^(left|right|center|justify)$/.test(v); },
        'line-height': function (v) { return /^\d{1,2}(\.\d+)?(px|em|%)?$/.test(v); },
        'letter-spacing': function (v) { return /^-?\d(\.\d+)?(px|em)$/.test(v); },
        'margin-left': function (v) { var m = /^(\d{1,3})px$/.exec(v); return !!m && +m[1] <= 240; }
      };
      function keepStyles(n, el, extra) {
        var st = {}, k, i;
        if (n.style) for (i = 0; i < n.style.length; i++) {
          k = n.style[i];
          if (STYLE_OK[k]) { var v = (n.style.getPropertyValue(k) || '').trim(); if (v && STYLE_OK[k](v)) st[k] = v; }
        }
        for (k in (extra || {})) if (STYLE_OK[k] && STYLE_OK[k](extra[k])) st[k] = extra[k];
        for (k in st) el.style.setProperty(k, st[k]);
        return st;
      }
      /* অন্য জায়গা (Word/Docs) থেকে কপি করা বোল্ড/ইটালিক ইত্যাদি স্টাইল → ট্যাগে রূপান্তর */
      function wrapFmt(n, node) {
        var s = n.style || {};
        var fw = s.fontWeight || '', fs = s.fontStyle || '', td = (s.textDecoration || s.textDecorationLine || '');
        if (fw === 'bold' || fw === 'bolder' || +fw >= 600) { var b = document.createElement('strong'); b.appendChild(node); node = b; }
        if (fs === 'italic') { var e = document.createElement('em'); e.appendChild(node); node = e; }
        if (/underline/.test(td)) { var u = document.createElement('u'); u.appendChild(node); node = u; }
        if (/line-through/.test(td)) { var x = document.createElement('s'); x.appendChild(node); node = x; }
        return node;
      }
      function clean(node, out) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) { out.appendChild(document.createTextNode(n.nodeValue)); return; }
          if (n.nodeType !== 1) return;
          var tag = n.tagName, name = KEEP[tag] ? tag.toLowerCase() : RENAME[tag], extra = null;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'TEMPLATE' || tag === 'NOSCRIPT') return;
          if (tag === 'FONT') {
            name = 'span'; extra = {};
            var fc = n.getAttribute('color'); if (fc) extra['color'] = fc;
            var fz = n.getAttribute('size'); if (fz && FONT_PX[fz]) extra['font-size'] = FONT_PX[fz] + 'px';
            var ff = n.getAttribute('face'); if (ff) extra['font-family'] = ff;
          }
          if (tag === 'P' || /^H[1-6]$/.test(tag) || tag === 'DIV' || tag === 'LI' || tag === 'BLOCKQUOTE') {
            var al = (n.getAttribute('align') || '').toLowerCase(); if (al) { extra = extra || {}; extra['text-align'] = al; }
          }
          if (!name) { clean(n, out); return; }
          var el = document.createElement(name);
          if (name === 'a') {
            var href = n.getAttribute('href') || '';
            if (!/^(https?:|mailto:)/i.test(href)) { clean(n, out); return; }
            el.setAttribute('href', href); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
          }
          if (name === 'img') { /* শুধু https ছবি; বাকি সব বাদ */
            var src = (n.getAttribute('src') || '').trim();
            if (!/^https:\/\//i.test(src) || src.length > 1500) return;
            el.setAttribute('src', src); el.setAttribute('loading', 'lazy'); el.setAttribute('decoding', 'async');
            var alt = (n.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 200); el.setAttribute('alt', alt);
            out.appendChild(el); return;
          }
          if (name === 'figure') {
            var sz = n.getAttribute('data-size'), al2 = n.getAttribute('data-align');
            el.setAttribute('data-size', /^(s|m|l|f)$/.test(sz || '') ? sz : 'm');
            el.setAttribute('data-align', /^(left|center|right)$/.test(al2 || '') ? al2 : 'center');
          }
          if (name === 'aside') { var tn = n.getAttribute('data-tone'); el.setAttribute('data-tone', /^(info|warn|good)$/.test(tn || '') ? tn : 'info'); }
          var st = (name === 'hr' || name === 'br' || name === 'figure' || name === 'figcaption' || name === 'aside') ? {} : keepStyles(n, el, extra);
          clean(n, el);
          if (name === 'figure' && !el.querySelector('img')) return; /* ছবি ছাড়া ফিগার বাদ */
          if (name === 'figcaption' && !el.textContent.trim()) return; /* খালি ক্যাপশন বাদ */
          if (name === 'aside' && !el.textContent.trim()) return; /* খালি বক্স বাদ */
          if (/^(blockquote|h[2-4]|pre)$/.test(name) && !el.textContent.trim()) return; /* খালি শিরোনাম/উদ্ধৃতি বাদ */
          if (name === 'table' && !el.querySelector('td,th')) return; /* খালি টেবিল বাদ */
          if ((name === 'p' || /^h[2-4]$/.test(name)) && el.querySelector(':scope > ul, :scope > ol, :scope > pre, :scope > blockquote, :scope > hr, :scope > p, :scope > h2, :scope > h3, :scope > h4, :scope > table, :scope > figure, :scope > aside')) {
            /* অনুচ্ছেদের ভেতরে তালিকা/ব্লক থাকলে সেগুলো বাইরে তুলে আনা */
            var run = null;
            [].slice.call(el.childNodes).forEach(function (c) {
              var isBlock = c.nodeType === 1 && /^(UL|OL|PRE|BLOCKQUOTE|HR|P|H2|H3|H4|TABLE|FIGURE|ASIDE)$/.test(c.tagName);
              if (isBlock) { run = null; out.appendChild(c); return; }
              if (c.nodeType === 3 && !c.nodeValue.trim() && !run) return;
              if (!run) { run = document.createElement(name); if (el.getAttribute('style')) run.setAttribute('style', el.getAttribute('style')); out.appendChild(run); }
              run.appendChild(c);
            });
            return;
          }
          if (name === 'span') {
            if (!Object.keys(st).length) { /* স্টাইল না থাকলে শুধু ভেতরের লেখা রাখি (বোল্ড/ইটালিক থাকলে ট্যাগে) */
              var holder = document.createDocumentFragment(); while (el.firstChild) holder.appendChild(el.firstChild);
              var w = wrapFmt(n, holder); out.appendChild(w); return;
            }
            out.appendChild(wrapFmt(n, el)); return;
          }
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
