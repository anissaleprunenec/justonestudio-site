// Hush prototype — small interactions shared by every screen
document.addEventListener('click', (e) => {
  // filter chips: one active per group
  const chip = e.target.closest('.chips .btn');
  if (chip) {
    chip.parentElement.querySelectorAll('.btn').forEach((b) => b.setAttribute('aria-pressed', b === chip));
    chip.parentElement.dispatchEvent(new CustomEvent('chipchange', { bubbles: true, detail: chip.dataset.filter }));
    return;
  }

  // favourite toggle: remembered across screens and visits
  const fav = e.target.closest('.fav');
  if (fav) {
    const on = fav.getAttribute('aria-pressed') !== 'true';
    paintFav(fav, on);
    const id = fav.closest('[data-id]')?.dataset.id;
    if (id) setFav(id, on);
    toast(on ? 'Ajouté à tes favoris' : 'Retiré de tes favoris');
    return;
  }

  // links that lead to screens the prototype doesn't have yet
  const soon = e.target.closest('a[href="#"]');
  if (soon && !soon.closest('.modal')) {
    e.preventDefault();
    toast('Bientôt disponible dans Hush');
    return;
  }

  // show / hide password
  const eye = e.target.closest('.auth__eye');
  if (eye) {
    const input = eye.parentElement.querySelector('input');
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    eye.setAttribute('aria-label', hidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    eye.classList.toggle('is-on', hidden);
    return;
  }

  // room accordion
  const toggle = e.target.closest('[data-toggle-room]');
  if (toggle) {
    const room = toggle.closest('.room');
    const open = room.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelector('use').setAttribute('href', `../assets/icons.svg#sol-square-${open ? 'up' : 'down'}`);
  }
});

// the focused field takes the brand outline
document.addEventListener('focusin', (e) => {
  const field = e.target.closest('.field');
  if (!field) return;
  field.closest('form, main')?.querySelectorAll('.field.is-active').forEach((f) => f.classList.remove('is-active'));
  field.classList.add('is-active');
});

// prototype forms only move to the next screen: nothing typed (password included) ends up in the URL.
// Forms marked data-validate check their fields first; data-loading shows a short wait on the button.
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.hasAttribute('data-validate') && !validate(form)) return;
  fillSummary();
  form.dispatchEvent(new CustomEvent('accepted', { bubbles: true }));
  const next = form.getAttribute('action');
  if (!next) return;
  if (form.hasAttribute('data-loading')) {
    const button = e.submitter || form.querySelector('[type="submit"]') || document.querySelector(`[form="${form.id}"]`);
    button?.classList.add('is-loading');
    if (button) button.dataset.label = button.textContent, button.textContent = form.dataset.loading || 'Un instant…';
    setTimeout(() => { location.href = next; button?.classList.remove('is-loading'); if (button) button.textContent = button.dataset.label; }, 1200);
  } else location.href = next;
});

// ---------- form validation: one clear message under each wrong field ----------
function validate(form) {
  let first = null;
  form.querySelectorAll('[data-error]').forEach((input) => {
    const ok = input.checkValidity();
    const box = input.closest('.field, .textarea, .check') || input;
    box.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', !ok);
    let msg = document.getElementById(`${input.id}-error`);
    if (!ok) {
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'field-error';
        msg.id = `${input.id}-error`;
        box.after(msg);
        input.setAttribute('aria-describedby', msg.id);
      }
      msg.textContent = input.value && input.dataset.errorFormat ? input.dataset.errorFormat : input.dataset.error;
      first ??= input;
    } else msg?.remove();
  });
  first?.focus();
  return !first;
}
document.addEventListener('input', (e) => {
  const input = e.target.closest('[aria-invalid="true"]');
  if (input && input.checkValidity()) {
    input.setAttribute('aria-invalid', false);
    (input.closest('.field, .textarea, .check') || input).classList.remove('is-invalid');
    document.getElementById(`${input.id}-error`)?.remove();
  }
  // payment fields format themselves as you type
  const f = e.target.dataset?.format;
  if (f === 'card') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  if (f === 'expiry') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
  if (f === 'cvc') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
});
document.addEventListener('change', (e) => {
  if (e.target.type === 'checkbox' && e.target.checked && e.target.getAttribute('aria-invalid') === 'true') {
    e.target.setAttribute('aria-invalid', false);
    e.target.closest('.check')?.classList.remove('is-invalid');
    document.getElementById(`${e.target.id}-error`)?.remove();
  }
});

