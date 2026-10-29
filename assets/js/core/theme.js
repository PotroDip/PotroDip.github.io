/* theme.js — লাইট/ডার্ক থিম মনে রাখা ও বদলানো (সব পেজ, <head>-এ লোড হয়) */
(function(){
  var root = document.documentElement;
  var STORAGE_KEY = 'potrodip-theme';

  function getInitialTheme(){
    var saved = null;
    try{ saved = localStorage.getItem(STORAGE_KEY); }catch(e){}
    if(saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
  }

  var currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('theme-toggle');
    if(btn){
      btn.addEventListener('click', function(){
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        try{ localStorage.setItem(STORAGE_KEY, currentTheme); }catch(e){}
      });
    }
    // থিম বদলানোর সময় স্মুথ ট্রানজিশনের জন্য, শুরুর রেন্ডারের পর ক্লাস যোগ করা হচ্ছে
    setTimeout(function(){ document.body.classList.add('theme-ready'); }, 60);
  });
})();
