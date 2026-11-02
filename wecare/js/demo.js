// Wecare — démonstration : garde les changements dans ce navigateur et propose un premier parcours.
(function () {
  const { icon } = UI;
  const KEY = 'wecare-demo-v1';
  const STEPS = [
    ['drag', 'Glissez un rendez-vous à venir sur une heure libre'],
    ['urgent', 'Choisissez « Tous » à gauche, puis cliquez sur Urgences'],
    ['search', 'Ouvrez la recherche avec Ctrl + K'],
  ];
  let guide = { open: true, done: [] };
  let timer = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (!saved || !Array.isArray(saved.appts) || !Array.isArray(saved.patients)) return;
      Data.appts.splice(0, Data.appts.length, ...saved.appts);
      Data.patients.splice(0, Data.patients.length, ...saved.patients);
      Object.assign(App.S, { sms: saved.sms, promoClosed: saved.promoClosed });
      guide = saved.guide;
    } catch (e) { /* Sans stockage, la démo repart simplement de zéro. */ }
  }

  function save() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const { sms, promoClosed } = App.S;
      try {
        localStorage.setItem(KEY, JSON.stringify({ appts: Data.appts, patients: Data.patients, sms, promoClosed, guide }));
      } catch (e) { /* La démo reste utilisable sans sauvegarde. */ }
    }, 200);
  }

  function drawGuide() {
    let el = document.getElementById('guide');
    if (!guide.open || App.mobile.matches) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('aside');
      el.id = 'guide';
      el.className = 'guide';
      el.setAttribute('aria-label', 'Guide de démonstration');
      document.body.append(el);
    }
    el.innerHTML = `<button type="button" class="round" data-act="closeGuide" aria-label="Fermer le guide">${icon('x')}</button>
      <h2>À essayer</h2>
      <ol>${STEPS.map(([key, label]) => `<li class="${guide.done.includes(key) ? 'is-done' : ''}"><span class="guide__mark">${guide.done.includes(key) ? icon('check') : ''}</span>${label}</li>`).join('')}</ol>`;
  }

  function done(key) {
    if (!guide.open || guide.done.includes(key)) return;
    guide.done.push(key);
    drawGuide();
    save();
    if (guide.done.length === STEPS.length) {
      setTimeout(() => { guide.open = false; drawGuide(); save(); }, 1800);
    }
  }

  const render = App.render;
  App.render = () => {
    render();
    drawGuide();
    save();
  };

  const after = (name, run) => {
    const action = App.act[name];
    App.act[name] = (el, e) => { action(el, e); run(el); };
  };
  after('moveConfirm', () => done('drag'));
  after('focus', el => { if (el.dataset.focus === 'urgent') done('urgent'); });
  after('openSearch', () => done('search'));

  Object.assign(App.act, {
    closeGuide() {
      guide.open = false;
      drawGuide();
      save();
    },
    openGuide() {
      guide = { open: true, done: [] };
      App.closeLayer();
      drawGuide();
      save();
    },
    askReset() {
      const layer = document.getElementById('layer');
      layer.innerHTML = `<div class="scrim"></div>
        <div class="pop confirm" role="alertdialog" aria-label="Réinitialiser la démo">
          <h2>Réinitialiser la démo ?</h2>
          <p>Les rendez-vous, patients et réglages reviennent à leur état de départ.</p>
          <div class="confirm__cta">
            <button type="button" class="btn btn--ghost btn--sm" data-act="closePop">Annuler</button>
            <button type="button" class="btn btn--primary btn--sm" data-act="resetDemo">Réinitialiser</button>
          </div>
        </div>`;
      const pop = layer.querySelector('.confirm');
      if (!App.mobile.matches) pop.style.left = `${(innerWidth / App.scale - pop.offsetWidth) / 2}px`;
      pop.querySelector('[data-act="resetDemo"]').focus();
    },
    resetDemo() {
      clearTimeout(timer);
      try { localStorage.removeItem(KEY); } catch (e) { /* Rien à effacer. */ }
      location.hash = '#/agenda';
      location.reload();
    },
  });

  load();
})();
