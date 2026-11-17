/* img-fit.js — আপলোডের আগে ছবি অটোমেটিক আমাদের নির্ধারিত মাপে ও সবচেয়ে ছোট সাইজে আনে (v121)
   • যেকোনো ফরম্যাট: JPG/JPEG/JFIF, PNG, WebP, GIF, AVIF, BMP, SVG, ICO — ব্রাউজার নিজেই পড়ে;
     iPhone-এর HEIC/HEIF ও TIFF ব্রাউজার না পারলে নিজেদের ডিকোডার (assets/vendor) — শুধু দরকার হলে লোড হয়
   • যত বড় বা ছোট পিক্সেলের, যত লম্বা বা চওড়া ছবিই হোক — মাঝখান থেকে ক্রপ করে নির্ধারিত অনুপাতে আনে;
     ছোট ছবিকে বড় করে না (তাতে ঝাপসা হয়, ফাইলও অকারণে বড় হয়)
   • প্রতিটা জায়গায় ছবি যত বড় দেখায় সেই মাপে, WebP-তে, চোখে পার্থক্য না পড়া কোয়ালিটিতে (৮২% থেকে শুরু,
     ৫০%-এর নিচে নামে না) — Supabase-এ খুব ছোট ফাইল জমা হয়
   ব্যবহার: PD.fitImage(file, 'avatar').then(function (blob) { ... }) */
