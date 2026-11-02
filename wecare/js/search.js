// Wecare — recherche rapide : patients, praticiens et rendez-vous, depuis n'importe quelle page avec Ctrl + K.
(function () {
  const { icon, esc, norm } = UI;
  const { TODAY, NOW, fmt, hm } = Data;
  let active = 0;

  const when = a => `${fmt(a.date, { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')} à ${hm(a.start)}`;
  const row = (kind, id, mark, title, sub) => `<button type="button" class="find__row" role="option" data-act="findGo" data-kind="${kind}" data-id="${id}">
    ${mark}<span class="find__txt"><b>${title}</b><small>${sub}</small></span></button>`;
  const group = (label, rows) => rows.length ? `<p class="find__label">${label}</p>${rows.join('')}` : '';

  const apptRow = a => {
    const p = Data.patient(a.patient);
    return row('appt', a.id, `<span class="find__mark">${icon('calendar')}</span>`, `${esc(p.first)} ${esc(p.last)}, ${when(a)}`, `${esc(a.motif)} · ${esc(Data.prac(a.prac).short)}`);
  };

  function matches(q) {
    const digits = q.replace(/\D/g, '');
    const patients = Data.patients.filter(p => norm(`${p.first} ${p.last} ${p.last} ${p.first} ${p.id}`).includes(q)
      || (digits.length >= 4 && p.phone.replace(/\s/g, '').includes(digits)));
    const first = p => (norm(p.last).startsWith(q) ? 0 : 1);
    return {
      patients: patients.sort((a, b) => first(a) - first(b)).slice(0, 5),
      pracs: Data.practitioners.filter(p => norm(`${p.name} ${p.short} ${p.role}`).includes(q)).slice(0, 3),
    };
  }

  function results(text) {
    const q = norm(text.trim());
    if (!q) {
      const next = Data.apptsOn(TODAY).filter(a => a.status !== 'cancelled' && a.status !== 'absent' && a.start >= NOW).sort((a, b) => a.start - b.start).slice(0, 4);
      return group('Prochains rendez-vous', next.map(apptRow))
        + group('Actions', [row('new', '', `<span class="find__mark">${icon('plus')}</span>`, 'Nouveau rendez-vous', 'Ouvrir la prise de rendez-vous')]);
    }
    const { patients, pracs } = matches(q);
    const appts = patients.map(p => Data.nextAppt(p.id)).filter(Boolean).slice(0, 3);
    const html = group('Patients', patients.map(p => row('patient', p.id, UI.avatar(p, 'sm'), `${esc(p.first)} ${esc(p.last)}`, `${esc(p.id)} · ${esc(p.phone)}`)))
      + group('Rendez-vous à venir', appts.map(apptRow))
      + group('Praticiens', pracs.map(p => row('prac', p.id, `<span class="find__mark"><i class="tone-dot tone-${p.id}"></i></span>`, esc(p.short), esc(p.role))));
    return html || `<p class="find__none">Aucun résultat pour « ${esc(text.trim())} ».</p>`;
  }

  function highlight() {
    const list = [...document.querySelectorAll('.find__row')];
    list.forEach((el, i) => el.classList.toggle('is-active', i === active));
    list[active]?.scrollIntoView({ block: 'nearest' });
  }

  function fill(text) {
    active = 0;
    document.getElementById('findList').innerHTML = results(text);
    highlight();
  }

  function open() {
    const layer = document.getElementById('layer');
    layer.innerHTML = `<div class="scrim"></div>
      <div class="pop find" role="dialog" aria-label="Recherche rapide">
        <div class="find__bar">${icon('search')}
          <input id="findInput" class="find__input" data-input="findInput" placeholder="Patient, téléphone, n° de dossier, praticien…" autocomplete="off" aria-label="Rechercher" aria-controls="findList">
          <kbd>Esc</kbd>
        </div>
        <div class="find__list" id="findList" role="listbox"></div>
      </div>`;
    const pop = layer.querySelector('.find');
    if (!App.mobile.matches) pop.style.left = `${(innerWidth / App.scale - pop.offsetWidth) / 2}px`;
    fill('');
    document.getElementById('findInput').focus();
  }

  Object.assign(App.act, {
    openSearch() {
      if (document.querySelector('.find')) App.closeLayer(); else open();
    },
    findInput(el) { fill(el.value); },
    findGo(el) {
      const { kind, id } = el.dataset;
      App.closeLayer();
      if (kind === 'patient') App.go(`#/patients/${id}`);
      if (kind === 'appt') App.views.agenda.show(id);
      if (kind === 'new') App.views.booking.start();
      if (kind === 'prac') {
        App.S.hidden = new Set(Data.practitioners.filter(p => p.id !== id).map(p => p.id));
        App.go('#/agenda');
      }
    },
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      App.act.openSearch();
      return;
    }
    if (!document.querySelector('.find')) return;
    const list = document.querySelectorAll('.find__row');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.length) active = (active + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
      highlight();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      list[active]?.click();
    }
  });
})();
