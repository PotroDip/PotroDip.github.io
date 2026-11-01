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
  var OUT_MS = 1300;    /* বিদায় ট্রানজিশনের মোট সময় (CSS: pdi-out / pdi-enter) */
  var done = false, started = false, startAt = 0, loaded = false;

  function finish(){
    if(done) return; done = true;
    overlay.classList.add('hide','pdi-out');
    if(mainContent){
      mainContent.classList.add('pdi-enter','revealed');
      setTimeout(function(){ mainContent.classList.remove('pdi-enter'); }, OUT_MS);
    }
    setTimeout(function(){ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, OUT_MS);
  }

  function tryFinish(){
    if(!started || !loaded) return;
    setTimeout(finish, Math.max(0, ANIM_MS - (Date.now() - startAt)));
  }

  /* অ্যানিমেশন শুরু: পেজের ভারী স্ক্রিপ্টগুলো চলা শেষ হওয়ার পর, পরের ফ্রেমে — যাতে শুরুতে আটকে না যায় */
  function start(){
    if(started) return;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(started) return; started = true;
        startAt = Date.now();
        overlay.classList.add('pdi-go');
        tryFinish();
      });
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  if(document.readyState === 'complete'){ loaded = true; }
  else window.addEventListener('load', function(){ loaded = true; tryFinish(); });

  /* নিরাপত্তা: কিছু আটকে গেলেও ইন্ট্রো ৬ সেকেন্ডের বেশি ধরে রাখবে না */
  setTimeout(function(){ overlay.classList.add('pdi-go'); }, 1500);
  setTimeout(finish, 7000);
})();