// ---------- toast ----------
function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

// the confirmation repeats what was chosen (date, time, people)
function fillSummary() {
  const read = {
    date: () => document.querySelector('[data-cal="single"]')?.value,
    time: () => document.querySelector('[data-group="time"] [aria-pressed="true"]')?.textContent,
    people: () => { const n = document.querySelector('[data-stepper="people"] output')?.textContent; return n && `${n}${NB}personne${n > 1 ? 's' : ''}`; },
  };
  document.querySelectorAll('[data-out]').forEach((el) => {
    const value = read[el.dataset.out]?.();
    if (value) el.textContent = value;
  });
}

// Escape closes an open modal (they open on :target)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.querySelector('.modal:target')) location.hash = '';
});

// ---------- trips: upcoming / past ----------
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-trips]');
  if (!tab) return;
  tab.parentElement.querySelectorAll('[data-trips]').forEach((t) => t.setAttribute('aria-selected', t === tab));
  document.querySelectorAll('[data-when]').forEach((li) => { li.hidden = li.dataset.when !== tab.dataset.trips; });
});

// ---------- guest steppers ----------
const syncStepper = (row) => {
  const value = +row.querySelector('output').textContent;
  row.querySelector('[data-step="-1"]').disabled = value <= +row.dataset.min;
  row.querySelector('[data-step="1"]').disabled = value >= +row.dataset.max;
};
document.querySelectorAll('.stepper__row').forEach(syncStepper);
document.addEventListener('click', (e) => {
  const step = e.target.closest('[data-step]');
  if (!step) return;
  const row = step.closest('.stepper__row'), out = row.querySelector('output');
  out.textContent = Math.min(+row.dataset.max, Math.max(+row.dataset.min, +out.textContent + +step.dataset.step));
  syncStepper(row);
});

