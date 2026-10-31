/* intro-home.js — লোগোর পূর্ণ ইন্ট্রো অ্যানিমেশন (হোম)। body[data-intro="instant"] হলে সরাসরি হেডারে বসে */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlay = document.getElementById('intro-overlay');
  var stage = document.getElementById('logo-stage');
  var mainContent = document.getElementById('main-content');
  var headerSlot = document.getElementById('header-logo-slot');
  var svgEl = stage.querySelector('svg');

  function revealInstant(){
    overlay.style.display = 'none';
    headerSlot.appendChild(svgEl);
    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    // SVG-এর নিজস্ব SMIL এনিমেশন টাইমলাইন সরাসরি শেষ অবস্থায় নিয়ে যাওয়া হচ্ছে (reduced-motion হওয়ায় অপেক্ষা করা হবে না)
    try{
      if(typeof svgEl.pauseAnimations === 'function'){
        svgEl.setCurrentTime(3);
        svgEl.pauseAnimations();
      }
    }catch(e){}
    svgEl.setAttribute('viewBox','35 235 930 510');
    mainContent.classList.add('revealed');
  }

  if(reduceMotion || document.body.getAttribute('data-intro') === 'instant'){
    revealInstant();
    return;
  }

  // SVG-এর নিজস্ব এনিমেশন শেষ হতে সময় লাগে ~1.66s (কলম + শিরোনাম-অলংকরণ + ওয়ার্ডমার্ক + ৫টা ট্যাগলাইন শব্দ)
  var introAnimDuration = 1660;
  var holdAfterIntro = 220;

  window.addEventListener('load', function(){
    setTimeout(startFlip, introAnimDuration + holdAfterIntro);
  });

  function startFlip(){
    // FLIP কৌশল: প্রথমে বর্তমান অবস্থান, তারপর টার্গেট অবস্থান মেপে ট্রানজিশন করা হচ্ছে
    var firstRect = svgEl.getBoundingClientRect();

    // মূল আর্টওয়ার্ক (কলম+ওয়ার্ডমার্ক) অংশটুকু ফোকাস করার জন্য viewBox বদলে দেওয়া হচ্ছে
    svgEl.setAttribute('viewBox','35 235 930 510');

    headerSlot.appendChild(svgEl);
    var lastRect = svgEl.getBoundingClientRect();

    var dx = firstRect.left - lastRect.left + (firstRect.width - lastRect.width)/2;
    var dy = firstRect.top - lastRect.top + (firstRect.height - lastRect.height)/2;
    var scale = firstRect.width / lastRect.width;

    svgEl.style.width = '100%';
    svgEl.style.height = '100%';
    svgEl.style.transformOrigin = 'center center';
    svgEl.style.transform = 'translate('+dx+'px,'+dy+'px) scale('+scale+')';

    overlay.style.transition = 'opacity .5s ease';
    overlay.classList.add('hide');
    overlay.style.opacity = '0';

    mainContent.classList.add('revealed');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        svgEl.style.transition = 'transform .6s cubic-bezier(0.5,0.35,0.15,1)';
        svgEl.style.transform = 'translate(0,0) scale(1)';
      });
    });

    setTimeout(function(){
      overlay.remove();
      svgEl.style.transition = '';
    }, 700);
  }
})();
