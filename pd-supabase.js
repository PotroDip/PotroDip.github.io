/* পত্রদ্বীপ — Supabase সংযোগ। প্রতিটা পেজে supabase-js CDN-এর পরে এটা যোগ হবে। */
(function(){
var URL='https://pqoszcuhxdavehnxundq.supabase.co',KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3N6Y3VoeGRhdmVobnh1bmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODIzMDUsImV4cCI6MjEwNjE1ODMwNX0.UqZYaUMsH29NmMTZpFHDmoX9qyTG-U7APOWsalQS2JQ';
var TSK='0x4AAAAAAFnlme_tpslbtttw',TK={},TW={};
var PD=window.PD={pages:{home:'auth.html',admin:'auth.html',auth:'auth.html'},db:null,user:null,profile:null};
function toast(m,bad){var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:99px;z-index:9999;font:600 15px "Noto Serif Bengali",serif;color:#fff;background:'+(bad?'#B3402E':'#1D5358');document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}PD.toast=toast;
var ERR={'Invalid login credentials':'ইমেইল বা পাসওয়ার্ড ভুল','User already registered':'এই ইমেইলে আগেই অ্যাকাউন্ট আছে','Email not confirmed':'আগে ইমেইল ভেরিফাই করুন'};
var msg=function(e){var m=e.message||'';if(ERR[m])return ERR[m];if(/rate limit/i.test(m))return 'অল্প সময়ে অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন';if(/captcha/i.test(m))return 'নিরাপত্তা যাচাই ব্যর্থ — পেজ রিফ্রেশ করে আবার চেষ্টা করুন';if(/password/i.test(m)&&/6|8|short|least/i.test(m))return 'পাসওয়ার্ড আরও বড় ও শক্ত দিন';return 'সমস্যা: '+m};
PD.fixLinks=function(){var M=[[/^হোম$/,'index.html'],[/^আর্কাইভ$/,'archive.html'],[/^লেখক( তালিকা)?$/,'author.html'],[/^সংখ্যা কিনুন$/,'store.html'],[/^(লগইন|সাইনআপ|আমার প্রোফাইল)$/,'auth.html']];
[].forEach.call(document.querySelectorAll('a[href="#"],a:not([href])'),function(a){var t=a.textContent.replace(/\s+/g,' ').trim();if(a.classList.contains('brand')){a.href='index.html';return}for(var i=0;i<M.length;i++)if(M[i][0].test(t)){a.href=M[i][1];return}});
[].forEach.call(document.querySelectorAll('button[aria-label="প্রোফাইল"]'),function(b){b.onclick=function(){location.href='auth.html'}});
if(window.PD&&PD.db)PD.db.from('site_settings').select('key,value').eq('key','contact').then(function(r){var c=r.data&&r.data[0]&&r.data[0].value;if(!c)return;[].forEach.call(document.querySelectorAll('footer a'),function(a){var t=a.textContent.trim();if(t=='ফেসবুক'&&c.facebook)a.href=c.facebook;if(t=='ইনস্টাগ্রাম'&&c.instagram)a.href=c.instagram;if(t=='ইমেইল করুন'&&c.email)a.href='mailto:'+c.email;[].forEach.call(['ফেসবুক','ইনস্টাগ্রাম'],function(){});if(a.getAttribute('href')=='#'&&/ফেসবুক|ইনস্টাগ্রাম|ইমেইল/.test(t))a.style.display='none'})})};
if(!window.supabase){document.addEventListener('DOMContentLoaded',PD.fixLinks);console.warn('supabase-js লোড হয়নি');return}
var db=PD.db=window.supabase.createClient(URL,KEY);
PD.load=function(){return db.auth.getSession().then(function(r){PD.user=r.data.session?r.data.session.user:null;if(!PD.user)return null;return db.from('profiles').select('*').eq('id',PD.user.id).single().then(function(p){PD.profile=p.data;return PD.profile})})};
PD.isAdmin=function(){return !!(PD.profile&&PD.profile.role==='admin')};
PD.signOut=function(){return db.auth.signOut().then(function(){location.href=PD.pages.auth})};
PD.subscribe=function(email,uid){return db.from('newsletter_subscribers').insert({email:email,user_id:uid||null})};
function $(i){return document.getElementById(i)}function on(i,f){var e=$(i);if(e)e.addEventListener('click',function(ev){ev.preventDefault();f(e)})}
function go(){if(window.pdShowDashboard)pdShowDashboard();else location.href=PD.isAdmin()?PD.pages.admin:PD.pages.home}
function tok(i){return TK[i]||''}function rs(i){TK[i]='';try{if(window.turnstile&&TW[i]!=null)turnstile.reset(TW[i])}catch(e){}}
function initTS(n){n=n||0;var ids=['ts-login','ts-signup'].filter(function(i){return $(i)});if(!ids.length)return;if(!window.turnstile){if(n<50)setTimeout(function(){initTS(n+1)},200);return}
ids.forEach(function(i){TW[i]=turnstile.render('#'+i,{sitekey:TSK,appearance:'interaction-only',theme:'auto',callback:function(t){TK[i]=t},'expired-callback':function(){TK[i]=''},'error-callback':function(){TK[i]=''}})})}
var WAIT='আগে "Verify you are human" বক্সে টিক দিন (বা ২-৩ সেকেন্ড অপেক্ষা করুন), তারপর আবার চাপুন';
function wire(){initTS();
on('btn-login-submit',function(b){var e=$('li-email').value.trim(),p=$('li-pass').value;if(!e||!p)return toast('ইমেইল ও পাসওয়ার্ড দিন',1);var ct=tok('ts-login');if(!ct)return toast(WAIT,1);b.disabled=1;db.auth.signInWithPassword({email:e,password:p,options:{captchaToken:ct}}).then(function(r){b.disabled=0;rs('ts-login');if(r.error)return toast(msg(r.error),1);PD.load().then(function(){toast('স্বাগতম!');setTimeout(go,700)})})});
on('btn-signup-submit',function(b){var n=$('su-name').value.trim(),e=$('su-email').value.trim(),p=$('su-pass').value;if(!n||!e||p.length<6)return toast('নাম, ইমেইল ও ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড দিন',1);var nl=$('newsletter-switch');nl=!nl||nl.checked;var ct=tok('ts-signup');if(!ct)return toast(WAIT,1);b.disabled=1;
db.auth.signUp({email:e,password:p,options:{captchaToken:ct,data:{full_name:n},emailRedirectTo:location.origin+'/'+PD.pages.auth}}).then(function(r){b.disabled=0;rs('ts-signup');if(r.error)return toast(msg(r.error),1);var u=r.data.user;
if(r.data.session){db.from('profiles').update({newsletter_subscribed:nl}).eq('id',u.id).then(function(){});if(nl)PD.subscribe(e,u.id);toast('অ্যাকাউন্ট তৈরি হয়েছে!');setTimeout(go,900)}
else{if(nl)PD.subscribe(e,null);toast('আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে — লিংকে ক্লিক করে লগইন করুন')}})});
['btn-facebook-login','btn-facebook-signup'].forEach(function(i){on(i,function(){db.auth.signInWithOAuth({provider:'facebook',options:{redirectTo:location.href.split('#')[0]}}).then(function(r){if(r.error)toast(msg(r.error),1)})})});
on('demo-logout-btn',function(){PD.signOut()});
var th=$('theme-toggle');if(th)th.addEventListener('click',function(){setTimeout(function(){if(PD.user)db.from('profiles').update({theme_preference:document.documentElement.getAttribute('data-theme')}).eq('id',PD.user.id).then(function(){})},400)});
}
PD.load().then(function(){
 if(PD.profile&&PD.profile.theme_preference&&!localStorage.getItem('potrodip-theme')){localStorage.setItem('potrodip-theme',PD.profile.theme_preference);document.documentElement.setAttribute('data-theme',PD.profile.theme_preference)}
 if(/admin/.test(location.pathname)&&!PD.isAdmin()){location.replace(PD.pages.auth);return}
 if(PD.user&&window.pdShowDashboard)pdShowDashboard();
});
if(document.readyState!=='loading'){wire();PD.fixLinks()}else document.addEventListener('DOMContentLoaded',function(){wire();PD.fixLinks()});
})();
