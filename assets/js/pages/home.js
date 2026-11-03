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
    PH = 'assets/img/placeholder.svg',
    AV = 'assets/img/avatar.svg',
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
    R = await Promise.all([db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at,home_order,home_hidden').order('published_at', {
      ascending: false,
      nullsFirst: false
    }).order('created_at', {
      ascending: false
    }).limit(30), db.from('authors').select('id,slug,name,role_title,city,image_url,avg_rating,popular_rank').limit(100), db.from('issues').select('*'), db.from('ads').select('slot_id,image_url,link_url').eq('is_active', true), db.from('print_issues').select('id,issue_id,teaser,price,in_stock,cover_url').limit(50), db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at,home_order,home_hidden').not('home_order', 'is', null).order('home_order', { ascending: true }).limit(20), db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at,home_order,home_hidden').eq('home_featured', true).eq('status', 'published').order('created_at', { ascending: false }).limit(1)]);
  if (R[0].error) { /* নতুন কলাম (home_order) এখনো ডাটাবেসে না থাকলে আগের মতো চালু থাকুক */
    var fb = await db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at').order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(30);
    if (!fb.error) R[0] = fb
  }
  if (R[0].error) {
    $('article-grid').innerHTML = '<p class="pd-empty">লেখাগুলো এখন আনা যাচ্ছে না। ইন্টারনেট যাচাই করে পেজটা আবার খুলুন।</p>';
    return
  }
  /* বানান ঠিক রাখা: পুরোনো/ভুল বানানে সেভ হওয়া বিভাগের নাম সঠিক রূপে দেখানো */
  var normCat = PD.normCat;
  (R[0].data || []).forEach(function(a) { a.category = normCat(a.category) });
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
      return '<img decoding="async" src="' + esc(u.image_url || AV) + '" alt="">'
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
    arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    pen = '<svg class="pen-ico" viewBox="106 252 382 338" aria-hidden="true" focusable="false"><defs><linearGradient id="penGrad" gradientUnits="userSpaceOnUse" x1="110" y1="590" x2="484" y2="256"><stop offset="0" style="stop-color:var(--secondary)"/><stop offset=".42" style="stop-color:var(--secondary)"/><stop offset=".62" style="stop-color:var(--primary)"/><stop offset="1" style="stop-color:var(--primary)"/></linearGradient></defs><path fill="url(#penGrad)" stroke="url(#penGrad)" stroke-width="9" stroke-linejoin="round" d="M457.5,506.3c-20.8,3.9-41.3,9.2-62.1,12.5c-15.4,2.4-31.1,2.6-46.7,3.8c0-0.5-0.1-1-0.1-1.5c17.6-3.5,33.4-11.2,48.6-20.2c2.7-1.6,5.2-3.5,7.7-5.5c0.8-0.6,1.5-2.5,1.2-2.9c-0.7-0.9-2.1-1.5-3.3-1.6c-1.3-0.1-2.7,0.2-3.9,0.6c-8.9,2.8-17.8,5.7-26.6,8.7c-14.5,4.9-28.8,10.3-43.5,14.8c-4.9,1.5-11.2,2.7-15.6,0.8c-12.1-5.2-23.6-12-35.3-18.1c0.1-0.8,0.1-1.6,0.2-2.4c8-2.4,15.9-5.5,24.1-7c8.3-1.5,16.9-2.3,25.4-2.1c15.9,0.3,27.4-6.6,35.5-19.9c1.8-3,3.9-5.8,5.8-8.7c5.4-8.2,10.2-16.9,16.3-24.5c7.5-9.3,15.8-17.9,24.3-26.4c1.9-1.9,5.9-2.4,9-2.5c5.8-0.2,11.6,0.6,17.4,0.4c3.1-0.1,6.1-1.7,6-5.4c-0.1-4.1-3.7-5.4-6.8-5c-5.1,0.5-10.5,1.1-14.9,3.4c-6,3.2-10.5,2.3-16.2-0.6c-35.1-18-69.9-36.8-107.8-48.7c-4.7-1.5-9.4-3.6-14.6-0.3c0.3-1.4,1-2.4,2-3.1c1.3-0.9,3.4-1.1,3.9-2.2c11.2-22.9,22.4-45.7,33.1-68.8c3.9-8.4,2.1-12.5-5.4-17.8h-8c-3.4,3.6-7.5,6.7-10.2,10.7c-14.7,22-29,44.2-43.8,66.8c-15.5-4.3-30.3,0.5-44.5,8.6c-27.1,15.4-51.2,34.9-74.8,55c-6.1,5.2-10.8,12.2-15.9,18.6c-4.6,5.8-5.5,12.3-2,19.2c4.9,9.5,9,19.4,14.8,28.3c7.6,11.8,11.5,24.6,13.2,38.3c1.1,8.8,3.7,17,9.3,23.9c1.4,1.8,4.3,2.5,6.4,3.7c0.8-2.4,2.5-4.9,2.2-7.1c-1.8-11.9-5.6-23.2-12.5-33.4c-4.4-6.5-7.6-14-11.3-21c-4-7.5-8.1-14.9-12.1-22.4c-1.7-3.2-3.9-6.4-4.7-9.8c-2.9-12.5,1.1-23.8,10.4-31.6c20-16.6,40.7-32.3,61.6-47.8c7.2-5.3,15.3-9.4,23.3-13.5c7.5-3.8,15.5-4.6,23.8-1.9c5.5,1.7,11.3,2.5,17.6,3.8c-5.3,9.5-10.5,18.9-16.4,29.5c-0.9-4.7-1.3-7.7-2.2-10.5c-0.4-1.4-1.8-2.4-2.8-3.7c-0.9,1.4-2.5,2.8-2.6,4.3c-0.2,2.6-0.3,5.9,1.1,7.7c4.4,5.7,1.5,10.3-1.1,15.1c-4.6,8.6-9.3,17.1-13.9,25.6c-0.6-11.9,2.3-23.6-3.8-34.7c-1.9,2.9-3.5,6-3.3,8.9c0.4,8.3,1.3,16.5,2.3,24.7c0.6,4.6-0.6,8.4-4.2,11c-3.7,2.7-5.7-1.1-7.8-3.2c-2.3-2.3-3.9-2.2-6.3-0.1c-4.7,4-9.6,7.7-14.5,11.4c-2.7,2-4.7,1.3-7.2-1.4c-4.5-5-9.6-9.6-14.9-13.9c-1.5-1.2-4.4-0.6-6.7-0.8c0.4,2.3,0.1,5.5,1.4,6.7c5.3,4.5,11.2,8.1,16.7,12.4c1.8,1.3,4,3.4,4.2,5.3c1.2,15.3,2.1,30.6,2.8,45.8c0.1,2.8-1.5,5.7-1.9,8.5c-0.5,2.9,0,6-0.9,8.6c-1.8,5.2-4.3,10.1-6.5,15.1c-5.1,11.6-14.1,21.3-16.3,34.4c-1.3,7.5-4,14.7-5.6,22.2c-1.6,7.6-6,9.5-13.5,9.9c-7.9,0.4-15.7,0.5-23.4,0.1v2.7c8.5,0.3,17.1,0,25.7-0.5c2.6-0.2,5.6-0.8,7.9,0.1c3,1.2,4.7,0.3,6.4-1.8c9.3-11.4,18.6-22.9,27.9-34.3c0.8-1,1.7-1.9,2.1-2.3c5.1,3.9,9.6,7.8,14.6,10.9c7.6,4.7,17.7,2.6,23.4-4.4c0.8-1,1.5-2,2.3-3c15,12.4,27.8,9.4,35.8-8c10.7,4.7,19.1,4.4,23.4-1.8c7.7-11,0.5-19.2-3.7-24.1c2.7-2.9,4.9-5.3,7.6-8.4c7.4,5.2,18.3,10.1,30.2,12.5c24.8,5,49.8,4.7,74.6,1.3c20.1-2.8,39.8-7.7,59.7-11.7c11.7-2.3,23.4-5.5,35.5-3.8v-3C475.4,504.6,466.3,504.6,457.5,506.3z M434.9,396.5c1.3-0.2,2.8,1.7,4.2,2.6c-1.3,1-2.6,2.7-4,2.8c-5.1,0.3-10.2,0.1-15.3,0.1c-0.2-0.8-0.3-1.6-0.5-2.5C424.5,398.5,429.7,397.2,434.9,396.5z M158.9,526c-12.4-10.5-11.3-25.9-14.6-39.8C153.9,497.8,158.8,511.1,158.9,526z M156.4,416.4c7,2.5,11.8,7.6,16,13.5C165.6,427.2,159.4,423.8,156.4,416.4z M284.2,352.1c0.5-4.2,4.2-3.9,7.1-2.9c14.2,5.1,28.6,9.9,42.5,15.9c14.7,6.3,28.9,13.7,43.3,20.6c0.7,0.3,1.3,0.8,2,1.2c-0.1,0.2-0.2,0.5-0.4,0.7c-9.6-4.1-19.2-8.1-28.7-12.2c-19.3-8.3-39.3-14.5-60.1-17.7C286.3,357.1,283.8,355.4,284.2,352.1z M386.7,394.2c-32.4-8.2-65-15.2-94.1-32.6C326.3,365.6,356.1,381.3,386.7,394.2z M290,363.3c11.7,6.3,23.6,12.6,36.2,16.6c25.2,7.9,51,14.2,76.5,21.1c1.9,0.5,3.8,0.9,5.6,1.4c-0.1,0.8,0,1.2-0.1,1.4c-14.8,11.4-24.9,26.7-34.9,42.1c-3.4,5.3-7.1,10.5-10.3,16c-8.4,14.8-20.5,22.7-37.9,21.7c-3-0.2-6,0.4-9,0.4c-20.5,0-38.1,8.3-55.2,18.5c-11.2,6.6-22.3,13.3-33.8,19.3c-8.8,4.6-14.5,5.3-23.6,4.4c5.7-3.7,10.4-6.5,14.9-9.6c7.8-5.1,9.2-9.4,6-17.7c-3.3-8.6-7.5-11.1-16.6-9.6c-9.3,1.6-16.6,6.7-22.4,13.9c-4,4.9-3.5,12,1,17c2.1,2.3,4.8,4.1,6.9,5.9c-5.9,0-12.7-6.7-12.7-13c0-3.6,0-7.3,0-10.9c-0.5,0-0.9,0-1.4,0.1c1.5-1.9,3.2-3.6,4.5-5.6c9.2-13.7,20.5-25.7,33.8-35.1c8-5.6,17.9-8.7,27.3-11.9c14.4-5,28.4-10.6,40.1-20.6c4-3.5,7.9-7.2,11.5-11.1c2.1-2.3,4.2-5.2,1.1-8.3c-3-2.9-6.8-3-9.5-0.3c-5.9,6.2-11.3,12.9-16.7,19.6c-2.6,3.3-4.9,6.8-7.6,9.8c2-6,4.1-12.1,5.9-18.1c0.4-1.4,0.5-3.1,0.1-4.4c-0.4-1.2-1.8-2.1-2.7-3.1c-0.9,0.8-2.4,1.6-2.7,2.6c-1,4.4-1.6,8.8-2.4,13.2c-0.5,2.8-1.1,5.7-1.7,8.7c-7.7-3.2-9.9-6.5-9.2-13.7c0.2-1.8,0.5-3.7,1-5.4c6-18.6,14.1-36.3,24.8-52.7C281.6,358.5,282.6,359.3,290,363.3z M201.3,524.4c-5.6,3.1-16-6.5-15.7-15.3c0.3-0.7,0.6-2.9,1.8-4.3c6.7-7.8,14.6-13.5,25.6-13.3c5.4,0.1,7.3,3.8,9,7.9c1.7,4.2,2.9,8.8-1.2,11.9C214.5,516.2,208.1,520.7,201.3,524.4z M273.6,336.8c5.5,2.2,6.5,3.2,5.8,6.7c-5.6-2.8-11-10.2-17.6-1.3C266.6,334,266.6,334,273.6,336.8z M280.6,350.9c-13.7,24.6-27.4,49.1-41.1,73.7c-0.3-0.2-0.6-0.3-0.9-0.5c13.5-24.7,27-49.4,40.5-74.1C279.6,350.4,280.1,350.7,280.6,350.9z M252.9,405.7c-1.8,7.7-3.8,13.8-4.5,20c-0.8,7.5,5,11.4,11.6,15.3c-11.6,4.4-22,8.3-33.7,12.8C235.3,437.5,243.8,422.2,252.9,405.7z M271.4,434.6c4-9,9.7-16.9,17.7-22.8c1.5-1.1,4.4-0.5,6.7-0.7c-0.5,1.9-0.3,4.5-1.5,5.6c-7.1,6.6-14.4,12.8-21.7,19.2C272.1,435.5,271.7,435,271.4,434.6z M285.8,340.9l-1.3-0.7c4.9-9.1,9.8-18.2,14.7-27.3c0.3,0.1,0.6,0.3,0.8,0.4C295.2,322.5,290.5,331.7,285.8,340.9z M319.7,264.8c-3.8-1.9-7.6-3.9-11.1-5.7C313.5,256.6,317,258.4,319.7,264.8z M312.6,263.4c4.9,2.1,6.1,5.6,4,12.2c-5-2.6-10-5.2-15-7.8C304,263.1,307.8,261.4,312.6,263.4z M314.5,280.3c-4.7-2.4-10-5.2-15.1-7.9C304.8,269.9,313.8,275,314.5,280.3z M299.8,277c10.4,2.2,11.4,4.2,6.4,13.2c-7.6,13.7-15.6,27.1-23,40.9c-2.4,4.4-4.8,5.4-9,3.1c-1.9-1-4-1.5-6.6-2.4c9.5-18,18.7-35.5,28.1-53C296.1,277.7,298.5,276.8,299.8,277z M257.1,341.3c-9.1-1.8-18.2-3.5-26.8-5.2c7.3-3.5,23.2-1.6,27.2,3.5C257.4,340.2,257.3,340.8,257.1,341.3z M283,291.8c0.3,0.2,0.6,0.4,1,0.6c-8,13.3-15.9,26.6-23.9,39.9l-1.9-1.3C266.4,317.9,274.7,304.8,283,291.8z M258.2,335.7c0.8,0.6,1.5,1.2,2.3,1.9c0.8-0.9,1.5-1.8,2.3-2.7c-0.6,1.2-1.3,2.4-2,3.6C259.7,337.2,258.9,336.4,258.2,335.7z M216.3,382.8c0.4,0,0.8,0,1.2,0v21.9c-0.4,0-0.8,0-1.2,0V382.8z M221,417c12.5-22.4,25.5-44.5,38.3-66.6c1.4-2.4,3.4-4.6,5-6.9c2.3-3.3,5-3.3,8.2-1.5c5.5,3.1,5.9,4,2.8,9.6c-18.9,34.6-37.9,69.2-56.8,103.8c-0.9,1.7-2.3,3.3-3.8,4.6c-12.2,10.4-23.7,21.4-32.8,34.8c-0.5-0.2-1.1-0.4-1.6-0.6c1.4-3.4,2.4-7,4.1-10.2C196.5,461.7,208.6,439.2,221,417z M187,463.5c2,0.7,4.4,0.2,6.9,0.2c-3.6,5.9-7.2,11.9-10.9,18c-0.4-0.1-0.8-0.3-1.2-0.4v-21.7C183.4,460.8,185,462.8,187,463.5z M189.9,437.8c4.9-2.8,10-4,16.3-2.3c-2.6,9.7-6.9,17.9-13.7,24.6c-2.9,2.9-5.8,1.3-7.8-1.9C180,450.6,182.1,442.2,189.9,437.8z M182.7,433.2c6.2-3.7,11.9-8.3,17.5-12.3c3.9,2,7.9,4.1,12.3,6.4c-0.7,1.3-2,3.8-3.3,6.2c-11.7-3.5-21-0.2-29.2,10.8c-0.2-2-0.2-3.2-0.6-4.2C178,436.4,179.6,435.1,182.7,433.2z M160.5,537.4c0.5,0.2,1,0.3,1.5,0.5l-4.6,12.4c-0.3-0.1-0.6-0.2-1-0.3C157.8,545.8,159.1,541.6,160.5,537.4z M158.5,569.4c-1.6-0.9-3.4-2-5.4-3.1c3.8-9,7.5-17.6,11.2-26.3c4.1,1.2,8.2,2.4,11.9,3.6C170.6,551.8,164.6,560.5,158.5,569.4z M164.6,532.1c5.7,0.2,10,2.6,13.7,7.5C170.6,541.3,165,538.2,164.6,532.1z M182.1,532.7c-4.8-1.3-9.5-3-15.1-4.8c3.3-6.6,6.3-12.5,9.7-19.3c0.9,8.1,2.6,15,8.6,20c0.5,0.5,0.6,2.4,0.1,2.9C184.6,532.4,183,533,182.1,532.7z M186.8,544.8c5.7,0,12.6,6.1,14.8,13.3C194.5,555.2,189.3,551.8,186.8,544.8z M222.7,547.3c5-2.1,12.5,1,17.6,7.7C233.5,552.8,227.3,552.5,222.7,547.3z M248.8,552.6c-2.4,2-4,2.2-7.1-0.3c-4.8-3.8-10.8-5.9-16.3-8.9c-1.5-0.8-3-1.9-3.9-3.3c-2.2-3.5-4.1-7.2-6.1-10.8c-0.7,0.4-1.3,0.7-2,1.1c1.6,5.2,2.9,10.5,4.8,15.5c1.5,3.9-0.8,6.4-3.3,8c-2.8,1.8-6.3,2.5-9.5,3.4c-0.3,0.1-1-1.9-1.8-2.7c-3.9-4-7.7-8.2-12.1-11.7c-1.7-1.3-4.9-0.7-7.9-1c1.7-3.8,3.8-8.5,5.8-12.9c14.3,0,28.5,1.7,41.3-6c3-1.8,5.4-1.7,8.1,0.4c3.4,2.7,7.2,4.9,10.4,7.8C255.2,536.5,254.9,547.6,248.8,552.6z M259.1,534.4c3.6,2.2,7.1,4.3,11.4,7C264.7,543.3,260.6,540.8,259.1,534.4z M268.3,509.2c-3.7-1-7-2.6-10.9,0.9c2,0.7,4,1.6,6.1,2c8.5,1.7,16.4,10,17.5,18.7c0.7,5.5-1.5,9.1-7.4,11.8c-4.9-6.3-10.3-11.1-19.3-10.1c-2.9-6.4-7.8-11-16-13.3c12.4-7.4,23.8-14.3,35.6-21.4c1,1.3,2.3,2.2,2.5,3.3c0.5,2.6,0.6,5.3,0.8,8C274.2,509.2,271.1,509.9,268.3,509.2z M326.1,519.3c25.6-9.1,50.5-17.9,75.4-26.8c0.2,0.7,0.5,1.4,0.7,2.1C379.1,508.8,355.5,521.7,326.1,519.3z"/></svg>';
  /* v91: হিরো = পুরো-ব্যানার স্লাইডার (অ্যাডমিন > বিজ্ঞাপন > হিরো ব্যানার ১–৫); কিছু না দিলে ডিফল্ট ব্যানার */
  var HB = (R[3].data || []).filter(function(x) {
    return /^hero\d+$/i.test(x.slot_id || '') && x.image_url
  }).sort(function(a, b) {
    return parseInt(String(a.slot_id).replace(/\D/g, ''), 10) - parseInt(String(b.slot_id).replace(/\D/g, ''), 10)
  });
  var hbG = $('hero-grid'),
    hbArrow = function(d) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="' + d + '"/></svg>'
    },
    hbSafe = function(u) {
      u = String(u || '').trim();
      return /^(https?:\/\/|\/|[\w.-]+\.html)/i.test(u) ? u : ''
    },
    hbSlides = HB.length ? HB.map(function(x, i) {
      var img = '<img decoding="async" src="' + esc(x.image_url) + '" alt="ব্যানার ' + bn(i + 1) + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' draggable="false">',
        u = hbSafe(x.link_url);
      return u ? '<a class="hb-slide" href="' + esc(u) + '"' + (/^https?:/i.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + img + '</a>' : '<div class="hb-slide">' + img + '</div>'
    }) : ['<div class="hb-slide hb-default"><span class="hb-d-sub">গল্প, কবিতা, প্রবন্ধ ও ভাবনার ঠিকানা</span><h1 class="hb-d-title">পত্রদ্বীপ</h1><a class="hb-d-cta" href="archive.html">লেখাগুলো পড়ুন ' + arrow + '</a></div>'],
    hbN = hbSlides.length;
  hbG.innerHTML = '<div class="hb' + (hbN > 1 ? ' multi' : '') + '" role="region" aria-roledescription="carousel" aria-label="ব্যানার"><div class="hb-track" tabindex="0">' + hbSlides.join('') + '</div>' + (hbN > 1 ? '<button type="button" class="hb-nav prev" aria-label="আগের ব্যানার">' + hbArrow('15 18 9 12 15 6') + '</button><button type="button" class="hb-nav next" aria-label="পরের ব্যানার">' + hbArrow('9 18 15 12 9 6') + '</button>' : '') + '</div>' + (hbN > 1 ? '<div class="hb-dots" role="group" aria-label="ব্যানার বেছে নিন">' + hbSlides.map(function(_, i) {
    return '<button type="button" class="' + (i ? '' : 'on') + '" aria-label="ব্যানার ' + bn(i + 1) + '"></button>'
  }).join('') + '</div>' : '');
  if (hbN > 1) {
    var hbT = hbG.querySelector('.hb-track'),
      hbD = hbG.querySelectorAll('.hb-dots button'),
      hbC = 0,
      hbTimer = 0,
      hbRaf = 0,
      hbRM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,
      hbShow = function(i, instant) {
        i = (i + hbN) % hbN;
        hbT.scrollTo({
          left: i * hbT.clientWidth,
          behavior: instant || hbRM ? 'auto' : 'smooth'
        })
      },
      hbStop = function() {
        clearInterval(hbTimer);
        hbTimer = 0
      },
      hbStart = function() {
        hbStop();
        if (hbRM) return;
        hbTimer = setInterval(function() {
          hbShow(hbC + 1, hbC + 1 >= hbN)
        }, 5000)
      };
    hbT.addEventListener('scroll', function() {
      if (hbRaf) return;
      hbRaf = requestAnimationFrame(function() {
        hbRaf = 0;
        var i = Math.round(hbT.scrollLeft / (hbT.clientWidth || 1));
        if (i !== hbC && i >= 0 && i < hbN) {
          hbC = i;
          hbD.forEach(function(d, q) {
            d.classList.toggle('on', q === i)
          })
        }
      })
    }, {
      passive: true
    });
    hbD.forEach(function(d, i) {
      d.addEventListener('click', function() {
        hbShow(i);
        hbStart()
      })
    });
    hbG.querySelector('.hb-nav.prev').addEventListener('click', function() {
      hbShow(hbC - 1);
      hbStart()
    });
    hbG.querySelector('.hb-nav.next').addEventListener('click', function() {
      hbShow(hbC + 1);
      hbStart()
    });
    var hbBox = hbG.querySelector('.hb');
    ['mouseenter', 'focusin', 'touchstart'].forEach(function(t) {
      hbBox.addEventListener(t, hbStop, {
        passive: true
      })
    });
    ['mouseleave', 'focusout', 'touchend'].forEach(function(t) {
      hbBox.addEventListener(t, hbStart, {
        passive: true
      })
    });
    document.addEventListener('visibilitychange', function() {
      document.hidden ? hbStop() : hbStart()
    });
    window.addEventListener('resize', function() {
      hbT.scrollLeft = hbC * hbT.clientWidth
    });
    hbStart()
  }
  /* লেখার কার্ড (সাম্প্রতিক লেখা ও বিভাগ-সেকশন একই চেহারা) */
  function card(a) {
      return '<article class="article-card" data-id="' + a.id + '"><a class="ac-link" href="article.html?id=' + a.id + '"><div class="thumb"><img decoding="async" src="' + esc(a.cover_url || PH) + '" alt="" loading="lazy">' + (a.category ? '<span class="ac-cat">' + esc(a.category) + '</span>' : '') + '</div><div class="ac-body"><h3>' + esc(a.title) + '</h3><p>' + esc(cut(a.excerpt, 120)) + '</p><div class="card-meta">' + im(au(a)) + '<span class="cm-name">' + esc(au(a).name) + '</span><span class="cm-date">' + dt(a.published_at || a.created_at) + '</span></div></div></a></article>'
  }
  /* v93: প্রতিটা সেকশনে প্রথমে সর্বোচ্চ ৬টা কার্ড; বেশি লেখা থাকলে লাইনের ডানে "আরো দেখুন" (চাপলে আরও ৬টা, সব দেখানো হলে "কম দেখুন") */
  var PER = 6,
    MORE_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  function pager(head, gridEl, list) {
    var shown = Math.min(PER, list.length),
      btn = head.querySelector('.sec-more');
    gridEl.innerHTML = list.slice(0, shown).map(card).join('');
    if (list.length <= PER) {
      head.classList.remove('has-more');
      if (btn) btn.remove();
      return
    }
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sec-more';
      head.appendChild(btn)
    }
    head.classList.add('has-more');
    var paint = function() {
      var all = shown >= list.length;
      btn.classList.toggle('open', all);
      btn.setAttribute('aria-expanded', all ? 'true' : 'false');
      btn.innerHTML = '<span>' + (all ? 'কম দেখুন' : 'আরো দেখুন') + '</span>' + MORE_ARROW
    };
    paint();
    btn.onclick = function() {
      if (shown >= list.length) {
        while (gridEl.children.length > PER) gridEl.removeChild(gridEl.lastChild);
        shown = PER;
        head.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      } else {
        gridEl.insertAdjacentHTML('beforeend', list.slice(shown, shown + PER).map(card).join(''));
        shown = Math.min(shown + PER, list.length)
      }
      paint()
    }
  }
  /* লেখার গ্রিড ও ফিল্টার */
  function grid(tag) {
    var l = A.filter(function(a) {
        return !tag || a.category == tag
      }),
      g = $('article-grid');
    if (!l.length) {
      g.innerHTML = '<p class="pd-empty">এই বিভাগে এখনো লেখা নেই।</p>';
      var h0 = g.parentNode.querySelector('.section-head');
      if (h0) {
        h0.classList.remove('has-more');
        var b0 = h0.querySelector('.sec-more');
        if (b0) b0.remove()
      }
      return
    }
    pager(g.parentNode.querySelector('.section-head'), g, l)
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
  /* বিভাগ-ভিত্তিক সেকশন: নির্ধারিত ক্রমে (সাম্প্রতিক লেখার পর), লেখা না থাকলে সেকশন আসে না।
     অ্যাডমিন নতুন কোনো বিভাগ খুলে লেখা দিলে সেটাও নিজে থেকে নিচে যোগ হয়। */
  var CAT_ORDER = ['গল্প', 'সাহিত্য', 'ভ্রমণ', 'কবিতা', 'প্রবন্ধ', 'রম্য', 'স্মৃতিগদ্য', 'কাব্য', 'ছড়া'];
  async function catSections() {
    var box = $('cat-sections');
    if (!box) return;
    var all = A;
    try {
      var q = await db.from('articles').select('id,title,excerpt,category,cover_url,author_id,issue_id,published_at,created_at').order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(400);
      if (!q.error && q.data) {
        all = q.data;
        all.forEach(function(a) { a.category = normCat(a.category) });
      }
    } catch (e) {}
    var by = {}, extra = [];
    all.forEach(function(a) {
      if (!a.category) return;
      if (!by[a.category]) { by[a.category] = []; if (CAT_ORDER.indexOf(a.category) < 0) extra.push(a.category) }
      by[a.category].push(a)
    });
    var cats = CAT_ORDER.concat(extra).filter(function(c) { return by[c] && by[c].length });
    box.innerHTML = cats.map(function(c) {
      return '<section class="cat-sec" data-cat="' + esc(c) + '"><div class="section-head"><h2>' + esc(c) + '</h2></div><div class="article-grid"></div></section>'
    }).join('');
    [].forEach.call(box.querySelectorAll('.cat-sec'), function(sec) {
      pager(sec.querySelector('.section-head'), sec.querySelector('.article-grid'), by[sec.dataset.cat])
    })
  }
  await catSections();
  /* ম্যাগাজিন: চলতি সংখ্যার ব্যান্ডের নিচে আগের সংখ্যাগুলোর প্রচ্ছদ */
  (function() {
    var row = $('issue-row');
    if (!row) return;
    var list = (R[2].data || []).filter(function(i) { return i.cover_url }).sort(function(a, b) {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
    }).slice(1, 7);
    row.innerHTML = list.map(function(i) {
      return '<a class="mag-card" href="issue.html?id=' + i.id + '"><div class="mag-cover"><img decoding="async" src="' + esc(i.cover_url) + '" alt="' + esc(i.title) + ' প্রচ্ছদ" loading="lazy"></div><h4>' + esc(i.title) + '</h4>' + (i.issue_number ? '<span>সংখ্যা ' + bn(i.issue_number) + '</span>' : '') + '</a>'
    }).join('')
  })();
  /* চলতি সংখ্যা — সর্বশেষ সংখ্যার প্রচ্ছদ, বিবরণ, পড়া ও কেনার বাটন */
  (function() {
    var box = $('issue-band');
    if (!box) return;
    var list = (R[2].data || []).slice().sort(function(a, b) {
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
    });
    var cur = list[0];
    if (!cur) { var ms = $('mag-section'); return ms ? ms.remove() : box.remove() }
    var pr = (R[4] && R[4].data || []).filter(function(p) {
      return p.issue_id === cur.id
    })[0];
    /* সব তথ্য অ্যাডমিন প্যানেল থেকে — কিছুই অটো নয়; খালি ঘর দেখানো হয় না */
    var T = function(k) {
        return cur[k] == null ? '' : String(cur[k]).trim()
      },
      st = [];
    if (T('articles_count')) st.push('<div><strong>' + bn(T('articles_count')) + '</strong><span>টি লেখা</span></div>');
    if (T('authors_count')) st.push('<div><strong>' + bn(T('authors_count')) + '</strong><span>জন লেখক</span></div>');
    if (T('issue_month') || T('issue_year')) st.push('<div><strong>' + esc(T('issue_month') || bn(T('issue_year'))) + '</strong>' + (T('issue_month') && T('issue_year') ? '<span>' + bn(T('issue_year')) + '</span>' : '') + '</div>');
    var readBtn = T('read_label') ? '<a class="ib-btn primary" href="issue.html?id=' + cur.id + '">' + esc(T('read_label')) + ' ' + arrow + '</a>' : '',
      buyBtn = (cur.show_print_btn !== false && pr && pr.in_stock) ? '<a class="ib-btn ghost" href="store.html">ছাপা কপি · ৳' + bn(Number(pr.price)) + '</a>' : '',
      cover = cur.cover_url;
    box.classList.toggle('no-cover', !cover);
    box.innerHTML = '<div class="ib-inner">' + (cover ? '<a class="ib-cover" href="issue.html?id=' + cur.id + '"><img decoding="async" src="' + esc(cover) + '" alt="' + esc(cur.title) + ' প্রচ্ছদ" loading="lazy"></a>' : '') + '<div class="ib-text"><div class="ib-kicker"><span>চলতি সংখ্যা</span>' + (cur.issue_number ? '<span class="ib-no">সংখ্যা ' + bn(cur.issue_number) + '</span>' : '') + '</div><h2>' + esc(cur.title) + '</h2>' + (T('tagline') ? '<p class="ib-teaser">' + esc(cut(T('tagline'), 260)) + '</p>' : '') + (st.length ? '<div class="ib-stats">' + st.join('') + '</div>' : '') + ((readBtn || buyBtn) ? '<div class="ib-actions">' + readBtn + buyBtn + '</div>' : '') + '</div></div>';
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
    s.style.display = '';
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
  /* popular_rank কলাম ডাটাবেসে না থাকলে (SQL চালানো হয়নি) আগের মতোই রেটিং দিয়ে চলবে */
  if (R[1].error) {
    var fa = await db.from('authors').select('id,slug,name,role_title,city,image_url,avg_rating').limit(100);
    if (!fa.error) R[1] = fa
  }
  /* এডমিনের দেওয়া ক্রম ঠিক নিজের নম্বরের জায়গায় বসে (৩ দিলে ৩ নম্বরে); ফাঁকা জায়গা রেটিং অনুযায়ী বাকিদের দিয়ে ভরে — মোট ৫ জন */
  var AU = (R[1].data || []),
    slots = [null, null, null, null, null],
    rest = [];
  AU.forEach(function(u) {
    var r = Number(u.popular_rank);
    if (r >= 1 && r <= 5 && !slots[r - 1]) slots[r - 1] = u;
    else rest.push(u)
  });
  rest.sort(function(a, b) {
    return (b.avg_rating || 0) - (a.avg_rating || 0)
  });
  var L = slots.map(function(u) {
    return u || rest.shift() || null
  }).filter(Boolean);
  /* লেখক-পেজের মতো: ছবি, নাম + ছোট ফলো-আইকন, নিচে ধরন · ঠিকানা (বক্স/স্টার/লেখা-সহ বাটন নেই) */
  var SVG = function(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'
  };
  var ICON_ADD = SVG('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>'),
    ICON_DONE = SVG('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>');
  function setFollow(b, on) {
    b.classList.toggle('following', on);
    b.innerHTML = on ? ICON_DONE : ICON_ADD;
    var t = on ? 'ফলো করছেন' : 'ফলো করুন';
    b.title = t;
    b.setAttribute('aria-label', t);
    b.setAttribute('aria-pressed', on ? 'true' : 'false')
  }
  $('authors-row').innerHTML = L.length ? L.map(function(u) {
    var url = 'author.html?slug=' + encodeURIComponent(u.slug),
      parts = [u.role_title, u.city].filter(Boolean),
      line = parts.map(function(t) {
        return '<span>' + esc(t) + '</span>'
      }).join('<i class="au-dot"></i>'),
      on = !!F[u.id];
    return '<article class="au-card"><a class="au-ring" href="' + url + '" tabindex="-1" aria-hidden="true">' + im(u) + '</a><div class="au-id"><h3><a href="' + url + '">' + esc(u.name) + '</a></h3><button type="button" class="follow-btn' + (on ? ' following' : '') + '" data-id="' + u.id + '" title="' + (on ? 'ফলো করছেন' : 'ফলো করুন') + '" aria-label="' + (on ? 'ফলো করছেন' : 'ফলো করুন') + '" aria-pressed="' + on + '">' + (on ? ICON_DONE : ICON_ADD) + '</button></div>' + (line ? '<p class="au-line">' + line + '</p>' : '') + '</article>'
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
    setFollow(b, !on)
  };
})();
