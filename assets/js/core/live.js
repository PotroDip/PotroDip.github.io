/* live.js — রিয়ালটাইম আপডেট (v46)
   PD.live({ tables: ['comments', ...], onChange: fn(payload|null), poll: 30000 }) → { stop() }
   • Supabase Realtime চালু থাকলে ডেটাবেসে বদল হওয়ামাত্র onChange(payload) ডাকে
   • Realtime সংযুক্ত না হলে (বা SQL চালানো না হলে) বাধ্যতামূলক ফলব্যাক: প্রতি poll ms-এ ও ট্যাবে ফিরলে onChange(null)
   • একসাথে অনেক ইভেন্ট এলে ৫০০ ms-এ জড়ো করে একবারই কাজ করায় (শুধু প্রথমটার payload যায় 'events' তালিকায়) */
(function () {
  'use strict';
  var PD = window.PD;
  if (!PD || !PD.db || !PD.db.channel) return;
  var seq = 0;
  PD.live = function (opt) {
    var db = PD.db, name = 'pd-live-' + (++seq), connected = false, timer = null, poller = null, n = 0, queue = [], stopped = false;
    function flush() {
      timer = null;
      if (stopped) return;
      var q = queue; queue = [];
      try { opt.onChange(q.length ? q : null); } catch (e) { if (window.console) console.warn('[live]', e); }
    }
    function kick(p) { if (p) queue.push(p); if (!timer) timer = setTimeout(flush, 500); }
    var ch = db.channel(name);
    (opt.tables || []).forEach(function (t) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, function (p) { kick(p); });
    });
    ch.subscribe(function (st) { connected = st === 'SUBSCRIBED'; });
    /* ফলব্যাক পোলিং: Realtime না থাকলে পুরো gap ঢাকে; থাকলেও ধীরে (৪x) একটা সেফটি-নেট */
    var every = opt.poll || 30000;
    poller = setInterval(function () { if (document.hidden) return; if (!connected || ++n % 4 === 0) kick(null); }, every);
    function vis() { if (!document.hidden) kick(null); }
    document.addEventListener('visibilitychange', vis);
    return { stop: function () { stopped = true; clearInterval(poller); document.removeEventListener('visibilitychange', vis); try { db.removeChannel(ch); } catch (e) {} } };
  };
})();