// ---------- calendar sheet (dates of the stay, date of the table) ----------
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WEEK = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const NB = ' ';
const TODAY = new Date(2027, 4, 5); // the prototype's story happens in May 2027
const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dayLabel = (d) => `${WEEK[d.getDay()]} ${d.getDate()}${NB}${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

function openCalendar(input) {
  const single = input.dataset.cal === 'single';
  const startInput = single ? input : document.querySelector('[data-cal="start"]');
  const endInput = single ? null : document.querySelector('[data-cal="end"]');
  let start = fromIso(startInput.dataset.date);
  let end = endInput ? fromIso(endInput.dataset.date) : null;
  let view = new Date(start.getFullYear(), start.getMonth(), 1);

  const cal = document.createElement('div');
  cal.className = 'cal';
  cal.innerHTML = `
    <div class="cal__scrim" data-cal-close></div>
    <div class="cal__panel" role="dialog" aria-modal="true" aria-labelledby="cal-title">
      <h2 class="cal__title" id="cal-title">${single ? 'Choisis une date' : 'Choisis tes dates'}</h2>
      <div class="cal__month">
        <button type="button" data-cal-prev aria-label="Mois précédent"><svg class="i i--20" style="transform: rotate(180deg)"><use href="../assets/icons.svg#sol-chevron-right"/></svg></button>
        <h3 aria-live="polite"></h3>
        <button type="button" data-cal-next aria-label="Mois suivant"><svg class="i i--20"><use href="../assets/icons.svg#sol-chevron-right"/></svg></button>
      </div>
      <div class="cal__grid"></div>
      <p class="cal__sum" aria-live="polite"></p>
      <button type="button" class="btn btn--block" data-cal-ok>Valider</button>
    </div>`;
  document.body.appendChild(cal);

  const render = () => {
    const y = view.getFullYear(), m = view.getMonth();
    cal.querySelector('h3').textContent = `${MONTHS[m]} ${y}`;
    cal.querySelector('[data-cal-prev]').disabled = y === TODAY.getFullYear() && m <= TODAY.getMonth();
    const heads = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((d) => `<abbr title="${d}">${d[0].toUpperCase()}</abbr>`);
    const blanks = Array((new Date(y, m, 1).getDay() + 6) % 7).fill('<span></span>');
    const days = [];
    for (let n = 1; n <= new Date(y, m + 1, 0).getDate(); n++) {
      const d = new Date(y, m, n), t = +d;
      const cls = single
        ? (t === +start ? 'is-on' : '')
        : [t === +start && 'is-start', t === +start && end && 'has-end', end && t === +end && 'is-end', end && t > +start && t < +end && 'is-in'].filter(Boolean).join(' ');
      const on = single ? t === +start : t === +start || (end && t === +end);
      days.push(`<button type="button" data-day="${toIso(d)}" class="${cls}" aria-label="${dayLabel(d)}" aria-pressed="${!!on}"${d < TODAY ? ' disabled' : ''}>${n}</button>`);
    }
    cal.querySelector('.cal__grid').innerHTML = [...heads, ...blanks, ...days].join('');
    const nights = end ? Math.round((end - start) / 864e5) : 0;
    cal.querySelector('.cal__sum').textContent = single
      ? dayLabel(start)
      : end ? `${nights}${NB}nuit${nights > 1 ? 's' : ''} · ${dayLabel(start).replace(/ \d{4}$/, '')} → ${dayLabel(end)}` : 'Choisis maintenant ta date de départ';
    cal.querySelector('[data-cal-ok]').disabled = !single && !end;
  };

  const close = () => { cal.remove(); document.removeEventListener('keydown', onKey); input.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  cal.addEventListener('click', (e) => {
    if (e.target.closest('[data-cal-close]')) return close();
    if (e.target.closest('[data-cal-prev]')) { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); return render(); }
    if (e.target.closest('[data-cal-next]')) { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); return render(); }
    const day = e.target.closest('[data-day]');
    if (day) {
      const d = fromIso(day.dataset.day);
      if (single || end || d <= start) { start = d; end = null; } else end = d;
      if (single) end = null;
      render();
      cal.querySelector(`[data-day="${day.dataset.day}"]`)?.focus();
      return;
    }
    if (e.target.closest('[data-cal-ok]')) {
      startInput.value = dayLabel(start); startInput.dataset.date = toIso(start);
      if (endInput && end) { endInput.value = dayLabel(end); endInput.dataset.date = toIso(end); }
      close();
    }
  });

  render();
  (cal.querySelector('[aria-pressed="true"]') || cal.querySelector('[data-day]:not(:disabled)')).focus();
}

document.addEventListener('click', (e) => {
  const input = e.target.closest('.field')?.querySelector('input[data-cal]');
  if (input && !document.querySelector('.cal')) openCalendar(input);
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('input[data-cal]')) { e.preventDefault(); openCalendar(e.target); }
});

// ---------- detail sheet: slide up on open, slide down to close (arrow or swipe) ----------
const sheet = document.querySelector('.sheet--hero');
if (sheet) {
  const crossDocTransitions = 'CSSViewTransitionRule' in window;
  const cameFromApp = document.referrer.startsWith(location.origin);
  const navType = performance.getEntriesByType('navigation')[0]?.type;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // browsers without cross-document transitions still get the slide up, inside the page
  if (!crossDocTransitions && cameFromApp && navType === 'navigate') sheet.classList.add('is-entering');

  // back to where the user came from, or to the link's target when the sheet was opened directly
  const leave = (fallbackHref) => {
    if (cameFromApp && history.length > 1) history.back();
    else location.href = fallbackHref;
  };
  const closeHref = sheet.querySelector('[data-sheet-close]')?.href || '06-home.html';

  sheet.querySelector('[data-sheet-close]')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (crossDocTransitions || reduceMotion) {
      sessionStorage.setItem('hush-close', '1');
      leave(closeHref);
    } else {
      sheet.classList.add('is-leaving');
      setTimeout(() => leave(closeHref), 300);
    }
  });

  // drag the photo down: the sheet follows the finger, past 110 px it closes, otherwise it snaps back
  const hero = sheet.querySelector('.hero');
  let startY = null, dy = 0;
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button') || e.button > 0 || scrollY > 10) return;
    startY = e.clientY; dy = 0;
    try { hero.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    sheet.classList.remove('is-snapping', 'is-entering');
  });
  hero.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  });
  const release = () => {
    if (startY === null) return;
    startY = null;
    if (dy > 110) {
      sheet.style.transform = '';
      sheet.classList.add('is-leaving');
      setTimeout(() => { sessionStorage.setItem('hush-swiped', '1'); leave(closeHref); }, 300);
    } else {
      sheet.classList.add('is-snapping');
      sheet.style.transform = '';
    }
  };
  hero.addEventListener('pointerup', release);
  hero.addEventListener('pointercancel', release);
}

// coming back to a page from the bfcache: no sheet should stay half-dragged
addEventListener('pageshow', (e) => {
  if (e.persisted) document.querySelector('.sheet--hero')?.classList.remove('is-leaving', 'is-entering');
});

// textarea counter
document.querySelectorAll('.textarea').forEach((box) => {
  const area = box.querySelector('textarea'), count = box.querySelector('.textarea__count');
  area.addEventListener('input', () => { count.textContent = `${area.value.length}/${area.maxLength}`; });
});

// ---------- the stay chosen at booking follows the user to payment ----------
const STAY = 'hush-stay';
const euros = (n) => `${n.toLocaleString('fr-FR')}${NB}€`;
const plural = (n, word) => `${n}${NB}${word}${n > 1 ? 's' : ''}`;

// booking: picking a room offer remembers dates, guests and that offer
document.addEventListener('click', (e) => {
  const book = e.target.closest('.room__cta a[href$="12-payment.html"]');
  if (!book) return;
  const offer = book.closest('.room__option'), steppers = document.querySelectorAll('.stepper__row output');
  const price = offer.querySelector('.price');
  sessionStorage.setItem(STAY, JSON.stringify({
    start: document.querySelector('[data-cal="start"]').dataset.date,
    end: document.querySelector('[data-cal="end"]').dataset.date,
    adults: +steppers[0].textContent,
    kids: +steppers[1].textContent,
    room: book.closest('.room').querySelector('h3').textContent,
    perks: offer.querySelector('h4').textContent.split(' · '),
    price: parseInt(price.firstChild.textContent, 10),
    was: parseInt(price.querySelector('s').textContent, 10),
  }));
});

// payment: rebuild the summary and the price breakdown from that stay
const stay = JSON.parse(sessionStorage.getItem(STAY) || 'null');
if (stay && document.querySelector('[data-bind]')) {
  const start = fromIso(stay.start), end = fromIso(stay.end);
  const nights = Math.round((end - start) / 864e5);
  const cancelBy = new Date(start); cancelBy.setDate(cancelBy.getDate() - 3);
  const startText = dayLabel(start).replace(start.getFullYear() === end.getFullYear() ? / \d{4}$/ : /$^/, '');
  const total = stay.price * nights, base = stay.was * nights;
  const values = {
    nights: plural(nights, 'nuit'),
    dates: `${startText[0].toUpperCase()}${startText.slice(1)} – ${dayLabel(end)}`,
    guests: plural(stay.adults, 'adulte') + (stay.kids ? `, ${plural(stay.kids, 'enfant')}` : ''),
    room: stay.room,
    perk1: stay.perks[0],
    perk2: stay.perks[1],
    cancel: `Annulation gratuite jusqu’au ${cancelBy.getDate()}${NB}${MONTHS[cancelBy.getMonth()]} ${cancelBy.getFullYear()}`,
    'base-label': `${euros(stay.was)} × ${plural(nights, 'nuit')}`,
    base: euros(base),
    'discount-label': `Prix Hush (−${euros(stay.was - stay.price)} par nuit)`,
    discount: `−${euros(base - total)}`,
    total: euros(total),
    'total-num': total.toLocaleString('fr-FR'),
  };
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const v = values[el.dataset.bind];
    if (v) el.textContent = v;
  });
}

// =====================================================================
// Places, favourites and trips: what the user does is kept between screens
// =====================================================================
const PLACES = [
  { id: 'bratan', name: 'Lac Bratan & Ulun Danu', loc: 'Bedugul, Bali', type: 'guide', rating: '4,8', reviews: '1 453', price: 45, was: 55, unit: '/pers.', promo: true, img: 'tour-temple', alt: 'Le temple Ulun Danu sur le lac Bratan', href: '08-hotel.html', map: [190, 95] },
  { id: 'palmeraie', name: 'Palmeraie Seminyak', loc: 'Seminyak, Bali', type: 'hotel', rating: '4,5', reviews: '4 136', price: 149, was: 169, unit: '/nuit', promo: true, img: 'vicoroy-hotel', alt: 'Piscine bordée de palmiers de la Palmeraie Seminyak', href: '08-hotel.html', map: [178, 192] },
  { id: 'alang', name: 'Villa Alang-Alang', loc: 'Ubud, Bali', type: 'hotel', rating: '4,7', reviews: '8 186', price: 112, unit: '/nuit', img: 'neano-hotel', alt: 'Villa au toit de chaume et sa piscine privée', href: '08-hotel.html', map: [232, 140] },
  { id: 'pasir', name: 'Pasir Putih Resort', loc: 'Nusa Dua, Bali', type: 'resort', rating: '4,9', reviews: '4 348', price: 189, unit: '/nuit', img: 'amnaya-resort', alt: 'Piscine à débordement du Pasir Putih Resort', href: '08-hotel.html', map: [214, 234] },
  { id: 'hutan', name: 'Hutan Lodge', loc: 'Sayan, Ubud', type: 'resort', rating: '5,0', reviews: '2 164', price: 124, unit: '/nuit', img: 'kastara-resort', alt: 'Le Hutan Lodge vu du ciel', href: '08-hotel.html', map: [214, 152] },
  { id: 'danau', name: 'Warung Danau', loc: 'Kintamani, Bali', type: 'restaurant', rating: '4,9', reviews: '3 726', price: 18, unit: '/pers.', img: 'kampung-cafe', alt: 'Terrasse du Warung Danau face au lac', href: '10-restaurant.html', map: [256, 102] },
];
const placeById = (id) => PLACES.find((p) => p.id === id);
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: the session still works */ } },
};

// favourites: three places liked out of the box, as in the original design
const favs = () => store.get('hush-favs', ['bratan', 'palmeraie', 'alang']);
function setFav(id, on) {
  const list = favs().filter((x) => x !== id);
  if (on) list.unshift(id);
  store.set('hush-favs', list);
  document.dispatchEvent(new CustomEvent('favschange'));
}
function paintFav(button, on) {
  button.setAttribute('aria-pressed', on);
  button.setAttribute('aria-label', on ? 'Retirer des favoris' : 'Ajouter aux favoris');
  button.querySelector('use').setAttribute('href', `../assets/icons.svg#sol-heart${on ? '' : '-linear'}`);
}
const syncFavs = () => document.querySelectorAll('[data-id] .fav').forEach((b) => paintFav(b, favs().includes(b.closest('[data-id]').dataset.id)));
syncFavs();
addEventListener('pageshow', syncFavs);

