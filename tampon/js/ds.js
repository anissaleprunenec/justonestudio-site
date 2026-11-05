// Tampon — le design system se construit avec les mêmes styles, icônes et données que l'application :
// quand un composant change dans l'outil, sa documentation change avec lui.
(function () {
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim().toUpperCase();
  const sec = (id, title, intro, body) => `<section class="ds-sec" id="${id}"><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ""}${body}</section>`;
  const swatch = (name, label) => `<div class="ds-swatch"><i style="background:var(${name})"></i><span>${label}<small>${name} · ${css(name)}</small></span></div>`;
  const fig = (label, html, cls = "") => `<figure class="ds-fig ${cls}"><figcaption>${label}</figcaption>${html}</figure>`;
  const tileOf = (fournisseur, statut, echeance = "2026-11-20") => supplierTile({ fournisseur, statut, echeance });

  const NAV = [
    ["Fondations", [["principes", "Principes"], ["couleurs", "Couleurs"], ["etats", "Couleurs des états"], ["typo", "Typographie"], ["espaces", "Espaces et formes"], ["icones", "Icônes"], ["logo", "Logo"]]],
    ["Composants", [["boutons", "Boutons"], ["champs", "Champs"], ["onglets", "Onglets et filtres"], ["etiquettes", "Étiquettes et pastilles"], ["chiffres", "Cartes de chiffres"], ["ligne", "Ligne de facture"], ["lecture", "Lecture de l'IA"], ["circuit", "Circuit de validation"], ["decision", "Décision du gérant"], ["refus", "Refus"], ["import", "Import"], ["menus", "Menus et notifications"], ["messages", "Messages"]]],
    ["Contenu", [["ecriture", "Écriture"], ["accessibilite", "Accessibilité"]]],
  ];

  /* ---------- Fondations ---------- */

  const principes = sec("principes", "Principes", "Cinq règles guident chaque décision dans Tampon.", `
    <ul class="ds-rules">
      <li><b>Qui doit agir, tout de suite</b><span>Chaque écran répond d'abord à « qu'est-ce que je dois faire ? ». Les chiffres viennent ensuite.</span></li>
      <li><b>Une couleur par état</b><span>La couleur dit où en est la facture. Le vert ne veut dire qu'une chose : c'est réglé.</span></li>
      <li><b>L'IA montre ses doutes</b><span>Elle ne tranche jamais seule. Un champ douteux s'affiche, avec la valeur lue sur le document.</span></li>
      <li><b>Vérifier n'est pas valider</b><span>Clara contrôle la lecture et paie, Julien autorise la dépense. Aucun écran ne mélange les deux rôles.</span></li>
      <li><b>Une erreur ne coûte rien</b><span>Chaque action qui change des données s'annule pendant quelques secondes.</span></li>
    </ul>`);

  const couleurs = sec("couleurs", "Couleurs", "Un fond gris très clair, de grands panneaux blancs, un menu presque noir. Le vert de la marque reste rare : logo, page ouverte, bouton principal.", `
    <h3>Marque</h3><div class="ds-swatches">${[["--primary-500", "Vert Tampon"], ["--primary-600", "Vert survol"], ["--success-600", "Vert texte"], ["--primary-100", "Vert 100"], ["--primary-50", "Vert 50"]].map((c) => swatch(...c)).join("")}
      <div class="ds-swatch"><i style="background:#121513"></i><span>Menu<small>#121513</small></span></div>
      <div class="ds-swatch"><i style="background:#5dd26e"></i><span>Vert sur noir<small>#5DD26E</small></span></div></div>
    <h3>Neutres</h3><div class="ds-swatches">${[["--gray-900", "Encre"], ["--gray-800", "Encre 2"], ["--gray-700", "Texte"], ["--gray-600", "Texte secondaire"], ["--gray-400", "Décor"], ["--gray-300", "Trait fort"], ["--gray-100", "Trait"], ["--gray-50", "Fond"]].map((c) => swatch(...c)).join("")}</div>
    <h3>Sémantique</h3><div class="ds-swatches">${[["--warning-500", "Attention"], ["--warning-600", "Attention texte"], ["--warning-50", "Attention fond"], ["--blue-500", "Bleu"], ["--blue-600", "Bleu texte"], ["--blue-50", "Bleu fond"], ["--danger-500", "Danger"], ["--danger-600", "Danger texte"], ["--danger-50", "Danger fond"]].map((c) => swatch(...c)).join("")}</div>
    <p class="ds-note"><b>Règle :</b> les teintes « texte » (600) servent pour les mots, les teintes 500 pour les fonds pleins, les icônes et les traits.</p>`);

  const STATES = [
    ["verifier", "orange", "La facture vient d'arriver", "Clara contrôle la lecture de l'IA"],
    ["valider", "slate", "La lecture est confirmée", "Julien décide, Clara attend"],
    ["payer", "blue", "La dépense est acceptée", "Clara programme le virement"],
    ["payee", "green", "Le virement est parti", "Personne : c'est terminé"],
    ["refusee", "gray", "La dépense est rejetée", "Personne, ou un avoir à attendre"],
  ];
  const etats = sec("etats", "Couleurs des états", "La même couleur suit la facture partout : étiquette, pastille du fournisseur, onglet, carte, étape du circuit. Le retard passe avant le statut.", `
    <div class="ds-states" role="table" aria-label="Couleurs des états">
      <div class="ds-state ds-state--head" role="row"><span role="columnheader">Étiquette</span><span role="columnheader">Pastille</span><span role="columnheader">Ce que ça veut dire</span><span role="columnheader">Qui agit</span></div>
      ${STATES.map(([s, , what, who]) => `<div class="ds-state" role="row"><span role="cell"><span class="pill pill--${s}">${STATUTS[s]}</span></span><span role="cell">${tileOf("Fabricant d'emballages", s)}</span><span role="cell">${what}</span><span role="cell">${who}</span></div>`).join("")}
      <div class="ds-state" role="row"><span role="cell"><span class="due-rel is-late">En retard de 3 j</span></span><span role="cell">${tileOf("Fabricant d'emballages", "valider", "2026-10-31")}</span><span role="cell">L'échéance est passée</span><span role="cell">Urgent : le rouge remplace la couleur de l'état</span></div>
    </div>
    <p class="ds-note"><b>Jamais la couleur seule :</b> chaque état garde son mot. « Réglée » et « Refusée » ajoutent une coche ou une croix.</p>`);

  const TYPES = [
    ["Titre de page", "Manrope 800 · 44 / 46", "font:800 44px/1.05 var(--font);letter-spacing:-.04em", "Bonjour Clara"],
    ["Titre d'écran", "Manrope 700 · 24 / 30", "font:700 24px/1.25 var(--font);letter-spacing:-.02em", "Factures fournisseurs"],
    ["Titre de carte", "Manrope 600 · 16 / 22", "font:600 16px/1.4 var(--font)", "Ce que vous validez"],
    ["Texte", "Manrope 500 · 14 / 20", "font:500 14px/1.45 var(--font)", "Café vert Brésil Cerrado, 22 sacs de 60 kg"],
    ["Légende", "Manrope 500 · 12 / 16", "font:500 12px/1.4 var(--font);color:var(--gray-600)", "Reçue le 2 nov. · suivie par Clara Martin"],
    ["Montant fort", "Inter 600 · 32 / 36", "font:600 32px/1.1 var(--font-num);letter-spacing:-.02em", "8 460,00 €"],
    ["Montant", "Inter 500 · 14 / 20, chiffres tabulaires", "font:500 14px/1.45 var(--font-num);font-variant-numeric:tabular-nums", "1 932,48 €"],
  ];
  const typo = sec("typo", "Typographie", "Manrope pour les mots, Inter pour les montants et les dates : ses chiffres de même largeur alignent les colonnes.",
    TYPES.map((t) => `<div class="ds-type"><small><b>${t[0]}</b>${t[1]}</small><span style="${t[2]}">${t[3]}</span></div>`).join(""));

  const espaces = sec("espaces", "Espaces et formes", "Une grille de 4 px. Les grands conteneurs sont arrondis à 16 px, les boutons et étiquettes sont en pilule.", `
    <h3>Espacement</h3><div class="ds-spaces">${[4, 8, 12, 16, 20, 24, 32].map((n) => `<div><i style="width:${n}px;height:${n}px"></i>${n}</div>`).join("")}</div>
    <h3>Rayons</h3><div class="ds-row">${[["Étiquette", 8], ["Champ", 12], ["Carte", 16], ["Fenêtre", 20], ["Bouton", 99]].map(([k, v]) => `<div class="ds-radius" style="border-radius:${v}px">${k} · ${v === 99 ? "∞" : v}</div>`).join("")}</div>
    <h3>Ombres</h3><div class="ds-canvas ds-row"><div class="ds-shadow" style="box-shadow:0 1px 2px rgba(107,107,107,.07);border:1px solid var(--gray-100)">Carte</div><div class="ds-shadow" style="box-shadow:0 16px 40px rgba(16,24,40,.16)">Menu flottant</div><div class="ds-shadow" style="box-shadow:0 24px 60px rgba(16,24,40,.25)">Fenêtre</div></div>`);

  const ICON_LIST = [["home", "Tableau de bord"], ["file", "Factures"], ["users", "Fournisseurs"], ["card", "Paiements"], ["doc", "Document"], ["upload", "Importer"], ["export", "Télécharger"], ["search", "Rechercher"], ["filter", "Filtrer"], ["bell", "Notifications"], ["check", "Validé"], ["alert", "Attention"], ["clock", "En attente"], ["calendar", "Échéance"], ["spark", "IA"], ["pen", "Corriger"], ["x", "Refuser, fermer"], ["more", "Plus d'actions"], ["menu", "Menu"], ["reset", "Réinitialiser"], ["arrow", "Suivant"], ["back", "Retour"]];
  const icones = sec("icones", "Icônes", "Iconsax en trait de 1,5 px, à 18 px dans les listes et 24 px seules. Une icône accompagne un mot, sauf dans un bouton rond qui porte alors un libellé pour les lecteurs d'écran.", `
    <div class="ds-icons">${ICON_LIST.map(([n, l]) => `<div>${icon(n)}${l}</div>`).join("")}</div>
    <h3>Pastilles fournisseur</h3><p class="ds-note">L'icône dit de quoi il s'agit, la couleur dit où en est la facture.</p>
    <div class="ds-row" style="margin-top:12px">${Object.keys(SUPPLIER_ICONS).slice(0, 9).map((n, i) => tileOf(n, STATES[i % 5][0])).join("")}${supplierTile({ fournisseur: "Maintenance du torréfacteur", statut: "valider", echeance: "2026-11-06" }, true)}</div>`);

  const logo = sec("logo", "Logo", "Un « t » minuscule dont la queue remonte en coche : la première lettre du nom et le geste de valider, en un seul trait. Lisible jusqu'à 16 px.", `
    <div class="ds-row">
      <div style="display:flex;align-items:center;gap:12px;padding:24px 28px;border-radius:16px;background:#121513;color:#fff;font:800 40px/1 var(--font);letter-spacing:-.045em"><span style="color:#5dd26e;display:flex">${LOGO_MARK.replace('class="brand-mark"', 'class="brand-mark" style="width:44px;height:44px;background:none;box-shadow:none"')}</span>tampon</div>
      <div style="display:flex;align-items:center;gap:12px;padding:24px 28px;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 1px var(--gray-100);color:var(--gray-900);font:800 40px/1 var(--font);letter-spacing:-.045em"><span style="color:var(--primary-500);display:flex">${LOGO_MARK.replace('class="brand-mark"', 'class="brand-mark" style="width:44px;height:44px;background:none;box-shadow:none"')}</span>tampon</div>
      <div style="display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#121513;color:#5dd26e">${LOGO_MARK.replace('class="brand-mark"', 'class="brand-mark" style="width:22px;height:22px;background:none;box-shadow:none"')}</div>
    </div>`);

  /* ---------- Composants ---------- */

  const boutons = sec("boutons", "Boutons", "Un seul bouton principal par zone. Tous en pilule ; 40 px de haut, 32 px dans les barres d'action, 48 px en bas d'écran sur téléphone.", `
    <h3>Principal, secondaire, action groupée</h3><div class="ds-row">
      <button class="btn btn-primary">${icon("check")}Confirmer et envoyer en validation</button>
      <button class="btn btn-primary" disabled>${icon("check")}Désactivé tant qu'un doute reste</button>
      <button class="btn btn-ghost">Préparer le lot de virements</button>
      <button class="btn btn-light btn-sm">${icon("check")}Envoyer en validation (3)</button>
    </div>
    <h3>Destructif</h3><div class="ds-row">
      <button class="btn btn-danger">Refuser la facture</button>
      <button class="btn btn-sm btn-danger-ghost">Refuser comme doublon</button>
    </div>
    <h3>Petits, ronds et liens</h3><div class="ds-row">
      <button class="btn btn-ghost btn-sm">Changer</button>
      <button class="round-btn" aria-label="Actions">${icon("more")}</button>
      <button class="icon-btn" aria-label="Zoomer">${icon("zoomIn")}</button>
      <button class="link-btn">Modifier</button>
      <button class="link-btn check-fix">${icon("pen")}Autre valeur : corriger à la main</button>
    </div>
    <p class="ds-note"><b>Règle :</b> le libellé dit ce qui va se passer (« Valider pour paiement », pas « OK »). Un bouton désactivé explique pourquoi juste à côté.</p>`);

  const champs = sec("champs", "Champs", "Le libellé reste visible, la valeur lue sur le document est rappelée pendant la correction, et l'erreur dit comment corriger.", `
    <div class="ds-grid2">
      ${fig("Recherche", `<label class="search">${icon("search")}<input type="search" placeholder="Rechercher un fournisseur, un n°" aria-label="Rechercher"></label>`)}
      ${fig("Case à cocher", `<label class="check-line"><input type="checkbox" checked><span>Prévenir le fournisseur et demander un avoir</span></label>`)}
      ${fig("Correction d'un champ", `<dl class="fields"><form class="field is-editing" onsubmit="return false"><label for="ds-e1">Montant TTC</label><input class="edit-input" id="ds-e1" value="8 640,00"><p class="edit-hint">Lu sur le document : 8 460,00 €</p><span class="edit-actions"><button type="button" class="btn btn-sm btn-ghost">Annuler</button><button class="btn btn-sm btn-primary">Enregistrer</button></span></form></dl>`)}
      ${fig("Erreur", `<dl class="fields"><form class="field is-editing" onsubmit="return false"><label for="ds-e2">Montant TTC</label><input class="edit-input" id="ds-e2" value="huit mille" aria-invalid="true" style="border-color:var(--danger-500)"><p class="edit-hint is-error">Montant non reconnu : écrivez-le comme 1 234,56.</p></form></dl>`)}
      ${fig("Zone de texte", `<textarea class="edit-input" rows="2" placeholder="Ex. : la livraison du 28 octobre n'a jamais eu lieu"></textarea>`)}
    </div>`);

  const onglets = sec("onglets", "Onglets et filtres", "Les onglets portent le point de couleur de leur état : ils servent aussi de légende au tableau. « En retard » est un filtre transversal, la facture garde son statut.", `
    <div class="ds-canvas"><div class="toolbar"><div class="tabs" role="tablist">
      ${[["toutes", "Toutes", 14, true], ["retard", "En retard", 2], ["verifier", "À vérifier", 3], ["valider", "En validation", 3], ["payer", "Prêtes à payer", 4], ["payee", "Réglées", 3], ["refusee", "Refusées", 1]]
        .map(([id, l, n, on]) => `<button class="tab tab--${id}${on ? " is-active" : ""}" role="tab" aria-selected="${!!on}">${l}<span class="tab-count">${n}</span></button>`).join("")}
    </div><button class="btn btn-ghost btn-sm filter-btn is-on">${icon("filter")}Filtres<span class="filter-count">1</span></button></div></div>
    <h3>Puces de choix</h3><div class="ds-row">
      <button class="chip-btn is-on" aria-pressed="true">Ne pas importer</button><button class="chip-btn" aria-pressed="false">Importer quand même</button>
    </div>
    <fieldset class="reasons" style="margin-top:16px"><legend>Motif du refus</legend>${REFUSAL_REASONS.map((r, i) => `<label class="reason"><input type="radio" name="ds-m" ${i === 1 ? "checked" : ""}><span>${r}</span></label>`).join("")}</fieldset>`);

  const etiquettes = sec("etiquettes", "Étiquettes et pastilles", "", `
    <h3>États</h3><div class="ds-row">${Object.keys(STATUTS).map((s) => `<span class="pill pill--${s}">${STATUTS[s]}</span>`).join("")}<span class="pill pill--verifier">IBAN à confirmer</span></div>
    <h3>Échéance</h3><div class="ds-row"><div class="stack"><span>2 déc.</span><span class="due-rel">Dans 29 j</span></div><div class="stack"><span>6 nov.</span><span class="due-rel is-soon">Dans 3 j</span></div><div class="stack"><span>31 oct.</span><span class="due-rel is-late">En retard de 3 j</span></div></div>
    <h3>Lecture de l'IA</h3><div class="ds-row"><span class="ia ia--ok">${icon("spark")}Lue sans doute</span><span class="stack"><span class="ia ia--warn">${icon("alert")}64 %</span><span class="ia-note">2 points à revoir</span></span><span class="ia ia--done">${icon("check")}Vérifiée</span><span class="ia ia--new">${icon("users")}Nouveau</span><span class="ia ia--late">Illisible</span></div>
    <h3>Personnes et compteurs</h3><div class="ds-row"><span class="avatar avatar--sm">CM</span><span class="avatar">JL</span><span class="kpi-avatar" style="position:relative">JL<span class="kpi-badge">${icon("clock")}</span></span><span class="nav-count" style="margin:0">6</span><span class="nav-count nav-count--dot" style="margin:0">2</span></div>
    <p class="ds-note"><b>Règle :</b> le pourcentage de confiance ne s'affiche que sur un doute. Ailleurs, il ajoute du bruit sans aider à décider.</p>`);

  const kpi = (k) => `<button type="button" class="kpi kpi--${k.key}${k.on ? " is-active" : ""}" aria-pressed="${!!k.on}">${k.avatar ? `<span class="kpi-tile kpi-avatar">${k.avatar}<span class="kpi-badge">${icon("clock")}</span></span>` : `<span class="tile tile--${k.tile} kpi-tile"><svg aria-hidden="true"><use href="#${k.icon}"/></svg></span>`}<span class="kpi-label">${k.label}</span><span class="kpi-value">${k.value}</span><span class="kpi-detail"><span>${k.d[0]}</span><b>${k.d[1]}</b></span></button>`;
  const chiffres = sec("chiffres", "Cartes de chiffres", "Deux familles, deux rôles. Les cartes teintées de la liste sont des filtres : un clic ouvre l'onglet correspondant. Les cartes blanches des autres pages informent, avec un mini graphique.", `
    <h3>Cartes filtres (liste des factures)</h3>
    <section class="kpis">${[
      { key: "verifier", tile: "orange", icon: "linear-receipt-search", label: "À vérifier", value: 3, d: ["Points à revoir", 2] },
      { key: "valider", avatar: "JL", label: "En validation chez Julien", value: 3, d: ["Attend depuis", "7 j"], on: true },
      { key: "late", tile: "red", icon: "linear-info-circle", label: "En retard", value: "8 460,00 €", d: ["Factures échues", 2] },
      { key: "payer", tile: "blue", icon: "linear-money-send", label: "Prêtes à payer d'ici le 10 nov.", value: "2 902,34 €", d: ["Échéances cette semaine", 3] },
    ].map(kpi).join("")}</section>
    <h3>Cartes d'information (tableau de bord, fournisseurs, paiements)</h3>
    <section class="stat-row">
      <div class="stat"><span class="stat-label">Reste à payer</span><b class="stat-value">27 262 €</b><span class="stat-sub">11 factures en cours</span><div class="stat-viz"><div class="gauge"><i style="width:62%"></i></div></div></div>
      <div class="stat"><span class="stat-label">Réglé sur 30 jours</span><b class="stat-value">3 634 €</b><span class="stat-trend"><span class="trend up-good">↑ +6 %</span><span class="vs">vs octobre</span></span></div>
      <div class="stat stat--late"><span class="stat-label">En retard</span><b class="stat-value">8 460 €</b><span class="stat-sub">2 factures échues</span></div>
      <div class="stat"><span class="stat-label">Délai de paiement</span><b class="stat-value">14 j</b><span class="stat-sub">de la réception au virement</span></div>
    </section>
    <p class="ds-note"><b>Règle :</b> une carte teintée se clique et filtre ; une carte blanche se lit. On ne mélange jamais les deux sur une même page.</p>`);

  const row = (f, extra = "") => `<tr class="row--${f.statut}${isLate(f) ? " is-late" : ""}${extra}">
      <td class="c-check"><input type="checkbox" ${extra ? "checked" : ""} aria-label="Sélectionner"></td>
      <td><div class="supplier">${supplierTile(f)}<div><a class="row-link" href="#ligne"><strong>${f.fournisseur}</strong></a><span class="muted">${f.numero}</span></div></div></td>
      <td>${shortDate.format(toDate(f.recue))}</td>
      <td><div class="stack"><span>${shortDate.format(toDate(f.echeance))}</span>${isLate(f) ? `<span class="due-rel is-late">En retard de ${-daysFromToday(f.echeance)} j</span>` : isOpen(f) ? `<span class="due-rel">Dans ${daysFromToday(f.echeance)} j</span>` : ""}</div></td>
      <td class="num amount">${eur.format(f.ttc)}</td>
      <td><span class="pill pill--${f.statut}">${STATUTS[f.statut]}</span></td>
      <td><span class="avatar avatar--sm">${f.resp}</span></td>
      <td class="c-action"><div class="row-actions"><button class="round-btn" aria-label="Actions">${icon("more")}</button></div></td></tr>`;
  const ligne = sec("ligne", "Ligne de facture", "Toute la ligne ouvre la fiche. Le menu ⋮ garde les actions secondaires. Une ligne en retard prend un fond rouge pâle, une ligne réglée un fond vert très clair.", `
    <div class="table-wrap ds-table"><table class="table">
      <thead><tr><th class="c-check"></th><th>Fournisseur</th><th>Reçue le</th><th>Échéance</th><th class="num">Montant TTC</th><th>Statut</th><th>Resp.</th><th></th></tr></thead>
      <tbody>${[INVOICES[0], INVOICES[5], INVOICES[8], INVOICES[10]].map((f, i) => row(f, i === 2 ? " is-selected" : "")).join("")}</tbody>
    </table></div>
    <h3>Barre d'actions groupées</h3>
    <div class="bulk"><span class="bulk-info">2 sélectionnées · 2 812,35 €</span><div class="bulk-actions"><button class="btn btn-sm btn-light">${icon("card")}Marquer réglées (2)</button><button class="btn btn-sm btn-ghost">Assigner</button><button class="btn btn-sm btn-ghost">${icon("export")}Exporter</button><button class="btn btn-sm btn-ghost">Annuler</button></div></div>
    <p class="ds-note"><b>Règle :</b> la barre ne propose que les actions possibles pour la sélection et pour la personne connectée.</p>`);

  const check1 = CHECKS[1][0];
  const lecture = sec("lecture", "Lecture de l'IA", "Chaque champ lu a un état. Survoler un champ allume la zone correspondante sur le document.", `
    <div class="ds-grid2">
      ${fig("Un doute à trancher", `<div class="card ia-card is-warn" style="width:100%"><p class="ia-head">${icon("spark")}<strong>Lecture IA</strong><span class="conf conf--warn">64 %</span></p>
        <div class="check"><p class="check-title">${icon("alert")}<strong>${check1.title}</strong><span class="conf conf--warn">${check1.conf} %</span></p><p class="check-text">${check1.text}</p>
        <div class="check-options">${check1.options.map((o) => `<button class="btn btn-sm btn-ghost">${o.label}</button>`).join("")}</div>
        <button class="link-btn check-fix">${icon("pen")}Autre valeur : corriger à la main</button></div></div>`)}
      ${fig("Les quatre états d'un champ", `<div class="card" style="width:100%"><dl class="fields">
        <div class="field is-ok"><dt>N° de facture</dt><dd>FA-2026-1184</dd><span class="field-end"><span class="conf"></span><button class="field-edit" style="opacity:1" aria-label="Corriger">${icon("pen")}</button></span></div>
        <div class="field is-review"><dt>IBAN</dt><dd>FR76 4061 8803 1100 0402 9937 512</dd><span class="field-end"><span class="conf conf--warn">61 %</span></span></div>
        <div class="field is-resolved"><dt>Échéance</dt><dd>31 décembre 2026</dd><span class="field-end"><span class="conf">${icon("check")}Vérifié</span></span></div>
        <div class="field is-edited"><dt>Montant TTC</dt><dd>8 640,00 €</dd><span class="field-end"><span class="conf">${icon("check")}Corrigé</span></span></div>
      </dl></div>`)}
    </div>
    <p class="ds-note"><b>Lu</b> sans doute · <b>À revoir</b> en orange avec la confiance · <b>Vérifié</b> quand Clara a tranché · <b>Corrigé</b> en bleu quand la valeur vient d'elle, pas de l'IA.</p>`);

  const stepper = (st, done) => `<ol class="stepper is-${st}">${["Reçue", "Vérifiée", "Validée", "Réglée"].map((l, i) => `<li class="${i < done ? "is-done" : i === done ? "is-current" : ""}"><span class="step-dot">${i < done ? icon("check") : i + 1}</span>${l}</li>`).join("")}</ol>`;
  const circuit = sec("circuit", "Circuit de validation", "L'étape en cours prend la couleur de l'état, comme dans la liste. Quand c'est à l'autre personne d'agir, on montre son visage et depuis quand elle attend.", `
    <div class="ds-grid2">
      ${fig("À vérifier", stepper("verifier", 1))}
      ${fig("En validation", stepper("valider", 2))}
      ${fig("Prête à payer", stepper("payer", 3))}
      ${fig("Réglée", stepper("payee", 4))}
    </div>
    <h3>Attente</h3>
    <div class="inv-actions" style="justify-content:flex-start"><div class="waiting"><span class="kpi-avatar waiting-avatar">JL<span class="kpi-badge">${icon("clock")}</span></span><p><strong>En attente de Julien Lemaire</strong><span>Depuis 5 j · c'est au gérant de valider la dépense</span></p><button class="btn btn-ghost">Relancer</button></div></div>`);

  const decision = sec("decision", "Décision du gérant", "Julien voit l'essentiel en haut de la fiche, puis décide. Sur téléphone, Refuser et Valider restent en bas de l'écran, sous le pouce.", `
    <div class="ds-grid2 ds-static">
      ${fig("Ce que vous validez", `<section class="card decide-card" style="width:100%"><h2 class="card-title">Ce que vous validez</h2><p class="decide-obj">Entretien du torréfacteur P25</p>
        <dl class="decide-grid"><div><dt>Montant TTC</dt><dd>3 576,00 €</dd></div><div><dt>Montant HT</dt><dd>2 980,00 €</dd></div><div><dt>Échéance</dt><dd>Dans 3 j</dd></div><div><dt>Compte</dt><dd>Entretien et réparations</dd></div></dl>
        <ul class="decide-checks"><li>${icon("check")}Lecture vérifiée par Clara Martin</li><li class="is-warn">${icon("alert")}+18 % par rapport à d'habitude (moyenne 3 480,00 €)</li></ul>
        <a class="decide-doc" href="#decision">${icon("doc")}Voir la facture originale</a></section>`)}
      <div class="ds-fig"><figcaption>Barre de décision et suite</figcaption>
        <div class="inv-actions is-decide" style="display:grid;grid-template-columns:1fr 1.6fr;gap:8px;padding:12px;border-radius:16px;box-shadow:0 -8px 24px rgba(16,24,40,.1);background:#fff"><button class="btn btn-ghost" style="justify-content:center;height:48px">Refuser</button><button class="btn btn-primary" style="justify-content:center;height:48px">${icon("check")}Valider pour paiement</button></div>
        <div class="inv-actions" style="justify-content:flex-start;margin-top:12px"><p class="decide-done">${icon("check")}<span><strong>Validée</strong>Clara Martin programmera le virement avant le 6 nov.</span></p><a class="btn btn-primary" href="#decision">Suivante : Fournisseur d'électricité (2 restantes)${icon("next")}</a></div>
      </div>
    </div>`);

  const refus = sec("refus", "Refus", "On ne refuse jamais sans motif. Le fournisseur est prévenu, et la fiche garde la trace de la suite.", `
    <div class="ds-grid2 ds-static">
      ${fig("Fenêtre de refus", `<div class="modal-back"><form class="modal" onsubmit="return false" style="width:100%"><div class="modal-head"><h2>Refuser la facture</h2><button type="button" class="round-btn" aria-label="Fermer">${icon("x")}</button></div><div class="modal-body">
        <p class="modal-sub">Fournisseur d'électricité · 10293847561 · 1 247,90 €</p>
        <fieldset class="reasons"><legend>Motif du refus</legend>${REFUSAL_REASONS.map((r, i) => `<label class="reason"><input type="radio" name="ds-r" ${i === 1 ? "checked" : ""}><span>${r}</span></label>`).join("")}</fieldset>
        <label class="check-line"><input type="checkbox" checked><span>Prévenir le fournisseur par e-mail et demander un avoir</span></label>
        <div class="modal-actions"><button type="button" class="btn btn-ghost">Annuler</button><button class="btn btn-danger">Refuser la facture</button></div></div></form></div>`)}
      <div class="ds-fig"><figcaption>Facture refusée</figcaption>
        <section class="refusal"><span class="refusal-ico">${icon("x")}</span><div class="refusal-main"><strong>Refusée : Montant incorrect</strong><span>Par Julien Lemaire, le 3 nov. · « Le relevé indique 1 147,90 € »</span></div><div class="refusal-next"><span class="refusal-step">${icon("clock")}Fournisseur prévenu · en attente d'un avoir</span><button class="btn btn-ghost btn-sm">Avoir reçu</button></div></section>
        <section class="refusal" style="margin-top:12px"><span class="refusal-ico">${icon("x")}</span><div class="refusal-main"><strong>Refusée : Facture en double</strong><span>Par Clara Martin, le 3 nov. · « Doublon de TV/10/0871 »</span></div><div class="refusal-next"><span class="refusal-step is-done">${icon("check")}Rien à payer, dossier clos</span></div></section>
      </div>
    </div>`);

  const rd = (lead, title, sub, side, cls = "", extra = "") => `<li class="rd is-done ${cls}">${lead}<span class="rd-main"><strong>${title}</strong><span>${sub}</span></span><span class="rd-result">${side}</span>${extra}</li>`;
  const imp = sec("import", "Import", "Chaque document est lu l'un après l'autre. Les imprévus restent visibles, avec ce qui va se passer pour chacun.", `
    <div class="ds-grid2">
      ${fig("Lecture en cours", `<ul class="reading" style="width:100%"><li class="rd"><span class="rd-file">${icon("doc")}</span><span class="rd-main"><strong>facture-electricite-novembre.pdf</strong><span>Extraction des montants</span><span class="rd-bar"><i style="width:60%"></i></span></span></li></ul>
        <label class="drop" style="margin-top:8px"><span class="drop-ico">${icon("upload")}</span><strong>Glissez vos factures ici</strong><span>PDF ou photo, plusieurs à la fois · <u>parcourir</u></span></label>`)}
      ${fig("Résultats", `<ul class="reading" style="width:100%">
        ${rd(tileOf("Fabricant d'emballages", "verifier"), "Fabricant d'emballages", "ER-55140 · échéance 18 nov.", `<b>2 448,00 €</b><span class="ia ia--done">${icon("spark")}Lue sans doute</span>`)}
        ${rd(tileOf("Fabricant d'emballages", "verifier"), "Fabricant d'emballages", "ER-55021 · déjà reçue le 2 nov., même montant", `<b>1 932,48 €</b><span class="ia ia--warn">${icon("alert")}Doublon</span>`, "is-skip", `<div class="rd-choice"><button class="chip-btn is-on">Ne pas importer</button><button class="chip-btn">Importer quand même</button></div>`)}
        ${rd(`<span class="rd-file rd-file--error">${icon("alert")}</span>`, "photo-ticket-livraison.jpg", "Photo trop floue pour être lue : reprenez-la à plat, bien éclairée.", `<span class="ia ia--late">Illisible</span>`, "is-error")}
        ${rd(`<span class="rd-file">${icon("doc")}</span>`, "devis-entretien-bruleur.pdf", "C'est un devis, pas une facture.", `<span class="ia ia--muted">Pas une facture</span>`, "is-skip")}
        ${rd(supplierTile({ fournisseur: "Fabricant de sacs en jute", statut: "verifier", echeance: "2026-12-03" }), "Fabricant de sacs en jute", "JF-2026-118 · nouveau fournisseur, sa fiche sera créée", `<b>744,00 €</b><span class="ia ia--new">${icon("users")}Nouveau</span>`)}
      </ul>`)}
    </div>`);

  const menus = sec("menus", "Menus et notifications", "Les menus flottants s'ouvrent sous leur bouton, se ferment avec Échap ou un clic à côté, et se parcourent au clavier.", `
    <div class="ds-grid3 ds-static">
      ${fig("Menu d'une ligne", `<div class="row-menu" role="menu"><a role="menuitem" href="#menus">${icon("doc")}Ouvrir la fiche</a><button role="menuitem">${icon("export")}Télécharger le PDF</button><div class="menu-sep"></div><p class="menu-label">Assigner à</p>${["CM", "JL", "SB"].map((k) => `<button role="menuitemradio" aria-checked="${k === "CM"}"><span class="avatar avatar--sm">${k}</span>${PEOPLE[k].nom}${k === "CM" ? `<span class="menu-check">${icon("check")}</span>` : ""}</button>`).join("")}<div class="menu-sep"></div><button role="menuitem" class="is-danger">${icon("alert")}Refuser la facture</button></div>`)}
      ${fig("Notifications", `<div class="floating notif-panel"><div class="np-head"><strong>Notifications</strong><button class="link-btn">Tout marquer comme lu</button></div><ul class="np-list">
        <li class="is-unread"><a href="#menus"><span class="np-dot"></span><span class="np-text">Julien a validé la facture PF-26-0417 (maintenance du torréfacteur) : elle est prête à payer.<span>3 nov., 10:00</span></span></a></li>
        <li class="is-unread"><a href="#menus"><span class="np-dot"></span><span class="np-text">Hélène Roux attend l'export d'octobre pour la déclaration de TVA.<span>2 nov., 9:12</span></span></a></li>
        <li><a href="#menus"><span class="np-dot"></span><span class="np-text">Julien a refusé la facture 10293847561 (fournisseur d'électricité) : montant incorrect.<span>31 oct., 17:10</span></span></a></li></ul></div>`)}
      ${fig("Barre du haut sur téléphone", `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 12px;border-radius:14px;background:#121513;color:#fff"><span style="display:flex;align-items:center;gap:8px;font:800 20px/1 var(--font);letter-spacing:-.045em"><span style="color:#5dd26e;display:flex;flex:none">${LOGO_MARK.replace('class="brand-mark"', 'width="26" height="26"')}</span>tampon</span><span style="display:flex;gap:4px"><span class="nav-icon-btn" style="display:grid">${icon("bell")}<span class="nav-dot">2</span></span><span class="nav-icon-btn" style="display:grid">${icon("menu")}</span></span></div>`)}
    </div>`);

  const messages = sec("messages", "Messages", "Un message court confirme chaque action. Quand l'action change des données, il propose « Annuler » pendant six secondes.", `
    <div class="ds-row ds-static">
      <div class="toast" role="status"><span>Facture validée : Clara est prévenue.</span><button class="toast-undo" type="button">Annuler</button></div>
      <div class="toast" role="status"><span>Téléchargement de ER-55021.pdf simulé.</span></div>
    </div>
    <h3>Bandeau de démonstration</h3>
    <div class="demo-bar"><span class="demo-tag">Démo</span><p>Vous voyez Tampon comme <strong>Clara</strong>, la comptable, qui vérifie et paie.</p><button class="demo-switch"><span class="avatar avatar--sm">JL</span>Passer côté Julien${icon("arrow")}</button></div>
    <h3>Indications</h3>
    <div class="ds-row"><p class="action-hint" style="flex-basis:auto;text-align:left">Encore 2 points à vérifier</p><p class="decide-note">${icon("alert")}Envoyée par Clara Martin depuis 5 j · lecture vérifiée</p></div>`);

  /* ---------- Contenu ---------- */

  const ecriture = sec("ecriture", "Écriture", "Tampon parle comme une collègue précise : vouvoiement, phrases courtes, verbes d'action, et toujours la prochaine étape.", `
    <div class="ds-dodont" style="margin-top:16px">
      <div class="ds-do"><b>On écrit</b><ul><li>« Valider pour paiement »</li><li>« En attente de Julien Lemaire · depuis 5 j »</li><li>« Montant non reconnu : écrivez-le comme 1 234,56. »</li><li>« Photo trop floue : reprenez-la à plat, bien éclairée. »</li></ul></div>
      <div class="ds-dont"><b>On évite</b><ul><li>« OK », « Soumettre », « Traiter »</li><li>« Workflow en cours »</li><li>« Erreur de saisie »</li><li>« Échec du traitement OCR »</li></ul></div>
    </div>
    <ul class="ds-rules">
      <li><b>Les états sont des noms fixes</b><span>À vérifier, En validation, Prête à payer, Réglée, Refusée. Jamais de synonyme ailleurs.</span></li>
      <li><b>Les montants en euros français</b><span>Espace fine avant €, virgule décimale, deux décimales dans les tableaux.</span></li>
      <li><b>Les dates relatives d'abord</b><span>« Dans 3 j », « En retard de 3 j » : on agit sur un délai, pas sur une date.</span></li>
    </ul>`);

  const accessibilite = sec("accessibilite", "Accessibilité", "Visé : WCAG 2.2 niveau AA pour les textes et les interactions.", `
    <ul class="ds-rules">
      <li><b>Contraste</b><span>Tout texte atteint 4,5:1. Les petits textes gris utilisent ${css("--gray-600")}, jamais le gris de décor.</span></li>
      <li><b>Clavier</b><span>Menus, fenêtres et tiroir se parcourent au clavier et se ferment avec Échap ; le focus revient au bouton d'origine.</span></li>
      <li><b>Lecteurs d'écran</b><span>Boutons ronds libellés, rôles menu, dialog et tab, messages annoncés par une zone status.</span></li>
      <li><b>Mouvement</b><span>Les animations sont coupées quand le système demande moins d'animations.</span></li>
      <li><b>Cibles tactiles</b><span>44 px minimum sur téléphone, 48 px pour la barre de décision.</span></li>
      <li><b>Jamais la couleur seule</b><span>Un mot, une coche ou une croix accompagne chaque couleur d'état.</span></li>
    </ul>`);

  const counts = { colors: 24, styles: TYPES.length, comps: 13 };
  document.getElementById("ds").innerHTML = `
    ${ICON_SPRITE}
    <nav class="ds-nav" aria-label="Sommaire du design system">
      <a class="ds-brand" href="index.html">${LOGO_MARK}tampon</a>
      ${NAV.map(([g, items]) => `<h2>${g}</h2>${items.map(([id, l]) => `<a href="#${id}">${l}</a>`).join("")}`).join("")}
      <a class="ds-back" href="index.html">← Ouvrir l'application</a>
    </nav>
    <main>
      <header class="ds-head">
        <p class="eyebrow">Design system · version 1.0 · novembre 2026</p>
        <h1>Tampon<span>.</span></h1>
        <p>Les couleurs, les textes, les composants et les règles de l'outil de factures fournisseurs. Chaque exemple de cette page utilise le code de l'application : quand un composant évolue, sa documentation suit.</p>
        <div class="ds-figs"><span><b>${counts.colors}</b> couleurs nommées</span><span><b>${counts.styles}</b> styles de texte</span><span><b>${counts.comps}</b> familles de composants</span><span><b>5</b> états de facture</span></div>
      </header>
      ${principes}${couleurs}${etats}${typo}${espaces}${icones}${logo}
      ${boutons}${champs}${onglets}${etiquettes}${chiffres}${ligne}${lecture}${circuit}${decision}${refus}${imp}${menus}${messages}
      ${ecriture}${accessibilite}
    </main>`;

  // Rien ne doit partir d'une page de documentation
  document.addEventListener("submit", (e) => e.preventDefault());
})();
