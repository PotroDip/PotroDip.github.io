/* intro-quick.js — ছোট ইন্ট্রো অ্যানিমেশন (auth পেজ) */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlay = document.getElementById('intro-overlay');
  var stage = document.getElementById('logo-stage');
  var mainContent = document.getElementById('main-content');
  var headerSlot = document.getElementById('header-logo-slot');
  /* লগইন/সাইনআপ মোডে হেডার লুকানো — লোগো কার্ডের ভেতরের জায়গায় বসে */
  var cardSlot = document.getElementById('auth-logo-slot');
  /* লোগো কোথায় বসবে তা বসানোর মুহূর্তেই ঠিক হয় (লগইন ডেটা আগে এসে গেলে লোগো যেন লুকানো কার্ডে আটকে না যায়) */
  function pickSlot(){
    return (cardSlot && document.body.classList.contains('auth-mode')) ? cardSlot : document.getElementById('header-logo-slot');
  }
  headerSlot = pickSlot();
  var svgEl = stage.querySelector('svg');

  function revealInstant(){
    overlay.style.display = 'none';
    headerSlot = pickSlot();
    headerSlot.appendChild(svgEl);
    svgEl.setAttribute('viewBox','35 235 930 510');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    try{
      if(typeof svgEl.pauseAnimations === 'function'){
        svgEl.setCurrentTime(1);
        svgEl.pauseAnimations();
      }
    }catch(e){}
    mainContent.classList.add('revealed');
  }

  if(reduceMotion){
    revealInstant();
    return;
  }

  var introAnimDuration = 620;
  var holdAfterIntro = 90;

  window.addEventListener('load', function(){
    setTimeout(startFlip, introAnimDuration + holdAfterIntro);
  });

  function startFlip(){
    /* ট্যাগলাইনসহ পুরো লোগো যেন হেডারে বসার আগেই সম্পূর্ণ দেখায় */
    try{ if(typeof svgEl.setCurrentTime === 'function') svgEl.setCurrentTime(3); }catch(e){}
    var firstRect = svgEl.getBoundingClientRect();

    headerSlot = pickSlot();
    headerSlot.appendChild(svgEl);
    svgEl.setAttribute('viewBox','35 235 930 510');
    var lastRect = svgEl.getBoundingClientRect();

    var dx = firstRect.left - lastRect.left + (firstRect.width - lastRect.width)/2;
    var dy = firstRect.top - lastRect.top + (firstRect.height - lastRect.height)/2;
    var scale = firstRect.width / lastRect.width;

    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.transformOrigin = 'center center';
    svgEl.style.transform = 'translate('+dx+'px,'+dy+'px) scale('+scale+')';

    overlay.style.transition = 'opacity .3s ease';
    overlay.classList.add('hide');
    overlay.style.opacity = '0';

    mainContent.classList.add('revealed');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        svgEl.style.transition = 'transform .4s cubic-bezier(0.5,0.35,0.15,1)';
        svgEl.style.transform = 'translate(0,0) scale(1)';
      });
    });

    setTimeout(function(){
      overlay.remove();
      svgEl.style.transition = '';
    }, 480);
  }
})();
