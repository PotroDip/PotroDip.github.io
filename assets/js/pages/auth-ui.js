/* auth-ui.js — লগইন/সাইনআপ পেজের ইন্টারফেস: ট্যাব, ড্যাশবোর্ড, পপআপ */
/* ============ লগইন/সাইনআপ ট্যাব সুইচিং ============ */
(function(){
  var tabBtns = document.querySelectorAll('.auth-tabs button');
  var panels = { login: document.getElementById('panel-login'), signup: document.getElementById('panel-signup') };

  function activateTab(name){
    tabBtns.forEach(function(b){ b.classList.toggle('active', b.dataset.tab === name); });
    Object.keys(panels).forEach(function(k){ panels[k].classList.toggle('active', k === name); });
  }

  tabBtns.forEach(function(b){
    b.addEventListener('click', function(){ activateTab(this.dataset.tab); });
  });

  document.querySelectorAll('[data-switch]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      activateTab(this.dataset.switch);
    });
  });
})();
;
/* ============ ডেমো: লগইন/লগআউট → অথ সেকশন বনাম ড্যাশবোর্ড সেকশন টগল ============ */
(function(){
  var authSection = document.getElementById('auth-section');
  var dashSection = document.getElementById('dashboard-section');
  var breadcrumb = document.getElementById('breadcrumb-el');
  var demoLoginBtn = document.getElementById('demo-login-btn');
  var demoLogoutBtn = document.getElementById('demo-logout-btn');
  var profileIconBtn = document.getElementById('profile-icon-btn');

  function showDashboard(){
    authSection.style.display = 'none';
    dashSection.style.display = 'block';
    breadcrumb.querySelector('.current').textContent = 'আমার ড্যাশবোর্ড';
    window.scrollTo({top:0, behavior:'smooth'});
    setTimeout(maybeShowNotifPopup, 500);
  }
  function showAuth(){
    dashSection.style.display = 'none';
    authSection.style.display = 'flex';
    breadcrumb.querySelector('.current').textContent = 'লগইন / সাইনআপ';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  
  
  
  
  
  demoLogoutBtn.addEventListener('click', function(){
    showConfirm('লগ-আউট করবেন?', 'আপনি কি সত্যিই এই একাউন্ট থেকে লগ-আউট করতে চান?', function(){ if(window.PD) PD.signOut(); else showAuth(); });
  });
  window.pdShowDashboard = showDashboard; window.pdShowAuth = showAuth;
  if(profileIconBtn) profileIconBtn.addEventListener('click', function(e){
    /* লগইন থাকলে একই পেজে ড্যাশবোর্ড খোলা; না থাকলে লগইন ফর্মই থাকে */
    if(window.PD && PD.user){ e.preventDefault(); showDashboard(); }
    else e.preventDefault();
  });
})();
;
/* ============ ড্যাশবোর্ড ট্যাব সুইচিং ============ */
(function(){
  var tabBtns = document.querySelectorAll('.dash-tab-btn');
  var panelMap = {
    following: document.getElementById('dpanel-following'),
    saved: document.getElementById('dpanel-saved'),
    notifications: document.getElementById('dpanel-notifications'),
    orders: document.getElementById('dpanel-orders'),
    settings: document.getElementById('dpanel-settings')
  };

  tabBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var name = this.dataset.dtab;
      tabBtns.forEach(function(b){ b.classList.toggle('active', b === btn); });
      Object.keys(panelMap).forEach(function(k){ panelMap[k].classList.toggle('active', k === name); });
    });
  });
})();
;
/* ============ সাধারণ কনফার্মেশন পপআপ ফাংশন — যেকোনো ঝুঁকিপূর্ণ কাজের আগে ব্যবহার হবে ============ */
(function(){
  var overlay = document.getElementById('confirm-overlay');
  var titleEl = document.getElementById('confirm-title');
  var descEl = document.getElementById('confirm-desc');
  var yesBtn = document.getElementById('confirm-yes');
  var noBtn = document.getElementById('confirm-no');
  var pendingAction = null;

  window.showConfirm = function(title, desc, onConfirm){
    titleEl.textContent = title;
    descEl.textContent = desc;
    pendingAction = onConfirm;
    overlay.classList.add('show');
  };

  function closeConfirm(){
    overlay.classList.remove('show');
    pendingAction = null;
  }

  yesBtn.addEventListener('click', function(){
    var action = pendingAction;
    closeConfirm();
    if(typeof action === 'function') action();
  });
  noBtn.addEventListener('click', closeConfirm);
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closeConfirm();
  });
})();
;
/* ============ পাসওয়ার্ড শো/হাইড টগল ============ */
(function(){
  document.querySelectorAll('.pw-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var input = document.getElementById(this.dataset.target);
      if(!input) return;
      var showing = this.classList.toggle('showing');
      input.type = showing ? 'text' : 'password';
      this.setAttribute('aria-label', showing ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান');
    });
  });
})();
;
/* ============ নোটিফিকেশন অনুমতি পপআপ ============ */
(function(){
  var overlay = document.getElementById('notif-permission-overlay');
  var allowBtn = document.getElementById('npo-allow');
  var skipBtn = document.getElementById('npo-skip');

  window.maybeShowNotifPopup = function(){
    var alreadyShown = false;
    try{ alreadyShown = sessionStorage.getItem('potrodip-notif-popup-shown') === '1'; }catch(e){}
    if(alreadyShown) return;
    overlay.classList.add('show');
  };

  function closePopup(){
    overlay.classList.remove('show');
    try{ sessionStorage.setItem('potrodip-notif-popup-shown', '1'); }catch(e){}
  }

  allowBtn.addEventListener('click', function(){
    try{
      if('Notification' in window && Notification.requestPermission){
        Notification.requestPermission();
      }
    }catch(e){}
    closePopup();
  });
  skipBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', function(e){
    if(e.target === overlay) closePopup();
  });
})();
