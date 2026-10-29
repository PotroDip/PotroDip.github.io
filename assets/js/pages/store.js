/* store.js — ছাপা সংখ্যার স্টোর: কার্ট, ঠিকানা, ডেলিভারি চার্জ, পেমেন্ট নির্দেশনা, অর্ডার জমা ও PDF নমুনা-রিডার */
(function() {
  'use strict';
  var PD = window.PD,
    UI = window.PDUI;

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
  var DELIVERY_RULES = {
    dhaka: {
      normal: 70,
      bulk: 80
    },
    outside: {
      normal: 120,
      bulk: 130
    }
  };
  var BULK_THRESHOLD = 10;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function(c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      } [c];
    });
  }

  function saveCart() {
    try {
      localStorage.setItem('pd-cart', JSON.stringify(cart.map(function(i) {
        return {
          id: i.id,
          qty: i.qty
        };
      })));
    } catch (e) {}
  }
  var cart = []; // { id, title, price, qty, cover }
  function findCartItem(id) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) return cart[i];
    }
    return null;
  }

  function addToCart(issue) {
    var existing = findCartItem(issue.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: issue.id,
        title: issue.title,
        price: issue.price,
        qty: 1,
        cover: issue.cover
      });
    }
    renderCart();
    updateFab();
  }

  function removeFromCart(id) {
    cart = cart.filter(function(item) {
      return item.id !== id;
    });
    renderCart();
    updateFab();
  }

  function changeQty(id, delta) {
    var item = findCartItem(id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
    renderCart();
    updateFab();
  }

  function cartTotalQty() {
    return cart.reduce(function(sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function(sum, item) {
      return sum + (item.qty * item.price);
    }, 0);
  }
  var fab = document.getElementById('cart-fab');
  var fabCount = document.getElementById('fab-count');

  function updateFab() {
    saveCart();
    var qty = cartTotalQty();
    if (qty > 0) {
      fab.classList.add('show');
      fabCount.textContent = toBn(qty);
    } else {
      fab.classList.remove('show');
    }
  }
  var cartListEl = document.getElementById('cart-list');
  var emptyCartEl = document.getElementById('empty-cart');

  function qtyBtnIcon(type) {
    if (type === 'plus') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  }

  function renderCart() {
    cartListEl.innerHTML = '';
    if (cart.length === 0) {
      emptyCartEl.style.display = 'block';
    } else {
      emptyCartEl.style.display = 'none';
      cart.forEach(function(item) {
        var el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML =
          '<div class="ci-cover"><img src="' + esc(item.cover) + '" alt=""></div>' +
          '<div class="ci-info">' +
          '<div>' +
          '<div class="ci-title">' + esc(item.title) + '</div>' +
          '<div class="ci-price">' + bnTaka(item.price) + ' &times; ' + toBn(item.qty) + ' = ' + bnTaka(item.price * item.qty) + '</div>' +
          '</div>' +
          '<div class="ci-row">' +
          '<div class="qty-stepper">' +
          '<button class="qty-minus" data-id="' + esc(item.id) + '">' + qtyBtnIcon('minus') + '</button>' +
          '<span class="qty-val">' + toBn(item.qty) + '</span>' +
          '<button class="qty-plus" data-id="' + esc(item.id) + '">' + qtyBtnIcon('plus') + '</button>' +
          '</div>' +
          '<button class="ci-remove" data-id="' + esc(item.id) + '" aria-label="সরিয়ে ফেলুন"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>' +
          '</div>' +
          '</div>';
        cartListEl.appendChild(el);
      });
    }
    cartListEl.querySelectorAll('.qty-plus').forEach(function(b) {
      b.addEventListener('click', function() {
        changeQty(this.dataset.id, 1);
        updateSummary();
      });
    });
    cartListEl.querySelectorAll('.qty-minus').forEach(function(b) {
      b.addEventListener('click', function() {
        changeQty(this.dataset.id, -1);
        updateSummary();
      });
    });
    cartListEl.querySelectorAll('.ci-remove').forEach(function(b) {
      b.addEventListener('click', function() {
        removeFromCart(this.dataset.id);
        updateSummary();
      });
    });
    updateSummary();
  }
  var areaSelect = document.getElementById('inp-area');
  var sumSubtotal = document.getElementById('sum-subtotal');
  var sumDelivery = document.getElementById('sum-delivery');
  var sumTotalNow = document.getElementById('sum-total-now');
  var bulkNote = document.getElementById('bulk-note');

  function getDeliveryCharge() {
    var area = areaSelect.value;
    if (!area) return null;
    var qty = cartTotalQty();
    var isBulk = qty >= BULK_THRESHOLD;
    var rule = DELIVERY_RULES[area];
    return {
      amount: isBulk ? rule.bulk : rule.normal,
      isBulk: isBulk
    };
  }

  function updateSummary() {
    var subtotal = cartSubtotal();
    sumSubtotal.textContent = bnTaka(subtotal);
    var d = getDeliveryCharge();
    if (d === null) {
      sumDelivery.textContent = '— (এলাকা বেছে নিন)';
      sumTotalNow.textContent = '—';
      bulkNote.style.display = 'none';
    } else {
      sumDelivery.textContent = bnTaka(d.amount);
      sumTotalNow.textContent = bnTaka(d.amount);
      bulkNote.style.display = d.isBulk ? 'block' : 'none';
    }
  }
  areaSelect.addEventListener('change', updateSummary);
  var enDigits = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9'
  };

  function forceEnglishDigits(inputEl) {
    inputEl.addEventListener('input', function() {
      var pos = this.selectionStart;
      var before = this.value;
      var after = before.replace(/[০-৯]/g, function(d) {
        return enDigits[d];
      });
      if (before !== after) {
        this.value = after;
        if (pos !== null) this.setSelectionRange(pos, pos);
      }
    });
  }
  forceEnglishDigits(document.getElementById('inp-phone'));
  forceEnglishDigits(document.getElementById('inp-txn'));
  var issueGridEl = document.getElementById('issueGrid');
  issueGridEl.addEventListener('click', function(e) {
    var btn = e.target.closest('.order-btn');
    if (btn) {
      var card = btn.closest('.issue-card');
      addToCart({
        id: card.dataset.id,
        title: btn.dataset.title,
        price: parseInt(btn.dataset.price, 10),
        cover: btn.dataset.cover
      });
      var original = btn.innerHTML;
      btn.classList.add('added');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> কার্টে যোগ হয়েছে';
      setTimeout(function() {
        btn.classList.remove('added');
        btn.innerHTML = original;
      }, 1400);
      openDrawer('form');
      return;
    }
    var pv = e.target.closest('.preview-trigger');
    if (pv) {
      var c = pv.closest('.issue-card');
      if (c && c.dataset.pdf) openReader(c);
    }
  });
  var scrim = document.getElementById('drawer-scrim');
  var drawer = document.getElementById('order-drawer');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerBack = document.getElementById('drawer-back');
  var drawerClose = document.getElementById('drawer-close');
  var drawerPrimaryBtn = document.getElementById('drawer-primary-btn');
  var cartFabBtn = document.getElementById('cart-fab');
  var STEP_TITLES = {
    form: 'অর্ডার সামারি ও ঠিকানা',
    payment: 'ডেলিভারি চার্জ পেমেন্ট',
    success: 'অর্ডার সম্পন্ন'
  };
  var STEP_BTN_LABELS = {
    form: 'চেকআউট / অর্ডার নিশ্চিত করুন',
    payment: 'অর্ডার জমা দিন',
    success: 'সংখ্যা তালিকায় ফিরে যান'
  };
  var currentStep = 'form';

  function showStep(step) {
    currentStep = step;
    document.querySelectorAll('.drawer-step').forEach(function(el) {
      el.classList.remove('active');
    });
    document.getElementById('step-' + step).classList.add('active');
    drawerTitle.textContent = STEP_TITLES[step];
    drawerBack.style.display = (step === 'payment') ? 'flex' : 'none';
    drawerPrimaryBtn.textContent = STEP_BTN_LABELS[step];
    drawerPrimaryBtn.disabled = false;
    document.querySelector('.drawer-body').scrollTop = 0;
    /* ধাপ-নির্দেশক: আগের ধাপগুলো 'done', বর্তমানটা 'on' */
    var order = ['form', 'payment', 'success'], at = order.indexOf(step);
    document.querySelectorAll('#drawer-steps span').forEach(function(s) {
      var k = order.indexOf(s.dataset.s);
      s.classList.toggle('on', k === at);
      s.classList.toggle('done', k < at);
    });
  }

  function openDrawer(step) {
    scrim.classList.add('open');
    drawer.classList.add('open');
    showStep(step || 'form');
  }

  function closeDrawer() {
    scrim.classList.remove('open');
    drawer.classList.remove('open');
  }
  cartFabBtn.addEventListener('click', function() {
    openDrawer('form');
  });
  scrim.addEventListener('click', closeDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  drawerBack.addEventListener('click', function() {
    if (currentStep === 'payment') showStep('form');
  });
  var readerOverlay = document.getElementById('reader-overlay');
  var readerScroll = document.getElementById('reader-scroll');
  var readerTitle = document.getElementById('reader-title');
  var readerLoading = document.getElementById('reader-loading');
  var readerErrorBox = document.getElementById('reader-error');
  var readerErrorLink = document.getElementById('reader-error-link');
  var readerProgress = document.getElementById('reader-progress');
  var readerClose = document.getElementById('reader-close');
  var readerOrderBtn = document.getElementById('reader-order-btn');
  var currentPreviewCard = null;
  var currentPdfDoc = null;
  var currentObserver = null;
  var progressHideTimer = null;

  function clearReaderScroll() {
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }
    readerScroll.innerHTML = '';
    readerScroll.scrollTop = 0;
  }

  function destroyCurrentPdf() {
    if (currentPdfDoc) {
      try {
        currentPdfDoc.destroy();
      } catch (e) {}
      currentPdfDoc = null;
    }
  }

  function renderPageIntoCard(pdf, pageNum, card, targetWidth) {
    return pdf.getPage(pageNum).then(function(page) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var baseViewport = page.getViewport({
        scale: 1
      });
      var scale = (targetWidth * dpr) / baseViewport.width;
      var viewport = page.getViewport({
        scale: scale
      });
      var canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      var ctx = canvas.getContext('2d');
      return page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise.then(function() {
        var skeleton = card.querySelector('.page-skeleton');
        if (skeleton) skeleton.remove();
        card.appendChild(canvas);
        card.classList.add('rendered');
      });
    });
  }

  function updateProgress() {
    var cards = readerScroll.querySelectorAll('.page-card');
    if (!cards.length) return;
    var scrollMid = readerScroll.scrollTop + (readerScroll.clientHeight * 0.35);
    var current = 1;
    cards.forEach(function(card) {
      if (card.offsetTop <= scrollMid) current = parseInt(card.dataset.pageNum, 10);
    });
    readerProgress.textContent = 'পাতা ' + toBn(current) + ' / ' + toBn(cards.length);
    readerProgress.classList.add('show');
    clearTimeout(progressHideTimer);
    progressHideTimer = setTimeout(function() {
      readerProgress.classList.remove('show');
    }, 1100);
  }
  readerScroll.addEventListener('scroll', updateProgress);

  function loadPdfIntoReader(pdfUrl) {
    readerLoading.style.display = 'flex';
    readerLoading.style.opacity = '1';
    readerErrorBox.classList.remove('show');
    readerErrorLink.href = pdfUrl;
    if (!window.pdfjsLib) {
      readerLoading.style.display = 'none';
      readerErrorBox.classList.add('show');
      return;
    }
    var loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise.then(function(pdf) {
      currentPdfDoc = pdf;
      var numPages = pdf.numPages;
      var pagePromises = [];
      for (var i = 1; i <= numPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }
      return Promise.all(pagePromises).then(function(pages) {
        readerLoading.style.opacity = '0';
        setTimeout(function() {
          readerLoading.style.display = 'none';
        }, 200);
        var containerWidth = Math.min(readerScroll.clientWidth - 36, 640);
        pages.forEach(function(page, idx) {
          var pageNum = idx + 1;
          var vp = page.getViewport({
            scale: 1
          });
          var ratio = vp.height / vp.width;
          var card = document.createElement('div');
          card.className = 'page-card';
          card.dataset.pageNum = pageNum;
          card.style.aspectRatio = vp.width + ' / ' + vp.height;
          var skeleton = document.createElement('div');
          skeleton.className = 'page-skeleton';
          card.appendChild(skeleton);
          var badge = document.createElement('div');
          badge.className = 'page-num-badge';
          badge.textContent = toBn(pageNum) + ' / ' + toBn(numPages);
          card.appendChild(badge);
          readerScroll.appendChild(card);
        });
        readerProgress.textContent = 'পাতা ১ / ' + toBn(numPages);
        var cards = readerScroll.querySelectorAll('.page-card');
        var rendered = {};
        currentObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            var card = entry.target;
            var pageNum = parseInt(card.dataset.pageNum, 10);
            if (entry.isIntersecting && !rendered[pageNum]) {
              rendered[pageNum] = true;
              var w = card.clientWidth || containerWidth;
              renderPageIntoCard(pdf, pageNum, card, w);
            }
          });
        }, {
          root: readerScroll,
          rootMargin: '600px 0px',
          threshold: 0.01
        });
        cards.forEach(function(card) {
          currentObserver.observe(card);
        });
      });
    }).catch(function(err) {
      readerLoading.style.display = 'none';
      readerErrorBox.classList.add('show');
    });
  }

  function openReader(card) {
    currentPreviewCard = card;
    var pdfUrl = card.dataset.pdf;
    var title = card.dataset.pdfTitle || 'সংখ্যার নমুনা';
    readerTitle.textContent = title;
    destroyCurrentPdf();
    clearReaderScroll();
    readerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var hasOrderBtn = !!card.querySelector('.order-btn');
    readerOrderBtn.style.display = hasOrderBtn ? 'inline-flex' : 'none';
    loadPdfIntoReader(pdfUrl);
  }

  function closeReader() {
    readerOverlay.classList.remove('open');
    document.body.style.overflow = '';
    destroyCurrentPdf();
    clearReaderScroll();
  }
  readerClose.addEventListener('click', closeReader);
  readerOrderBtn.addEventListener('click', function() {
    if (!currentPreviewCard) return;
    var orderBtn = currentPreviewCard.querySelector('.order-btn');
    closeReader();
    if (orderBtn) {
      orderBtn.click();
    } else {
      openDrawer('form');
    }
  });

  function markInvalid(id, invalid) {
    var el = document.getElementById(id);
    if (invalid) el.classList.add('invalid');
    else el.classList.remove('invalid');
  }

  function validateFormStep() {
    var ok = true;
    if (cart.length === 0) {
      ok = false;
    }
    var name = document.getElementById('inp-name').value.trim();
    markInvalid('field-name', name.length === 0);
    if (name.length === 0) ok = false;
    var phone = document.getElementById('inp-phone').value.trim();
    var phoneOk = /^[0-9+\-\s]{10,15}$/.test(phone);
    markInvalid('field-phone', !phoneOk);
    if (!phoneOk) ok = false;
    var address = document.getElementById('inp-address').value.trim();
    markInvalid('field-address', address.length === 0);
    if (address.length === 0) ok = false;
    var area = areaSelect.value;
    markInvalid('field-area', area === '');
    if (area === '') ok = false;
    return ok;
  }

  function validatePaymentStep() {
    var txn = document.getElementById('inp-txn').value.trim();
    var ok = txn.length > 0;
    markInvalid('field-txn', !ok);
    return ok;
  }
  drawerPrimaryBtn.addEventListener('click', function() {
    if (currentStep === 'form') {
      if (!PD.user) {
        UI.toast('অর্ডার করতে আগে লগইন করুন (আপনার কার্ট সেভ থাকবে)', 1);
        setTimeout(function() {
          location.href = 'auth.html';
        }, 1200);
        return;
      }
      if (!validateFormStep()) return;
      var d = getDeliveryCharge();
      document.getElementById('pay-amount').textContent = bnTaka(d.amount);
      showStep('payment');
    } else if (currentStep === 'payment') {
      if (!validatePaymentStep()) return;
      var btn = drawerPrimaryBtn;
      btn.disabled = true;
      btn.textContent = 'জমা হচ্ছে…';
      var name = document.getElementById('inp-name').value.trim();
      var phone = document.getElementById('inp-phone').value.trim();
      PD.db.rpc('place_order', {
        p_name: name,
        p_phone: phone,
        p_address: document.getElementById('inp-address').value.trim(),
        p_area: areaSelect.value === 'dhaka' ? 'dhaka' : 'outside',
        p_trx: document.getElementById('inp-txn').value.trim(),
        p_items: cart.map(function(i) {
          return {
            id: i.id,
            qty: i.qty
          };
        })
      }).then(function(r) {
        btn.disabled = false;
        btn.textContent = STEP_BTN_LABELS.payment;
        if (r.error || !r.data) {
          UI.toast(r.error ? PD.msg(r.error) : 'অর্ডার জমা হয়নি, আবার চেষ্টা করুন', 1);
          return;
        }
        document.getElementById('success-order-id').textContent = '#' + r.data.order_number;
        document.getElementById('success-name').textContent = 'ধন্যবাদ, ' + name + '!';
        document.getElementById('success-phone-note').textContent = 'আপনার ফোনে (' + phone + ') আপডেট জানিয়ে দেয়া হবে।';
        showStep('success');
        cart = [];
        ['inp-name', 'inp-phone', 'inp-address', 'inp-txn'].forEach(function(id) {
          document.getElementById(id).value = '';
        });
        areaSelect.value = '';
        updateFab();
        renderCart();
      });
    } else if (currentStep === 'success') {
      closeDrawer();
    }
  });
  document.querySelectorAll('.pm-copy').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var num = this.dataset.copy;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(num).catch(function() {});
      }
      var self = this;
      self.classList.add('copied');
      var original = self.innerHTML;
      self.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(function() {
        self.classList.remove('copied');
        self.innerHTML = original;
      }, 1400);
    });
  });

  /* ---------- ডেটাবেস থেকে সংখ্যা, সেটিংস ও কার্ড বসানো ---------- */
  var grid = issueGridEl;

  function gridMsg(t) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:48px 0">' + t + '</p>';
  }

  function applySettings(rows) {
    rows.forEach(function(r) {
      var v = r.value || {};
      if (r.key === 'delivery') {
        DELIVERY_RULES = {
          dhaka: {
            normal: +v.in_normal || 70,
            bulk: +v.in_bulk || 80
          },
          outside: {
            normal: +v.out_normal || 120,
            bulk: +v.out_bulk || 130
          }
        };
        BULK_THRESHOLD = +v.bulk_min || 10;
        var setT = function(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
        setT('info-dhaka', bnTaka(DELIVERY_RULES.dhaka.normal));
        setT('info-out', bnTaka(DELIVERY_RULES.outside.normal));
        setT('info-dhaka-bulk', toBn(BULK_THRESHOLD) + '+ কপিতে ' + bnTaka(DELIVERY_RULES.dhaka.bulk));
        setT('info-out-bulk', toBn(BULK_THRESHOLD) + '+ কপিতে ' + bnTaka(DELIVERY_RULES.outside.bulk));
        bulkNote.textContent = 'বাল্ক অর্ডার হারে ডেলিভারি চার্জ ধরা হয়েছে (' + toBn(BULK_THRESHOLD) + '+ কপি)।';
      }
      if (r.key === 'payment') {
        var names = ['bkash', 'nagad', 'rocket'], label = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' };
        var on = names.filter(function(n) { return v[n]; }).map(function(n) { return label[n]; });
        var ip = document.getElementById('info-pay'); if (ip && on.length) ip.textContent = on.join(' · ');
        document.querySelectorAll('.pay-method').forEach(function(m, i) {
          var num = v[names[i]] || '';
          if (!num) {
            m.style.display = 'none';
            return;
          }
          m.querySelector('.pm-number').textContent = num;
          m.querySelector('.pm-copy').dataset.copy = num;
        });
      }
    });
    updateSummary();
  }

  function render(items, nums) {
    grid.innerHTML = '';
    if (!items.length) {
      gridMsg('এখনো কোনো ছাপা সংখ্যা অর্ডারের জন্য প্রস্তুত নেই।');
      return;
    }
    items.forEach(function(p) {
      var c = UI.tpl(p.in_stock ? 'tpl-issue' : 'tpl-issue-out');
      c.dataset.id = p.id;
      if (p.preview_pdf_url) {
        c.dataset.pdf = p.preview_pdf_url;
        c.dataset.pdfTitle = p.title;
      } else {
        ['.preview-hint', '.preview-link'].forEach(function(q) {
          var e = c.querySelector(q);
          if (e) e.remove();
        });
        c.querySelectorAll('.preview-trigger').forEach(function(e) {
          e.classList.remove('preview-trigger');
        });
      }
      UI.img(c, '.issue-cover img', UI.cover(p.cover_url), p.title + ' প্রচ্ছদ');
      var nb = c.querySelector('.issue-num-badge'),
        no = nums[p.issue_id];
      if (no) nb.textContent = 'সংখ্যা ' + toBn(no);
      else nb.remove();
      UI.set(c, '.issue-title', p.title);
      var tz = c.querySelector('.issue-teaser');
      if (p.teaser) tz.textContent = p.teaser;
      else tz.remove();
      var pr = c.querySelector('.issue-price');
      pr.innerHTML = '';
      var u = document.createElement('span');
      u.className = 'unit';
      u.textContent = '৳';
      pr.appendChild(u);
      pr.appendChild(document.createTextNode(toBn(p.price)));
      var ob = c.querySelector('.order-btn');
      if (ob) {
        ob.dataset.title = p.title;
        ob.dataset.price = p.price;
        ob.dataset.cover = UI.cover(p.cover_url);
      }
      grid.appendChild(c);
    });
  }

  /* বিশেষ সংখ্যা: স্টকে থাকা সর্বশেষ সংখ্যা — বাটনগুলো গ্রিডের কার্ডের মতোই কাজ করে */
  function renderFeature(items, nums) {
    var box = document.getElementById('storeFeature');
    if (!box) return;
    var list = items.filter(function(x) { return x.in_stock; });
    var p = list.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); })[0];
    if (!p) return box.remove();
    var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    var teaser = String(p.teaser || '').replace(/\s+/g, ' ').trim();
    if (teaser.length > 200) { teaser = teaser.slice(0, 200); teaser = teaser.slice(0, teaser.lastIndexOf(' ')) + ' …'; }
    box.innerHTML = '<div class="ib-inner"><button type="button" class="ib-cover" data-act="preview"><img src="' + esc(UI.cover(p.cover_url)) + '" alt="' + esc(p.title) + ' প্রচ্ছদ">' + (p.preview_pdf_url ? '<span class="ib-peek">নমুনা পাতা পড়ুন</span>' : '') + '</button><div class="ib-text"><div class="ib-kicker"><span>এখন অর্ডার চলছে</span>' + (nums[p.issue_id] ? '<span class="ib-no">সংখ্যা ' + toBn(nums[p.issue_id]) + '</span>' : '') + '</div><h2>' + esc(p.title) + '</h2>' + (teaser ? '<p class="ib-teaser">' + esc(teaser) + '</p>' : '') + '<div class="ib-price"><span class="unit">৳</span>' + toBn(p.price) + '<small>+ ডেলিভারি চার্জ</small></div><div class="ib-actions"><button type="button" class="ib-btn primary" data-act="order">অর্ডার করুন ' + arrow + '</button>' + (p.preview_pdf_url ? '<button type="button" class="ib-btn ghost" data-act="preview">নমুনা পাতা পড়ুন</button>' : '') + '</div></div></div>';
    box.addEventListener('click', function(e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var card = issueGridEl.querySelector('.issue-card[data-id="' + p.id + '"]');
      if (!card) return;
      if (b.dataset.act === 'order') { var ob = card.querySelector('.order-btn'); if (ob) ob.click(); }
      else if (card.dataset.pdf) openReader(card);
    });
  }

  function restoreCart(items) {
    var saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('pd-cart') || '[]');
    } catch (e) {}
    cart = [];
    saved.forEach(function(s) {
      var p = items.filter(function(x) {
        return x.id === s.id && x.in_stock;
      })[0];
      if (p && s.qty > 0) cart.push({
        id: p.id,
        title: p.title,
        price: +p.price,
        qty: Math.min(+s.qty, 50),
        cover: UI.cover(p.cover_url)
      });
    });
  }
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';
  if (!PD || !PD.db) {
    gridMsg('সংযোগ করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।');
  } else {
    Promise.all([
      PD.db.from('print_issues').select('id,issue_id,title,teaser,cover_url,price,in_stock,preview_pdf_url,sort_order,created_at').order('sort_order', {
        ascending: true
      }).limit(100),
      PD.db.from('issues').select('id,issue_number'),
      PD.db.from('site_settings').select('key,value').in('key', ['delivery', 'payment'])
    ]).then(function(r) {
      if (r[0].error) {
        gridMsg('সংখ্যাগুলো লোড করা যায়নি');
        return;
      }
      var items = r[0].data || [],
        nums = {};
      (r[1].data || []).forEach(function(i) {
        nums[i.id] = i.issue_number;
      });
      applySettings(r[2].data || []);
      render(items, nums);
      renderFeature(items, nums);
      var sc = document.getElementById('storeCount');
      if (sc) sc.textContent = items.length ? toBn(items.length) + 'টি সংখ্যা · ' + toBn(items.filter(function(x) { return x.in_stock; }).length) + 'টি স্টকে' : '';
      restoreCart(items);
      renderCart();
      updateFab();
    });
    PD.ready.then(function() {
      if (PD.user) {
        var n = document.getElementById('inp-name');
        if (n && !n.value && PD.profile && PD.profile.full_name) n.value = PD.profile.full_name;
      }
    });
  }

})();
