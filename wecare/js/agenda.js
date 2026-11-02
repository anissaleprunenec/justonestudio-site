// Wecare — agenda : jour par praticien, semaine, liste mobile, détail d'un rendez-vous.
(function () {
  const { icon, esc } = UI;
  const { TODAY, NOW, DAY_START, DAY_END, LUNCH, CLOSED, fmt, hm, addDays, monday, weekday } = Data;
  let PPM = 128 / 60;
  const y = m => (m - DAY_START) * PPM;
  const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START + (i + 1) * 60);
  const VIEW = { week: 'Semaine', day: 'Jour' };
  const FOCUS = { all: 'Tous', urgent: 'Urgences', cancelled: 'Annulés' };

  let selectedId = null;
  let keepScroll = null;
  let enter = false;
  let changedId = null;
  let pendingId = null;
  let drag = null;
  let justDragged = false;
  let pendingMove = null;

  const matchesFocus = a => {
    const { focus } = App.S;
    if (focus === 'urgent') return a.urgent;
    if (focus === 'cancelled') return a.status === 'cancelled';
    return true;
  };
  const visible = list => list.filter(a => !App.S.hidden.has(a.prac) && matchesFocus(a));
  const visiblePracs = date => Data.practitioners.filter(p => !App.S.hidden.has(p.id) && Data.worksOn(p, date));
  const capitalize = s => s[0].toUpperCase() + s.slice(1);
  const canMove = a => a.status === 'booked' && (a.date > TODAY || (a.date === TODAY && a.start > NOW));
  const byDay = () => App.S.mode === 'day' || App.mobile.matches;
  const stacked = () => App.S.mode === 'week' && Data.practitioners.length - App.S.hidden.size > 2;

  // Répartit les rendez-vous qui se chevauchent en colonnes.
  function layout(list) {
    const sorted = [...list].sort((a, b) => a.start - b.start || b.dur - a.dur);
    const out = [];
    let cluster = [], end = -1;
    const flush = () => {
      const lanes = [];
      cluster.forEach(a => {
        let i = lanes.findIndex(l => l <= a.start);
        if (i < 0) { i = lanes.length; lanes.push(0); }
        lanes[i] = a.start + a.dur;
        a._lane = i;
      });
      cluster.forEach(a => out.push({ a, lane: a._lane, lanes: lanes.length }));
      cluster = [];
    };
    sorted.forEach(a => {
      if (cluster.length && a.start >= end) { flush(); end = -1; }
      cluster.push(a);
      end = Math.max(end, a.start + a.dur);
    });
    if (cluster.length) flush();
    return out;
  }

  function eventsHtml(list, opts = {}) {
    return layout(list).map(({ a, lane, lanes }) => {
      const w = 100 / lanes;
      const style = `position:absolute;top:${y(a.start) + 4}px;height:${a.dur * PPM - 7}px;left:calc(${lane * w}% + 6px);width:calc(${w}% - 12px)`;
      return UI.evt(a, { style, short: opts.short || lanes > 1, selected: a.id === selectedId, move: canMove(a) });
    }).join('');
  }

  const lunchBand = () => `<div class="band" style="top:${y(LUNCH[0])}px;height:${(LUNCH[1] - LUNCH[0]) * PPM}px"></div>`;

  function nowLine(show) {
    return show ? `<div class="nowline" style="top:${y(NOW)}px"><span>${hm(NOW)}</span></div>` : '';
  }

  function gutter(showsNow) {
    return `<div class="cal__hours">${HOURS.filter(m => !(showsNow && m === NOW)).map(m => `<span style="top:${y(m)}px">${hm(m)}</span>`).join('')}</div>`;
  }

  function dayGrid() {
    const { S } = App;
    const pracs = visiblePracs(S.date);
    if (!pracs.length) return emptyDay();
    const appts = visible(Data.apptsOn(S.date));
    return `<div class="cal__grid" style="--cols:${pracs.length};--col-min:118px;--hour:${60 * PPM}px">
      <div class="cal__corner">GMT+1</div>
      ${pracs.map(p => `<div class="cal__colhead"><i class="tone-dot tone-${p.id}"></i>${esc(p.short)}</div>`).join('')}
      <div class="cal__body" style="height:${y(DAY_END)}px">
        ${lunchBand()}${gutter(S.date === TODAY)}
        ${pracs.map(p => `<div class="col" data-date="${S.date}" data-prac="${p.id}">${eventsHtml(appts.filter(a => a.prac === p.id))}</div>`).join('')}
        ${nowLine(S.date === TODAY)}
      </div>
    </div>`;
  }

  const dayHead = d => `<button type="button" class="cal__colhead ${d === TODAY ? 'is-today' : d < TODAY ? 'is-past' : ''}" data-act="openDay" data-date="${d}" aria-label="Voir le ${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}">${fmt(d, { weekday: 'short' }).replace('.', '')} ${fmt(d, { day: 'numeric' })}</button>`;

  // Praticiens encore disponibles sur une heure à venir.
  function freeAt(date, start) {
    return Data.practitioners.filter(p => Data.worksOn(p, date) && Data.slots(p.id, date, 60).some(s => s.start === start && s.free));
  }

  // Toute l'équipe sur une semaine : une ligne par docteur occupé, puis le nombre de docteurs libres.
  function stacksHtml(list, date) {
    const order = a => Data.practitioners.findIndex(p => p.id === a.prac);
    return [...new Set(list.map(a => a.start))].map(start => {
      const free = App.S.focus === 'all' ? freeAt(date, start) : [];
      return `<div class="evt-stack" style="top:${y(start) + 4}px;height:${60 * PPM - 8}px">
        ${list.filter(a => a.start === start).sort((a, b) => order(a) - order(b)).map(a => UI.evt(a, { xs: true, doc: true, selected: a.id === selectedId, move: canMove(a) })).join('')}
        ${free.length ? `<button type="button" class="evt-stack__free" data-act="bookHour" data-date="${date}" data-start="${start}" data-prac="${free.length === 1 ? free[0].id : ''}" title="Libres : ${esc(free.map(p => p.short).join(', '))}">+ ${free.length} libre${free.length > 1 ? 's' : ''}</button>` : ''}
      </div>`;
    }).join('');
  }

  function weekGrid() {
    const { S } = App;
    const mon = monday(S.date);
    const days = Array.from({ length: 6 }, (_, i) => addDays(mon, i));
    const n = Data.practitioners.length - S.hidden.size;
    return `<div class="cal__grid" style="--cols:6;--col-min:96px;--hour:${60 * PPM}px">
      <div class="cal__corner">GMT+1</div>
      ${days.map(dayHead).join('')}
      <div class="cal__body" style="height:${y(DAY_END)}px">
        ${lunchBand()}${gutter(days.includes(TODAY))}
        ${days.map(d => CLOSED[d]
          ? `<div class="col col--closed"><span>Cabinet fermé<br>${CLOSED[d]}</span></div>`
          : `<div class="col ${d === TODAY ? 'is-today' : d < TODAY ? 'is-past' : ''}" data-date="${d}" ${n === 1 ? `data-prac="${Data.practitioners.find(p => !S.hidden.has(p.id)).id}"` : ''}>${n > 2 ? stacksHtml(visible(Data.apptsOn(d)), d) : eventsHtml(visible(Data.apptsOn(d)), { short: n > 1 })}</div>`).join('')}
        ${nowLine(days.includes(TODAY))}
      </div>
    </div>`;
  }

  function listView() {
    const { S } = App;
    const mon = monday(S.date);
    const days = Array.from({ length: 6 }, (_, i) => addDays(mon, i));
    const list = visible(Data.apptsOn(S.date)).sort((a, b) => a.start - b.start);
    return `<div class="daystrip">
      ${days.map(d => `<button type="button" data-act="openDay" data-date="${d}" ${d === S.date ? 'aria-current="date"' : ''}><span>${fmt(d, { weekday: 'short' }).replace('.', '')}</span><b>${fmt(d, { day: 'numeric' })}</b></button>`).join('')}
    </div>
    <div class="pfilter">${Data.practitioners.map(p => `<button type="button" class="chip" data-act="togglePrac" data-prac="${p.id}" aria-pressed="${!S.hidden.has(p.id)}"><i class="tone-dot tone-${p.id}"></i>${esc(p.short)}</button>`).join('')}</div>
    ${S.sim === 'empty' || !list.length ? emptyDay() : `<ol class="agenda-list">${list.map(a => `<li><span class="agenda-list__t">${hm(a.start)}</span>${UI.evt(a, { selected: a.id === selectedId })}</li>`).join('')}</ol>`}`;
  }

  function emptyDay() {
    const { S } = App;
    const closed = CLOSED[S.date];
    return UI.state('empty', {
      icon: 'calendar',
      title: closed ? `Cabinet fermé — ${closed}` : 'Aucun rendez-vous ce jour',
      text: closed ? 'Le cabinet rouvre le jour ouvré suivant.' : 'L’agenda est libre pour les praticiens sélectionnés.',
      action: closed ? '' : `<a class="btn btn--primary btn--sm" href="#/rdv">${icon('plus')}Nouveau rendez-vous</a>`,
    });
  }

  function skeleton() {
    return `<div class="cal__sk" aria-label="Chargement de l’agenda" role="status">
      ${Array.from({ length: 4 }, (_, c) => `<div>
        <span class="sk" style="height:32px;width:70%;margin-bottom:24px"></span>
        ${Array.from({ length: 3 }, (_, i) => `<span class="sk" style="height:${110 + ((c + i) * 37) % 60}px;margin-bottom:${10 + ((c * i) * 13) % 30}px;border-radius:15px"></span>`).join('')}
      </div>`).join('')}
    </div>`;
  }

  function miniCalendar() {
    const { S } = App;
    const first = S.date.slice(0, 8) + '01';
    const start = monday(first);
    const month = first.slice(0, 7);
    const week = monday(S.date);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i % 7 === 0 && d.slice(0, 7) > month) break;
      const inWeek = monday(d) === week && weekday(d) < 6;
      cells.push(`<button type="button" data-act="openDate" data-date="${d}" class="${[
        d.slice(0, 7) !== month ? 'is-out' : '',
        d === TODAY ? 'is-today' : '',
        d === S.date ? 'is-sel' : '',
        inWeek ? 'is-week' : '',
        inWeek && weekday(d) === 0 ? 'is-week-start' : '',
        inWeek && weekday(d) === 5 ? 'is-week-end' : '',
        CLOSED[d] ? 'is-closed' : '',
      ].join(' ')}" aria-label="${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}" ${d === S.date ? 'aria-current="date"' : ''}><span>${Number(d.slice(8))}</span></button>`);
    }
    return `<section class="mini">
      <div class="side__head">
        <h2>${capitalize(fmt(first, { month: 'long', year: 'numeric' }))}</h2>
        <button type="button" class="round round--on" data-act="shiftMonth" data-n="-1" aria-label="Mois précédent">${icon('left')}</button>
        <button type="button" class="round" data-act="shiftMonth" data-n="1" aria-label="Mois suivant">${icon('right')}</button>
      </div>
      <div class="mini__body">
        <div class="mini__grid mini__dow" aria-hidden="true">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="mini__grid">${cells.join('')}</div>
      </div>
    </section>`;
  }

  function doctors() {
    const { S } = App;
    const selected = S.hidden.size === Data.practitioners.length - 1 ? Data.practitioners.find(p => !S.hidden.has(p.id)).id : S.hidden.size ? null : '';
    const list = (byDay() ? Data.apptsOn(S.date) : Data.appts.filter(a => monday(a.date) === monday(S.date))).filter(a => a.status !== 'cancelled');
    const row = (id, mark, name, role, n) => `<li><button type="button" class="doc" data-act="selectPrac" data-prac="${id}" aria-pressed="${selected === id}">
      ${mark}<span class="doc__txt"><b>${name}</b><small>${role}</small></span><span class="doc__n">${n}</span></button></li>`;
    return `<section class="doctors">
      <div class="side__head"><h2>Praticiens</h2></div>
      <ul class="doc-list">
        ${row('', `<span class="doc__all">${icon('users')}</span>`, 'Tous', 'Toute l’équipe', list.length)}
        ${Data.practitioners.map(p => row(p.id, `<i class="tone-dot tone-${p.id}"></i>`, esc(p.short), esc(p.role), list.filter(a => a.prac === p.id).length)).join('')}
      </ul>
    </section>`;
  }

  function waiting() {
    const list = Data.apptsOn(TODAY).filter(a => a.status === 'arrived').sort((a, b) => a.arrivedAt - b.arrivedAt);
    return `<section class="waitlist">
      <div class="side__head"><h2>Salle d’attente</h2><span class="round round--count" aria-label="${list.length} patients en attente">${list.length}</span></div>
      ${list.length ? `<ul class="wait">${list.map(a => {
        const p = Data.patient(a.patient);
        const mins = NOW - a.arrivedAt;
        return `<li><button type="button" data-act="openAppt" data-id="${a.id}">
          ${UI.avatar(p, 'sm')}<span class="wait__who"><b>${esc(p.first)} ${esc(p.last)}</b><small>${esc(Data.prac(a.prac).short)}</small></span>
          <span class="wait__t ${mins >= 20 ? 'is-long' : ''}">${icon('clock')}${mins} min</span></button></li>`;
      }).join('')}</ul>` : '<p class="muted wait__none">Personne n’attend pour le moment.</p>'}
    </section>`;
  }

  function promo() {
    if (App.S.promoClosed) return '';
    const n = Data.appts.filter(a => monday(a.date) === monday(TODAY) && a.status === 'absent').length;
    return `<section class="promo" aria-label="Rappels SMS">
      <button type="button" class="promo__close" data-act="closePromo" aria-label="Fermer">${icon('x')}</button>
      <b>${n ? `${n} absent${n > 1 ? 's' : ''} cette semaine` : 'Moins d’oublis'}</b>
      <p>Moins d’oublis avec les rappels SMS</p>
      <button type="button" class="promo__cta" data-act="openSms">Activer</button>
    </section>`;
  }

  // L'encart cède la place dès que le panneau devrait défiler.
  function fitPromo() {
    const side = document.querySelector('.side');
    const banner = side?.querySelector('.promo');
    if (!banner) return;
    banner.hidden = false;
    banner.hidden = side.scrollHeight > side.clientHeight;
  }
  addEventListener('resize', fitPromo);

  function counts() {
    const { S } = App;
    const list = (byDay()
      ? Data.apptsOn(S.date)
      : Data.appts.filter(a => monday(a.date) === monday(S.date))).filter(a => !S.hidden.has(a.prac));
    const active = list.filter(a => a.status !== 'cancelled');
    return { all: active.length, urgent: active.filter(a => a.urgent).length, cancelled: list.length - active.length };
  }

  function calTitle() {
    const { S } = App;
    if (byDay()) return capitalize(fmt(S.date, { weekday: 'long', day: 'numeric', month: 'long' }));
    const mon = monday(S.date), sat = addDays(mon, 5);
    const sameMonth = mon.slice(5, 7) === sat.slice(5, 7);
    return `${fmt(mon, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} - ${fmt(sat, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }

  function board() {
    const { S } = App;
    if (S.sim === 'error') return App.errorState('l’agenda');
    if (S.sim === 'loading' || S.booting) return skeleton();
    if (S.sim === 'empty') return emptyDay();
    if (S.mode === 'day') return !CLOSED[S.date] ? dayGrid() : emptyDay();
    return weekGrid();
  }

  function render() {
    const { S } = App;
    const m = App.mobile.matches;
    PPM = (stacked() ? 108 : 128) / 60;
    const n = S.sim === 'normal' && !S.booting ? counts() : null;
    return `<div class="pagehead pagehead--agenda">
      <div class="pagehead__t"><h1>Agenda</h1></div>
      <div class="tools">
        <button type="button" class="tool" data-act="menuView" aria-haspopup="true">${icon('calendar')}${VIEW[S.mode]}${icon('down')}</button>
        <button type="button" class="tool" data-act="exportCsv">${icon('download')}Exporter</button>
        <span class="tools__gap"></span>
        <button type="button" class="tool tool--round" data-act="menuSettings" aria-haspopup="true" aria-label="États" title="États">${icon('support')}</button>
        <button type="button" class="tool tool--round" data-act="toggleSide" aria-pressed="${!S.sideHidden}" aria-label="Afficher ou masquer le panneau" title="Afficher ou masquer le panneau">${icon('layout')}</button>
      </div>
      <a class="btn btn--primary pagehead__cta" href="#/rdv">${icon('plus')}Nouveau rendez-vous</a>
    </div>
    <div class="board ${S.sideHidden ? 'no-side' : ''}">
      <aside class="side">${doctors()}${waiting()}${promo()}</aside>
      <section class="cal" aria-label="Agenda">
        <div class="cal__bar">
          <h2 class="cal__title"><button type="button" data-act="menuDate" aria-haspopup="true">${calTitle()}${icon('down')}</button></h2>
          <button type="button" class="today" data-act="today">Aujourd’hui</button>
          <div class="cal__nav">
            <button type="button" data-act="shift" data-n="-1" aria-label="Précédent">${icon('left')}</button>
            <button type="button" data-act="shift" data-n="1" aria-label="Suivant">${icon('right')}</button>
          </div>
          <div class="seg seg--count cal__focus" role="group" aria-label="Afficher">
            ${Object.entries(FOCUS).map(([k, l]) => `<button type="button" data-act="focus" data-focus="${k}" aria-pressed="${S.focus === k}">${l}${n ? `<span class="seg__n ${n[k] ? (k === 'urgent' ? 'is-urgent' : '') : 'is-zero'}">${n[k]}</span>` : ''}</button>`).join('')}
          </div>
          <span class="cal__sep"></span>
          <button type="button" class="plain" data-act="print" aria-label="Imprimer l’agenda">${icon('print')}</button>
          <a class="plain" href="#/patients" aria-label="Voir les patients">${icon('users')}</a>
        </div>
        <div class="cal__scroll ${enter ? 'is-enter' : ''}" id="calScroll">${m && S.sim !== 'error' && S.sim !== 'loading' && !S.booting ? listView() : board()}</div>
      </section>
    </div>`;
  }

  function after() {
    const box = document.getElementById('calScroll');
    if (!box) return;
    fitPromo();
    const scrollsToNow = box.querySelector('.cal__grid');
    box.scrollTop = keepScroll !== null ? keepScroll : scrollsToNow ? Math.max(37, y(NOW) - box.clientHeight / 2) : 0;
    if (App.mobile.matches && keepScroll === null && App.S.date === TODAY) {
      box.querySelector('.is-inconsult, .is-arrived, .is-booked')?.closest('li')?.scrollIntoView({ block: 'start' });
    }
    keepScroll = null;
    enter = false;
    if (changedId) { document.querySelector(`.evt[data-id="${changedId}"]`)?.classList.add('is-changed'); changedId = null; }
    box.addEventListener('pointermove', onHover);
    box.addEventListener('pointerleave', hideGhost);
    if (pendingId) {
      const id = pendingId;
      pendingId = null;
      document.querySelector(`.evt[data-id="${id}"]`)?.scrollIntoView({ block: 'center' });
      selectAndOpen(id);
    }
  }

  // Survol d'une plage libre : on affiche l'heure et un clic ouvre la prise de rendez-vous.
  function slotAt(col, clientY) {
    const rect = col.getBoundingClientRect();
    const min = Math.floor((clientY - rect.top) / App.scale / PPM / 60) * 60 + DAY_START;
    if (min < DAY_START || min >= DAY_END || (min >= LUNCH[0] && min < LUNCH[1])) return null;
    const { date, prac } = col.dataset;
    const taken = visible(Data.apptsOn(date)).some(a => (!prac || a.prac === prac) && a.start < min + 60 && min < a.start + a.dur);
    return taken ? null : min;
  }
  function hideGhost() {
    document.querySelector('.ghost')?.remove();
  }
  function onHover(e) {
    if (drag) return;
    const col = e.target.classList?.contains('col') && e.target.dataset.date ? e.target : (e.target.classList?.contains('ghost') ? e.target.parentElement : null);
    if (!col) { hideGhost(); return; }
    const min = slotAt(col, e.clientY);
    hideGhost();
    if (min === null) return;
    const g = document.createElement('div');
    g.className = 'ghost';
    g.style.top = `${y(min) + 4}px`;
    g.style.height = `${60 * PPM - 7}px`;
    g.textContent = `+ ${hm(min)}`;
    col.append(g);
  }

  // Glisser-déposer : un rendez-vous à venir se pose sur une heure libre, avec le même contrôle que la prise de rendez-vous.
  function dropTarget(e) {
    const col = document.elementFromPoint(e.clientX, e.clientY)?.closest('.col[data-date]');
    if (!col) return null;
    const start = Math.floor((e.clientY - col.getBoundingClientRect().top) / App.scale / PPM / 60) * 60 + DAY_START;
    const prac = col.dataset.prac || drag.a.prac;
    const ok = Data.slots(prac, col.dataset.date, drag.a.dur, drag.a.id).some(s => s.start === start && s.free);
    return { col, start, prac, ok };
  }

  function drawDrop(target) {
    document.querySelector('.drop')?.remove();
    if (!target) return;
    const d = document.createElement('div');
    d.className = `drop ${target.ok ? '' : 'is-bad'}`;
    d.style.top = `${y(target.start) + 4}px`;
    d.style.height = `${drag.a.dur * PPM - 7}px`;
    d.textContent = target.ok ? hm(target.start) : 'Indisponible';
    target.col.append(d);
  }

  function endDrag(apply) {
    if (!drag) return;
    const { a, card, on, target } = drag;
    drag = null;
    document.body.classList.remove('is-moving');
    card.classList.remove('is-dragging');
    const date = target?.col.dataset.date;
    const same = date === a.date && target?.start === a.start && target?.prac === a.prac;
    const ask = on && apply && target?.ok && !same;
    if (!ask) document.querySelector('.drop')?.remove();
    if (!on) return;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
    if (!apply || !target || same) return;
    if (!target.ok) { App.toast('Ce créneau n’est pas disponible'); return; }
    askMove(a, date, target);
  }

  // Le dépôt ne suffit pas : le déplacement concerne un patient, on demande confirmation.
  function askMove(a, date, target) {
    const p = Data.patient(a.patient);
    const moment = (d, m) => `${capitalize(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }))} à ${hm(m)}`;
    pendingMove = { a, date, start: target.start, prac: target.prac };
    const layer = document.getElementById('layer');
    layer.innerHTML = `<div class="scrim"></div>
      <div class="pop confirm" role="alertdialog" aria-label="Confirmer le déplacement">
        <h2>Déplacer ce rendez-vous ?</h2>
        <p>${esc(p.first)} ${esc(p.last)} · ${esc(a.motif)}</p>
        <div class="confirm__move"><span>${moment(a.date, a.start)}${target.prac !== a.prac ? ` · ${esc(Data.prac(a.prac).short)}` : ''}</span>${icon('right')}<b>${moment(date, target.start)}${target.prac !== a.prac ? ` · ${esc(Data.prac(target.prac).short)}` : ''}</b></div>
        <div class="confirm__cta">
          <button type="button" class="btn btn--ghost btn--sm" data-act="closePop">Annuler</button>
          <button type="button" class="btn btn--primary btn--sm" data-act="moveConfirm">Déplacer</button>
        </div>
      </div>`;
    const pop = layer.querySelector('.confirm');
    pop.style.left = `${(innerWidth / App.scale - pop.offsetWidth) / 2}px`;
    pop.querySelector('[data-act="moveConfirm"]').focus();
  }

  document.addEventListener('pointerdown', e => {
    const card = e.target.closest?.('#calScroll .evt.is-movable');
    if (!card || e.button !== 0 || e.pointerType !== 'mouse') return;
    drag = { a: Data.appts.find(x => x.id === card.dataset.id), card, x: e.clientX, y: e.clientY, on: false, target: null };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!e.buttons) { endDrag(false); return; }
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.on = true;
      App.closeLayer();
      hideGhost();
      drag.card.classList.add('is-dragging');
      document.body.classList.add('is-moving');
    }
    const box = document.getElementById('calScroll').getBoundingClientRect();
    if (e.clientY < box.top + 60) document.getElementById('calScroll').scrollTop -= 14;
    if (e.clientY > box.bottom - 40) document.getElementById('calScroll').scrollTop += 14;
    drag.target = dropTarget(e);
    drawDrop(drag.target);
  });
  document.addEventListener('pointerup', () => endDrag(true));
  document.addEventListener('pointercancel', () => endDrag(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') endDrag(false); });
  // Le relâchement ne doit pas ouvrir le détail de la carte déplacée.
  document.addEventListener('click', e => {
    if (justDragged) { justDragged = false; e.stopPropagation(); e.preventDefault(); }
  }, true);

  function place(pop, anchor) {
    if (App.mobile.matches || !anchor) return;
    const s = App.scale;
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const vw = innerWidth / s, vh = innerHeight / s;
    const left = r.right / s + 10 + w < vw ? r.right / s + 10 : Math.max(12, r.left / s - w - 10);
    pop.style.left = `${left}px`;
    pop.style.top = `${Math.max(12, Math.min(vh - h - 12, r.top / s + 8))}px`;
  }

  function popover(a, anchor, confirming) {
    const p = Data.patient(a.patient);
    const pr = Data.prac(a.prac);
    const layer = document.getElementById('layer');
    const isToday = a.date === TODAY;
    const open = a.status === 'booked' || a.status === 'arrived';
    const dateStr = capitalize(fmt(a.date, { weekday: 'long', day: 'numeric', month: 'long' }));
    const next = {
      booked: isToday ? ['arrived', 'Arrivé'] : null,
      arrived: ['inconsult', 'Démarrer'],
      inconsult: ['done', 'Terminer'],
    }[a.status];
    const row = (ic, title, sub, end = '') => `<div class="sched__row">${ic}<div class="sched__txt"><b>${title}</b>${sub}</div>${end}</div>`;

    const body = confirming ? `
      <div class="sched__row sched__row--col">
        <b>Annuler le rendez-vous de ${esc(p.first)} ${esc(p.last)} ?</b>
        <p class="muted">${dateStr}, ${hm(a.start)}. Le créneau redevient libre.</p>
        <div class="field"><label for="cancelReason">Motif d’annulation</label>
          <select class="input" id="cancelReason"><option>Demande du patient</option><option>Demande du cabinet</option><option>Praticien indisponible</option></select></div>
      </div>
      <div class="sched__foot">
        <button type="button" class="link" data-act="openAppt" data-id="${a.id}">Retour</button>
        <button type="button" class="btn btn--danger btn--sm" data-act="cancelConfirm" data-id="${a.id}">Annuler le rendez-vous</button>
      </div>` : `
      ${row(`<i class="sched__dot tone-${a.prac}"></i>`, `${esc(p.first)} ${esc(p.last)}`, `<span class="sched__links"><a href="#/patients/${p.id}">Voir la fiche</a><a href="tel:${p.phone.replace(/\s/g, '')}">${p.phone}</a></span>`)}
      ${row(icon('clock'), 'Horaire', `<span>${hm(a.start)} → ${hm(a.start + a.dur)}</span>`, open ? `<button type="button" class="plain" data-act="reschedule" data-id="${a.id}" aria-label="Déplacer le rendez-vous" title="Déplacer">${icon('swap')}</button>` : '')}
      ${row(icon('steth'), esc(a.motif), `<span>${esc(pr.name)}</span>`)}
      ${App.S.sms.on && a.status === 'booked' ? row(icon('phone'), 'Rappel SMS', `<span>${esc(App.smsLabel())}</span>`) : ''}
      ${p.alert ? `<div class="sched__row sched__row--alert">${icon('alert')}<b>${esc(p.alert)}</b></div>` : ''}
      ${a.note ? `<div class="sched__row sched__row--note"><p>${esc(a.note)}</p></div>` : ''}
      ${a.cancelReason && a.status === 'cancelled' ? `<div class="sched__row sched__row--note"><p>${esc(a.cancelReason)}</p></div>` : ''}
      ${next || open ? `<div class="sched__foot">
        ${open ? `<button type="button" class="link" data-act="cancelAsk" data-id="${a.id}">Annuler</button>` : ''}
        ${a.status === 'booked' && isToday ? `<button type="button" class="link" data-act="advance" data-id="${a.id}" data-to="absent">Absent</button>` : ''}
        ${next ? `<button type="button" class="btn btn--primary btn--sm" data-act="advance" data-id="${a.id}" data-to="${next[0]}">${next[1]}</button>` : ''}
      </div>` : ''}`;

    layer.innerHTML = `<div class="pop sched" data-id="${a.id}" role="dialog" aria-label="Rendez-vous de ${esc(p.first)} ${esc(p.last)}" tabindex="-1">
      <div class="sched__head"><h2>${a.urgent ? 'Urgence' : Data.STATUS[a.status]}</h2>
        <button type="button" class="round" data-act="closePop" aria-label="Fermer">${icon('x')}</button></div>
      ${body}
    </div>`;

    const pop = layer.firstElementChild;
    place(pop, anchor && anchor.isConnected ? anchor : document.querySelector(`.evt[data-id="${a.id}"]`));
    pop.focus({ preventScroll: true });
  }

  function menu(key, anchor, html, cls = '') {
    const layer = document.getElementById('layer');
    if (layer.querySelector(`[data-menu="${key}"]`)) { App.closeLayer(); return; }
    layer.innerHTML = `<div class="pop menu ${cls}" data-menu="${key}" role="menu" tabindex="-1">${html}</div>`;
    const pop = layer.firstElementChild;
    if (!App.mobile.matches) {
      const s = App.scale;
      const r = anchor.getBoundingClientRect();
      pop.style.top = `${r.bottom / s + 8}px`;
      pop.style.left = `${Math.max(12, Math.min(innerWidth / s - pop.offsetWidth - 12, r.left / s))}px`;
    }
    pop.focus({ preventScroll: true });
  }

  const redrawKeeping = () => {
    keepScroll = document.getElementById('calScroll')?.scrollTop ?? null;
    App.render();
  };

  function selectAndOpen(id, confirming) {
    const a = Data.appts.find(x => x.id === id);
    keepScroll = document.getElementById('calScroll')?.scrollTop ?? null;
    selectedId = null;
    App.render();
    selectedId = id;
    document.querySelector(`.evt[data-id="${id}"]`)?.classList.add('is-selected');
    popover(a, document.querySelector(`.evt[data-id="${id}"]`), confirming);
  }

  Object.assign(App.act, {
    openAppt(el) { selectAndOpen(el.dataset.id); },
    closePop() { App.closeLayer(); },
    cancelAsk(el) { selectAndOpen(el.dataset.id, true); },
    cancelConfirm(el) {
      const a = Data.appts.find(x => x.id === el.dataset.id);
      const before = a.status;
      a.status = 'cancelled';
      a.cancelReason = document.getElementById('cancelReason').value;
      redrawKeeping();
      App.toast('Rendez-vous annulé', { label: 'Rétablir', run() { a.status = before; delete a.cancelReason; redrawKeeping(); } });
    },
    advance(el) {
      const a = Data.appts.find(x => x.id === el.dataset.id);
      const before = a.status;
      a.status = el.dataset.to;
      if (a.status === 'arrived') a.arrivedAt = NOW;
      changedId = a.id;
      redrawKeeping();
      App.toast(`${Data.patient(a.patient).last} : ${Data.STATUS[a.status].toLowerCase()}`, { label: 'Annuler', run() { a.status = before; redrawKeeping(); } });
    },
    reschedule(el) {
      App.views.booking.start({ rescheduleId: el.dataset.id });
    },
    bookHour(el) {
      const { date, start, prac } = el.dataset;
      keepScroll = document.getElementById('calScroll').scrollTop;
      App.views.booking.start({ date, start: Number(start), prac: prac || undefined });
    },
    moveConfirm() {
      const { a, date, start, prac } = pendingMove;
      const before = { date: a.date, start: a.start, prac: a.prac };
      Object.assign(a, { date, start, prac });
      changedId = a.id;
      redrawKeeping();
      App.toast(`Déplacé au ${fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })} à ${hm(start)}`, {
        label: 'Annuler',
        run() { Object.assign(a, before); changedId = a.id; redrawKeeping(); },
      });
    },
    closePromo() {
      App.S.promoClosed = true;
      redrawKeeping();
    },
    menuDate(el) { menu('date', el, miniCalendar(), 'menu--cal'); },
    menuView(el) {
      menu('view', el, Object.entries(VIEW).map(([k, l]) => `<button type="button" role="menuitemradio" aria-checked="${App.S.mode === k}" data-act="mode" data-mode="${k}">${App.S.mode === k ? icon('check') : '<span class="icon"></span>'}${l}</button>`).join(''));
    },
    mode(el) {
      App.S.mode = el.dataset.mode;
      enter = true;
      App.render();
    },
    focus(el) {
      App.S.focus = el.dataset.focus;
      enter = true;
      redrawKeeping();
      // Le rendez-vous filtré peut se trouver hors de l'écran.
      const box = document.getElementById('calScroll');
      const tops = [...box.querySelectorAll('.evt')].map(e => e.getBoundingClientRect().top);
      if (App.S.focus !== 'all' && tops.length) box.scrollTop += (Math.min(...tops) - box.getBoundingClientRect().top) / App.scale - 70;
    },
    toggleSide() {
      App.S.sideHidden = !App.S.sideHidden;
      redrawKeeping();
    },
    print() { window.print(); },
    exportCsv() {
      const { S } = App;
      const list = visible(S.mode === 'day' ? Data.apptsOn(S.date) : Data.appts.filter(a => monday(a.date) === monday(S.date)))
        .sort((a, b) => (a.date + hm(a.start)).localeCompare(b.date + hm(b.start)));
      const rows = [['Date', 'Début', 'Fin', 'Patient', 'Praticien', 'Motif', 'Statut']].concat(list.map(a => {
        const p = Data.patient(a.patient);
        return [a.date, hm(a.start), hm(a.start + a.dur), `${p.first} ${p.last}`, Data.prac(a.prac).name, a.motif, Data.STATUS[a.status]];
      }));
      const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      link.download = `agenda-${S.date}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      App.toast(`${list.length} rendez-vous exportés`);
    },
    today() {
      App.S.date = TODAY;
      enter = true;
      App.render();
    },
    shift(el) {
      const { S } = App;
      const n = Number(el.dataset.n);
      enter = true;
      if (!byDay()) S.date = addDays(S.date, n * 7);
      else {
        S.date = addDays(S.date, n);
        if (weekday(S.date) === 6) S.date = addDays(S.date, n);
      }
      redrawKeeping();
    },
    shiftMonth(el) {
      const { S } = App;
      const n = Number(el.dataset.n);
      const [yy, mm] = S.date.split('-').map(Number);
      S.date = new Date(Date.UTC(yy, mm - 1 + n, 1)).toISOString().slice(0, 10);
      if (weekday(S.date) === 6) S.date = addDays(S.date, 1);
      redrawKeeping();
      App.act.menuDate(document.querySelector('[data-act="menuDate"]'));
    },
    openDate(el) {
      App.S.date = el.dataset.date;
      enter = true;
      redrawKeeping();
    },
    openDay(el) {
      App.S.date = el.dataset.date;
      App.S.mode = 'day';
      enter = true;
      redrawKeeping();
    },
    selectPrac(el) {
      const { S } = App;
      const id = el.dataset.prac;
      S.hidden = new Set(id ? Data.practitioners.filter(p => p.id !== id).map(p => p.id) : []);
      enter = true;
      keepScroll = null;
      App.render();
    },
    togglePrac(el) {
      const { hidden } = App.S;
      hidden.has(el.dataset.prac) ? hidden.delete(el.dataset.prac) : hidden.add(el.dataset.prac);
      redrawKeeping();
    },
  });

  // Clic sur une plage libre de la grille.
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    const col = e.target.closest('.col');
    const onGhost = e.target.classList.contains('ghost');
    if (!col || !col.dataset.date || (e.target !== col && !onGhost)) return;
    const min = slotAt(col, e.clientY);
    if (min === null) return;
    keepScroll = document.getElementById('calScroll').scrollTop;
    App.views.booking.start({ date: col.dataset.date, start: min, prac: col.dataset.prac });
  });

  App.views.agenda = {
    render, after, menu,
    show(id) {
      const { S } = App;
      const a = Data.appts.find(x => x.id === id);
      S.date = a.date;
      S.focus = 'all';
      if (S.hidden.has(a.prac)) S.hidden = new Set();
      pendingId = id;
      App.go('#/agenda');
    },
    clearSelection() {
      selectedId = null;
      document.querySelector('.drop')?.remove();
      document.querySelectorAll('.evt.is-selected').forEach(n => n.classList.remove('is-selected'));
    },
  };
})();