// one listing card, the same markup as the hand-written ones
const cardHtml = (p) => `
  <article class="listing listing--full" data-id="${p.id}" data-type="${p.type}">
    <div class="listing__media">
      <div class="ph ph--photo listing__img" style="--img: url(../assets/photos/${p.img}.jpg)" role="img" aria-label="${p.alt}"></div>
      ${p.promo ? `<span class="badge badge--off">−10${NB}%</span>` : ''}
      <button class="glass glass--32 glass--light fav" aria-pressed="false" aria-label="Ajouter aux favoris"><svg class="i"><use href="../assets/icons.svg#sol-heart-linear"/></svg></button>
    </div>
    <div class="listing__body">
      <h3><a class="card-link" href="${p.href}">${p.name}</a></h3>
      <p class="rating"><svg class="i"><use href="../assets/icons.svg#sol-star"/></svg>${p.rating} (${p.reviews.replace(' ', NB)})</p>
      <p class="loc"><svg class="i"><use href="../assets/icons.svg#sol-pin"/></svg>${p.loc}</p>
      <p class="price">${p.price}<span>${NB}€</span><small>${NB}${p.unit}</small>${p.was ? ` <s>${p.was}${NB}€</s>` : ''}</p>
    </div>
  </article>`;
const ratingOf = (p) => parseFloat(p.rating.replace(',', '.'));

