/* dashboard.js — লগইন করা ইউজারের ড্যাশবোর্ড: প্রোফাইল, ফলো, সেভ করা লেখা, নোটিফিকেশন, অর্ডার, সেটিংস */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI;
  if (!PD || !PD.db) return;
  var db = PD.db, $ = function (i) { return document.getElementById(i); };
  window.maybeShowNotifPopup = function () { }; /* ব্রাউজার-পুশ সার্ভার এখনো নেই, তাই অনুমতির পপআপ বন্ধ */
  var STATUS = { pending: 'যাচাই বাকি', verified: 'পেমেন্ট যাচাই হয়েছে', delivered: 'ডেলিভারি হয়েছে' };

  function ago(iso) {
    var m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (m < 2) return 'এইমাত্র';
    if (m < 60) return UI.bn(m) + ' মিনিট আগে';
    if (m < 1440) return UI.bn(Math.round(m / 60)) + ' ঘণ্টা আগে';
    return UI.bn(Math.round(m / 1440)) + ' দিন আগে';
  }
  function count(tab, n) { var b = document.querySelector('[data-dtab="' + tab + '"] .count'); if (b) b.textContent = UI.bn(n); }
  function empty(box, text) { var p = document.createElement('p'); p.className = 'pd-empty'; p.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-muted);padding:36px 0'; p.textContent = text; box.appendChild(p); }
  function safeLink(u) { return /^(article|author|issue|store|archive)\.html(\?[\w=&%.-]*)?$/.test(u || '') ? u : ''; }
  function fade(card) { card.style.transition = 'opacity .25s ease, transform .25s ease'; card.style.opacity = '0'; card.style.transform = 'scale(.95)'; setTimeout(function () { card.remove(); }, 250); }

  /* ---------- প্রোফাইল ---------- */
  function hero() {
    var name = (PD.profile && PD.profile.full_name) || (PD.user.email || '').split('@')[0] || 'পাঠক';
    $('dash-name').textContent = 'স্বাগতম, ' + name;
    $('dash-email').textContent = PD.user.email || '';
    $('dash-avatar-img').src = UI.avatar(PD.profile && PD.profile.avatar_url);
    /* শুধু এডমিনের জন্য: এডমিন প্যানেলে যাওয়ার বাটন */
    if (PD.isAdmin() && !$('admin-link')) {
      var a = document.createElement('a'); a.id = 'admin-link'; a.className = 'btn-outline'; a.href = 'admin.html'; a.textContent = 'এডমিন প্যানেল';
      a.style.textDecoration = 'none'; a.style.display = 'inline-flex'; a.style.alignItems = 'center';
      document.querySelector('.dash-hero-actions').insertBefore(a, document.querySelector('.dash-hero-actions').firstChild);
    }
  }
  $('btn-edit-profile').addEventListener('click', function () {
    var cur = (PD.profile && PD.profile.full_name) || '';
    var n = prompt('আপনার নাম লিখুন:', cur);
    if (n === null) return;
    n = n.trim();
    if (!n || n.length > 60) return UI.toast('নাম ১ থেকে ৬০ অক্ষরের মধ্যে হতে হবে', 1);
    db.from('profiles').update({ full_name: n }).eq('id', PD.user.id).then(function (r) {
      if (r.error) return UI.toast(PD.msg(r.error), 1);
      PD.profile = Object.assign({}, PD.profile, { full_name: n }); hero(); UI.toast('নাম হালনাগাদ হয়েছে');
    });
  });

  /* ---------- ফলো করা লেখক ---------- */
  function following() {
    var box = document.querySelector('.following-grid'); box.innerHTML = '';
    return db.from('follows').select('author_id').eq('follower_id', PD.user.id).then(function (r) {
      var ids = (r.data || []).map(function (x) { return x.author_id; });
      count('following', ids.length);
      if (!ids.length) return empty(box, 'এখনো কোনো লেখককে ফলো করেননি।');
      return db.from('authors').select('id,slug,name,role_title,city,image_url').in('id', ids).then(function (a) {
        (a.data || []).forEach(function (u) {
          var c = UI.tpl('tpl-following');
          UI.img(c, 'img', UI.avatar(u.image_url), ''); UI.set(c, 'h4', u.name); UI.set(c, '.following-role', (u.role_title || '') + (u.city ? ' · ' + u.city : ''));
          c.querySelector('h4').style.cursor = 'pointer'; c.querySelector('h4').addEventListener('click', function () { location.href = UI.authorUrl(u); });
          c.querySelector('.unfollow-btn').addEventListener('click', function () {
            window.showConfirm('আনফলো করবেন?', '"' + u.name + '" কে কি সত্যিই আনফলো করতে চান? পরে চাইলে আবার ফলো করতে পারবেন।', function () {
              db.from('follows').delete().eq('follower_id', PD.user.id).eq('author_id', u.id).then(function (d) { if (d.error) return UI.toast(PD.msg(d.error), 1); fade(c); ids = ids.filter(function (x) { return x !== u.id; }); count('following', ids.length); });
            });
          });
          box.appendChild(c);
        });
      });
    });
  }

  /* ---------- সেভ করা লেখা ---------- */
  function saved() {
    var box = document.querySelector('.saved-grid'); box.innerHTML = '';
    return db.from('bookmarks').select('article_id').eq('user_id', PD.user.id).then(function (r) {
      var ids = (r.data || []).map(function (x) { return x.article_id; });
      count('saved', ids.length);
      if (!ids.length) return empty(box, 'এখনো কোনো লেখা সেভ করেননি।');
      return db.from('articles').select('id,title,category,cover_url,author_id').in('id', ids).then(function (a) {
        var arts = a.data || [], au = arts.map(function (x) { return x.author_id; }).filter(Boolean);
        return (au.length ? db.from('authors').select('id,name,city,image_url').in('id', au) : Promise.resolve({ data: [] })).then(function (ar) {
          var U = {}; (ar.data || []).forEach(function (u) { U[u.id] = u; });
          arts.forEach(function (x) {
            var u = U[x.author_id] || { name: '' }, c = UI.tpl('tpl-saved');
            UI.img(c, '.thumb img', UI.cover(x.cover_url), ''); UI.set(c, '.cat-label', x.category || ''); UI.set(c, 'h3', x.title);
            UI.img(c, '.card-meta img', UI.avatar(u.image_url), '');
            var sp = c.querySelector('.card-meta > span'); sp.innerHTML = ''; sp.appendChild(document.createTextNode(u.name));
            if (u.city) { var d = document.createElement('span'); d.className = 'dot-sep'; var cc = document.createElement('span'); cc.className = 'city'; cc.textContent = u.city; sp.appendChild(d); sp.appendChild(cc); }
            c.style.cursor = 'pointer';
            c.addEventListener('click', function (e) { if (!e.target.closest('.remove-bookmark')) location.href = UI.articleUrl(x); });
            c.querySelector('.remove-bookmark').addEventListener('click', function () {
              window.showConfirm('সেভ থেকে বাদ দেবেন?', '"' + x.title + '" লেখাটা কি সেভ করা তালিকা থেকে সরিয়ে ফেলতে চান?', function () {
                db.from('bookmarks').delete().eq('user_id', PD.user.id).eq('article_id', x.id).then(function (d2) { if (d2.error) return UI.toast(PD.msg(d2.error), 1); fade(c); ids = ids.filter(function (i) { return i !== x.id; }); count('saved', ids.length); });
              });
            });
            box.appendChild(c);
          });
        });
      });
    });
  }

  /* ---------- নোটিফিকেশন ---------- */
  function notifs() {
    var box = document.querySelector('#dpanel-notifications .notif-list'); box.innerHTML = '';
    return db.from('notifications').select('id,type,title,body,link_url,is_read,created_at').eq('user_id', PD.user.id).order('created_at', { ascending: false }).limit(30).then(function (r) {
      var list = r.data || [];
      count('notifications', list.filter(function (n) { return !n.is_read; }).length);
      if (!list.length) return empty(box, 'এখনো কোনো নোটিফিকেশন নেই।');
      list.forEach(function (n) {
        var c = UI.tpl('tpl-notif'), kind = /comment/.test(n.type || '') ? 'type-comment' : /rating/.test(n.type || '') ? 'type-rating' : 'type-article';
        c.classList.toggle('unread', !n.is_read);
        var ic = c.querySelector('.notif-icon'); ic.className = 'notif-icon ' + kind;
        var p = c.querySelector('.notif-body p'); p.innerHTML = '';
        var st = document.createElement('strong'); st.textContent = n.title || ''; p.appendChild(st); p.appendChild(document.createTextNode(n.body ? ' ' + n.body : ''));
        UI.set(c, '.notif-time', ago(n.created_at));
        if (n.is_read) { var dot = c.querySelector('.notif-dot'); if (dot) dot.remove(); }
        c.style.cursor = 'pointer';
        c.addEventListener('click', function () {
          var go = safeLink(n.link_url);
          var done = function () { if (go) location.href = go; else { c.classList.remove('unread'); var d = c.querySelector('.notif-dot'); if (d) d.remove(); } };
          if (n.is_read) return done();
          db.from('notifications').update({ is_read: true }).eq('id', n.id).then(done);
        });
        box.appendChild(c);
      });
    });
  }

  /* ---------- আমার অর্ডার ---------- */
  function orders() {
    var box = $('orders-list'); box.innerHTML = '';
    return db.from('orders').select('id,order_number,subtotal,delivery_charge,payment_status,created_at').eq('user_id', PD.user.id).order('created_at', { ascending: false }).limit(30).then(function (r) {
      var list = r.data || [];
      count('orders', list.length);
      if (!list.length) return empty(box, 'এখনো কোনো অর্ডার করেননি। ' );
      list.forEach(function (o) {
        var c = UI.tpl('tpl-order'), st = o.payment_status === 'verified' || o.payment_status === 'delivered' ? o.payment_status : 'pending';
        UI.set(c, '.notif-body strong', '#' + o.order_number);
        UI.set(c, '.o-text', ' — বই ' + UI.bn(Number(o.subtotal || 0)) + ' ৳ (ডেলিভারির সময় পরিশোধ) + ডেলিভারি চার্জ ' + UI.bn(Number(o.delivery_charge || 0)) + ' ৳ · ' + STATUS[st]);
        UI.set(c, '.notif-time', UI.date(o.created_at));
        box.appendChild(c);
      });
    });
  }

  /* ---------- সেটিংস ---------- */
  var nl = $('newsletter-switch');
  function settings() { if (nl) nl.checked = !PD.profile || PD.profile.newsletter_subscribed !== false; }
  if (nl) nl.addEventListener('change', function () {
    var on = nl.checked;
    db.from('profiles').update({ newsletter_subscribed: on }).eq('id', PD.user.id).then(function (r) {
      if (r.error) { nl.checked = !on; return UI.toast(PD.msg(r.error), 1); }
      PD.profile = Object.assign({}, PD.profile, { newsletter_subscribed: on });
      if (on && PD.user.email) PD.subscribe(PD.user.email, PD.user.id);
      UI.toast(on ? 'নিউজলেটার চালু হয়েছে' : 'নিউজলেটার বন্ধ করা হয়েছে');
    });
  });

  var loadedFor = null;
  function load() {
    if (!PD.user || loadedFor === PD.user.id) return;
    loadedFor = PD.user.id;
    hero(); settings();
    following(); saved(); notifs(); orders();
  }
  var orig = window.pdShowDashboard;
  window.pdShowDashboard = function () { if (orig) orig.apply(this, arguments); load(); };
  PD.ready.then(load);
})();