(function () {
  'use strict';
  var PD = window.PD = window.PD || {};
  var KB = 1024, MB = 1024 * 1024;

  /* কোন ছবি কোথায় কেমন দেখায় — মাপ (পিক্সেল) ও সর্বোচ্চ ফাইল সাইজ */
  var KINDS = PD.IMG_KINDS = {
    avatar:          { w: 400,  h: 400,  max: 45 * KB,  label: 'প্রোফাইল ছবি' },      /* বর্গ; সাইটে সর্বোচ্চ ~১৬০px বৃত্তে দেখায় */
    profileCover:    { w: 1600, h: 500,  max: 150 * KB, label: 'প্রোফাইল কভার' },     /* লেখকের পেজের চওড়া কভার */
    article:         { w: 1600, h: 900,  max: 190 * KB, label: 'লেখার কভার' },        /* ১৬:৯ — লেখার পাতায় পুরো চওড়ায় */
    gallery:         { w: 1600, h: 900,  max: 190 * KB, label: 'লেখার ছবি' },         /* ১৬:৯ */
    issue:           { w: 900,  h: 1200, max: 150 * KB, label: 'সংখ্যার কভার' },      /* ৩:৪ */
    inline:          { w: 1400, h: 0,    max: 200 * KB, label: 'লেখার ভেতরের ছবি', fit: true, maxH: 2000 }, /* ক্রপ নয় — অনুপাত ঠিক রেখে ছোট */
    'banner-top':    { w: 1500, h: 250,  max: 90 * KB,  label: 'টপ ব্যানার' },        /* ৬:১ (১২০০×২০০ জায়গা) */
    'banner-mid':    { w: 1456, h: 300,  max: 80 * KB,  label: 'মিড ব্যানার' },        /* ৭২৮×১৫০ এর ২x */
    'banner-square': { w: 600,  h: 600,  max: 70 * KB,  label: 'স্কোয়ার ব্যানার' },   /* ৩০০×৩০০ এর ২x */
    'banner-mobile': { w: 640,  h: 200,  max: 50 * KB,  label: 'মোবাইল ব্যানার' },     /* ৩২০×১০০ এর ২x */
    'banner-popup':  { w: 1080, h: 0,    max: 160 * KB, label: 'পপআপ এড', fit: true, maxH: 1350 } /* যেকোনো অনুপাত, কাটে না */
  };
  /* হিরো বিজ্ঞাপন ১–৫: আলাদা বিজ্ঞাপনের জায়গা, ১২০০×৪৫০ (৮:৩) — মোবাইল ও পিসিতে একই */
  for (var hi = 1; hi <= 5; hi++) KINDS['banner-hero' + hi] = { w: 1200, h: 450, max: 110 * KB, label: 'হিরো বিজ্ঞাপন ' + hi };
  PD.IMG_RAW_LIMIT = 60 * MB; /* এর চেয়ে বড় আসল ফাইল ব্রাউজারের মেমরিতে সামলানো যায় না */

  /* ফাইল-বাছাইয়ের জানালায় সব ছবির ফরম্যাট দেখাতে (accept=) */
  PD.IMG_ACCEPT = 'image/*,.jpg,.jpeg,.jfif,.pjpeg,.pjp,.png,.apng,.webp,.gif,.avif,.bmp,.dib,.svg,.svgz,.ico,.cur,.heic,.heif,.hif,.tif,.tiff';
  var EXT_RE = /\.(jpe?g|jfif|pjpeg|pjp|png|apng|webp|gif|avif|bmp|dib|svgz?|ico|cur|hei[cf]|hif|tiff?)$/i;
  /* ছবির ফাইল কিনা — অনেক সময় (যেমন উইন্ডোজে HEIC) ফাইলের ধরন খালি থাকে, তাই নামের শেষাংশও দেখা হয় */
  PD.isImageFile = function (f) { return !!f && (/^image\//i.test(f.type || '') || EXT_RE.test(f.name || '')); };

  /* ---------- দরকার হলে ডিকোডার লোড (একবারই) ---------- */
  var scripts = {};
  function loadScript(src) {
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ok;
      s.onerror = function () { delete scripts[src]; no(new Error('ছবি পড়ার সরঞ্জাম লোড হয়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন')); };
      document.head.appendChild(s);
    });
    return scripts[src];
  }

  /* ---------- ফাইলের আসল ধরন (প্রথম কয়েকটা বাইট দেখে) ---------- */
  function sniff(file) {
    return file.slice(0, 32).arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf), s = String.fromCharCode.apply(null, b);
      if (/^ftyp(heic|heix|heim|heis|hevc|hevx|mif1|msf1)/.test(s.slice(4, 12))) return 'heic';
      if (s.slice(4, 12) === 'ftypavif' || s.slice(4, 12) === 'ftypavis') return 'avif';
      if ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2A && b[3] === 0) || (b[0] === 0x4D && b[1] === 0x4D && b[2] === 0 && b[3] === 0x2A)) return 'tiff';
      if (/<svg|<\?xml/i.test(s) || /svg/i.test(file.type || '') || /\.svgz?$/i.test(file.name || '')) return 'svg';
      if (s.slice(0, 6) === 'GIF87a' || s.slice(0, 6) === 'GIF89a') return 'gif';
      return 'other';
    }, function () { return 'other'; });
  }

  function fromBitmap(b) { return { src: b, w: b.width, h: b.height, done: function () { try { b.close(); } catch (e) {} } }; }
  function bitmap(blob) { return window.createImageBitmap ? createImageBitmap(blob, { imageOrientation: 'from-image' }).then(fromBitmap) : Promise.reject(new Error('no-bitmap')); }
  function viaImg(blob, svg) {
    return new Promise(function (resolve, reject) {
      var im = new Image(), u = URL.createObjectURL(blob);
      im.decoding = 'async';
      im.onload = function () {
        var w = im.naturalWidth, h = im.naturalHeight;
        if (svg || !w || !h) { /* SVG: মাপ না থাকলে বড় করে আঁকা, যাতে ঝাপসা না হয় */
          var r = (w && h) ? w / h : 4 / 3; w = 2000; h = Math.round(w / r);
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(im, 0, 0, w, h);
          URL.revokeObjectURL(u);
          return resolve({ src: c, w: w, h: h, done: function () {} });
        }
        resolve({ src: im, w: w, h: h, done: function () { URL.revokeObjectURL(u); } });
      };
      im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('unreadable')); };
      im.src = u;
    });
  }
  /* HEIC/HEIF (iPhone): Safari নিজেই পড়ে; অন্য ব্রাউজারে libheif (WebAssembly) দিয়ে —
     এর জন্য পেজের CSP-তে শুধু 'wasm-unsafe-eval' লাগে (জাভাস্ক্রিপ্ট eval নয়), তাই নিরাপদ */
  var heifP = null;
  function heif() {
    if (heifP) return heifP;
    heifP = Promise.all([
      loadScript('assets/vendor/libheif/libheif.js?v=1'),
      fetch('assets/vendor/libheif/libheif.wasm?v=1').then(function (r) { if (!r.ok) throw new Error('wasm'); return r.arrayBuffer(); })
    ]).then(function (x) {
      return Promise.resolve(window.libheif({ wasmBinary: x[1] }));
    });
    heifP.catch(function () { heifP = null; });
    return heifP;
  }
  function decodeHeic(file) {
    return bitmap(file).catch(function () {
      var work = Promise.all([heif(), file.arrayBuffer()]).then(function (x) {
        var lib = x[0], dec = new lib.HeifDecoder(), imgs = dec.decode(new Uint8Array(x[1]));
        if (!imgs || !imgs.length) throw new Error('unreadable');
        var im = imgs[0], w = im.get_width(), h = im.get_height();
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var cx = c.getContext('2d'), data = cx.createImageData(w, h);
        return new Promise(function (ok, no) {
          im.display(data, function (d) {
            if (!d) return no(new Error('unreadable'));
            cx.putImageData(d, 0, 0);
            try { imgs.forEach(function (i) { if (i.free) i.free(); }); } catch (e) {}
            ok({ src: c, w: w, h: h, done: function () {} });
          });
        });
      });
      /* কোনো কারণে আটকে গেলে ঝুলে না থেকে জানানো */
      var timeout = new Promise(function (ok, no) { setTimeout(function () { no(new Error('timeout')); }, 45000); });
      return Promise.race([work, timeout]);
    });
  }
  /* TIFF: Safari নিজেই পড়ে; অন্য ব্রাউজারে UTIF দিয়ে প্রথম পাতা */
  function decodeTiff(file) {
    return bitmap(file).catch(function () {
      return loadScript('assets/vendor/utif/pako_inflate.min.js?v=1').then(function () {
        return loadScript('assets/vendor/utif/UTIF.js?v=1');
      }).then(function () { return file.arrayBuffer(); }).then(function (buf) {
        var U = window.UTIF, ifds = U.decode(buf);
        if (!ifds || !ifds.length) throw new Error('unreadable');
        var pg = ifds[0]; U.decodeImage(buf, pg, ifds);
        var rgba = U.toRGBA8(pg), w = pg.width, h = pg.height;
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, w * h * 4), w, h), 0, 0);
        return { src: c, w: w, h: h, done: function () {} };
      });
    });
  }
  function load(file) {
    return sniff(file).then(function (t) {
      var p = t === 'heic' ? decodeHeic(file)
        : t === 'tiff' ? decodeTiff(file)
        : t === 'svg' ? viaImg(file, true)
        : bitmap(file).catch(function () { return viaImg(file, false); });
      return p.catch(function () {
        throw new Error('এই ছবিটা পড়া যাচ্ছে না — ফাইলটা নষ্ট বা অচেনা ফরম্যাটের। JPG, PNG, WebP, HEIC বা অন্য সাধারণ ছবি দিন');
      });
    });
  }
  PD.decodeImage = load;

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
  /* সর্বোচ্চ কোয়ালিটি খোঁজা যাতে সাইজ max-এর মধ্যে থাকে (বাইনারি সার্চ, ৫০%–৮২%) */
  var Q_HI = 0.82, Q_LO = 0.5;
  function best(canvas, type, max) {
    return enc(canvas, type, Q_HI).then(function (b) {
      if (!b) return null;
      if (b.type !== type) return { blob: b, bad: true }; /* ব্রাউজার এই ফরম্যাট দিতে পারে না */
      if (b.size <= max) return { blob: b };
      var lo = Q_LO, hi = Q_HI, keep = null, n = 0;
      return enc(canvas, type, Q_LO).then(function (low) {
        if (!low || low.size > max) return null; /* ৫০%-এও বড় → মাপ কমাতে হবে */
        keep = { blob: low };
        return (function step() {
          if (n++ >= 6) return Promise.resolve(keep);
          var mid = (lo + hi) / 2;
          return enc(canvas, type, mid).then(function (x) {
            if (x && x.size <= max) { keep = { blob: x }; lo = mid; } else hi = mid;
            return step();
          });
        })();
      });
    });
  }
  function run(img, k) {
    var scale = 1, tries = 0;
    function attempt() {
      var w = Math.max(1, Math.round(k.w * scale)), h = Math.max(1, Math.round(k.h * scale));
      var webp = draw(img, w, h, false);
      return best(webp, 'image/webp', k.max).then(function (r) {
        if (r && r.bad) { /* WebP নেই → JPEG (স্বচ্ছতা সাদা করে) */
          var jc = draw(img, w, h, true);
          return best(jc, 'image/jpeg', k.max);
        }
        return r;
      }).then(function (r) {
        if (r && r.blob && r.blob.size <= k.max) return r.blob;
        /* ৫০% কোয়ালিটিতেও বড় → মাপ একটু কমিয়ে (একই অনুপাতে) আবার */
        if (++tries > 8) throw new Error('ছবিটা ' + (k.label || 'ছবি') + '-এর সাইজে আনা যায়নি — অন্য ছবি দিন');
        scale *= 0.88;
        return attempt();
      });
    }
    return attempt();
  }

  /* মূল ফাংশন: file → Promise<Blob>  (ব্লবে .type আছে: image/webp, image/jpeg বা অ্যানিমেটেড GIF) */
  PD.fitImage = function (file, kind) {
    var k0 = KINDS[kind];
    if (!k0) return Promise.reject(new Error('অজানা ছবির ধরন: ' + kind));
    if (!PD.isImageFile(file)) return Promise.reject(new Error('শুধু ছবির ফাইল দিন'));
    if (file.size > PD.IMG_RAW_LIMIT) return Promise.reject(new Error('ছবির ফাইল অনেক বড় (৬০ MB-এর বেশি) — একটু ছোট ছবি দিন'));
    return sniff(file).then(function (t) {
      /* অ্যানিমেটেড GIF ক্যানভাসে গেলে নড়াচড়া হারায় — বিজ্ঞাপন/লেখার ছবিতে সাইজ সীমার মধ্যে থাকলে যেমন আছে তেমনই */
      if (t === 'gif' && file.size <= k0.max && (/^banner-/.test(kind) || kind === 'inline')) return file;
      return load(file).then(function (img) {
        var k = { w: k0.w, h: k0.h, max: k0.max, label: k0.label };
        if (k0.fit) { /* ক্রপ ছাড়া: চওড়া সর্বোচ্চ k.w, উচ্চতা সর্বোচ্চ maxH (বড় করা হয় না), অনুপাত ঠিক */
          var sc = Math.min(1, k0.w / img.w, (k0.maxH || Infinity) / img.h);
          k.w = Math.max(1, Math.round(img.w * sc)); k.h = Math.max(1, Math.round(img.h * sc));
        } else { /* ক্রপের পর যে অংশ থাকে সেটা নির্ধারিত মাপের চেয়ে ছোট হলে বড় করা হয় না */
          var tr = k.w / k.h, cw = Math.min(img.w, img.h * tr);
          if (cw < k.w) { k.w = Math.max(1, Math.round(cw)); k.h = Math.max(1, Math.round(k.w / tr)); }
        }
        return run(img, k).then(function (b) { img.done(); return b; }, function (e) { img.done(); throw e; });
      });
    });
  };
  /* বাছাই করা ছবির প্রিভিউ লিংক: ব্রাউজার যেটা সরাসরি দেখাতে পারে সেটা সরাসরি; HEIC/TIFF হলে পড়ে ছোট JPEG বানিয়ে */
  PD.previewUrl = function (file) {
    var direct = /^image\/(jpeg|png|webp|gif|avif|bmp|svg\+xml|x-icon|vnd\.microsoft\.icon)$/i.test(file.type || '');
    if (direct) return Promise.resolve(URL.createObjectURL(file));
    return load(file).then(function (img) {
      var sc = Math.min(1, 900 / Math.max(img.w, img.h)), c = mk(Math.max(1, Math.round(img.w * sc)), Math.max(1, Math.round(img.h * sc)));
      ctxOf(c).drawImage(img.src, 0, 0, c.width, c.height); img.done();
      return enc(c, 'image/jpeg', 0.8).then(function (b) { return URL.createObjectURL(b); });
    });
  };
  PD.fitExt = function (blob) { return blob && blob.type === 'image/jpeg' ? 'jpg' : (blob && blob.type === 'image/gif' ? 'gif' : 'webp'); };
})();