// lists rendered from data: favourites page and search results
function renderList(list) {
  const kind = list.dataset.list;
  const chip = document.querySelector('.chips [aria-pressed="true"]')?.dataset.filter || 'all';
  const q = (document.querySelector('[data-search]')?.value || '').trim().toLowerCase();
  const f = window.hushFilters || {};
  let items = kind === 'favorites' ? favs().map(placeById).filter(Boolean) : PLACES;
  if (kind === 'favorites' && new URLSearchParams(location.search).has('vide')) items = []; // demo of the empty state
  items = items.filter((p) => (chip === 'all' || p.type === chip)
    && (!q || `${p.name} ${p.loc} ${p.type}`.toLowerCase().includes(q))
    && (!f.maxPrice || p.price <= f.maxPrice)
    && (!f.minRating || ratingOf(p) >= f.minRating)
    && (!f.promo || p.promo));
  list.innerHTML = items.map(cardHtml).join('');
  syncFavs();
  const empty = document.querySelector(`[data-empty="${kind}"]`);
  if (empty) {
    empty.hidden = items.length > 0;
    const term = empty.querySelector('[data-term]');
    if (term) term.textContent = q ? `pour « ${q} »` : 'avec ces filtres';
  }
  return items.length;
}
const lists = document.querySelectorAll('[data-list]');
const q0 = new URLSearchParams(location.search).get('q'); // demo: 07-search.html?q=…
if (q0 && document.querySelector('[data-search]')) document.querySelector('[data-search]').value = q0;
const rerender = () => lists.forEach(renderList);
lists.forEach(renderList);
document.addEventListener('chipchange', rerender);
document.addEventListener('favschange', () => document.querySelector('[data-list="favorites"]') && setTimeout(rerender, 250));
document.querySelector('[data-search]')?.addEventListener('input', rerender);
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-reset-search]')) return;
  const input = document.querySelector('[data-search]');
  if (input) input.value = '';
  window.hushFilters = {};
  document.querySelector('.chips [data-filter="all"]')?.click();
  document.querySelector('[data-open-filters]')?.classList.remove('is-on');
  rerender();
});

