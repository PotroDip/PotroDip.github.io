# Firebase ইমেইল-টেমপ্লেট বসানোর নিয়ম

Firebase কনসোল → Authentication → **Templates** → প্রতিটা টেমপ্লেটের পাশে ✏️ (পেন্সিল)।

| টেমপ্লেট | বিষয় (Subject) | বডি (Message) |
|---|---|---|
| Email address verification | `পত্রদ্বীপে স্বাগতম — ইমেইলটা যাচাই করুন` | `verify-email.html` |
| Password reset | `পত্রদ্বীপ — পাসওয়ার্ড বদলানোর লিংক` | `reset-password.html` |
| Email address change | `পত্রদ্বীপ — আপনার ইমেইল ঠিকানা বদলানো হয়েছে` | `change-email.html` |

- Sender name: `পত্রদ্বীপ` (এটা বসানো আছে)
- বডি-ঘরে ফাইলের **পুরোটা** কপি করে বসান। কনসোল সুন্দর ডিজাইন (`.html`) না নিলে `lite/` ফোল্ডারের সরল ফাইল বসান।
- প্রতিটা টেমপ্লেটের নিচে **Customize action URL** → `https://potrodip.github.io/action.html` → Save
  (এতে ইমেইলের লিংক potrodip.github.io পাতায় আসে — বাংলা, সুন্দর ও বিশ্বাসযোগ্য)
