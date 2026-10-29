/* config.js — সাইটের সেটিংস এক জায়গায়। (anon কী ও Turnstile সাইট কী জনসমক্ষে থাকার জন্যই বানানো; service_role কী কখনো এখানে রাখবেন না) */
window.PD_CONFIG = {
  supabaseUrl: 'https://pqoszcuhxdavehnxundq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3N6Y3VoeGRhdmVobnh1bmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODIzMDUsImV4cCI6MjEwNjE1ODMwNX0.UqZYaUMsH29NmMTZpFHDmoX9qyTG-U7APOWsalQS2JQ',
  turnstileSiteKey: '0x4AAAAAAFnlme_tpslbtttw',
  pages: {
    home: 'index.html',
    auth: 'auth.html',
    admin: 'admin.html'
  }
};
