/* custom-page.js — ডিজাইন স্টুডিওতে বানানো নতুন পেজ (page.html?p=নাম)। ডিজাইন না পেলে "পেজ পাওয়া যায়নি" দেখায় */
(function () {
  var slug = new URLSearchParams(location.search).get('p');
  var main = document.getElementById('pd-page-main');
  if (!main || /[?&]pdstudio=1/.test(location.search)) return;
  var tries = 0;
  var t = setInterval(function () {
    tries++;
    var d = window.PDDesign && window.PDDesign.current;
    if (d && d.custom && slug && d.custom[slug]) { clearInterval(t); return; }
    if (tries > 24) {
      clearInterval(t);
      if (!main.children.length) {
        main.innerHTML = '<div style="padding:90px 16px;text-align:center"><h1 style="font-size:28px;margin-bottom:12px">পেজটি পাওয়া যায়নি</h1><p style="color:var(--text-muted);margin-bottom:20px">এই ঠিকানায় কোনো পেজ নেই বা এখনো প্রকাশ হয়নি।</p><a href="index.html" style="color:var(--primary);font-weight:600">← হোমে ফিরুন</a></div>';
      }
    }
  }, 250);
})();
