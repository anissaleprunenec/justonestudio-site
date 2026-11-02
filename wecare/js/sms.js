// Wecare — rappels SMS : réglages simulés, aucun message ne part réellement.
(function () {
  const { icon, esc } = UI;
  const { TODAY, NOW, fmt, hm, monday } = Data;
  const WHEN = { j1: 'La veille', h48: '48 h avant', h2: '2 h avant' };
  let draft = null;

  const upcoming = a => a.status === 'booked' && (a.date > TODAY || (a.date === TODAY && a.start > NOW));
  const sample = () => Data.appts.filter(upcoming).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0];

  function preview(text) {
    const a = sample();
    const p = Data.patient(a.patient);
    return text.replace(/\{prénom\}/g, p.first).replace(/\{date\}/g, fmt(a.date, { weekday: 'long', day: 'numeric', month: 'long' }))
      .replace(/\{heure\}/g, hm(a.start)).replace(/\{praticien\}/g, Data.prac(a.prac).short);
  }

  function refreshText() {
    const text = preview(draft.text);
    document.getElementById('smsBubble').textContent = text;
    document.getElementById('smsCount').textContent = `${text.length} caractères · ${Math.max(1, Math.ceil(text.length / 160))} SMS`;
  }

  function open() {
    const layer = document.getElementById('layer');
    const week = Data.appts.filter(a => upcoming(a) && monday(a.date) === monday(TODAY)).length;
    layer.innerHTML = `<div class="scrim"></div>
      <div class="pop sms" role="dialog" aria-label="Rappels SMS">
        <div class="sms__head"><h2>Rappels SMS</h2>
          <button type="button" class="round" data-act="closePop" aria-label="Fermer">${icon('x')}</button></div>
        <div class="sms__body">
          <div class="sms__form">
            <label class="check"><input type="checkbox" data-change="smsToggle" ${draft.on ? 'checked' : ''}>Envoyer un rappel aux patients</label>
            <div class="field"><label>Moment de l’envoi</label>
              <div class="seg" role="group" aria-label="Moment de l’envoi">${Object.entries(WHEN).map(([k, l]) => `<button type="button" data-act="smsWhen" data-when="${k}" aria-pressed="${draft.when === k}">${l}</button>`).join('')}</div>
            </div>
            <div class="field"><label for="smsText">Message</label>
              <textarea id="smsText" class="input" rows="4" data-input="smsText">${esc(draft.text)}</textarea>
              <p class="sms__hint">Variables : {prénom}, {date}, {heure}, {praticien}</p>
            </div>
            <p class="sms__hint"><b>${week}</b> rendez-vous à venir cette semaine recevraient ce rappel.</p>
          </div>
          <div class="sms__preview">
            <p class="sms__label">Aperçu</p>
            <p class="sms__bubble" id="smsBubble"></p>
            <p class="sms__hint" id="smsCount"></p>
            <button type="button" class="btn btn--secondary btn--sm" data-act="smsTest">${icon('phone')}Envoyer un test</button>
          </div>
        </div>
        <div class="sms__foot">
          <p class="sms__hint">Démonstration : aucun SMS n’est envoyé.</p>
          <button type="button" class="btn btn--ghost btn--sm" data-act="closePop">Annuler</button>
          <button type="button" class="btn btn--primary btn--sm" data-act="smsSave">Enregistrer</button>
        </div>
      </div>`;
    const pop = layer.querySelector('.sms');
    if (!App.mobile.matches) pop.style.left = `${(innerWidth / App.scale - pop.offsetWidth) / 2}px`;
    refreshText();
  }

  Object.assign(App.act, {
    openSms() {
      draft = { ...App.S.sms, on: true };
      open();
    },
    smsToggle(el) { draft.on = el.checked; },
    smsWhen(el) {
      draft.when = el.dataset.when;
      document.querySelectorAll('[data-act="smsWhen"]').forEach(b => b.setAttribute('aria-pressed', b === el));
    },
    smsText(el) {
      draft.text = el.value;
      refreshText();
    },
    smsTest() { App.toast('SMS de test envoyé (simulation)'); },
    smsSave() {
      const { S } = App;
      S.sms = { ...draft };
      S.promoClosed = draft.on;
      App.render();
      App.toast(draft.on ? `Rappels SMS activés : ${WHEN[draft.when].toLowerCase()}` : 'Rappels SMS désactivés');
    },
  });

  App.smsLabel = () => WHEN[App.S.sms.when];
})();
