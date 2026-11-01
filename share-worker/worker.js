/**
 * পত্রদ্বীপ — শেয়ার-প্রিভিউ ওয়ার্কার (Cloudflare Worker)
 *
 * সমস্যা: লেখার পেজ (article.html) ব্রাউজারে JS দিয়ে ডেটা আনে। ফেসবুক/হোয়াটসঅ্যাপ/টেলিগ্রাম/X-এর ক্রলার JS চালায় না,
 * তাই তারা শুধু article.html-এর স্থির ট্যাগ (সাইটের নাম ও লোগো) দেখত।
 *
 * সমাধান: শেয়ারের লিংক হবে  https://<ওয়ার্কার>/a/<লেখার-id>
 *   • ক্রলার এলে → ওই লেখার টাইটেল, সারাংশ ও কভার-ছবিসহ og:/twitter: ট্যাগ পায়।
 *   • পাঠক এলে  → সঙ্গে সঙ্গে আসল পেজে (potrodip.github.io/article.html?id=…) চলে যায়।
 * লেখকের প্রোফাইলের জন্য:  /w/<slug>
 *
 * শুধু পাবলিক (anon) কী ব্যবহার হয় — service_role কী এখানে কখনো নয়।
 */

const DEFAULTS = {
  SUPABASE_URL: 'https://pqoszcuhxdavehnxundq.supabase.co',
  // config.js-এর anonKey-ই (এটা জনসমক্ষে থাকার জন্যই বানানো)
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxb3N6Y3VoeGRhdmVobnh1bmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1ODIzMDUsImV4cCI6MjEwNjE1ODMwNX0.UqZYaUMsH29NmMTZpFHDmoX9qyTG-U7APOWsalQS2JQ',
  SITE_ORIGIN: 'https://potrodip.github.io',
  SITE_NAME: 'পত্রদ্বীপ',
  FALLBACK_IMAGE: '/assets/img/brand/og-logo.png',
};

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SLUG_RE = /^[^\s\/?#\\]{1,120}$/u;

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  const a = Array.from(t);
  return a.length > n ? a.slice(0, n - 1).join('').trim() + '…' : t;
};

function cfg(env) {
  const e = env || {};
  const c = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (e[k]) c[k] = String(e[k]);
  c.SITE_ORIGIN = c.SITE_ORIGIN.replace(/\/+$/, '');
  c.SUPABASE_URL = c.SUPABASE_URL.replace(/\/+$/, '');
  return c;
}

