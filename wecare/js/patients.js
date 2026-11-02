// Wecare — liste des patients et fiche patient.
(function () {
  const { icon, esc, norm } = UI;
  const { fmt, hm, PATIENT_STATUS } = Data;
  const PAGE = 25;
  const f = { q: '', prac: '', status: '', sort: 'name', limit: PAGE };
  let tab = 'history';
  let docError = '';

  const dateShort = iso => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
  const statusBadge = s => `<span class="badge badge--${s}">${PATIENT_STATUS[s]}</span>`;

  function matches() {
    const q = norm(f.q.trim());
    const digits = q.replace(/\D/g, '');
    let list = Data.patients.filter(p => {
      if (f.prac && p.ref !== f.prac) return false;
      if (f.status && p.status !== f.status) return false;
      if (!q) return true;
      const hay = norm(`${p.first} ${p.last} ${p.last} ${p.first} ${p.id}`);
      return hay.includes(q) || (digits.length >= 4 && p.phone.replace(/\s/g, '').includes(digits));
    });
    const key = { name: p => norm(p.last + p.first), recent: p => p.id }[f.sort];
    list = [...list].sort((a, b) => key(a).localeCompare(key(b)));
    return f.sort === 'recent' ? list.reverse() : list;
  }

  function results() {
    const { sim, booting } = App.S;
    if (sim === 'error') return App.errorState('la liste des patients');
    if (sim === 'loading' || booting) {
      return `<div class="ptable-sk" role="status" aria-label="Chargement des patients">${Array.from({ length: 8 }, () => `<div><span class="sk" style="width:40px;height:40px;border-radius:50%"></span><span class="sk" style="height:14px;width:28%"></span><span class="sk" style="height:14px;width:16%"></span><span class="sk" style="height:14px;width:20%"></span></div>`).join('')}</div>`;
    }
    if (sim === 'empty') {
      return UI.state('empty', {
        icon: 'users', title: 'Aucun patient pour le moment',
        text: 'Les patients créés lors d’une prise de rendez-vous apparaîtront ici.',
        action: `<a class="btn btn--primary btn--sm" href="#/rdv">${icon('plus')}Nouveau rendez-vous</a>`,
      });
    }
    const list = matches();
    if (!list.length) {
      return UI.state('empty', {
        icon: 'search', title: 'Aucun patient trouvé',
        text: f.q ? `Rien ne correspond à « ${esc(f.q)} ». Vérifiez l’orthographe ou cherchez par téléphone.` : 'Aucun dossier ne correspond à ces filtres.',
        action: `<button class="btn btn--secondary btn--sm" data-act="resetFilters">Effacer les filtres</button>`,
      });
    }
    const shown = list.slice(0, f.limit);
    return `<p class="ptable__count">${list.length} patient${list.length > 1 ? 's' : ''}</p>
    <div class="ptable" role="table" aria-label="Patients">
      <div class="ptable__row ptable__row--head" role="row">
        <span role="columnheader">Patient</span><span role="columnheader">Naissance</span><span role="columnheader">Téléphone</span>
        <span role="columnheader">Référent</span><span role="columnheader">Prochain rendez-vous</span><span role="columnheader">Statut</span>
      </div>
      ${shown.map(p => {
        const next = Data.nextAppt(p.id);
        const ref = Data.prac(p.ref);
        return `<a class="ptable__row" role="row" href="#/patients/${p.id}">
          <span class="ptable__who" role="cell">${UI.avatar(p)}<span><b>${esc(p.first)} ${esc(p.last)}</b>${p.alert ? `<small class="ptable__alert">${icon('alert')}${esc(p.alert)}</small>` : `<small>${p.id}</small>`}</span></span>
          <span role="cell">${dateShort(p.birth)}<small>${Data.ageOf(p)} ans</small></span>
          <span role="cell">${p.phone}</span>
          <span role="cell" class="ptable__ref tone-${ref.id}"><i></i>${esc(ref.short)}</span>
          <span role="cell">${next ? `${dateShort(next.date)}<small>${hm(next.start)}</small>` : '<span class="muted">Aucun</span>'}</span>
          <span role="cell">${statusBadge(p.status)}</span>
        </a>`;
      }).join('')}
    </div>
    ${list.length > f.limit ? `<div class="ptable__more"><button class="btn btn--secondary btn--sm" data-act="moreRows">Afficher ${Math.min(PAGE, list.length - f.limit)} de plus</button></div>` : ''}`;
  }

  function renderList() {
    return `<div class="pagehead">
      <div><h1>Patients</h1><p class="pagehead__sub">${Data.patients.length} dossiers au cabinet</p></div>
      <a class="btn btn--primary pagehead__cta" href="#/rdv">${icon('plus')}Nouveau rendez-vous</a>
    </div>
    <section class="panel panel--list">
      <div class="filters">
        <div class="search"><label class="sr" for="q">Rechercher un patient</label>${icon('search')}<input class="input" id="q" type="search" placeholder="Nom, téléphone ou n° de dossier" value="${esc(f.q)}" data-input="patientSearch"></div>
        <label class="sr" for="fPrac">Référent</label>
        <select class="input" id="fPrac" data-change="patientFilter" data-key="prac"><option value="">Tous les référents</option>${Data.practitioners.map(p => `<option value="${p.id}" ${f.prac === p.id ? 'selected' : ''}>${esc(p.short)}</option>`).join('')}</select>
        <label class="sr" for="fSort">Trier</label>
        <select class="input" id="fSort" data-change="patientFilter" data-key="sort"><option value="name" ${f.sort === 'name' ? 'selected' : ''}>Nom A → Z</option><option value="recent" ${f.sort === 'recent' ? 'selected' : ''}>Dossiers récents</option></select>
      </div>
      <div class="filters__chips" role="group" aria-label="Statut">
        <button type="button" class="chip" data-act="patientStatus" data-status="" aria-pressed="${!f.status}">Tous</button>
        ${Object.entries(PATIENT_STATUS).map(([k, l]) => `<button type="button" class="chip" data-act="patientStatus" data-status="${k}" aria-pressed="${f.status === k}">${l}</button>`).join('')}
      </div>
      <div id="pResults" class="presults">${results()}</div>
    </section>`;
  }

  const refreshResults = () => { document.getElementById('pResults').innerHTML = results(); };

  function historyTab(p) {
    const list = Data.history(p.id);
    if (!list.length) {
      return UI.state('empty', { icon: 'clock', title: 'Pas encore d’historique', text: 'Les rendez-vous de ce patient apparaîtront ici.' });
    }
    return `<ol class="timeline">${list.map(a => `<li class="tone-${a.prac}">
      <span class="timeline__date">${dateShort(a.date)}<small>${hm(a.start)}</small></span>
      <div class="timeline__body"><b>${esc(a.motif)}</b><small>${esc(Data.prac(a.prac).name)}</small></div>
      <span class="timeline__status">${a.urgent ? UI.urgentBadge() : ''}${UI.statusBadge(a.status)}</span>
    </li>`).join('')}</ol>`;
  }

  function notesTab(p) {
    const isPrac = App.S.role === 'praticien';
    const visible = p.notes.filter(n => n.kind === 'admin' || isPrac).sort((a, b) => b.date.localeCompare(a.date));
    return `<form class="noteform" data-note="${p.id}" onsubmit="return false">
      <div class="field"><label for="noteText">Ajouter une note</label><textarea class="input" id="noteText" placeholder="${isPrac ? 'Observation, suivi, consigne…' : 'Information pratique, mutuelle, préférence de contact…'}"></textarea></div>
      <div class="noteform__foot">
        ${isPrac ? `<div class="seg" role="group" aria-label="Type de note"><button type="button" data-act="noteKind" data-kind="med" aria-pressed="true">Médicale</button><button type="button" data-act="noteKind" data-kind="admin" aria-pressed="false">Administrative</button></div>` : '<span class="muted">Note administrative, visible par toute l’équipe</span>'}
        <button type="button" class="btn btn--primary btn--sm" data-act="addNote" data-id="${p.id}">Enregistrer</button>
      </div>
    </form>
    ${isPrac ? '' : `<div class="banner banner--info">${icon('lock')}<div><strong>Notes médicales masquées</strong><p>Elles sont réservées aux praticiens qui suivent ce patient.</p></div></div>`}
    <ul class="notes">${visible.map(n => `<li>
      <div class="notes__head"><b>${esc(n.author)}</b><span class="badge">${n.kind === 'med' ? 'Médicale' : 'Administrative'}</span><time>${dateShort(n.date)}</time></div>
      <p>${esc(n.text)}</p></li>`).join('')}</ul>`;
  }

  function docsTab(p) {
    const isPrac = App.S.role === 'praticien';
    return `<div class="docbar">
      <p class="muted">PDF, JPG ou PNG, 10 Mo maximum</p>
      <label class="btn btn--secondary btn--sm">${icon('upload')}Ajouter un document<input class="sr" type="file" data-change="addDoc" data-id="${p.id}" accept=".pdf,.jpg,.jpeg,.png"></label>
    </div>
    ${docError ? `<div class="banner banner--danger" role="alert">${icon('alert')}<div><strong>Document non ajouté</strong><p>${esc(docError)}</p></div></div>` : ''}
    <ul class="docs">${p.docs.map(d => {
      const locked = d.restricted && !isPrac;
      return `<li class="${locked ? 'is-locked' : ''}">
        <span class="docs__icon">${icon(locked ? 'lock' : 'file')}</span>
        <span class="docs__name"><b>${esc(d.name)}</b><small>${locked ? 'Réservé aux praticiens' : `${esc(d.type)} · ${esc(d.size)}`}</small></span>
        <time>${dateShort(d.date)}</time>
      </li>`;
    }).join('')}</ul>`;
  }

  function renderPatient() {
    const { route, sim, booting } = App.S;
    const p = Data.patient(route.id);
    const crumb = `<nav class="crumb" aria-label="Fil d’Ariane"><a href="#/patients">Patients</a>${icon('right')}<span aria-current="page">${p ? `${esc(p.first)} ${esc(p.last)}` : 'Dossier'}</span></nav>`;
    if (sim === 'error') return `${crumb}<section class="panel panel--center">${App.errorState('ce dossier')}</section>`;
    if (!p) {
      return `${crumb}<section class="panel panel--center">${UI.state('empty', { icon: 'users', title: 'Dossier introuvable', text: 'Ce numéro de dossier n’existe pas ou a été archivé.', action: `<a class="btn btn--secondary btn--sm" href="#/patients">Retour aux patients</a>` })}</section>`;
    }
    if (sim === 'loading' || booting) {
      return `${crumb}<section class="panel" role="status" aria-label="Chargement du dossier"><div class="psk">${App.skeletonLines(9)}</div></section>`;
    }
    const next = Data.nextAppt(p.id);
    const ref = Data.prac(p.ref);
    const tabs = [['history', 'Historique', Data.history(p.id).length], ['notes', 'Notes', p.notes.filter(n => n.kind === 'admin' || App.S.role === 'praticien').length], ['docs', 'Documents', p.docs.length]];
    return `${crumb}
    <section class="phead">
      ${UI.avatar(p, 'lg')}
      <div class="phead__id">
        <h1>${esc(p.first)} ${esc(p.last)}</h1>
        <p>${Data.ageOf(p)} ans · né${p.sex === 'F' ? 'e' : ''} le ${fmt(p.birth, { day: 'numeric', month: 'long', year: 'numeric' })} · ${p.id}</p>
      </div>
      ${statusBadge(p.status)}
      <div class="phead__cta">
        <a class="btn btn--secondary" href="tel:${p.phone.replace(/\s/g, '')}">${icon('phone')}Appeler</a>
        <button type="button" class="btn btn--primary" data-act="bookFor" data-id="${p.id}">${icon('plus')}Nouveau rendez-vous</button>
      </div>
    </section>
    ${p.alert ? `<div class="banner banner--danger phead__alert">${icon('alert')}<div><strong>${esc(p.alert)}</strong><p>À vérifier avant toute prescription.</p></div></div>` : ''}
    <div class="pgrid">
      <aside class="pcol">
        <section class="panel"><h2>Prochain rendez-vous</h2>
          ${next ? `<div class="nextappt tone-${next.prac}"><b>${fmt(next.date, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>${hm(next.start)} · ${esc(next.motif)}</span><span>${esc(Data.prac(next.prac).name)}</span></div>
            <button type="button" class="btn btn--ghost btn--sm" data-act="reschedule" data-id="${next.id}">Déplacer</button>`
          : '<p class="muted">Aucun rendez-vous prévu.</p>'}
        </section>
        <section class="panel"><h2>Coordonnées</h2>
          <ul class="contact">
            <li>${icon('phone')}<a href="tel:${p.phone.replace(/\s/g, '')}">${p.phone}</a></li>
            <li>${icon('mail')}<a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>
            <li>${icon('pin')}<span>${esc(p.address)}<br>${esc(p.city)}</span></li>
            ${p.guardian ? `<li>${icon('users')}<span>${esc(p.guardian)}</span></li>` : ''}
          </ul>
          <p class="pref tone-${ref.id}">${UI.avatar(ref, 'sm')}<span><small>Référent</small>${esc(ref.name)}</span></p>
        </section>
      </aside>
      <section class="panel pmain">
        <div class="tabs" role="tablist">${tabs.map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${tab === k}" data-act="ptab" data-tab="${k}">${l}<span class="count">${n}</span></button>`).join('')}</div>
        <div class="ptab" role="tabpanel">${{ history: historyTab, notes: notesTab, docs: docsTab }[tab](p)}</div>
      </section>
    </div>`;
  }

  Object.assign(App.act, {
    patientSearch(el) { f.q = el.value; f.limit = PAGE; refreshResults(); },
    patientFilter(el) { f[el.dataset.key] = el.value; f.limit = PAGE; refreshResults(); },
    patientStatus(el) {
      f.status = el.dataset.status;
      f.limit = PAGE;
      document.querySelectorAll('[data-act="patientStatus"]').forEach(b => b.setAttribute('aria-pressed', b === el));
      refreshResults();
    },
    moreRows() { f.limit += PAGE; refreshResults(); },
    resetFilters() { Object.assign(f, { q: '', prac: '', status: '', limit: PAGE }); App.render(); },
    ptab(el) { tab = el.dataset.tab; docError = ''; App.render(); },
    bookFor(el) { App.views.booking.start({ patient: el.dataset.id }); },
    noteKind(el) {
      el.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === el));
    },
    addNote(el) {
      const box = document.getElementById('noteText');
      const text = box.value.trim();
      if (!text) { box.classList.add('is-error'); box.focus(); return; }
      const p = Data.patient(el.dataset.id);
      const isPrac = App.S.role === 'praticien';
      const kind = isPrac ? document.querySelector('[data-act="noteKind"][aria-pressed="true"]').dataset.kind : 'admin';
      p.notes.push({ id: `${p.id}-n${Date.now()}`, kind, author: isPrac ? 'Dr Vasseur' : 'Nadia Tessier', date: Data.TODAY, text });
      App.render();
      App.toast('Note enregistrée');
    },
    addDoc(el) {
      const file = el.files[0];
      if (!file) return;
      const p = Data.patient(el.dataset.id);
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) docError = `« ${file.name} » n’est pas un format accepté.`;
      else if (file.size > 10 * 1024 * 1024) docError = `« ${file.name} » dépasse 10 Mo.`;
      else {
        docError = '';
        const size = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(file.size / 1024))} Ko`;
        p.docs.unshift({ id: `${p.id}-d${Date.now()}`, name: file.name, type: 'Administratif', date: Data.TODAY, size, restricted: false });
      }
      App.render();
      if (!docError) App.toast('Document ajouté');
    },
  });

  App.views.patients = { render: renderList };
  App.views.patient = { render: renderPatient };
})();
