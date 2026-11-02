// Wecare — prise de rendez-vous en quatre étapes.
(function () {
  const { icon, esc, norm } = UI;
  const { TODAY, fmt, hm, addDays, monday, weekday } = Data;
  const STEPS = ['Patient', 'Motif', 'Créneau', 'Confirmation'];
  const blank = () => ({
    step: 0, patient: null, prac: null, motif: null, dur: null, urgent: false, note: '',
    date: null, start: null, day: null, q: '', newForm: false, newP: { first: '', last: '', phone: '' },
    errors: {}, sms: true, taken: null, saveError: false, saving: false, done: null, rescheduleId: null,
  });
  let B = blank();

  const dateLong = d => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const fieldError = msg => msg ? `<p class="field__error" role="alert">${icon('alert')}${esc(msg)}</p>` : '';

  function start(o = {}) {
    B = blank();
    if (o.rescheduleId) {
      const a = Data.appts.find(x => x.id === o.rescheduleId);
      Object.assign(B, { rescheduleId: a.id, patient: a.patient, prac: a.prac, motif: a.motif, dur: a.dur, urgent: !!a.urgent, step: 2, day: a.date < TODAY ? TODAY : a.date });
    } else {
      if (o.patient) { B.patient = o.patient; B.step = 1; }
      if (o.prac) B.prac = o.prac;
      if (o.date) { B.day = o.date; B.date = o.date; B.start = o.start; }
    }
    B.fresh = true;
    App.go('#/rdv');
  }

  function results() {
    const q = norm(B.q.trim());
    const digits = q.replace(/\D/g, '');
    const list = q ? Data.patients.filter(p => norm(`${p.first} ${p.last} ${p.last} ${p.first}`).includes(q) || (digits.length >= 4 && p.phone.replace(/\s/g, '').includes(digits))) : Data.patients.slice(0, 5);
    if (!list.length) {
      return `<div class="bk-empty"><p>Aucun patient pour « ${esc(B.q)} ».</p><button type="button" class="btn btn--secondary btn--sm" data-act="bkNew">${icon('plus')}Créer ce patient</button></div>`;
    }
    return `<ul class="pick">${list.slice(0, 6).map(p => `<li><button type="button" class="pick__row ${B.patient === p.id ? 'is-on' : ''}" data-act="bkPatient" data-id="${p.id}" aria-pressed="${B.patient === p.id}">
      ${UI.avatar(p)}<span class="pick__txt"><b>${esc(p.first)} ${esc(p.last)}</b><small>${fmt(p.birth, { day: 'numeric', month: 'short', year: 'numeric' })} · ${p.phone}</small></span>${B.patient === p.id ? icon('check', 'pick__ok') : ''}
    </button></li>`).join('')}</ul>`;
  }

  function stepPatient() {
    if (B.newForm) {
      const n = B.newP, e = B.errors;
      const input = (id, label, val, err, attrs = '') => `<div class="field"><label for="${id}">${label}</label><input class="input ${err ? 'is-error' : ''}" id="${id}" value="${esc(val)}" data-input="bkNewField" data-key="${id.slice(1).toLowerCase()}" ${err ? `aria-invalid="true"` : ''} ${attrs}>${fieldError(err)}</div>`;
      return `<h2>Nouveau patient</h2><p class="muted">Trois informations suffisent. Le dossier se complétera à l’accueil.</p>
      <div class="form2">
        ${input('nFirst', 'Prénom', n.first, e.first, 'autocomplete="off"')}
        ${input('nLast', 'Nom', n.last, e.last, 'autocomplete="off"')}
        ${input('nPhone', 'Téléphone', n.phone, e.phone, 'inputmode="tel" autocomplete="off"')}
      </div>
      <button type="button" class="btn btn--ghost btn--sm" data-act="bkExisting">Chercher un patient existant</button>`;
    }
    return `<h2>Pour quel patient ?</h2>
    <div class="search"><label class="sr" for="bkQ">Rechercher un patient</label>${icon('search')}<input class="input ${B.errors.patient ? 'is-error' : ''}" id="bkQ" type="search" placeholder="Nom ou téléphone" value="${esc(B.q)}" data-input="bkSearch"></div>
    ${fieldError(B.errors.patient)}
    <p class="bk-label">${B.q ? 'Résultats' : 'Patients récents'}</p>
    <div id="bkResults">${results()}</div>
    ${B.q ? '' : `<button type="button" class="btn btn--ghost btn--sm" data-act="bkNew">${icon('plus')}Nouveau patient</button>`}`;
  }

  function stepMotif() {
    const p = B.prac && Data.prac(B.prac);
    return `<h2>Avec qui, et pour quoi ?</h2>
    <p class="bk-label">Praticien</p>
    <div class="pracgrid">${Data.practitioners.map(x => `<button type="button" class="praccard tone-${x.id} ${B.prac === x.id ? 'is-on' : ''}" data-act="bkPrac" data-id="${x.id}" aria-pressed="${B.prac === x.id}">
      ${UI.avatar(x)}<span><b>${esc(x.short)}</b><small>${esc(x.role)}</small></span></button>`).join('')}</div>
    ${fieldError(B.errors.prac)}
    ${p ? `<p class="bk-label">Motif</p>
    <div class="motifs">${p.motifs.map(m => `<button type="button" class="chip" data-act="bkMotif" data-label="${esc(m.label)}" data-dur="${m.dur}" aria-pressed="${B.motif === m.label}">${esc(m.label)}<span class="muted">${m.dur} min</span></button>`).join('')}</div>
    ${fieldError(B.errors.motif)}` : ''}
    <label class="urgent-toggle ${B.urgent ? 'is-on' : ''}">
      <input type="checkbox" data-change="bkUrgent" ${B.urgent ? 'checked' : ''}>
      <span><b>${icon('alert')}Urgence</b><small>Propose d’abord le premier créneau libre et signale le rendez-vous dans l’agenda.</small></span>
    </label>
    <div class="field"><label for="bkNote">Note pour le praticien <span class="muted">(facultatif)</span></label><textarea class="input" id="bkNote" data-input="bkNoteInput" placeholder="Symptômes, contexte de l’appel…">${esc(B.note)}</textarea></div>`;
  }

  function stepSlot() {
    const mon = monday(B.day || TODAY);
    const days = Array.from({ length: 6 }, (_, i) => addDays(mon, i));
    const day = B.day || days[0];
    const ignore = B.rescheduleId;
    const list = Data.slots(B.prac, day, B.dur, ignore);
    const part = (label, items) => items.length ? `<p class="bk-label">${label}</p><div class="slots">${items.map(slotBtn).join('')}</div>` : '';
    const slotBtn = s => `<button type="button" class="slot ${B.date === day && B.start === s.start ? 'is-selected' : ''}" ${s.free ? '' : 'disabled aria-label="' + hm(s.start) + ', déjà pris"'} data-act="bkSlot" data-date="${day}" data-start="${s.start}">${hm(s.start)}</button>`;
    const altBtn = o => `<button type="button" class="slot is-suggested" data-act="bkSlot" data-date="${o.date}" data-start="${o.start}">${fmt(o.date, { weekday: 'short', day: 'numeric' }).replace('.', '')} · ${hm(o.start)}</button>`;
    const first = Data.nextFree(B.prac, TODAY, B.dur, 3, ignore);
    const hasFree = list.some(s => s.free);
    return `<h2>${B.rescheduleId ? 'Choisir le nouveau créneau' : 'Quel créneau ?'}</h2>
    ${B.taken ? `<div class="banner banner--danger" role="alert">${icon('alert')}<div>
      <strong>Le créneau de ${hm(B.taken.start)} vient d’être pris</strong>
      <p>${esc(B.taken.by)} a réservé ${dateLong(B.taken.date)} à ${hm(B.taken.start)} pendant votre saisie. Votre dossier est conservé : choisissez un autre créneau.</p>
      <div class="slots slots--inline">${B.taken.alts.map(altBtn).join('')}</div>
    </div></div>` : ''}
    ${B.urgent && !B.taken ? `<div class="banner banner--info">${icon('alert')}<div><strong>Premiers créneaux disponibles</strong><div class="slots slots--inline">${first.map(altBtn).join('')}</div></div></div>` : ''}
    <div class="weeknav">
      <button type="button" class="icon-btn icon-btn--sm" data-act="bkWeek" data-n="-7" aria-label="Semaine précédente" ${mon <= monday(TODAY) ? 'disabled' : ''}>${icon('left')}</button>
      <div class="daypicks">${days.map(d => {
        const free = Data.slots(B.prac, d, B.dur, ignore).filter(s => s.free).length;
        return `<button type="button" class="daypick" data-act="bkDay" data-date="${d}" ${d === day ? 'aria-current="date"' : ''} ${free ? '' : 'disabled'}>
          <span>${fmt(d, { weekday: 'short' }).replace('.', '')} ${fmt(d, { day: 'numeric' })}</span><small>${free ? `${free} libre${free > 1 ? 's' : ''}` : (Data.CLOSED[d] ? 'Fermé' : '—')}</small></button>`;
      }).join('')}</div>
      <button type="button" class="icon-btn icon-btn--sm" data-act="bkWeek" data-n="7" aria-label="Semaine suivante">${icon('right')}</button>
    </div>
    ${list.some(s => !s.free) ? '<p class="muted">Les horaires barrés sont déjà pris.</p>' : ''}
    ${list.length ? `${part('Matin', list.filter(s => s.start < Data.LUNCH[0]))}${part('Après-midi', list.filter(s => s.start >= Data.LUNCH[0]))}
      ${hasFree ? '' : `<div class="banner banner--warning">${icon('info')}<div><strong>Journée complète</strong><p>Choisissez un autre jour ci-dessus.</p></div></div>`}`
      : UI.state('empty', { icon: 'calendar', title: `${Data.prac(B.prac).short} ne consulte pas ce jour`, text: 'Choisissez une autre date dans la semaine.' })}
    ${fieldError(B.errors.slot)}`;
  }

  function stepConfirm() {
    const p = Data.patient(B.patient);
    const pr = Data.prac(B.prac);
    return `<h2>${B.rescheduleId ? 'Vérifier le déplacement' : 'Vérifier et confirmer'}</h2>
    ${B.saveError ? `<div class="banner banner--danger" role="alert">${icon('wifiOff')}<div><strong>Rendez-vous non enregistré</strong><p>La connexion a échoué. Rien n’est perdu, vous pouvez réessayer.</p></div></div>` : ''}
    <dl class="recap">
      <div><dt>Patient</dt><dd><b>${esc(p.first)} ${esc(p.last)}</b><br>${p.phone}</dd></div>
      <div><dt>Praticien</dt><dd><b>${esc(pr.name)}</b><br>${esc(pr.role)}</dd></div>
      <div><dt>Motif</dt><dd><b>${esc(B.motif)}</b><br>${B.dur} min${B.urgent ? ' · Urgence' : ''}</dd></div>
      <div><dt>Créneau</dt><dd><b>${dateLong(B.date)}</b><br>${hm(B.start)} – ${hm(B.start + B.dur)}</dd></div>
    </dl>
    ${p.alert ? `<div class="banner banner--warning">${icon('alert')}<div><strong>${esc(p.alert)}</strong><p>Cette alerte figure au dossier.</p></div></div>` : ''}
    <label class="check"><input type="checkbox" data-change="bkSms" ${B.sms ? 'checked' : ''}>Envoyer un rappel par SMS la veille</label>`;
  }

  function doneScreen() {
    const a = B.done;
    const p = Data.patient(a.patient);
    return `<div class="pagehead"><div><h1>Rendez-vous</h1></div></div>
    <section class="panel bk-done">
      <span class="bk-done__ok">${icon('check')}</span>
      <h2>${B.rescheduleId ? 'Rendez-vous déplacé' : 'Rendez-vous confirmé'}</h2>
      <p>${esc(p.first)} ${esc(p.last)}, ${dateLong(a.date)} à ${hm(a.start)}, avec ${esc(Data.prac(a.prac).name)}.</p>
      ${B.sms ? '<p class="muted">Rappel SMS programmé la veille.</p>' : ''}
      <div class="bk-done__cta">
        <button type="button" class="btn btn--primary" data-act="bkSeeAgenda">Voir dans l’agenda</button>
        <button type="button" class="btn btn--secondary" data-act="bkAgain">Nouveau rendez-vous</button>
      </div>
    </section>`;
  }

  function aside() {
    const p = B.patient && Data.patient(B.patient);
    const pr = B.prac && Data.prac(B.prac);
    const row = (label, val) => `<div><dt>${label}</dt><dd>${val || '<span class="muted">À choisir</span>'}</dd></div>`;
    return `<aside class="bk-aside ${pr ? 'tone-' + pr.id : ''} ${B.step === 3 ? 'is-last' : ''}">
      <h2>Récapitulatif</h2>
      <dl>
        ${row('Patient', p && `${esc(p.first)} ${esc(p.last)}`)}
        ${row('Praticien', pr && esc(pr.short))}
        ${row('Motif', B.motif && `${esc(B.motif)} · ${B.dur} min`)}
        ${row('Créneau', B.date && B.start !== null && `${fmt(B.date, { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}, ${hm(B.start)}`)}
      </dl>
      ${B.urgent ? UI.urgentBadge() : ''}
    </aside>`;
  }

  function render() {
    if (B.done) return doneScreen();
    const view = [stepPatient, stepMotif, stepSlot, stepConfirm][B.step]();
    const last = B.step === 3;
    const label = B.rescheduleId ? 'Confirmer le déplacement' : 'Confirmer le rendez-vous';
    return `<div class="pagehead"><div class="bk-title">
      <button type="button" class="bk-back" data-act="bkQuit"><span class="bk-back__i">${icon('left')}</span>Retour à l’agenda${icon('calendar')}</button>
      <h1>${B.rescheduleId ? 'Déplacer un rendez-vous' : 'Nouveau rendez-vous'}</h1>
    </div></div>
    ${B.resumed ? `<div class="banner banner--info bk-resume">${icon('info')}<div><strong>Reprise de votre saisie</strong><p>Le rendez-vous commencé plus tôt est conservé.</p></div><button type="button" class="btn btn--ghost btn--sm" data-act="bkAgain">Recommencer</button></div>` : ''}
    <div class="bk">
      <section class="panel bk-main">
        <ol class="steps" aria-label="Étapes">${STEPS.map((s, i) => `<li class="${i < B.step ? 'is-done' : i === B.step ? 'is-current' : ''}" ${i === B.step ? 'aria-current="step"' : ''}>${i + 1}. ${s}</li>`).join('')}</ol>
        <div class="bk-body">${view}</div>
        <div class="bk-foot">
          ${B.step > 0 && !(B.rescheduleId && B.step === 2) ? `<button type="button" class="btn btn--secondary" data-act="bkBack">Retour</button>` : '<span></span>'}
          <button type="button" class="btn btn--primary ${B.saving ? 'is-loading' : ''}" data-act="${last ? 'bkConfirm' : 'bkNext'}">${last ? label : 'Continuer'}</button>
        </div>
      </section>
      ${aside()}
    </div>`;
  }

  function validate() {
    const e = {};
    if (B.step === 0) {
      if (B.newForm) {
        if (!B.newP.first.trim()) e.first = 'Indiquez le prénom.';
        if (!B.newP.last.trim()) e.last = 'Indiquez le nom.';
        if (B.newP.phone.replace(/\D/g, '').length !== 10) e.phone = 'Le numéro doit compter 10 chiffres.';
      } else if (!B.patient) e.patient = 'Choisissez un patient ou créez-en un.';
    }
    if (B.step === 1) {
      if (!B.prac) e.prac = 'Choisissez un praticien.';
      else if (!B.motif) e.motif = 'Choisissez un motif.';
    }
    if (B.step === 2 && (B.date === null || B.start === null)) e.slot = 'Choisissez un créneau.';
    B.errors = e;
    return !Object.keys(e).length;
  }

  function createPatient() {
    const n = B.newP;
    const digits = n.phone.replace(/\D/g, '');
    const p = {
      id: `P-${1042 + Data.patients.length}`, first: n.first.trim(), last: n.last.trim(), sex: 'F', birth: '1990-01-01',
      ref: 'p1', status: 'nouveau', phone: digits.replace(/(\d{2})(?=\d)/g, '$1 '), email: '—', address: 'À compléter', city: '', notes: [], docs: [],
    };
    Data.patients.push(p);
    B.patient = p.id;
    B.newForm = false;
  }

  function firstUsefulDay() {
    const free = Data.nextFree(B.prac, B.day && B.day >= TODAY ? B.day : TODAY, B.dur, 1, B.rescheduleId)[0];
    return free ? free.date : TODAY;
  }

  // Si le créneau pré-rempli depuis l'agenda ne convient plus à la durée choisie, on le retire.
  function checkPrefill() {
    if (B.date === null || B.start === null) return;
    if (Data.conflict(B.prac, B.date, B.start, B.dur, B.rescheduleId) || !Data.slots(B.prac, B.date, B.dur, B.rescheduleId).some(s => s.start === B.start)) {
      B.start = null;
      B.date = null;
    }
  }

  function commit() {
    if (B.rescheduleId) {
      const a = Data.appts.find(x => x.id === B.rescheduleId);
      Object.assign(a, { date: B.date, start: B.start, status: 'booked' });
      return a;
    }
    return Data.add(B.prac, B.date, B.start, B.dur, B.patient, B.motif, 'booked', { urgent: B.urgent, note: B.note.trim() || undefined });
  }

  Object.assign(App.act, {
    bkSearch(el) {
      B.q = el.value;
      B.errors = {};
      document.getElementById('bkResults').innerHTML = results();
    },
    bkPatient(el) { B.patient = el.dataset.id; B.errors = {}; App.render(); },
    bkNew() { B.newForm = true; B.errors = {}; const parts = B.q.trim().split(/\s+/); B.newP.first = parts[0] || ''; B.newP.last = parts.slice(1).join(' '); App.render(); },
    bkExisting() { B.newForm = false; B.errors = {}; App.render(); },
    bkNewField(el) { B.newP[el.dataset.key] = el.value; },
    bkPrac(el) {
      if (B.prac !== el.dataset.id) { B.motif = null; B.dur = null; }
      B.prac = el.dataset.id;
      B.errors = {};
      App.render();
    },
    bkMotif(el) { B.motif = el.dataset.label; B.dur = Number(el.dataset.dur); B.errors = {}; App.render(); },
    bkUrgent(el) { B.urgent = el.checked; App.render(); },
    bkNoteInput(el) { B.note = el.value; },
    bkDay(el) { B.day = el.dataset.date; App.render(); },
    bkWeek(el) {
      const d = addDays(monday(B.day), Number(el.dataset.n));
      B.day = d < TODAY ? TODAY : d;
      App.render();
    },
    bkSlot(el) {
      B.date = el.dataset.date;
      B.day = B.date;
      B.start = Number(el.dataset.start);
      B.errors = {};
      App.render();
    },
    bkSms(el) { B.sms = el.checked; },
    bkNext() {
      if (!validate()) { App.render(); return; }
      if (B.step === 0 && B.newForm) createPatient();
      if (B.step === 1) {
        checkPrefill();
        if (!B.day || !Data.nextFree(B.prac, B.day, B.dur, 1).some(f => f.date === B.day)) B.day = firstUsefulDay();
      }
      if (B.step === 2) B.taken = null;
      B.step += 1;
      App.render();
      document.getElementById('main').scrollTo(0, 0);
    },
    bkBack() { B.errors = {}; B.saveError = false; B.step -= 1; App.render(); },
    bkQuit() {
      const started = B.patient || B.step > 0;
      if (!started) B = blank();
      App.go('#/agenda');
      if (started) App.toast('Saisie conservée', { label: 'Reprendre', run() { App.go('#/rdv'); } });
    },
    bkConfirm() {
      B.saving = true;
      B.saveError = false;
      App.render();
      setTimeout(() => {
        B.saving = false;
        const { sim } = App.S;
        if (sim === 'error') { B.saveError = true; App.render(); return; }
        const clash = Data.conflict(B.prac, B.date, B.start, B.dur, B.rescheduleId);
        if (sim === 'taken' || clash) {
          // Un autre poste du cabinet a réservé la même plage entre-temps.
          if (!clash) Data.add(B.prac, B.date, B.start, B.dur, Data.patients[60].id, Data.prac(B.prac).motifs[0].label, 'booked');
          App.S.sim = 'normal';
          B.taken = {
            date: B.date, start: B.start, by: 'Un autre poste du cabinet',
            alts: Data.nextFree(B.prac, B.date, B.dur, 3, B.rescheduleId),
          };
          B.day = B.date;
          B.date = null;
          B.start = null;
          B.step = 2;
          App.render();
          document.getElementById('main').scrollTo(0, 0);
          return;
        }
        B.done = commit();
        App.render();
      }, 700);
    },
    bkSeeAgenda() {
      App.S.date = B.done.date;
      if (App.S.hidden.has(B.done.prac)) App.S.hidden = new Set(Data.practitioners.filter(p => p.id !== B.done.prac).map(p => p.id));
      App.go('#/agenda');
    },
    bkAgain() { start(); },
  });

  App.views.booking = {
    render, start,
    enter() {
      if (B.fresh) { B.fresh = false; return; }
      if (B.done || !(B.step || B.patient || B.prac)) B = blank();
      else B.resumed = true;
    },
  };
})();
