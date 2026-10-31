// firebase-bridge — Firebase-এ লগইন করা ইউজারকে একই ইমেইলের Supabase অ্যাকাউন্টে ঢোকায়।
// ১. Firebase ID token-এর সই Google-এর পাবলিক কী দিয়ে যাচাই
// ২. ইমেইল-যাচাই: গুগল হলে Google নিজেই যাচাই করা; ইমেইল-পাসওয়ার্ড হলে Supabase-এর পাঠানো যাচাই-ইমেইলে ক্লিক করা হয়েছে কিনা
//    (pd_fb_check) — এবং সেই Supabase-ইউজার ঠিক এই Firebase-অ্যাকাউন্টের সঙ্গেই জোড়া কিনা। পরিচিত প্রোভাইডারও (pd_email_domain_ok)
// ৩. Supabase ইউজার না থাকলে তৈরি, থাকলে সেটাই (ইমেইল দিয়ে মিল) — ডেটা দুই জায়গায় হয় না
// ৪. এককালীন ম্যাজিক-লিংক টোকেন ফেরত দেওয়া, যা দিয়ে ব্রাউজার Supabase সেশন পায়
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const FIREBASE_PROJECT = "potrodip-99ad4";
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
const ORIGINS = ["https://potrodip.github.io"];
const PROVIDERS = ["password", "google.com"];

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  const reply = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  let idToken = "";
  try {
    idToken = String((await req.json()).idToken || "");
  } catch (_) { /* নিচে ধরা হবে */ }
  if (!idToken) return reply(400, { error: "missing_token" });

  // ১. টোকেন যাচাই
  let claims: Record<string, any>;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT}`,
      audience: FIREBASE_PROJECT,
    });
    claims = payload as Record<string, any>;
  } catch (_) {
    return reply(401, { error: "invalid_token" });
  }

  const email = String(claims.email || "").trim().toLowerCase();
  const provider = String(claims.firebase?.sign_in_provider || "");
  if (!email) return reply(400, { error: "no_email" });
  if (!PROVIDERS.includes(provider)) return reply(403, { error: "provider_not_allowed" });
  // গুগলের ইমেইল Google নিজেই যাচাই করে রাখে
  if (provider === "google.com" && claims.email_verified !== true) return reply(403, { error: "email_not_verified" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dom = await admin.rpc("pd_email_domain_ok", { p_email: email });
  if (dom.error) return reply(500, { error: "server_error" });
  if (dom.data !== true) return reply(403, { error: "email_domain_not_allowed" });

  // ২. ইমেইল-পাসওয়ার্ড অ্যাকাউন্ট: Firebase নিজে ইমেইল যাচাই করে না (যাচাইয়ের ইমেইল যায় Supabase থেকে)
  if (provider === "password" && claims.email_verified !== true) {
    const chk = await admin.rpc("pd_fb_check", { p_email: email, p_uid: String(claims.sub || "") });
    if (chk.error || !chk.data) return reply(500, { error: "server_error" });
    const c = chk.data as { exists: boolean; confirmed: boolean; uid_match: boolean };
    if (!c.exists) return reply(403, { error: "need_signup" });           // Supabase-এ এখনো যাচাই-ইমেইল পাঠানো হয়নি
    if (!c.uid_match) return reply(403, { error: "account_exists" });     // এই ইমেইলে অন্য (আগের) অ্যাকাউন্ট আছে — তার সঙ্গে জোড়া নয়
    if (!c.confirmed) return reply(403, { error: "email_not_verified" }); // ইমেইলের লিংকে এখনো ক্লিক করা হয়নি
  }

  // ৩. ইউজার তৈরি (আগে থাকলে কিছুই হয় না — একই অ্যাকাউন্ট ব্যবহার হবে)
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: claims.name || undefined,
      avatar_url: claims.picture || undefined,
    },
  });
  if (created.error) {
    const m = `${created.error.message || ""} ${(created.error as any).code || ""}`;
    if (!/already|exists|registered/i.test(m)) return reply(500, { error: "create_failed" });
  }

  // ৪. এককালীন টোকেন (কোনো ইমেইল পাঠানো হয় না)
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = link.data?.properties?.hashed_token;
  if (link.error || !hashed) return reply(500, { error: "link_failed" });

  return reply(200, { token_hash: hashed, created: !created.error });
});
