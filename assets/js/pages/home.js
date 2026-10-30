/* home.js — হোমপেজ: লেখা, লেখক, বিজ্ঞাপন, ফলো ও নিউজলেটার (Supabase থেকে) */
(async function() {
  var $ = function(i) {
      return document.getElementById(i)
    },
    bn = function(n) {
      return String(n).replace(/\d/g, function(d) {
        return '০১২৩৪৫৬৭৮৯' [d]
      })
    },
    M = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    PH = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23C9A98A'/%3E%3C/svg%3E",
    esc = function(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        } [c]
      })
    },
    dt = function(s) {
      var d = new Date(s);
      return bn(d.getDate()) + ' ' + M[d.getMonth()] + ', ' + bn(d.getFullYear())
    };
  if (!window.PD || !PD.db) {
    $('article-grid').innerHTML = '<p class="pd-empty">সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।</p>';
    return
  }
  var db = PD.db,
    R = await Promise.all([db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at').order('published_at', {
      ascending: false,
      nullsFirst: false
    }).order('created_at', {
      ascending: false
    }).limit(30), db.from('authors').select('id,slug,name,role_title,city,image_url,avg_rating').limit(100), db.from('issues').select('id,title,issue_number,cover_url,published_at,created_at'), db.from('ads').select('slot_id,image_url,link_url').eq('is_active', true), db.from('print_issues').select('id,issue_id,teaser,price,in_stock,cover_url').limit(50)]);
  if (R[0].error) {
    $('article-grid').innerHTML = '<p class="pd-empty">লেখাগুলো এখন আনা যাচ্ছে না। ইন্টারনেট যাচাই করে পেজটা আবার খুলুন।</p>';
    return
  }
  var A = R[0].data || [],
    U = {},
    I = {},
    ADS = {};
  (R[1].data || []).forEach(function(x) {
    U[x.id] = x
  });
  (R[2].data || []).forEach(function(x) {
    I[x.id] = x
  });
  (R[3].data || []).forEach(function(x) {
    (/top/i.test(x.slot_id) ? ADS.top = x : /mid/i.test(x.slot_id) ? ADS.mid = x : /mobile/i.test(x.slot_id) ? ADS.mobile = x : 0)
  });
  var au = function(a) {
      return U[a.author_id] || {
        name: 'অজানা লেখক'
      }
    },
    meta = function(u) {
      return esc(u.name) + (u.city ? '<span class="dot-sep"></span><span class="city">' + esc(u.city) + '</span>' : '')
    },
    im = function(u) {
      return '<img src="' + esc(u.image_url || PH) + '" alt="">'
    };
  /* হিরো — ম্যাগাজিন-কভার স্টাইল: বড় প্রধান লেখা (ছবির ওপর লেখা) + পাশে "এই সংখ্যায়" তালিকা */
  var cut = function(t, n) {
      t = String(t || '').replace(/\s+/g, ' ').trim();
      if (t.length <= n) return t;
      t = t.slice(0, n);
      var k = t.lastIndexOf(' ');
      return (k > n * .6 ? t.slice(0, k) : t) + ' …'
    },
    num = function(i) {
      return bn(i < 9 ? '0' + (i + 1) : i + 1)
    },
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var h = A[0];
  if (!h) {
    $('hero-grid').innerHTML = '<p class="pd-empty" style="grid-column:1/-1">এখনো কোনো লেখা প্রকাশিত হয়নি। খুব শীঘ্রই আসছে!</p>';
  } else {
    var iss = I[h.issue_id],
      same = A.slice(1).filter(function(a) {
        return h.issue_id && a.issue_id === h.issue_id
      }),
      rail = (same.length >= 2 ? same : A.slice(1)).slice(0, 4);
    var feat = '<a class="hf" href="article.html?id=' + h.id + '"><div class="hf-media"><img src="' + esc(h.cover_url || PH) + '" alt="' + esc(h.title) + '" fetchpriority="high"></div><div class="hf-shade"></div><div class="hf-body"><div class="hf-kicker">' + (h.category ? '<span class="hf-cat">' + esc(h.category) + '</span>' : '') + (iss ? '<span class="hf-issue">' + esc(iss.title) + '</span>' : '') + '</div><h1>' + esc(h.title) + '</h1><p class="hf-excerpt">' + esc(cut(h.excerpt, 150)) + '</p><div class="hf-foot"><div class="hf-by">' + im(au(h)) + '<div><strong>' + esc(au(h).name) + '</strong><span>' + dt(h.published_at || h.created_at) + '</span></div></div><span class="hf-cta">সম্পূর্ণ পড়ুন ' + arrow + '</span></div></div></a>';
    var side = rail.length ? '<aside class="hero-rail"><div class="rail-head"><span class="rail-title">' + (same.length >= 2 ? 'এই সংখ্যায়' : 'আরও পড়ুন') + '</span>' + (iss && same.length >= 2 ? '<span class="rail-issue">' + esc(iss.title) + '</span>' : '') + '</div><ol class="rail-list">' + rail.map(function(a, i) {
      return '<li><a href="article.html?id=' + a.id + '"><span class="rail-num">' + num(i) + '</span><div class="rail-text">' + (a.category ? '<span class="rail-cat">' + esc(a.category) + '</span>' : '') + '<h3>' + esc(a.title) + '</h3><span class="rail-author">' + esc(au(a).name) + '</span></div><div class="rail-thumb"><img src="' + esc(a.cover_url || PH) + '" alt="" loading="lazy"></div></a></li>'
    }).join('') + '</ol><a class="rail-more" href="archive.html">সব সংখ্যা দেখুন ' + arrow + '</a></aside>' : '';
    $('hero-grid').innerHTML = feat + side;
    $('hero-grid').classList.toggle('no-rail', !rail.length);
  }
  /* লেখার গ্রিড ও ফিল্টার */
  function grid(tag) {
    var l = A.filter(function(a) {
      return !tag || a.category == tag
    });
    $('article-grid').innerHTML = l.length ? l.map(function(a) {
      return '<article class="article-card" data-id="' + a.id + '"><a class="ac-link" href="article.html?id=' + a.id + '"><div class="thumb"><img src="' + esc(a.cover_url || PH) + '" alt="" loading="lazy">' + (a.category ? '<span class="ac-cat">' + esc(a.category) + '</span>' : '') + '</div><div class="ac-body"><h3>' + esc(a.title) + '</h3><p>' + esc(cut(a.excerpt, 120)) + '</p><div class="card-meta">' + im(au(a)) + '<span class="cm-name">' + esc(au(a).name) + '</span><span class="cm-date">' + dt(a.published_at || a.created_at) + '</span></div></div></a></article>'
    }).join('') : '<p class="pd-empty">এই বিভাগে এখনো লেখা নেই।</p>'
  }
  var tags = [];
  A.forEach(function(a) {
    if (a.category && tags.indexOf(a.category) < 0) tags.push(a.category)
  });
  $('chips').innerHTML = ['সব'].concat(tags).map(function(t, i) {
    return '<button' + (i ? '' : ' class="active"') + '>' + esc(t) + '</button>'
  }).join('');
  $('chips').onclick = function(e) {
    var b = e.target.closest('button');
    if (!b) return;
    [].forEach.call($('chips').children, function(c) {
      c.classList.remove('active')
    });
    b.classList.add('active');
    grid(b.textContent == 'সব' ? '' : b.textContent)
  };
  grid('');
  $('article-grid').onclick = function(e) {
    var c = e.target.closest('.article-card');
    if (c) location.href = 'article.html?id=' + c.dataset.id
  };
  /* চলতি সংখ্যা — সর্বশেষ সংখ্যার প্রচ্ছদ, বিবরণ, পড়া ও কেনার বাটন */
  (function() {
    var box = $('issue-band');
    if (!box) return;
    var list = (R[2].data || []).slice().sort(function(a, b) {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
    });
    var cur = list[0];
    if (!cur) return box.remove();
    var pr = (R[4] && R[4].data || []).filter(function(p) {
        return p.issue_id === cur.id
      })[0],
      arts = A.filter(function(a) {
        return a.issue_id === cur.id
      }),
      wr = {};
    arts.forEach(function(a) {
      if (a.author_id) wr[a.author_id] = 1
    });
    var cover = cur.cover_url || (pr && pr.cover_url) || PH,
      teaser = (pr && pr.teaser) || (arts[0] && arts[0].excerpt) || '';
    box.innerHTML = '<div class="ib-inner"><a class="ib-cover" href="issue.html?id=' + cur.id + '"><img src="' + esc(cover) + '" alt="' + esc(cur.title) + ' প্রচ্ছদ" loading="lazy"></a><div class="ib-text"><div class="ib-kicker"><span>চলতি সংখ্যা</span>' + (cur.issue_number ? '<span class="ib-no">সংখ্যা ' + bn(cur.issue_number) + '</span>' : '') + '</div><h2>' + esc(cur.title) + '</h2>' + (teaser ? '<p class="ib-teaser">' + esc(cut(teaser, 190)) + '</p>' : '') + '<div class="ib-stats"><div><strong>' + bn(arts.length) + '</strong><span>টি লেখা</span></div><div><strong>' + bn(Object.keys(wr).length) + '</strong><span>জন লেখক</span></div>' + (cur.published_at ? '<div><strong>' + M[new Date(cur.published_at).getMonth()] + '</strong><span>' + bn(new Date(cur.published_at).getFullYear()) + '</span></div>' : '') + '</div><div class="ib-actions"><a class="ib-btn primary" href="issue.html?id=' + cur.id + '">সংখ্যাটি পড়ুন ' + arrow + '</a>' + (pr && pr.in_stock ? '<a class="ib-btn ghost" href="store.html">ছাপা কপি · ৳' + bn(Number(pr.price)) + '</a>' : '') + '</div></div></div>';
  })();
  /* বিজ্ঞাপন */
  var sl = document.querySelectorAll('.ad-slot'),
    isMob = window.matchMedia && window.matchMedia('(max-width:760px)').matches;
  ['top', 'mid'].forEach(function(k, i) {
    var s = sl[i];
    if (!s) return;
    var a = ADS[k];
    /* মোবাইলে "মোবাইল ব্যানার" থাকলে উপরের ব্যানারের জায়গায় সেটা দেখানো হয় */
    if (k === 'top' && isMob && ADS.mobile && ADS.mobile.image_url) {
      a = ADS.mobile;
      s.classList.add('ad-mobile');
    }
    if (!a || !a.image_url) {
      s.remove();
      return
    }
    var g = s.querySelector('.ad-bg');
    if (g) g.src = a.image_url;
    var c = s.querySelector('.ad-content');
    if (c) c.remove();
    var o = s.querySelector('.ad-overlay');
    if (o) o.remove();
    if (a.link_url) {
      s.style.cursor = 'pointer';
      s.onclick = function() {
        window.open(a.link_url, '_blank', 'noopener')
      }
    }
  });
  /* জনপ্রিয় লেখক ও ফলো */
  await PD.load();
  var F = {};
  if (PD.user) {
    var f = await db.from('follows').select('author_id').eq('follower_id', PD.user.id);
    (f.data || []).forEach(function(x) {
      F[x.author_id] = 1
    })
  }
  var L = (R[1].data || []).slice().sort(function(a, b) {
    return (b.avg_rating || 0) - (a.avg_rating || 0)
  }).slice(0, 4);
  $('authors-row').innerHTML = L.length ? L.map(function(u) {
    return '<div class="author-card"><a class="au-link" href="author.html?slug=' + encodeURIComponent(u.slug) + '"><span class="au-ava">' + im(u) + '</span><h4>' + esc(u.name) + '</h4><div class="author-role">' + esc(u.role_title) + (u.city ? '<span class="dot-sep"></span>' + esc(u.city) : '') + '</div></a><div class="au-foot"><div class="author-rating">★ ' + bn(Number(u.avg_rating || 0).toFixed(1)) + '</div><button class="follow-btn' + (F[u.id] ? ' following' : '') + '" data-id="' + u.id + '">' + (F[u.id] ? 'ফলো করছেন ✓' : 'ফলো করুন') + '</button></div></div>'
  }).join('') : '<p class="pd-empty">লেখক তালিকা শীঘ্রই আসছে।</p>';
  $('authors-row').onclick = async function(e) {
    var b = e.target.closest('.follow-btn');
    if (!b) return;
    if (!PD.user) {
      PD.toast('ফলো করতে আগে লগইন করুন', 1);
      setTimeout(function() {
        location.href = 'auth.html'
      }, 900);
      return
    }
    var on = b.classList.contains('following'),
      q = on ? db.from('follows').delete().eq('follower_id', PD.user.id).eq('author_id', b.dataset.id) : db.from('follows').insert({
        follower_id: PD.user.id,
        author_id: b.dataset.id
      }),
      r = await q;
    if (r.error) return PD.toast(PD.msg(r.error), 1);
    b.classList.toggle('following');
    b.textContent = on ? 'ফলো করুন' : 'ফলো করছেন ✓'
  };
})();
