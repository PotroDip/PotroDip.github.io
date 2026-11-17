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
    svgEl.setAttribute('viewBox','24 156 464 264');
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    try{
      if(typeof svgEl.pauseAnimations === 'function'){
        svgEl.setCurrentTime(3);
        svgEl.pauseAnimations();
      }
    }catch(e){}
    mainContent.classList.add('revealed');
  }

  if(reduceMotion || document.documentElement.classList.contains('pd-intro-done')){
    revealInstant();
    return;
  }

  var introAnimDuration = 620;
  var holdAfterIntro = 90;

  /* v120 (গতি): আগে window 'load'-এর জন্য অপেক্ষা হতো — সেটা আসে Turnstile, Firebase, ছবি সব নামার পর
     (লগইন পেজে ~৫ সেকেন্ড), ততক্ষণ পুরো পেজ লুকানো থাকত। এখন শুধু HTML পার্স + ফন্ট তৈরি হলেই
     (সর্বোচ্চ ৩৫০ms অপেক্ষা) লোগো হেডারে বসে পেজ দেখা যায়; লোগোর ছোট এনিমেশনটা শুধু পুরো চলার সময় পায়। */
  var flipped = false;
  function go(){
    if(flipped) return; flipped = true;
    var since = (window.performance && performance.now) ? performance.now() : 0;
    setTimeout(startFlip, Math.max(0, introAnimDuration + holdAfterIntro - since));
  }
  function whenReady(){
    var t = setTimeout(go, 350);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ clearTimeout(t); go(); }, go);
    else { clearTimeout(t); go(); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenReady);
  else whenReady();
  /* নিরাপত্তা: যা-ই হোক, ২.৫ সেকেন্ডের মধ্যে পেজ দেখাবেই */
  setTimeout(go, 2500);

  function startFlip(){
    /* ট্যাগলাইনসহ পুরো লোগো যেন হেডারে বসার আগেই সম্পূর্ণ দেখায় */
    try{ if(typeof svgEl.setCurrentTime === 'function') svgEl.setCurrentTime(3); }catch(e){}
    var firstRect = svgEl.getBoundingClientRect();

    headerSlot = pickSlot();
    headerSlot.appendChild(svgEl);
    svgEl.setAttribute('viewBox','24 156 464 264');
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
