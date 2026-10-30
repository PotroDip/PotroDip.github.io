/* intro-quick.js — ছোট ইন্ট্রো অ্যানিমেশন (auth পেজ) */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlay = document.getElementById('intro-overlay');
  var stage = document.getElementById('logo-stage');
  var mainContent = document.getElementById('main-content');
  var headerSlot = document.getElementById('header-logo-slot');
  /* লগইন/সাইনআপ মোডে হেডার লুকানো — লোগো কার্ডের ভেতরের জায়গায় বসে */
  var cardSlot = document.getElementById('auth-logo-slot');
  if(cardSlot && document.body.classList.contains('auth-mode')) headerSlot = cardSlot;
  var svgEl = stage.querySelector('svg');

  function revealInstant(){
    overlay.style.display = 'none';
    headerSlot.appendChild(svgEl);
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
    var firstRect = svgEl.getBoundingClientRect();

    headerSlot.appendChild(svgEl);
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