// filters sheet (search)
const filterSheet = document.querySelector('[data-filters]');
if (filterSheet) {
  const price = filterSheet.querySelector('[name="max-price"]'), priceOut = filterSheet.querySelector('[data-price-out]');
  const promo = filterSheet.querySelector('[name="promo"]'), count = filterSheet.querySelector('[data-count]');
  const read = () => ({
    maxPrice: +price.value < +price.max ? +price.value : 0,
    minRating: +(filterSheet.querySelector('[data-rating][aria-pressed="true"]')?.dataset.rating || 0),
    promo: promo.checked,
  });
  const preview = () => {
    priceOut.textContent = +price.value < +price.max ? `jusqu’à ${price.value}${NB}€` : 'Tous les prix';
    const saved = window.hushFilters; window.hushFilters = read();
    const n = renderList(document.querySelector('[data-list="search"]'));
    window.hushFilters = saved;
    renderList(document.querySelector('[data-list="search"]'));
    count.textContent = n ? `Afficher ${n} résultat${n > 1 ? 's' : ''}` : 'Aucun résultat';
  };
  const open = () => { filterSheet.hidden = false; preview(); filterSheet.querySelector('h2').focus(); };
  const close = () => { filterSheet.hidden = true; document.querySelector('[data-open-filters]').focus(); };
  document.querySelector('[data-open-filters]').addEventListener('click', open);
  filterSheet.addEventListener('input', preview);
  filterSheet.addEventListener('chipchange', preview);
  filterSheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-clear]')) { price.value = price.max; promo.checked = false; filterSheet.querySelector('[data-rating="0"]').click(); preview(); }
    if (e.target.closest('[data-apply]')) {
      window.hushFilters = read();
      document.querySelector('[data-open-filters]').classList.toggle('is-on', Object.values(window.hushFilters).some(Boolean));
      rerender(); close();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !filterSheet.hidden) close(); });
}

