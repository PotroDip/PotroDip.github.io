/* firebase.js — Firebase সংযোগ (ইমেইল/গুগল লগইন ও ছবি আপলোড)। app.js-এর পরে লোড হয়।
   config.js-এ firebaseAuth: false থাকলে বা apiKey/appId না থাকলে কিছুই চালু হয় না — সাইট তখন আগের মতো শুধু Supabase দিয়ে চলে। */
(function() {
  'use strict';
  var PD = window.PD;
  if (!PD || !PD.db) return;
  var F = PD.config.firebase || {};
  PD.fbOn = false;
  if (!PD.config.firebaseAuth || !F.apiKey || !F.appId || !window.firebase || !firebase.initializeApp) return;

  var app;
  try {
    app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(F);
  } catch (e) {
    console.warn('Firebase চালু হয়নি', e);
    return;
  }
  var auth = app.auth();
  auth.languageCode = 'bn';
  var storage = PD.config.firebaseStorage && app.storage ? app.storage() : null;

  /* Firebase নিজের লগইন-অবস্থা IndexedDB থেকে ফিরিয়ে আনা পর্যন্ত অপেক্ষা */
  var ready = new Promise(function(res) {
    var off = auth.onAuthStateChanged(function(u) {
      off();
      res(u)
    })
  });

  PD.fbOn = true;
  PD.fb = { app: app, auth: auth, storage: storage, ready: ready };

  /* Firebase ইউজার আর Supabase ইউজার একই মানুষ কিনা (একই ইমেইল) */
  function sameUser() {
    var u = auth.currentUser;
    return !!(u && PD.user && u.email && PD.user.email && u.email.toLowerCase() === PD.user.email.toLowerCase());
  }

  /* Firebase Storage-এ আপলোড — app.js-এর PD.upload এটা আগে চেষ্টা করে।
     আপলোড হয়ে গেলে কিন্তু লিংক না পেলে ফাইলটা মুছে ফেলে, যাতে Supabase-এ আবার গেলে দুই জায়গায় না থাকে। */
  if (storage) {
    PD.fbUpload = function(blob, path, type) {
      return ready.then(function() {
        if (!sameUser()) throw new Error('firebase-no-user');
        var ref = storage.ref('media/' + auth.currentUser.uid + '/' + path);
        return ref.put(blob, { contentType: type, cacheControl: 'public,max-age=31536000' }).then(function() {
          return ref.getDownloadURL().catch(function(err) {
            return ref.delete().catch(function() {}).then(function() { throw err });
          })
        })
      })
    };
  }

  /* Firebase Storage-এ রাখা নিজের ছবি মোছা (শুধু media/<নিজের uid>/avatars/...) */
  if (storage) {
    PD.fbRemove = function(url) {
      var u = auth.currentUser;
      if (!u || String(url || '').indexOf('firebasestorage.googleapis.com') < 0) return Promise.resolve();
      var name = '';
      try { name = decodeURIComponent((String(url).match(/\/o\/([^?]+)/) || [])[1] || '') } catch (e) {}
      if (name.indexOf('media/' + u.uid + '/avatars/') !== 0) return Promise.resolve();
      return storage.ref(name).delete().then(function() {}, function() {})
    };
  }

  /* লগ-আউট হলে Firebase থেকেও বের হওয়া */
  var so = PD.signOut;
  PD.signOut = function() {
    return auth.signOut().catch(function() {}).then(so)
  };
})();
