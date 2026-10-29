/* admin-shell.js — এডমিন প্যানেলের কাঠামো: সাইডবার, পেজ বদলানো, পপআপ (মডাল), কনফার্ম বক্স, টোস্ট (আপনার আসল কোড) */
(function() {
  /* ============ সহায়ক ফাংশন ============ */
  var bnDigits = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯'
  };

  function toBn(n) {
    return String(n).replace(/[0-9]/g, function(d) {
      return bnDigits[d];
    });
  }

  function bnTaka(n) {
    return '৳' + toBn(n);
  }

  function starSVG(filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
  }

  function starsMarkup(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += starSVG(i <= n);
    }
    return out;
  }

  /* ============ টোস্ট ============ */
  var toastEl = document.getElementById('toast');
  var toastTimer;

  function showToast(msg) {
    document.getElementById('toast-text').textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toastEl.classList.remove('show');
    }, 2200);
  }

  /* ============ কনফার্মেশন পপআপ ============ */
  var confirmOverlay = document.getElementById('confirm-overlay');
  var pendingConfirmAction = null;

  function showConfirm(title, desc, onYes) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-desc').textContent = desc;
    pendingConfirmAction = onYes;
    confirmOverlay.classList.add('show');
  }
  document.getElementById('confirm-yes').addEventListener('click', function() {
    var action = pendingConfirmAction;
    pendingConfirmAction = null;
    confirmOverlay.classList.remove('show');
    if (typeof action === 'function') action();
  });
  document.getElementById('confirm-no').addEventListener('click', function() {
    pendingConfirmAction = null;
    confirmOverlay.classList.remove('show');
  });
  confirmOverlay.addEventListener('click', function(e) {
    if (e.target === confirmOverlay) {
      pendingConfirmAction = null;
      confirmOverlay.classList.remove('show');
    }
  });

  /* ============ মোবাইল/মডাল স্ক্রল-লক হেল্পার (পেছনের পেজ স্ক্রল আটকানোর জন্য) ============ */
  var scrollLockCount = 0;
  var savedScrollY = 0;

  function lockBodyScroll() {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = (-savedScrollY) + 'px';
      document.body.classList.add('no-scroll');
    }
    scrollLockCount++;
  }

  function unlockBodyScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
      window.scrollTo(0, savedScrollY);
    }
  }

  /* ============ মডাল খোলা/বন্ধ (সাধারণ হেল্পার) ============ */
  var modalScrim = document.getElementById('modal-scrim');
  var openModalEl = null;

  function openModal(id) {
    document.querySelectorAll('.modal-box.open').forEach(function(m) {
      m.classList.remove('open');
    });
    var m = document.getElementById(id);
    modalScrim.classList.add('open');
    m.classList.add('open');
    openModalEl = m;
    lockBodyScroll();
  }

  function closeModal(id) {
    var m = document.getElementById(id);
    m.classList.remove('open');
    modalScrim.classList.remove('open');
    openModalEl = null;
    unlockBodyScroll();
  }
  document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      closeModal(this.dataset.closeModal);
    });
  });
  modalScrim.addEventListener('click', function() {
    if (openModalEl) closeModal(openModalEl.id);
  });

  /* ============ সাইডবার নেভিগেশন গঠন ============ */
  var NAV_STRUCTURE = [{
      group: 'সার্বিক',
      items: [{
        id: 'dashboard',
        label: 'ড্যাশবোর্ড',
        icon: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'
      }]
    },
    {
      group: 'কনটেন্ট',
      items: [{
          id: 'articles',
          label: 'লেখা প্রকাশ',
          icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
        },
        {
          id: 'authors',
          label: 'লেখক প্রোফাইল',
          icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
        },
        {
          id: 'archive',
          label: 'আর্কাইভ/সংখ্যা',
          icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>'
        },
        {
          id: 'ads',
          label: 'এড স্লট',
          icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/>'
        }
      ]
    },
    {
      group: 'স্টোর',
      items: [{
          id: 'issues',
          label: 'প্রিন্ট সংখ্যা',
          icon: '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'
        },
        {
          id: 'orders',
          label: 'অর্ডার তালিকা',
          icon: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'
        }
      ]
    },
    {
      group: 'কমিউনিটি',
      items: [{
          id: 'comments',
          label: 'কমেন্ট মডারেশন',
          icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'
        },
        {
          id: 'newsletter',
          label: 'নিউজলেটার',
          icon: '<path d="M4 4h16v16H4z" opacity="0"/><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 7 12 13 22 7"/>'
        },
        {
          id: 'analytics',
          label: 'অ্যানালিটিক্স',
          icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
        }
      ]
    },
    {
      group: 'সেটিংস',
      items: [{
          id: 'delivery',
          label: 'ডেলিভারি চার্জ',
          icon: '<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'
        },
        {
          id: 'payment',
          label: 'পেমেন্ট নাম্বার',
          icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'
        },
        {
          id: 'contact',
          label: 'যোগাযোগ তথ্য',
          icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/>'
        }
      ]
    }
  ];

  var PAGE_META = {
    dashboard: {
      title: 'ড্যাশবোর্ড',
      sub: 'সাইটের সার্বিক অবস্থা এক নজরে'
    },
    articles: {
      title: 'লেখা প্রকাশ',
      sub: 'নতুন লেখা প্রকাশ করুন বা পুরোনো লেখা ব্যবস্থাপনা করুন'
    },
    authors: {
      title: 'লেখক প্রোফাইল',
      sub: 'লেখক প্রোফাইল তৈরি ও এডিট করুন'
    },
    archive: {
      title: 'আর্কাইভ ব্যবস্থাপনা',
      sub: 'ত্রৈমাসিক সংখ্যা তৈরি ও ব্যবস্থাপনা করুন'
    },
    issues: {
      title: 'প্রিন্ট সংখ্যা ব্যবস্থাপনা',
      sub: 'প্রকাশিত সংখ্যা যোগ করুন, দাম-স্টক আপডেট করুন'
    },
    orders: {
      title: 'অর্ডার তালিকা',
      sub: 'পেমেন্ট যাচাই করে অর্ডারের স্ট্যাটাস আপডেট করুন'
    },
    ads: {
      title: 'এড স্লট ব্যবস্থাপনা',
      sub: 'সাইটের নির্দিষ্ট এড স্লট নিয়ন্ত্রণ করুন'
    },
    comments: {
      title: 'কমেন্ট মডারেশন',
      sub: 'আপত্তিকর মন্তব্য পর্যালোচনা ও অপসারণ করুন'
    },
    newsletter: {
      title: 'নিউজলেটার সাবস্ক্রাইবার',
      sub: 'সব সাবস্ক্রাইবারের তালিকা দেখুন'
    },
    analytics: {
      title: 'বেসিক অ্যানালিটিক্স',
      sub: 'পঠন ও জনপ্রিয়তার পরিসংখ্যান'
    },
    delivery: {
      title: 'ডেলিভারি চার্জ সেটিংস',
      sub: 'ঢাকা ও ঢাকার বাহিরের চার্জ নিয়ন্ত্রণ করুন'
    },
    payment: {
      title: 'পেমেন্ট নাম্বার সেটিংস',
      sub: 'বিকাশ, নগদ, রকেট নাম্বার পরিবর্তন করুন'
    },
    contact: {
      title: 'যোগাযোগ তথ্য',
      sub: 'সাইটের ফুটারে দেখানো তথ্য পরিবর্তন করুন'
    }
  };

  var sidebarNav = document.getElementById('sidebarNav');
  var navHtml = '';
  NAV_STRUCTURE.forEach(function(grp) {
    navHtml += '<div class="sidebar-group-label">' + grp.group + '</div>';
    grp.items.forEach(function(it) {
      navHtml += '<button class="nav-item' + (it.id === 'dashboard' ? ' active' : '') + '" data-page="' + it.id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + it.icon + '</svg>' +
        it.label +
        '</button>';
    });
  });
  sidebarNav.innerHTML = navHtml;

  var sidebarEl = document.getElementById('sidebar');
  var sidebarScrim = document.getElementById('sidebar-scrim');

  function goToPage(pageId) {
    document.querySelectorAll('.nav-item').forEach(function(n) {
      n.classList.toggle('active', n.dataset.page === pageId);
    });
    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    document.getElementById('topbar-heading').textContent = PAGE_META[pageId].title;
    document.getElementById('topbar-sub').textContent = PAGE_META[pageId].sub;
    if (sidebarEl.classList.contains('open')) {
      sidebarEl.classList.remove('open');
      sidebarScrim.classList.remove('open');
      unlockBodyScroll();
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  sidebarNav.addEventListener('click', function(e) {
    var btn = e.target.closest('.nav-item');
    if (!btn) return;
    goToPage(btn.dataset.page);
  });

  document.getElementById('hamburger-btn').addEventListener('click', function() {
    sidebarEl.classList.add('open');
    sidebarScrim.classList.add('open');
    lockBodyScroll();
  });
  sidebarScrim.addEventListener('click', function() {
    sidebarEl.classList.remove('open');
    sidebarScrim.classList.remove('open');
    unlockBodyScroll();
  });

  /* দ্রুত-কাজ বাটনগুলোর "data-goto" পেজ বদলাবে, তারপর যদি মডাল-ওপেনার থাকে সেটাও ট্রিগার হবে (নিচের নির্দিষ্ট বাইন্ডিং-এ) */
  document.querySelectorAll('[data-goto]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      goToPage(this.dataset.goto);
    });
  });

  window.AdminUI = {
    toBn: toBn,
    bnTaka: bnTaka,
    starSVG: starSVG,
    starsMarkup: starsMarkup,
    showToast: showToast,
    showConfirm: showConfirm,
    openModal: openModal,
    closeModal: closeModal,
    goToPage: goToPage
  };
})();