/** ছবির ঠিকানা: পুরো https হলে সেটাই; "/…" বা "assets/…" হলে সাইটের ঠিকানার সঙ্গে জুড়ে; না থাকলে লোগো */
function absImage(u, c) {
  const v = String(u || '').trim();
  if (/^https:\/\//i.test(v)) return { url: v, custom: true };
  if (/^http:\/\//i.test(v)) return { url: 'https://' + v.slice(7), custom: true };
  if (v && !/^(data:|blob:|javascript:)/i.test(v)) {
    return { url: c.SITE_ORIGIN + '/' + v.replace(/^\/+/, ''), custom: true };
  }
  return { url: c.SITE_ORIGIN + c.FALLBACK_IMAGE, custom: false };
}

async function sb(c, path) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4500);
  try {
    const r = await fetch(c.SUPABASE_URL + '/rest/v1/' + path, {
      headers: { apikey: c.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + c.SUPABASE_ANON_KEY, Accept: 'application/json' },
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error('db ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function page(c, o) {
  const img = absImage(o.image, c);
  const card = img.custom ? 'summary_large_image' : 'summary';
  const title = clip(o.title, 120);
  const desc = clip(o.description, 200);
  const extra = (o.extra || []).map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`).join('\n');
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${esc(c.SITE_NAME)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta property="og:site_name" content="${esc(c.SITE_NAME)}">
<meta property="og:locale" content="bn_BD">
<meta property="og:type" content="${esc(o.type || 'article')}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(o.selfUrl)}">
<meta property="og:image" content="${esc(img.url)}">
<meta property="og:image:secure_url" content="${esc(img.url)}">
<meta property="og:image:alt" content="${esc(title)}">
${extra}
<meta name="twitter:card" content="${card}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img.url)}">
<meta http-equiv="refresh" content="0;url=${esc(o.target)}">
<script>location.replace(${JSON.stringify(o.target).replace(/</g, '\\u003c')});</script>
<style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#faf7f2;color:#1f5459}a{color:#1f5459}</style>
</head>
<body><p>খুলছে… <a href="${esc(o.target)}">খুলছে না? এখানে চাপুন</a></p></body>
</html>`;
}

function html(body, maxAge) {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=' + maxAge,
      'x-content-type-options': 'nosniff',
    },
  });
}

const go = (url) => new Response(null, { status: 302, headers: { location: url, 'cache-control': 'public, max-age=60' } });

async function article(c, id, selfUrl) {
  const target = c.SITE_ORIGIN + '/article.html?id=' + encodeURIComponent(id);
  if (!ID_RE.test(id)) return go(c.SITE_ORIGIN + '/');
  let rows;
  try {
    rows = await sb(c, 'articles?select=id,title,excerpt,cover_url,category,author_id,published_at,created_at&status=eq.published&id=eq.' + encodeURIComponent(id) + '&limit=1');
  } catch (e) {
    return go(target); // ডেটাবেস ধীর/বন্ধ: পাঠককে আসল পেজেই পাঠাই, কিছু ক্যাশ হবে না
  }
  const a = rows && rows[0];
  if (!a) return go(target);

  let author = '';
  if (a.author_id) {
    try {
      const au = await sb(c, 'authors?select=name&id=eq.' + encodeURIComponent(a.author_id) + '&limit=1');
      author = (au && au[0] && au[0].name) || '';
    } catch (e) {}
  }
  const extra = [];
  const when = a.published_at || a.created_at;
  if (when) extra.push(['article:published_time', when]);
  if (a.category) extra.push(['article:section', a.category]);
  if (author) extra.push(['article:author', author]);

  const fallbackDesc = (author ? author + '-এর লেখা। ' : '') + c.SITE_NAME + '-এ পড়ুন।';
  return html(
    page(c, { title: a.title || c.SITE_NAME, description: a.excerpt || fallbackDesc, image: a.cover_url, type: 'article', selfUrl, target, extra }),
    300
  );
}

async function authorPage(c, slug, selfUrl) {
  const target = c.SITE_ORIGIN + '/author.html?slug=' + encodeURIComponent(slug);
  if (!SLUG_RE.test(slug)) return go(c.SITE_ORIGIN + '/');
  let rows;
  try {
    rows = await sb(c, 'authors?select=name,role_title,city,image_url&slug=eq.' + encodeURIComponent(slug) + '&limit=1');
  } catch (e) {
    return go(target);
  }
  const u = rows && rows[0];
  if (!u) return go(target);
  const bits = [u.role_title, u.city].filter(Boolean).join(' · ');
  return html(
    page(c, { title: u.name + ' | ' + c.SITE_NAME + ' লেখক', description: (bits ? bits + '। ' : '') + u.name + '-এর সব লেখা ' + c.SITE_NAME + '-এ।', image: u.image_url, type: 'profile', selfUrl, target }),
    300
  );
}

export default {
  async fetch(request, env) {
    const c = cfg(env);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    const url = new URL(request.url);
    const self = url.origin + url.pathname;
    const m = url.pathname.match(/^\/(a|w)\/([^/]+)\/?$/);
    if (!m) return go(c.SITE_ORIGIN + '/');
    let key;
    try {
      key = decodeURIComponent(m[2]);
    } catch (e) {
      return go(c.SITE_ORIGIN + '/');
    }
    return m[1] === 'a' ? article(c, key, self) : authorPage(c, key, self);
  },
};
