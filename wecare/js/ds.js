// Wecare — le design system se construit avec les mêmes styles et gabarits que l'application.
(function () {
  const { icon, esc, avatar, evt, statusBadge, urgentBadge, state, LOGO } = UI;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const NAV = [
    ['Fondations', [['principes', 'Principes'], ['couleurs', 'Couleurs'], ['typo', 'Typographie'], ['espaces', 'Espaces et formes'], ['motif', 'Motif']]],
    ['Composants', [['boutons', 'Boutons'], ['champs', 'Champs'], ['selection', 'Sélection'], ['statuts', 'Statuts et avatars'], ['compteurs', 'Compteurs'], ['rdv', 'Rendez-vous'], ['creneaux', 'Créneaux et étapes'], ['messages', 'Messages'], ['fenetres', 'Fenêtres'], ['encart', 'Encart'], ['etats', 'États de page']]],
  ];

  const swatch = (name, label) => `<div class="swatch"><i style="background:var(${name})"></i><span>${label}<small>${name} · ${css(name).toUpperCase()}</small></span></div>`;
  const sec = (id, title, intro, body) => `<section class="sec" id="${id}"><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ''}${body}</section>`;

  const demoAppt = (o = {}) => ({ id: 'demo', prac: 'p1', date: Data.TODAY, start: 600, dur: 60, patient: Data.patients[5].id, motif: 'Consultation', status: 'booked', ...o });
  const fig = (label, html) => `<figure><figcaption>${label}</figcaption>${html}</figure>`;

  const principes = sec('principes', 'Principes', 'Quatre règles guident chaque décision dans le produit.', `<ul class="rules">
    <li><b>Lisible en deux secondes</b><span>Au téléphone, le secrétariat doit repérer un créneau libre sans chercher.</span></li>
    <li><b>Jamais la couleur seule</b><span>Chaque statut s’accompagne d’une icône. Le nom du praticien reste écrit à côté de sa couleur.</span></li>
    <li><b>L’urgence se voit</b><span>Le rouge reste réservé aux urgences, aux alertes et aux erreurs.</span></li>
    <li><b>Une erreur ne coûte rien</b><span>Une action s’annule d’un clic et un échec ne perd jamais la saisie.</span></li>
  </ul>`);

  const couleurs = sec('couleurs', 'Couleurs', 'Le bleu en dégradé porte l’action, le fond bleu clair entoure les panneaux blancs et chaque praticien garde une couleur vive, réduite à un point sur les cartes.', `
    <h3>Marque</h3><div class="swatches">${[['--blue-600', 'Bleu'], ['--blue-500', 'Bleu texte'], ['--sky', 'Ciel'], ['--blue-200', 'Bleu 200'], ['--blue-100', 'Bleu 100'], ['--blue-50', 'Bleu 50']].map(c => swatch(...c)).join('')}</div>
    <h3>Neutres</h3><div class="swatches">${[['--ink', 'Encre'], ['--ink-2', 'Encre 2'], ['--ink-3', 'Encre 3'], ['--ink-4', 'Encre 4'], ['--line', 'Trait'], ['--grid', 'Grille'], ['--line-2', 'Trait 2'], ['--placeholder', 'Avatar'], ['--canvas', 'Fond'], ['--surface', 'Surface']].map(c => swatch(...c)).join('')}</div>
    <h3>Sémantique</h3><div class="swatches">${[['--danger', 'Danger'], ['--danger-line', 'Danger trait'], ['--success', 'Succès'], ['--success-line', 'Succès trait'], ['--warning', 'Attention'], ['--warning-line', 'Attention trait']].map(c => swatch(...c)).join('')}</div>
    <h3>Praticiens</h3><div class="tones">${Data.practitioners.map(p => `<div class="tone tone-${p.id}"><span>${esc(p.short)}<small>${esc(p.role)}</small></span></div>`).join('')}</div>`);

  const TYPES = [
    ['Titre de page', '36 / 40 · 600', 'font-size:36px;line-height:40px;font-weight:600', 'Agenda du mardi'],
    ['Titre d’étape', '24 / 30 · 600', 'font-size:24px;line-height:30px;font-weight:600', 'Rendez-vous confirmé'],
    ['Titre de bloc', '20 / 26 · 600', 'font-size:20px;line-height:1.3;font-weight:600', 'Mardi 3 novembre'],
    ['Bouton', '16 / 23 · 600', 'font-size:16px;line-height:1.45;font-weight:600', 'Nouveau rendez-vous'],
    ['Texte', '14 / 20 · 400', 'font-size:14px;line-height:1.45', 'Sofia Amrani, consultation de 60 minutes'],
    ['Libellé', '14 / 20 · 600', 'font-size:14px;line-height:1.45;font-weight:600', '10:00 - 11:00'],
    ['Légende', '13 / 18 · 500', 'font-size:13px;line-height:1.45;font-weight:500', 'Médecin généraliste'],
  ];
  const typo = sec('typo', 'Typographie', 'Inter Tight, de 400 à 700. Les chiffres sont tabulaires pour aligner les horaires.', TYPES.map(t => `<div class="type"><small>${t[0]}<br>${t[1]}</small><span style="${t[2]}">${t[3]}</span></div>`).join(''));

  const espaces = sec('espaces', 'Espaces et formes', 'Une grille de 4 px, des angles généreux et une ombre douce pour décoller les cartes du fond blanc.', `
    <h3>Espacement</h3><div class="spaces">${[4, 8, 12, 16, 20, 24, 32, 40].map(n => `<div><i style="width:${n}px;height:${n}px"></i>${n}</div>`).join('')}</div>
    <h3>Rayons</h3><div class="row">${[['sm', 8], ['md', 15], ['xl', 35], ['pill', 999]].map(([k, v]) => `<div class="radius" style="border-radius:${v}px">${k} · ${v === 999 ? '∞' : v}</div>`).join('')}</div>
    <h3>Ombres</h3><div class="row"><div class="shadow" style="box-shadow:0 1px 3px rgba(41,63,109,.14),0 8px 20px -8px rgba(41,63,109,.34)">Carte</div><div class="shadow" style="box-shadow:var(--shadow-lg)">Fenêtre</div></div>`);

  const motif = sec('motif', 'Motif', 'Des formes blanches à 20 % d’opacité, posées en haut à droite d’une surface bleue et coupées par son bord. Il signale une carte sélectionnée, l’encart et la couverture.', `
    <div class="ds-motif" role="img" aria-label="Motif Wecare sur fond bleu"></div>`);

  const btnRow = cls => ['', 'is-hover', 'is-focus', 'is-loading'].map((s, i) => `<button type="button" class="btn ${cls} ${s}" tabindex="-1">${['Par défaut', 'Survol', 'Focus', 'Envoi'][i]}</button>`).join('');
  const boutons = sec('boutons', 'Boutons', 'Un seul bouton principal par écran. Hauteur de 49 px, ou 39 px dans les zones denses.', `
    <h3>Principal</h3><div class="row">${btnRow('btn--primary')}</div>
    <h3>Secondaire</h3><div class="row">${btnRow('btn--secondary')}</div>
    <h3>Discret</h3><div class="row">${btnRow('btn--ghost')}</div>
    <h3>Destructif, désactivé, petit, icône</h3><div class="row">
      <button type="button" class="btn btn--danger">Annuler le rendez-vous</button>
      <button type="button" class="btn btn--primary" disabled>Désactivé</button>
      <button type="button" class="btn btn--primary btn--sm">${icon('plus')}Petit</button>
      <button type="button" class="btn btn--secondary btn--sm">${icon('upload')}Ajouter</button>
      <button type="button" class="icon-btn" aria-label="Rechercher">${icon('search')}</button>
      <button type="button" class="icon-btn icon-btn--sm" aria-label="Suivant">${icon('right')}</button>
    </div>
    <h3>Retour</h3><div class="row"><button type="button" class="bk-back"><span class="bk-back__i">${icon('left')}</span>Retour à l’agenda${icon('calendar')}</button></div>`);

  const field = (label, cls, extra = '', err = '') => `<div class="field"><label>${label}</label><input class="input ${cls}" value="${/rempli|erreur/i.test(label) ? '06 39 98 12' : ''}" placeholder="Téléphone" ${extra}>${err}</div>`;
  const champs = sec('champs', 'Champs', 'Le libellé reste visible et l’erreur dit comment corriger.', `
    <div class="fields">
      ${field('Par défaut', '')}${field('Focus', 'is-focus')}${field('Rempli', '')}
      ${field('Erreur', 'is-error', 'aria-invalid="true"', `<p class="field__error">${icon('alert')}Le numéro doit compter 10 chiffres.</p>`)}
      ${field('Désactivé', '', 'disabled')}
      <div class="field"><label>Liste</label><select class="input"><option>Tous les référents</option></select></div>
      <div class="field"><label>Recherche</label><div class="search">${icon('search')}<input class="input" placeholder="Nom ou téléphone"></div></div>
      <div class="field"><label>Note</label><textarea class="input" placeholder="Contexte de l’appel…"></textarea></div>
    </div>`);

  const selection = sec('selection', 'Sélection', '', `
    <h3>Bascule</h3><div class="row"><div class="seg"><button type="button" aria-pressed="true">Jour</button><button type="button" aria-pressed="false">Semaine</button></div>
      <div class="seg"><button type="button" aria-pressed="false">Secrétariat</button><button type="button" aria-pressed="true">Praticien</button></div></div>
    <h3>Filtres</h3><div class="row"><button type="button" class="chip" aria-pressed="true">Tous</button><button type="button" class="chip" aria-pressed="false">Suivi actif</button><button type="button" class="chip" aria-pressed="false">À rappeler</button></div>
    <h3>Onglets</h3><div class="tabs"><button type="button" aria-selected="true">Historique<span class="count">12</span></button><button type="button" aria-selected="false">Notes<span class="count">3</span></button><button type="button" aria-selected="false">Documents<span class="count">2</span></button></div>
    <h3>Case à cocher</h3><label class="check"><input type="checkbox" checked>Envoyer un rappel par SMS la veille</label>`);

  const statuts = sec('statuts', 'Statuts et avatars', 'Chaque statut combine une icône, un libellé et une couleur.', `
    <h3>Rendez-vous</h3><div class="row">${Object.keys(Data.STATUS).map(statusBadge).join('')}${urgentBadge()}</div>
    <h3>Dossier</h3><div class="row">${Object.entries(Data.PATIENT_STATUS).map(([k, l]) => `<span class="badge badge--${k}">${l}</span>`).join('')}</div>
    <h3>Initiales</h3><div class="row">${avatar(Data.prac('p1'), 'sm')}${avatar(Data.prac('p2'))}${avatar(Data.prac('p4'), 'lg')}</div>`);

  const compteurs = sec('compteurs', 'Compteurs', 'Le filtre du planning porte les chiffres de la période et du praticien affichés. Le rouge signale des urgences, un zéro reste discret.', `
    <div class="seg seg--count"><button type="button" aria-pressed="true">Tous<span class="seg__n">81</span></button><button type="button" aria-pressed="false">Urgences<span class="seg__n is-urgent">3</span></button><button type="button" aria-pressed="false">Annulés<span class="seg__n">10</span></button></div>
    <h3>Sans urgence</h3><div class="seg seg--count"><button type="button" aria-pressed="true">Tous<span class="seg__n">25</span></button><button type="button" aria-pressed="false">Urgences<span class="seg__n is-zero">0</span></button><button type="button" aria-pressed="false">Annulés<span class="seg__n">1</span></button></div>`);

  const rdv = sec('rdv', 'Rendez-vous', 'Une carte blanche sans contour avec une ombre douce. Le point désigne le praticien, la pastille le statut, et un rendez-vous passé prend un fond bleu très clair.', `
    <h3>Praticiens</h3><div class="matrix">${Data.practitioners.map(p => fig(p.short, evt(demoAppt({ prac: p.id }), { demo: true }))).join('')}</div>
    <h3>Statuts</h3><div class="matrix">
      ${fig('Prévu', evt(demoAppt(), { demo: true }))}
      ${fig('En salle d’attente', evt(demoAppt({ status: 'arrived' }), { demo: true }))}
      ${fig('En consultation', evt(demoAppt({ status: 'inconsult' }), { demo: true }))}
      ${fig('Terminé', evt(demoAppt({ status: 'done' }), { demo: true }))}
      ${fig('Urgence', evt(demoAppt({ urgent: true }), { demo: true }))}
      ${fig('Absent', evt(demoAppt({ status: 'absent' }), { demo: true }))}
      ${fig('Annulé', evt(demoAppt({ status: 'cancelled' }), { demo: true }))}
      ${fig('Sélectionné', evt(demoAppt(), { demo: true, selected: true }))}
    </div>
    <h3>Tailles</h3><div class="matrix">
      ${fig('Grille horaire, 1 h minimum', evt(demoAppt(), { demo: true }))}
      ${fig('Vue équipe, une ligne par docteur', `<div class="ds-stack">${[['p1', 'booked'], ['p2', 'booked'], ['p4', 'cancelled']].map(([prac, status], i) => evt(demoAppt({ prac, status, urgent: i === 1 }), { demo: true, xs: true, doc: true })).join('')}<button type="button" class="evt-stack__free">+ 2 libres</button></div>`)}
    </div>
    <h3>Déplacement</h3><div class="matrix">
      ${fig('Heure disponible', '<div class="ds-drop"><div class="drop">14:00</div></div>')}
      ${fig('Heure indisponible', '<div class="ds-drop"><div class="drop is-bad">Indisponible</div></div>')}
    </div>`);

  const creneaux = sec('creneaux', 'Créneaux et étapes', '', `
    <h3>Créneau</h3><div class="row">
      <button type="button" class="slot">10:00</button>
      <button type="button" class="slot is-suggested">Suggéré · 11:00</button>
      <button type="button" class="slot is-selected">14:00</button>
      <button type="button" class="slot" disabled>15:00</button>
    </div>
    <h3>Étapes</h3><div class="steps-demo"><ol class="steps"><li class="is-done">1. Patient</li><li class="is-done">2. Motif</li><li class="is-current">3. Créneau</li><li>4. Confirmation</li></ol></div>`);

  const banner = (kind, ic, title, text) => `<div class="banner banner--${kind}">${icon(ic)}<div><strong>${title}</strong><p>${text}</p></div></div>`;
  const messages = sec('messages', 'Messages', 'Le message explique ce qui s’est passé et propose la suite.', `
    <h3>Bandeaux</h3><div style="display:grid;gap:12px;max-width:620px">
      ${banner('danger', 'alert', 'Le créneau de 10:00 vient d’être pris', 'Votre dossier est conservé : choisissez un autre créneau.')}
      ${banner('warning', 'alert', 'Allergie à la pénicilline', 'Cette alerte figure au dossier.')}
      ${banner('info', 'lock', 'Notes médicales masquées', 'Elles sont réservées aux praticiens qui suivent ce patient.')}
      ${banner('success', 'check', 'Rendez-vous confirmé', 'Rappel SMS programmé la veille.')}
    </div>
    <h3>Notification</h3><div class="row"><div class="toast"><span>Rendez-vous annulé</span><button type="button">Rétablir</button></div></div>`);

  const fenetres = sec('fenetres', 'Fenêtres', 'Elles s’ouvrent au-dessus d’un voile et se ferment avec Échap ou un clic à côté.', `
    <h3>Recherche rapide</h3><div class="pop find ds-pop"><div class="find__bar">${icon('search')}<input class="find__input" value="amrani" aria-label="Exemple de recherche" tabindex="-1" readonly><kbd>Esc</kbd></div>
      <div class="find__list"><p class="find__label">Patients</p>
        <div class="find__row is-active">${avatar(Data.patients[5], 'sm')}<span class="find__txt"><b>${esc(Data.patients[5].first)} ${esc(Data.patients[5].last)}</b><small>${esc(Data.patients[5].id)} · ${esc(Data.patients[5].phone)}</small></span></div>
        <p class="find__label">Rendez-vous à venir</p>
        <div class="find__row"><span class="find__mark">${icon('calendar')}</span><span class="find__txt"><b>Jeudi 5 novembre à 13:00</b><small>Consultation · Dr Vasseur</small></span></div>
      </div></div>
    <h3>Confirmation de déplacement</h3><div class="pop confirm ds-pop"><h2>Déplacer ce rendez-vous ?</h2><p>Paul Lebrun · Certificat médical</p>
      <div class="confirm__move"><span>Jeudi 5 novembre à 13:00</span>${icon('right')}<b>Vendredi 6 novembre à 13:00</b></div>
      <div class="confirm__cta"><button type="button" class="btn btn--ghost btn--sm">Annuler</button><button type="button" class="btn btn--primary btn--sm">Déplacer</button></div></div>
    <h3>Aperçu d’un rappel SMS</h3><div class="ds-sms"><p class="sms__bubble">Bonjour Paul, rappel de votre rendez-vous le jeudi 5 novembre à 13:00 avec Dr Vasseur. Répondez ANNULER pour libérer le créneau.</p><p class="sms__hint">124 caractères · 1 SMS</p></div>`);

  const encart = sec('encart', 'Encart', 'Bas du panneau gauche. Un seul bouton, une croix, et il disparaît dès que la salle d’attente a besoin de la place.', `
    <div class="ds-promo"><section class="promo" aria-label="Rappels SMS"><button type="button" class="promo__close" aria-label="Fermer">${icon('x')}</button><b>2 absents cette semaine</b><p>Moins d’oublis avec les rappels SMS</p><button type="button" class="promo__cta">Activer</button></section></div>`);

  const etats = sec('etats', 'États de page', 'Chaque écran prévoit ces trois états, en plus de son contenu normal.', `<div class="states">
    <div class="sk-box" role="img" aria-label="Exemple de chargement"><span class="sk" style="height:32px;width:60%"></span><span class="sk" style="height:64px;border-radius:12px"></span><span class="sk" style="height:40px;width:80%;border-radius:12px"></span></div>
    <div>${state('empty', { icon: 'calendar', title: 'Aucun rendez-vous ce jour', text: 'L’agenda est libre pour les praticiens sélectionnés.', action: `<button type="button" class="btn btn--primary btn--sm">${icon('plus')}Nouveau rendez-vous</button>` })}</div>
    <div>${state('error', { icon: 'wifiOff', title: 'Impossible de charger l’agenda', text: 'La connexion au serveur du cabinet a échoué.', action: `<button type="button" class="btn btn--primary btn--sm">Réessayer</button>` })}</div>
  </div>`);

  document.getElementById('ds').innerHTML = `
    <nav class="ds__nav" aria-label="Sections">
      <a class="ds__brand" href="index.html">${LOGO}</a>
      ${NAV.map(([t, items]) => `<h2>${t}</h2>${items.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}`).join('')}
      <a class="btn btn--secondary btn--sm ds__back" href="index.html" style="padding:0 14px">Ouvrir l’application</a>
    </nav>
    <main>
      <header class="ds__head"><h1>Design system</h1><p>Les fondations et composants de Wecare. Cette page utilise le même code que l’application.</p></header>
      ${principes}${couleurs}${typo}${espaces}${motif}${boutons}${champs}${selection}${statuts}${compteurs}${rdv}${creneaux}${messages}${fenetres}${encart}${etats}
    </main>`;
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
})();
