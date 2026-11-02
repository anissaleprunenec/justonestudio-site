// Wecare — coquille de l'application : état, routes, en-tête, messages, réglages de démonstration.
(function () {
  const { icon, esc, LOGO } = UI;

  const SIM_OPTIONS = [
    ['normal', 'Données normales'],
    ['loading', 'Chargement'],
    ['empty', 'Vide'],
    ['error', 'Erreur réseau'],
    ['taken', 'Créneau déjà pris'],
  ];

  const App = window.App = {
    S: {
      route: { name: 'agenda' },
      role: 'secretariat',
      mode: 'week',
      focus: 'all',
      date: Data.TODAY,
      hidden: new Set(Data.practitioners.filter(p => p.id !== 'p1').map(p => p.id)),
      sim: 'normal',
      sideHidden: false,
      promoClosed: false,
      sms: { on: false, when: 'j1', text: 'Bonjour {prénom}, rappel de votre rendez-vous le {date} à {heure} avec {praticien}. Répondez ANNULER pour libérer le créneau.' },
      booting: true,
    },
    act: {},
    views: {},
    scale: 1,
    mobile: window.matchMedia('(max-width: 760px)'),

    go(hash) {
      if (location.hash === hash) App.render(); else location.hash = hash;
    },

    render() {
      const { S } = App;
      closeLayer();
      const view = App.views[S.route.name];
      document.getElementById('app').innerHTML = `${header()}<main class="main" id="main">${view.render()}</main>${tabbar()}`;
      if (view.after) view.after();
    },

    toast(text, action) {
      const box = document.getElementById('toasts');
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<span>${esc(text)}</span>`;
      if (action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = action.label;
        b.onclick = () => { el.remove(); action.run(); };
        el.append(b);
      } else {
        el.style.paddingRight = '20px';
      }
      box.append(el);
      setTimeout(() => el.remove(), 6000);
    },

    closeLayer,
    skeletonLines(n) {
      return Array.from({ length: n }, (_, i) => `<span class="sk" style="height:14px;width:${90 - (i * 17) % 40}%"></span>`).join('');
    },
    errorState(what) {
      return UI.state('error', {
        icon: 'wifiOff',
        title: `Impossible de charger ${what}`,
        text: 'La connexion au serveur du cabinet a échoué. Vos saisies en cours ne sont pas perdues.',
        action: `<button class="btn btn--primary btn--sm" data-act="retry">Réessayer</button>`,
      });
    },
  };

  // L'interface est dessinée pour 1440 × 900 : elle se met à l'échelle de la fenêtre, comme une maquette ajustée à l'écran.
  function fit() {
    const w = innerWidth, h = innerHeight;
    App.scale = w <= 760 ? 1 : Math.round(Math.max(.72, Math.min(1.25, w / 1440, h / 900)) * 100) / 100;
    document.documentElement.style.setProperty('--ui', App.scale);
  }

  function closeLayer() {
    document.getElementById('layer').innerHTML = '';
    if (App.views.agenda) App.views.agenda.clearSelection();
  }

  function header() {
    const { S } = App;
    const current = S.route.name;
    const link = (href, names, label) => `<a class="nav__link" href="${href}" ${names.includes(current) ? 'aria-current="page"' : ''}>${label}</a>`;
    const me = S.role === 'secretariat'
      ? { first: 'Nadia', last: 'Tessier', sex: 'F', title: 'Nadia Tessier, secrétariat' }
      : { ...Data.prac('p1'), title: 'Dr Hélène Vasseur' };
    const alerts = Data.apptsOn(Data.TODAY).filter(a => a.urgent && a.status === 'booked').length;
    return `<header class="top">
      <a class="brand" href="#/agenda" aria-label="Wecare, retour à l’agenda">${LOGO}</a>
      <nav class="nav" aria-label="Navigation principale">
        ${link('#/patients', ['patients', 'patient'], 'Patients')}
        ${link('#/agenda', ['agenda'], 'Agenda')}
        ${link('#/rdv', ['booking'], 'Rendez-vous')}
      </nav>
      <div class="top__end">
        <button type="button" class="icon-btn" data-act="openSearch" aria-label="Recherche rapide" title="Recherche rapide (Ctrl + K)" aria-haspopup="dialog">${icon('search')}</button>
        <button type="button" class="icon-btn" data-act="menuSettings" aria-label="Réglages" aria-haspopup="true">${icon('gear')}</button>
        <button type="button" class="icon-btn" data-act="menuAlerts" aria-label="Notifications, ${alerts} nouvelle${alerts > 1 ? 's' : ''}" aria-haspopup="true">${icon('bell')}${alerts ? '<span class="dot-alert"></span>' : ''}</button>
        <span class="top__me" title="${esc(me.title)}">${UI.avatar(me)}</span>
      </div>
    </header>`;
  }

  function tabbar() {
    const current = App.S.route.name;
    const link = (href, names, label, ic) => `<a href="${href}" ${names.includes(current) ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`;
    return `<nav class="tabbar" aria-label="Navigation mobile">
      ${link('#/agenda', ['agenda'], 'Agenda', 'calendar')}
      ${link('#/rdv', ['booking'], 'Rendez-vous', 'plus')}
      ${link('#/patients', ['patients', 'patient'], 'Patients', 'users')}
    </nav>`;
  }

  Object.assign(App.act, {
    menuSettings(el) {
      const { S } = App;
      App.views.agenda.menu('settings', el, `
        <p class="menu__title">Voir en tant que</p>
        <div class="seg" role="group" aria-label="Voir l’application en tant que">
          <button type="button" data-act="role" data-role="secretariat" aria-pressed="${S.role === 'secretariat'}">Secrétariat</button>
          <button type="button" data-act="role" data-role="praticien" aria-pressed="${S.role === 'praticien'}">Praticien</button>
        </div>
        <p class="menu__title">Simuler un état</p>
        ${SIM_OPTIONS.map(([k, l]) => `<button type="button" role="menuitemradio" aria-checked="${S.sim === k}" data-act="sim" data-sim="${k}">${S.sim === k ? icon('check') : '<span class="icon"></span>'}${l}</button>`).join('')}
        <p class="menu__title">Messages</p>
        <button type="button" data-act="openSms">${icon('phone')}<span>Rappels SMS : ${S.sms.on ? App.smsLabel().toLowerCase() : 'désactivés'}</span></button>
        <p class="menu__title">Démonstration</p>
        <button type="button" data-act="openGuide">${icon('info')}<span>Revoir le guide</span></button>
        <button type="button" data-act="askReset">${icon('swap')}<span>Réinitialiser la démo</span></button>
        <a class="menu__link" href="design-system.html">Design system ${icon('right')}</a>`);
    },
    menuAlerts(el) {
      const list = Data.apptsOn(Data.TODAY).filter(a => a.urgent && a.status === 'booked');
      App.views.agenda.menu('alerts', el, `<p class="menu__title">Notifications</p>${list.length
        ? list.map(a => { const p = Data.patient(a.patient); return `<button type="button" data-act="openAppt" data-id="${a.id}">${icon('alert')}<span>Urgence à ${Data.hm(a.start)} : ${esc(p.first)} ${esc(p.last)}</span></button>`; }).join('')
        : '<p class="muted menu__none">Rien de nouveau.</p>'}`);
    },
    role(el) {
      const { S } = App;
      S.role = el.dataset.role;
      S.hidden = new Set(S.role === 'praticien' ? Data.practitioners.filter(p => p.id !== 'p1').map(p => p.id) : []);
      App.render();
    },
    sim(el) {
      App.S.sim = el.dataset.sim;
      App.render();
      if (el.dataset.sim === 'taken') App.toast('Le prochain créneau confirmé sera pris entre-temps.');
    },
    retry() {
      App.S.sim = 'normal';
      App.render();
    },
    link(el) {
      App.go(el.dataset.href);
    },
  });

  function parseRoute() {
    const [, a, b] = location.hash.split('/');
    if (a === 'patients' && b) return { name: 'patient', id: b };
    if (a === 'patients') return { name: 'patients' };
    if (a === 'rdv') return { name: 'booking' };
    return { name: 'agenda' };
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && App.act[el.dataset.act]) {
      App.act[el.dataset.act](el, e);
      return;
    }
    if (!e.target.closest('.pop')) closeLayer();
  });
  document.addEventListener('input', e => {
    const name = e.target.dataset.input;
    if (name && App.act[name]) App.act[name](e.target, e);
  });
  document.addEventListener('change', e => {
    const name = e.target.dataset.change;
    if (name && App.act[name]) App.act[name](e.target, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const id = document.querySelector('.pop')?.dataset.id;
      closeLayer();
      if (id) document.querySelector(`.evt[data-id="${id}"]`)?.focus();
    }
  });

  window.addEventListener('hashchange', () => {
    App.S.route = parseRoute();
    document.getElementById('main')?.scrollTo(0, 0);
    if (App.S.route.name === 'booking') App.views.booking.enter();
    App.render();
    const title = document.querySelector('#main h1');
    if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  });
  App.mobile.addEventListener('change', () => App.render());
  window.addEventListener('resize', () => { closeLayer(); fit(); });

  document.addEventListener('DOMContentLoaded', () => {
    fit();
    App.S.route = parseRoute();
    if (App.S.route.name === 'booking') App.views.booking.enter();
    App.render();
    setTimeout(() => { App.S.booting = false; App.render(); }, 550);
  });
})();
