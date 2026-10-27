/* পত্রদ্বীপ — Supabase সংযোগ। প্রতিটা পেজে supabase-js CDN-এর পরে এটা যোগ হবে। */
(function(){
var URL='https://pqoszcuhxdavehnxundq.supabase.co',KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3N6Y3VoeGRhdmVobnh1bmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODIzMDUsImV4cCI6MjEwNjE1ODMwNX0.UqZYaUMsH29NmMTZpFHDmoX9qyTG-U7APOWsalQS2JQ';
var PD=window.PD={pages:{home:'auth.html',admin:'auth.html',auth:'auth.html'},db:null,user:null,profile:null};
function toast(m,bad){var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:99px;z-index:9999;font:600 15px "Noto Serif Bengali",serif;color:#fff;background:'+(bad?'#B3402E':'#1D5358');document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}PD.toast=toast;
var ERR={'Invalid login credentials':'ইমেইল বা পাসওয়ার্ড ভুল','User already registered':'এই ইমেইলে আগেই অ্যাকাউন্ট আছে','Email not confirmed':'আগে ইমেইল ভেরিফাই করুন'};
var msg=function(e){return ERR[e.message]||('সমস্যা: '+e.message)};
if(!window.supabase){console.warn('supabase-js লোড হয়নি');return}
var db=PD.db=window.supabase.createClient(URL,KEY);
PD.load=function(){return db.auth.getSession().then(function(r){PD.user=r.data.session?r.data.session.user:null;if(!PD.user)return null;return db.from('profiles').select('*').eq('id',PD.user.id).single().then(function(p){PD.profile=p.data;return PD.profile})})};
PD.isAdmin=function(){return !!(PD.profile&&PD.profile.role==='admin')};
PD.signOut=function(){return db.auth.signOut().then(function(){location.href=PD.pages.auth})};
PD.subscribe=function(email,uid){return db.from('newsletter_subscribers').insert({email:email,user_id:uid||null})};
function $(i){return document.getElementById(i)}function on(i,f){var e=$(i);if(e)e.addEventListener('click',function(ev){ev.preventDefault();f(e)})}
function go(){if(window.pdShowDashboard)pdShowDashboard();else location.href=PD.isAdmin()?PD.pages.admin:PD.pages.home}
function wire(){
on('btn-login-submit',function(b){var e=$('li-email').value.trim(),p=$('li-pass').value;if(!e||!p)return toast('ইমেইল ও পাসওয়ার্ড দিন',1);b.disabled=1;db.auth.signInWithPassword({email:e,password:p}).then(function(r){b.disabled=0;if(r.error)return toast(msg(r.error),1);PD.load().then(function(){toast('স্বাগতম!');setTimeout(go,700)})})});
on('btn-signup-submit',function(b){var n=$('su-name').value.trim(),e=$('su-email').value.trim(),p=$('su-pass').value;if(!n||!e||p.length<6)return toast('নাম, ইমেইল ও ন্যূনতম ৬ অক্ষরের পাসওয়ার্ড দিন',1);var nl=$('newsletter-switch');nl=!nl||nl.checked;b.disabled=1;
db.auth.signUp({email:e,password:p,options:{data:{full_name:n},emailRedirectTo:location.origin+'/'+PD.pages.auth}}).then(function(r){b.disabled=0;if(r.error)return toast(msg(r.error),1);var u=r.data.user;
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
if(document.readyState!=='loading')wire();else document.addEventListener('DOMContentLoaded',wire);
})();
