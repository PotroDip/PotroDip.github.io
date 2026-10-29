/* comments.js — মন্তব্য, রেটিং, রিপ্লাই ও "সহায়ক" (আর্টিকেল পেজের কম্পোনেন্ট) */
(function () {
  'use strict';
  var PD = window.PD, UI = window.PDUI;
  var ICON = {
    like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  var PAGE_SIZE = 5, MAX_LEN = 600;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- তারা-বোতাম (আপনার আসল অ্যানিমেশনসহ) ---------- */
  function starOutline(s) { return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>'; }
  function starFill(s) { return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>'; }
  function buildStars(box, size) {
    box.innerHTML = '';
    for (var i = 1; i <= 5; i++) {
      var b = el('button');
      b.type = 'button';
      b.setAttribute('aria-label', UI.bn(i) + ' স্টার');
      b.dataset.val = i;
      b.innerHTML = '<span class="star-icon-wrap" style="width:' + size + 'px;height:' + size + 'px;"><span class="star-layer star-outline">' + starOutline(size) + '</span><span class="star-layer star-fill">' + starFill(size) + '</span></span>';
      box.appendChild(b);
    }
  }
  function paint(box, upto, cls) {
    [].forEach.call(box.children, function (b) { b.classList.toggle(cls, +b.dataset.val <= upto); });
  }
  function pop(box, upto) {
    [].forEach.call(box.children, function (b, i) {
      if (i + 1 > upto) return;
      var w = b.querySelector('.star-icon-wrap');
      setTimeout(function () { w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); }, i * 45);
    });
  }
  function burst(btn, count, spread) {
    var colors = ['var(--success)', 'var(--secondary)', 'var(--primary)', 'var(--secondary-light)'];
    for (var i = 0; i < count; i++) {
      var p = el('span', 'star-particle'), a = Math.random() * Math.PI * 2, d = spread * 0.55 + Math.random() * spread * 0.55, sz = 5 + Math.random() * 5;
      p.style.width = p.style.height = sz + 'px';
      p.style.background = colors[i % 4];
      p.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
      p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - spread * 0.25).toFixed(1) + 'px');
      p.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg');
      btn.appendChild(p);
      (function (n) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { n.classList.add('burst'); }); });
        setTimeout(function () { n.remove(); }, 700);
      })(p);
    }
  }
  function hookStars(box, getVal, setVal, onPick, particles) {
    box.addEventListener('mouseover', function (e) { var b = e.target.closest('button'); if (b) paint(box, +b.dataset.val, 'hover'); });
    box.addEventListener('mouseleave', function () { paint(box, getVal(), 'hover'); });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      setVal(+b.dataset.val);
      paint(box, getVal(), 'selected');
      pop(box, getVal());
      burst(b, particles[0], particles[1]);
      if (onPick) onPick(getVal());
    });
  }

  /* ---------- মূল কম্পোনেন্ট ---------- */
  window.PDComments = {
    init: function (articleId) {
      if (!PD || !PD.db || !$('commentList')) return;
      var db = PD.db, rows = [], likes = {}, sort = 'new', showAll = false;
      var rateBox = $('rateStars'), cfBox = $('cfStars'), mySel = 0, cfSel = 0;
      var list = $('commentList'), input = $('commentInput'), me = function () { return rows.find(function (r) { return PD.user && r.user_id === PD.user.id && !r.parent_comment_id; }); };

      buildStars(rateBox, 30);
      buildStars(cfBox, 19);
      hookStars(rateBox, function () { return mySel; }, function (v) { mySel = v; }, quickRate, [14, 34]);
      hookStars(cfBox, function () { return cfSel; }, function (v) { cfSel = v; }, null, [9, 22]);
      input.addEventListener('input', function () { $('cfCharHint').textContent = UI.bn(input.value.length) + ' / ' + UI.bn(MAX_LEN); });
      input.maxLength = MAX_LEN;

      function load() {
        return db.from('comments').select('id,user_id,user_name,user_avatar,body,rating,parent_comment_id,created_at')
          .eq('article_id', articleId).order('created_at', { ascending: false }).limit(300).then(function (r) {
            rows = r.data || [];
            var ids = rows.map(function (x) { return x.id; });
            if (!ids.length) { likes = {}; return; }
            return db.from('comment_likes').select('comment_id,user_id').in('comment_id', ids).then(function (l) {
              likes = {};
              (l.data || []).forEach(function (x) { (likes[x.comment_id] = likes[x.comment_id] || []).push(x.user_id); });
            });
          });
      }

      function summary() {
        var rated = rows.filter(function (r) { return !r.parent_comment_id && r.rating; });
        var n = rated.length, avg = n ? rated.reduce(function (s, r) { return s + r.rating; }, 0) / n : 0;
        var ring = document.querySelector('.num-ring'), num = ring.querySelector('.num');
        ring.style.setProperty('--pct', Math.round(avg / 5 * 100));
        num.textContent = n ? UI.bn(avg.toFixed(1)) : '—';
        $('avgStars').innerHTML = UI.starsHTML(avg);
        document.querySelector('.rating-avg .count').textContent = n ? UI.bn(n) + 'টি রেটিং' : 'এখনো কোনো রেটিং নেই';
        var dist = $('distBlock');
        dist.innerHTML = '';
        for (var s = 5; s >= 1; s--) {
          var c = rated.filter(function (r) { return r.rating === s; }).length, pct = n ? Math.round(c / n * 100) : 0, row = el('div', 'dist-row');
          row.innerHTML = '<span class="dist-label">' + UI.bn(s) + UI.starSVG(true) + '</span><span class="dist-bar-track"><span class="dist-bar-fill" style="width:' + pct + '%"></span></span><span class="dist-pct">' + UI.bn(pct) + '%</span>';
          dist.appendChild(row);
        }
        var mine = me();
        mySel = mine && mine.rating ? mine.rating : 0;
        paint(rateBox, mySel, 'selected');
        if (mySel) { $('rateFeedback').textContent = 'আপনি ' + UI.bn(mySel) + ' স্টার দিয়েছেন।'; $('rateFeedback').classList.add('show'); }
      }

      function comment(c, own) {
        var item = el('div', 'comment-item' + (own ? ' is-own' : ''));
        var img = el('img'); img.src = UI.avatar(c.user_avatar); img.alt = '';
        var body = el('div', 'comment-body'), top = el('div', 'comment-top');
        top.appendChild(el('strong', '', c.user_name || 'পাঠক'));
        if (own) top.appendChild(el('span', 'own-tag', 'আপনি'));
        if (c.rating) { var st = el('span', 'comment-stars'); st.innerHTML = UI.starsHTML(c.rating); top.appendChild(st); }
        top.appendChild(el('span', 'comment-date', UI.date(c.created_at)));
        body.appendChild(top);
        body.appendChild(el('p', 'comment-text', c.body));
        var act = el('div', 'comment-actions'), lk = likes[c.id] || [], liked = PD.user && lk.indexOf(PD.user.id) >= 0;
        var hb = el('button', 'helpful' + (liked ? ' liked' : ''));
        hb.innerHTML = ICON.like + ' সহায়ক (<span class="helpful-count">' + UI.bn(lk.length) + '</span>)';
        hb.addEventListener('click', function () { toggleLike(c); });
        act.appendChild(hb);
        var replies = rows.filter(function (r) { return r.parent_comment_id === c.id; }).reverse();
        var rform = el('div', 'reply-form');
        if (!own) {
          var rb = el('button', 'reply-toggle'); rb.innerHTML = ICON.reply + ' রিপ্লাই';
          rb.addEventListener('click', function () { if (UI.needLogin()) return; rform.classList.toggle('show'); if (rform.classList.contains('show')) rform.querySelector('textarea').focus(); });
          act.appendChild(rb);
        } else {
          var ow = el('span', 'own-actions'), eb = el('button', 'edit-btn'), db_ = el('button', 'delete-btn');
          eb.innerHTML = ICON.edit; eb.title = 'এডিট করুন'; db_.innerHTML = ICON.del; db_.title = 'মুছে ফেলুন';
          eb.addEventListener('click', function () { edit(c); });
          db_.addEventListener('click', function () { askDelete(c); });
          ow.appendChild(eb); ow.appendChild(db_); act.appendChild(ow);
        }
        body.appendChild(act);
        if (replies.length) {
          var rl = el('div', 'reply-list');
          replies.forEach(function (r) {
            var ri = el('div', 'reply-item'), ri_img = el('img'), rb2 = el('div', 'comment-body'), rt = el('div', 'comment-top');
            ri_img.src = UI.avatar(r.user_avatar); ri_img.alt = '';
            rt.appendChild(el('strong', '', r.user_name || 'পাঠক'));
            rt.appendChild(el('span', 'comment-date', UI.date(r.created_at)));
            rb2.appendChild(rt); rb2.appendChild(el('p', 'comment-text', r.body));
            if (PD.user && r.user_id === PD.user.id) {
              var rd = el('button', 'delete-btn'); rd.innerHTML = ICON.del; rd.title = 'মুছে ফেলুন';
              rd.addEventListener('click', function () { askDelete(r); });
              rb2.appendChild(rd);
            }
            ri.appendChild(ri_img); ri.appendChild(rb2); rl.appendChild(ri);
          });
          body.appendChild(rl);
        }
        var fi = el('img'); fi.src = UI.avatar(PD.profile && PD.profile.avatar_url); fi.alt = '';
        var inner = el('div', 'reply-form-inner'), ta = el('textarea'), foot = el('div', 'reply-form-foot'), cn = el('button', 'btn-tiny ghost', 'বাতিল'), sb = el('button', 'btn-tiny primary', 'জবাব দিন');
        ta.placeholder = 'একটা জবাব লিখুন...'; ta.maxLength = MAX_LEN;
        cn.addEventListener('click', function () { rform.classList.remove('show'); ta.value = ''; });
        sb.addEventListener('click', function () { reply(c, ta, sb); });
        foot.appendChild(cn); foot.appendChild(sb); inner.appendChild(ta); inner.appendChild(foot);
        rform.appendChild(fi); rform.appendChild(inner); body.appendChild(rform);
        item.appendChild(img); item.appendChild(body);
        return item;
      }

      function render() {
        var top = rows.filter(function (r) { return !r.parent_comment_id && r.body; });
        if (sort === 'old') top.sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
        else if (sort === 'top') top.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0) || new Date(b.created_at) - new Date(a.created_at); });
        else top.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
        list.innerHTML = '';
        $('commentCountLabel').textContent = top.length ? UI.bn(top.length) + 'টি মন্তব্য' : 'কোনো মন্তব্য নেই';
        $('emptyState').classList.toggle('show', !top.length);
        var shown = showAll ? top : top.slice(0, PAGE_SIZE);
        shown.forEach(function (c) { list.appendChild(comment(c, PD.user && c.user_id === PD.user.id)); });
        $('loadMoreBtn').parentElement.style.display = !showAll && top.length > PAGE_SIZE ? 'block' : 'none';
        summary();
      }

      function refresh() { return load().then(render); }
      function fail(r) { if (r && r.error) { UI.toast(PD.msg(r.error), 1); return true; } return false; }

      function quickRate(v) {
        if (UI.needLogin()) { mySel = 0; paint(rateBox, 0, 'selected'); return; }
        var mine = me(), q = mine ? db.from('comments').update({ rating: v }).eq('id', mine.id) : db.from('comments').insert({ article_id: articleId, user_id: PD.user.id, body: '', rating: v });
        q.then(function (r) { if (!fail(r)) { $('rateFeedback').textContent = 'ধন্যবাদ! আপনি ' + UI.bn(v) + ' স্টার দিয়েছেন।'; $('rateFeedback').classList.add('show'); refresh(); } });
      }

      $('submitCommentBtn').addEventListener('click', function () {
        if (UI.needLogin()) return;
        var text = input.value.trim();
        if (!text) { input.focus(); return; }
        var btn = this, mine = me(), rating = cfSel || (mine && mine.rating) || null;
        btn.disabled = true;
        var q = mine ? db.from('comments').update({ body: text, rating: rating }).eq('id', mine.id) : db.from('comments').insert({ article_id: articleId, user_id: PD.user.id, body: text, rating: rating });
        q.then(function (r) {
          btn.disabled = false;
          if (fail(r)) return;
          input.value = ''; $('cfCharHint').textContent = '০ / ' + UI.bn(MAX_LEN); cfSel = 0; paint(cfBox, 0, 'selected');
          UI.toast(mine ? 'আপনার মন্তব্য হালনাগাদ হয়েছে' : 'মন্তব্য যোগ হয়েছে');
          sort = 'new'; [].forEach.call(document.querySelectorAll('#sortChips button'), function (c) { c.classList.toggle('active', c.dataset.sort === 'new'); });
          refresh();
        });
      });

      function reply(c, ta, btn) {
        var text = ta.value.trim();
        if (!text) return;
        btn.disabled = true;
        db.from('comments').insert({ article_id: articleId, user_id: PD.user.id, body: text, parent_comment_id: c.id }).then(function (r) {
          btn.disabled = false;
          if (!fail(r)) { UI.toast('জবাব যোগ হয়েছে'); refresh(); }
        });
      }
      function toggleLike(c) {
        if (UI.needLogin()) return;
        var lk = likes[c.id] || [], has = lk.indexOf(PD.user.id) >= 0;
        var q = has ? db.from('comment_likes').delete().eq('comment_id', c.id).eq('user_id', PD.user.id) : db.from('comment_likes').insert({ comment_id: c.id, user_id: PD.user.id });
        q.then(function (r) { if (!fail(r)) refresh(); });
      }
      function edit(c) {
        var t = prompt('মন্তব্য এডিট করুন:', c.body);
        if (t === null || !t.trim()) return;
        db.from('comments').update({ body: t.trim() }).eq('id', c.id).then(function (r) { if (!fail(r)) refresh(); });
      }
      var pending = null, overlay = $('confirm-overlay');
      function askDelete(c) { pending = c; overlay.classList.add('show'); }
      $('confirmDeleteYes').addEventListener('click', function () {
        if (pending) db.from('comments').delete().eq('id', pending.id).then(function (r) { if (!fail(r)) refresh(); });
        pending = null; overlay.classList.remove('show');
      });
      $('confirmDeleteNo').addEventListener('click', function () { pending = null; overlay.classList.remove('show'); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) { pending = null; overlay.classList.remove('show'); } });

      var chips = document.querySelectorAll('#sortChips button');
      chips.forEach(function (c) { c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.remove('active'); }); c.classList.add('active'); sort = c.dataset.sort; render(); }); });
      $('loadMoreBtn').addEventListener('click', function () { showAll = true; render(); });

      PD.ready.then(function () {
        var logged = !!PD.user;
        $('loginPrompt').classList.toggle('show', !logged);
        $('commentForm').style.display = logged ? 'block' : 'none';
        if (logged) {
          var h = document.querySelector('.comment-form-head');
          if (h) { var im = h.querySelector('img'); if (im) im.src = UI.avatar(PD.profile && PD.profile.avatar_url); var t = h.querySelector('.comment-form-head-text strong'); if (t) t.textContent = (PD.profile && PD.profile.full_name) || 'আপনি'; }
        }
        return refresh();
      });
    }
  };
})();