// ---------- trips: bookings made in the prototype show up in « Voyages » ----------
const trips = () => store.get('hush-trips', []);
function saveTrip(trip) {
  store.set('hush-trips', [trip, ...trips().filter((t) => t.key !== trip.key)]);
}
const tripList = document.querySelector('ul.trips');
if (tripList) {
  trips().forEach((t) => tripList.insertAdjacentHTML('afterbegin', `
      <li data-when="upcoming" data-type="${t.type}"><a class="trip" href="${t.href}">
        <div class="trip__top">
          <div><h2>${t.name}</h2><p class="loc loc--lg"><svg class="i"><use href="../assets/icons.svg#sol-pin"/></svg>${t.loc}</p></div>
          <svg class="i i--16"><use href="../assets/icons.svg#sol-chevron-right"/></svg>
        </div>
        <div class="divider"></div>
        <p class="trip__dates">${t.label} <strong>${t.dates}</strong><em class="is-new">Nouveau</em></p>
      </a></li>`));
  const update = () => {
    const tab = document.querySelector('[data-trips][aria-selected="true"]')?.dataset.trips || 'upcoming';
    const chip = document.querySelector('.chips [aria-pressed="true"]')?.dataset.filter || 'all';
    let shown = 0;
    tripList.querySelectorAll('li').forEach((li) => {
      li.hidden = li.dataset.when !== tab || (chip !== 'all' && li.dataset.type !== chip);
      if (!li.hidden) shown++;
    });
    document.querySelectorAll('[data-trips]').forEach((b) => { b.querySelector('span').textContent = tripList.querySelectorAll(`li[data-when="${b.dataset.trips}"]`).length; });
    const empty = document.querySelector('[data-empty="trips"]');
    if (empty) empty.hidden = shown > 0;
  };
  update();
  document.addEventListener('click', (e) => { if (e.target.closest('[data-trips]')) setTimeout(update); });
  document.addEventListener('chipchange', update);
}

// payment and table: the confirmed booking is saved as a trip
document.addEventListener('accepted', (e) => {
  const form = e.target;
  if (form.id === 'pay-form') {
    const dates = document.querySelector('[data-bind="dates"]')?.textContent;
    if (stay && dates) saveTrip({ key: `alang-${stay.start}-${stay.end}`, name: 'Villa Alang-Alang', loc: 'Ubud, Bali', type: 'hotel', href: '14-history-detail.html', label: document.querySelector('[data-bind="nights"]').textContent, dates: dates.replace(/^./, (c) => c.toLowerCase()) });
  }
  if (form.closest('.booking') && form.getAttribute('action') === '#table-ok') {
    const date = document.querySelector('[data-cal="single"]').value, time = document.querySelector('[data-group="time"] [aria-pressed="true"]').textContent;
    saveTrip({ key: `danau-${date}-${time}`, name: 'Warung Danau', loc: 'Kintamani, Bali', type: 'restaurant', href: '10-restaurant.html', label: 'Table', dates: `${date} · ${time}` });
  }
});

// payment: one tap fills the saved card
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-fill-card]')) return;
  const set = (sel, v) => { const i = document.querySelector(sel); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
  set('#card-number', '4970 1000 0000 3456'); set('#card-expiry', '09/29'); set('#card-cvc', '123');
  toast('Carte •••• 3456 sélectionnée');
});

// ---------- photo gallery on detail pages ----------
document.querySelectorAll('.gallery').forEach((g) => {
  const dots = g.parentElement.querySelectorAll('.pager i'), count = g.parentElement.querySelector('.gallery__count');
  g.parentElement.querySelector('.pager')?.classList.add('is-live');
  const update = () => {
    const i = Math.round(g.scrollLeft / g.clientWidth);
    dots.forEach((d, n) => d.classList.toggle('is-on', n === i));
    if (count) count.textContent = `${i + 1} / ${g.children.length}`;
  };
  g.addEventListener('scroll', update, { passive: true });
  update();
});

// demo for the overview page: ?erreurs shows the form's error state straight away
if (new URLSearchParams(location.search).has('erreurs')) {
  const form = document.querySelector('form[data-validate]');
  if (form) { validate(form); document.activeElement?.blur(); }
}
