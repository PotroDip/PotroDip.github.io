/* img-fit.js — আপলোডের আগে ছবি অটোমেটিক আমাদের নির্ধারিত মাপে আনে (v43)
   • যত বড় বা ছোট পিক্সেলের, যত লম্বা বা চওড়া ছবিই হোক — মাঝখান থেকে ক্রপ করে ঠিক নির্ধারিত মাপ (w × h) বানায়
   • কোয়ালিটি যতটা সম্ভব ঠিক রেখে সর্বোচ্চ সাইজের (KB) মধ্যে আনে (WebP; না পারলে JPEG)
   • সাইজ ও মাপ সব সময় আমাদের — ইউজারের ছবির না
   ব্যবহার: PD.fitImage(file, 'avatar').then(function (blob) { ... }) */
(function () {
  'use strict';
  var PD = window.PD = window.PD || {};
  var KB = 1024, MB = 1024 * 1024;

  /* কোন ছবি কোথায় কেমন দেখায় — মাপ (পিক্সেল) ও সর্বোচ্চ ফাইল সাইজ */
  var KINDS = PD.IMG_KINDS = {
    avatar:       { w: 512,  h: 512,  max: 800 * KB, label: 'প্রোফাইল ছবি' },   /* বর্গ, বৃত্তে দেখায় */
    profileCover: { w: 1800, h: 560,  max: 1 * MB,   label: 'প্রোফাইল কভার' },    /* লেখকের পেজের চওড়া কভার */
    article:      { w: 1600, h: 900,  max: 1 * MB,   label: 'লেখার কভার' },       /* ১৬:৯ */
    gallery:      { w: 1600, h: 900,  max: 1 * MB,   label: 'লেখার ছবি' },        /* ১৬:৯ */
    issue:        { w: 1200, h: 1600, max: 1 * MB,   label: 'সংখ্যার কভার' },     /* ৩:৪ */
    'banner-top':    { w: 2400, h: 400, max: 1 * MB, label: 'টপ ব্যানার' },       /* ১২০০×২০০ এর ২x */
    'banner-mid':    { w: 1456, h: 300, max: 1 * MB, label: 'মিড ব্যানার' },      /* ৭২৮×১৫০ এর ২x */
    'banner-square': { w: 600,  h: 600, max: 1 * MB, label: 'স্কোয়ার ব্যানার' }, /* ৩০০×৩০০ এর ২x */
    inline:       { w: 1600, h: 0,    max: 1.5 * MB, label: 'লেখার ভেতরের ছবি', fit: true }, /* v66: ক্রপ নয় — অনুপাত ঠিক রেখে শুধু ছোট করা (স্ক্রিনশটের জন্য) */
    'banner-mobile': { w: 640,  h: 200, max: 1 * MB, label: 'মোবাইল ব্যানার' }   /* ৩২০×১০০ এর ২x */
  };
  PD.IMG_RAW_LIMIT = 40 * MB; /* এর চেয়ে বড় আসল ফাইল ব্রাউজারের মেমরিতে সামলানো যায় না */

  function load(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) {
        return { src: b, w: b.width, h: b.height, done: function () { try { b.close(); } catch (e) {} } };
      }, viaImg);
    }
    return viaImg();
    function viaImg() {
      return new Promise(function (resolve, reject) {
        var im = new Image(), u = URL.createObjectURL(file);
        im.onload = function () { resolve({ src: im, w: im.naturalWidth, h: im.naturalHeight, done: function () { URL.revokeObjectURL(u); } }); };
        im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('এই ছবির ফরম্যাট সাপোর্ট করা যাচ্ছে না — JPG বা PNG দিন')); };
        im.src = u;
      });
    }
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function ctxOf(c) { var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return x; }

  /* মাঝখান থেকে ক্রপ করে (w × h) বানানো; অনেক বড় ছবি ধাপে ধাপে অর্ধেক করে ছোট করলে ধার/শার্পনেস ভালো থাকে */
  function draw(img, w, h, opaque) {
    var tr = w / h, sr = img.w / img.h, sw, sh, sx, sy;
    if (sr > tr) { sh = img.h; sw = sh * tr; sx = (img.w - sw) / 2; sy = 0; }
    else { sw = img.w; sh = sw / tr; sx = 0; sy = (img.h - sh) / 2; }
    var cur = img.src, cx = sx, cy = sy, cw = sw, ch = sh;
    while (cw / 2 >= w && ch / 2 >= h) {
      var nw = Math.max(w, Math.round(cw / 2)), nh = Math.max(h, Math.round(ch / 2));
      var t = mk(nw, nh), tx = ctxOf(t);
      tx.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
      cur = t; cx = 0; cy = 0; cw = nw; ch = nh;
    }
    var out = mk(w, h), ox = ctxOf(out);
    if (opaque) { ox.fillStyle = '#fff'; ox.fillRect(0, 0, w, h); }
    ox.drawImage(cur, cx, cy, cw, ch, 0, 0, w, h);
    return out;
  }
  function enc(canvas, type, q) {
    return new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, type, q); });
  }
  /* সর্বোচ্চ কোয়ালিটি খোঁজা যাতে সাইজ max-এর মধ্যে থাকে (বাইনারি সার্চ) */
  function best(canvas, type, max) {
    return enc(canvas, type, 0.95).then(function (b) {
      if (!b) return null;
      if (b.type !== type) return { blob: b, bad: true }; /* ব্রাউজার এই ফরম্যাট দিতে পারে না */
      if (b.size <= max) return { blob: b };
      var lo = 0.3, hi = 0.95, keep = null, n = 0;
      return (function step() {
        if (n++ >= 7) return Promise.resolve(keep);
        var mid = (lo + hi) / 2;
        return enc(canvas, type, mid).then(function (x) {
          if (x && x.size <= max) { keep = { blob: x }; lo = mid; } else hi = mid;
          return step();
        });
      })();
    });
  }
  function run(img, k) {
    var scale = 1, tries = 0;
    function attempt() {
      var w = Math.round(k.w * scale), h = Math.round(k.h * scale);
      var webp = draw(img, w, h, false);
      return best(webp, 'image/webp', k.max).then(function (r) {
        if (r && r.bad) { /* WebP নেই → JPEG (স্বচ্ছতা সাদা করে) */
          var jc = draw(img, w, h, true);
          return best(jc, 'image/jpeg', k.max);
        }
        return r;
      }).then(function (r) {
        if (r && r.blob && r.blob.size <= k.max) return r.blob;
        /* সবচেয়ে কম কোয়ালিটিতেও বড় → মাপ একটু কমিয়ে (একই অনুপাতে) আবার */
        if (++tries > 6) throw new Error('ছবিটা ' + KINDS_LABEL(k) + '-এর সাইজে আনা যায়নি — অন্য ছবি দিন');
        scale *= 0.85;
        return attempt();
      });
    }
    return attempt();
  }
  function KINDS_LABEL(k) { return k.label || 'ছবি'; }

  /* মূল ফাংশন: file → Promise<Blob>  (ব্লবে .type আছে: image/webp বা image/jpeg) */
  PD.fitImage = function (file, kind) {
    var k = KINDS[kind];
    if (!k) return Promise.reject(new Error('অজানা ছবির ধরন: ' + kind));
    if (!file || !/^image\//i.test(file.type || '')) return Promise.reject(new Error('শুধু ছবির ফাইল দিন'));
    if (file.size > PD.IMG_RAW_LIMIT) return Promise.reject(new Error('ছবির ফাইল অনেক বড় (৪০ MB-এর বেশি) — একটু ছোট ছবি দিন'));
    /* অ্যানিমেটেড GIF ক্যানভাসে গেলে নড়াচড়া হারায় — সাইজ সীমার মধ্যে থাকলে যেমন আছে তেমনই রাখা (শুধু ব্যানারে অর্থপূর্ণ) */
    if (file.type === 'image/gif' && file.size <= k.max && (/^banner-/.test(kind) || kind === 'inline')) return Promise.resolve(file);
    return load(file).then(function (img) {
      if (k.fit) { /* ক্রপ ছাড়া: চওড়া সর্বোচ্চ k.w (বড় করা হয় না), উচ্চতা অনুপাতে */
        var fw = Math.max(1, Math.min(k.w, img.w)), fh = Math.max(1, Math.round(fw * img.h / img.w));
        k = { w: fw, h: fh, max: k.max, label: k.label };
      }
      return run(img, k).then(function (b) { img.done(); return b; }, function (e) { img.done(); throw e; });
    });
  };
  PD.fitExt = function (blob) { return blob && blob.type === 'image/jpeg' ? 'jpg' : (blob && blob.type === 'image/gif' ? 'gif' : 'webp'); };
})();
