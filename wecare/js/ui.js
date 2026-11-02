// Wecare — petits gabarits partagés entre l'application et le design system.
(function () {
  const PATHS = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 8 9 6 9-6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"/><path d="M14 2v5h5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
    down: '<circle cx="12" cy="12" r="9"/><path d="m8.5 10.5 3.5 3.5 3.5-3.5"/>',
    download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M10 3v18M10 12h11"/>',
    support: '<rect x="4" y="3" width="16" height="18" rx="4"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.6-2 2-3 4-3s3.4 1 4 3"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="3"/><path d="M7 14h10v7H7z"/>',
    swap: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    door: '<path d="M16 3H7a2 2 0 0 0-2 2v16M16 3a2 2 0 0 1 2 2v16M3 21h18"/><path d="M13 12h.01"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
    steth: '<path d="M6 3H4v6a5 5 0 0 0 10 0V3h-2"/><path d="M9 14v2a5 5 0 0 0 10 0v-2"/><circle cx="19" cy="12" r="2"/>',
    userX: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
    move: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    wifiOff: '<path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M2 8.8a15 15 0 0 1 4.2-2.8M19 13a10 10 0 0 0-2.5-1.8M22 8.8A15 15 0 0 0 10.7 5M12 20h.01"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const STATUS_ICON = { arrived: 'userCheck', inconsult: 'steth', done: 'check', absent: 'userX', cancelled: 'x', booked: 'clock' };

  function statusBadge(status) {
    return `<span class="badge badge--${status}">${icon(STATUS_ICON[status])}${Data.STATUS[status]}</span>`;
  }
  const urgentBadge = () => `<span class="badge badge--urgent">${icon('alert')}Urgence</span>`;

  function avatar(person, size = '') {
    const initials = person.initials || (person.first[0] + person.last[0]);
    return `<span class="avatar ${size ? 'avatar--' + size : ''}" aria-hidden="true">${esc(initials)}</span>`;
  }

  // Carte de rendez-vous. Le point dit le praticien, la pastille dit le statut, l'heure passe en premier.
  const PILLS = {
    urgent: ['Urgence', 'alert'], arrived: ['En attente', 'userCheck'], inconsult: ['En cours', 'steth'],
    done: ['Terminé', 'check'], absent: ['Absent', 'userX'], cancelled: ['Annulé', 'x'],
  };
  function evt(a, opts = {}) {
    const p = Data.patient(a.patient);
    const stateKey = a.urgent ? 'urgent' : a.status;
    const pill = PILLS[stateKey];
    const flag = pill && (a.urgent || a.status === 'absent' || a.status === 'cancelled') ? icon(pill[1], 'evt__flag') : '';
    const cls = ['evt', `tone-${a.prac}`, `is-${a.status}`, a.urgent ? 'is-urgent' : '', opts.xs ? 'evt--xs' : '', opts.selected ? 'is-selected' : '', opts.move ? 'is-movable' : ''].join(' ');
    const label = `${p.first} ${p.last}, ${Data.hm(a.start)}, ${a.motif}, ${Data.prac(a.prac).short}, ${a.urgent ? 'urgence, ' : ''}${Data.STATUS[a.status]}`;
    const attrs = `class="${cls}" style="${opts.style || ''}" aria-label="${esc(label)}" title="${esc(label)}" data-id="${a.id}" ${opts.demo ? 'tabindex="-1"' : 'data-act="openAppt"'}`;
    const body = opts.xs
      ? `<i class="evt__dot"></i><span class="evt__meta">${Data.hm(a.start)}</span><span class="evt__name">${esc(opts.doc ? Data.prac(a.prac).short : a.motif)}</span>${flag}`
      : `<span class="evt__top"><span class="evt__meta">${Data.hm(a.start)}<span class="evt__end"> - ${Data.hm(a.start + a.dur)}</span></span>${pill ? `<span class="evt__pill evt__pill--${stateKey}">${icon(pill[1])}<span>${pill[0]}</span></span>` : ''}</span>
        <span class="evt__main"><span class="evt__who"><i class="evt__dot"></i><span class="evt__name">${esc(p.first[0])}. ${esc(p.last)}</span></span><span class="evt__motif">${esc(a.motif)}</span></span>`;
    return `<button type="button" ${attrs}>${body}</button>`;
  }

  function state(kind, o) {
    return `<div class="state ${kind === 'error' ? 'state--error' : ''}" ${kind === 'error' ? 'role="alert"' : ''}>
      <span class="state__icon">${icon(o.icon)}</span>
      <h2>${o.title}</h2><p>${o.text}</p>${o.action || ''}
    </div>`;
  }

  const LOGO = `<svg class="logo" viewBox="0 0 150 52" width="150" height="52" aria-hidden="true"><defs><linearGradient id="logoGrad" x1="12" y1="3" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#1A5BEE"/><stop offset="1" stop-color="#1A5BEE" stop-opacity=".7"/></linearGradient></defs><path transform="translate(0 2) scale(2)" fill="url(#logoGrad)" fill-rule="evenodd" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM10.6 6.5v2.6H8v2.8h2.6v2.6h2.8v-2.6H16V9.1h-2.6V6.5h-2.8z"/><text x="56" y="36" font-family="Inter Tight, sans-serif" font-size="27" font-weight="600" letter-spacing="-.3" fill="#293F6D">Wecare</text></svg>`;

  window.UI = { icon, esc, norm, statusBadge, urgentBadge, avatar, evt, state, LOGO };
})();
