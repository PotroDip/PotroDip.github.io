/* intro-home.js — হোমের লোগো ইন্ট্রো (v79: নতুন ফুল-স্ক্রীন অ্যানিমেশন)
   • অ্যানিমেশন নিজে CSS-এ (components/intro-logo.css) — মোট ~২.৬ সেকেন্ড, টাইমিং আপনার ফাইলের হুবহু
   • শেষ হলে ওভারলে ফেড-আউট হয়ে মূল পেজ ফুটে ওঠে
   • সেশনে একবারই চলে (site-design.js ঠিক করে), reduced-motion / স্টুডিও-তে সরাসরি পেজ */
(function(){
  var overlay = document.getElementById('intro-overlay');
  var mainContent = document.getElementById('main-content');
  var headerSvg = document.querySelector('#header-logo-slot svg');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = Date.now();

  /* হেডারের স্থির লোগো: তার নিজস্ব SMIL এনিমেশন সরাসরি শেষ অবস্থায় রাখা হচ্ছে */
  function settleHeaderLogo(){
    try{
      if(headerSvg && typeof headerSvg.pauseAnimations === 'function'){
        headerSvg.setCurrentTime(3);
        headerSvg.pauseAnimations();
      }
    }catch(e){}
  }
  settleHeaderLogo();

  function revealInstant(){
    if(overlay) overlay.style.display = 'none';
    if(mainContent) mainContent.classList.add('revealed');
  }

  if(!overlay || reduceMotion || document.documentElement.classList.contains('pd-intro-done') || document.body.getAttribute('data-intro') === 'instant'){
    revealInstant();
    return;
  }

  var ANIM_MS = 2700;   /* অ্যানিমেশন ২.৬s + সামান্য থামা */
  var OUT_MS = 1300;   /* বিদায় ট্রানজিশনের মোট সময় (CSS: pdi-out / pdi-enter) */
  var done = false;

  function finish(){
    if(done) return; done = true;
    overlay.classList.add('hide','pdi-out');
    if(mainContent){
      mainContent.classList.add('pdi-enter','revealed');
      setTimeout(function(){ mainContent.classList.remove('pdi-enter'); }, OUT_MS);
    }
    setTimeout(function(){ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, OUT_MS);
  }

  function schedule(){
    var wait = Math.max(0, ANIM_MS - (Date.now() - t0));
    setTimeout(finish, wait);
  }

  if(document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);

  /* নিরাপত্তা: লোড ধীর হলেও ইন্ট্রো ৬ সেকেন্ডের বেশি আটকে রাখবে না */
  setTimeout(finish, 6000);
})();
