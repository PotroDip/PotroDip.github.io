/* নির্মাতার ক্রেডিট ব্যাজ (v51)
   - পিসিতে ক্লিক: সরাসরি হোয়াটসঅ্যাপ
   - মোবাইলে ক্লিক: নিচ থেকে শিট — ফোন করুন / হোয়াটসঅ্যাপ (ইউজার বেছে নেবে)
*/
(function () {
  'use strict';
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 1 1-4.2 15.04l-.3-.18-3.1.81.83-3.02-.2-.31A8.1 8.1 0 0 1 12.04 3.8zm-3.2 4.1c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.68 2.66 4.14 3.62 2.05.8 2.46.64 2.9.6.45-.04 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4z"/></svg>';
  var CALL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';

  function isMobile() {
    var ua = navigator.userAgent || '';
    if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
    if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua)) return true;
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; /* আইপ্যাড */
  }

  function closeSheet() {
    var s = document.querySelector('.cr-sheet');
    if (!s) return;
    s.classList.remove('show');
    document.removeEventListener('keydown', onKey);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 240);
  }
  function onKey(e) { if (e.key === 'Escape') closeSheet(); }

  function openSheet(box) {
    closeSheet();
    var wa = box.getAttribute('data-phone');
    var photo = box.querySelector('.cr-photo img');
    var el = document.createElement('div');
    el.className = 'cr-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'যোগাযোগ করুন');
    el.innerHTML =
      '<div class="cr-sheet-card">' +
        '<div class="cr-sheet-grab"></div>' +
        '<div class="cr-sheet-head">' +
          (photo ? '<img src="' + (photo.getAttribute('data-avatar') || photo.getAttribute('src')) + '" alt="">' : '') +
          '<div><b>MUSTAFIZUR RJ</b><small><span>01704-598 772</span>' + '</small></div>' +
        '</div>' +
        '<div class="cr-sheet-opts">' +
          '<a class="cr-opt call" href="tel:+' + wa + '">' + CALL_ICON + '<span>ফোনে কল করুন</span></a>' +
          '<a class="cr-opt wa" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + WA_ICON + '<span>হোয়াটসঅ্যাপে মেসেজ করুন</span></a>' +
        '</div>' +
        '<button type="button" class="cr-sheet-close">বন্ধ করুন</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('.cr-sheet-close')) return closeSheet();
      if (e.target.closest('.cr-opt')) setTimeout(closeSheet, 150);
    });
  }

  function activate(box) {
    if (isMobile()) openSheet(box);
    else window.open('https://wa.me/' + box.getAttribute('data-phone'), '_blank', 'noopener');
  }

  /* স্ক্রলে ব্যাজ দেখা গেলে আস্তে ফেড-ইন */
  function initFade() {
    var boxes = document.querySelectorAll('.creator');
    if (!boxes.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.remove('cr-pre'); io.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    boxes.forEach(function (b) { b.classList.add('cr-pre'); io.observe(b); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFade); else initFade();

  document.addEventListener('click', function (e) {
    var box = e.target.closest && e.target.closest('.creator');
    if (!box || e.target.closest('.cr-sheet')) return;
    activate(box);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('creator')) {
      e.preventDefault(); activate(e.target);
    }
  });
})();
