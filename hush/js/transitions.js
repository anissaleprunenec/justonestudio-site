// Hush — page transitions. Loaded in <head> so it is listening before the first frame.
// Detail sheets (hotel, restaurant) slide up when opened and slide back down when closed;
// every other navigation stays instant.
(() => {
  const SHEET = /\/(08-hotel|10-restaurant)\.html$/;   // pages shown as a sheet
  const DEEPER = /\/(09-booking|11-reservation)\.html$/; // steps that open from a sheet

  window.addEventListener('pagereveal', (e) => {
    // flags left by the sheet's close button / swipe: read them once, whatever happens next
    const swiped = sessionStorage.getItem('hush-swiped');
    const closeAsked = sessionStorage.getItem('hush-close');
    sessionStorage.removeItem('hush-swiped');
    sessionStorage.removeItem('hush-close');

    const vt = e.viewTransition;
    if (!vt) return;
    // the browser may skip a transition (hidden tab…): not an error
    [vt.ready, vt.updateCallbackDone, vt.finished].forEach((p) => p?.catch(() => {}));
    // the swipe already slid the sheet out: don't play it twice
    if (swiped) { vt.skipTransition(); return; }

    const from = new URL(window.navigation?.activation?.from?.url || document.referrer || location.href).pathname;
    const type = window.navigation?.activation?.navigationType;
    const here = location.pathname;

    const closing = closeAsked || (type === 'traverse' && !DEEPER.test(here));
    if (closing && SHEET.test(from)) vt.types.add('sheet-close');
    else if (SHEET.test(here) && type !== 'traverse' && !DEEPER.test(from) && !SHEET.test(from)) vt.types.add('sheet-open');
  });
})();
