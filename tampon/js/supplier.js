// Fiche fournisseur : son IBAN, ses factures, et ce que l'outil a appris de lui.

const NAME = new URLSearchParams(location.search).get("n");
if (!SUPPLIERS[NAME]) location.replace("fournisseurs.html");

const plural = (n) => (n > 1 ? "s" : "");
const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function ibanCard(s) {
  const check = s.ibanCheck && (CHECKS[s.ibanCheck.id] || []).find((c) => c.key === "iban");
  if (check) {
    const first = !s.sup.iban; // nouveau fournisseur : aucun IBAN connu
    return `
      <section class="card iban-card is-warn">
        <div class="card-head"><h2 class="card-title">IBAN</h2><span class="pill pill--verifier">À confirmer</span></div>
        <p class="iban-intro">${icon("alert")}<span>${
          first
            ? `Premier IBAN reçu pour ce fournisseur, sur la facture <a href="facture.html?id=${s.ibanCheck.id}">${s.ibanCheck.numero}</a>. Confirmez-le avec lui avant le premier virement.`
            : `Un nouvel IBAN apparaît sur la facture <a href="facture.html?id=${s.ibanCheck.id}">${s.ibanCheck.numero}</a> du ${numDate.format(toDate(s.ibanCheck.recue))}. Appelez le fournisseur à son numéro habituel avant de l'accepter.`
        }</span></p>
        <dl class="iban-compare">
          ${first ? "" : `<div><dt>Enregistré</dt><dd>${s.sup.iban}</dd></div>`}
          <div class="is-new"><dt>Sur la facture</dt><dd>${check.docValue}</dd></div>
        </dl>
        <div class="iban-actions">
          ${check.options.map((o) => `<button class="btn btn-sm btn-ghost" data-iban="${o.value}">${o.label}</button>`).join("")}
        </div>
      </section>`;
  }
  // IBAN retenu : corrigé à la main, ou celui de la facture une fois confirmé, sinon celui enregistré
  const src = s.invoices.find((f) => (CHECKS[f.id] || []).some((c) => c.key === "iban"));
  const manual = src && (store.data.edits[src.id] || {}).iban;
  const docValue = src && CHECKS[src.id].find((c) => c.key === "iban").docValue;
  const iban = manual || (s.ibanChoice && s.ibanChoice !== "known" ? docValue : s.sup.iban);
  const note = manual
    ? "IBAN corrigé à la main sur la facture"
    : s.ibanChoice === "known"
    ? "IBAN enregistré conservé après vérification"
    : s.ibanChoice === "rib"
    ? "Confirmé par un RIB signé"
    : s.ibanChoice
    ? "IBAN confirmé avec le fournisseur"
    : `Utilisé pour ${s.paid.length} virement${plural(s.paid.length)}`;
  return `
    <section class="card iban-card">
      <div class="card-head"><h2 class="card-title">IBAN</h2><span class="pill pill--payee">Vérifié</span></div>
      <p class="iban-value">${iban}</p>
      <p class="card-note">${note}</p>
    </section>`;
}

function render() {
  const s = supplierData(NAME);
  const status = s.ibanCheck ? `<span class="pill pill--verifier">IBAN à confirmer</span>` : s.late.length ? `<span class="pill pill--late">${s.late.length} en retard</span>` : `<span class="pill pill--payee">À jour</span>`;
  const delays = s.paid.map((f) => Math.round((addDays(f.echeance, -1) - toDate(f.recue)) / 86400000));
  const avg = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;
  // Délai entre réception et échéance, lu sur la dernière facture
  const last = s.invoices[0];
  const terms = Math.round((toDate(last.echeance) - toDate(last.recue)) / 86400000);
  document.title = `${PRODUCT} · ${NAME}`;

  renderShell(
    "Fournisseurs",
    `
    <nav class="crumbs" aria-label="Fil d'Ariane"><a href="fournisseurs.html">${icon("back")}Fournisseurs</a></nav>

    <header class="inv-head sup-head">
      <div class="supplier">
        <span class="tile tile--neutral tile--lg"><svg aria-hidden="true"><use href="#${SUPPLIER_ICONS[NAME] || "linear-bill"}"/></svg></span>
        <div>
          <h1>${NAME}</h1>
          <p class="muted">${s.sup.ville} · ${s.sup.compte.split(" · ")[1]} · fournisseur depuis ${monthYear.format(toDate(s.since))}</p>
        </div>
      </div>
      <div class="inv-sum">${status}<p class="inv-amount">${eur.format(s.engaged)}</p><p class="muted">engagés sur 30 jours</p></div>
    </header>

    <section class="stat-row" aria-label="Chiffres du fournisseur">
      <div class="stat"><span class="stat-label">Factures</span><b class="stat-value">${s.invoices.length}</b><span class="stat-sub">${s.paid.length} réglée${plural(s.paid.length)}</span></div>
      <div class="stat"><span class="stat-label">En cours</span><b class="stat-value">${eur.format(sum(s.open)).replace(/,\d\d/, "")}</b><span class="stat-sub">${s.open.length} facture${plural(s.open.length)} à traiter</span></div>
      <div class="stat${s.late.length ? " stat--late" : ""}"><span class="stat-label">En retard</span><b class="stat-value">${s.late.length ? eur.format(sum(s.late)).replace(/,\d\d/, "") : "0 €"}</b><span class="stat-sub">${s.late.length ? `${s.late.length} facture${plural(s.late.length)} échue${plural(s.late.length)}` : "rien d'échu"}</span></div>
      <div class="stat"><span class="stat-label">Délai de paiement</span><b class="stat-value">${avg !== null ? `${avg} j` : "—"}</b><span class="stat-sub">${avg !== null ? "de la réception au virement" : "aucun virement encore"}</span></div>
    </section>

    <div class="dash-grid">
      <section class="card sup-invoices">
        <div class="card-head"><h2 class="card-title">Factures</h2><a class="card-link" href="index.html?q=${encodeURIComponent(NAME)}">Voir dans la liste ${icon("next")}</a></div>
        <ul class="inv-list">${s.invoices
          .map(
            (f) => `
          <li class="${isLate(f) ? "is-late" : ""}">
            <a href="facture.html?id=${f.id}">
              ${supplierTile(f)}
              <span class="il-main"><strong>${f.numero}</strong><span>Reçue le ${shortDate.format(toDate(f.recue))} · échéance ${shortDate.format(toDate(f.echeance))}</span></span>
              <span class="il-amount">${eur.format(f.ttc)}</span>
              <span class="pill pill--${f.statut}">${STATUTS[f.statut]}</span>
            </a>
          </li>`
          )
          .join("")}</ul>
      </section>

      <div class="sup-side">
        ${ibanCard(s)}
        <section class="card">
          <h2 class="card-title">Ce que Tampon a appris</h2>
          <dl class="learned">
            <div><dt>Compte comptable</dt><dd>${s.sup.compte}</dd></div>
            <div><dt>TVA habituelle</dt><dd>${String(s.sup.tva).replace(".", ",")} %</dd></div>
            <div><dt>Conditions</dt><dd>Paiement à ${terms} jours</dd></div>
            <div><dt>Objet habituel</dt><dd>${s.sup.objet}</dd></div>
          </dl>
          <p class="card-text">${icon("spark")}Ces informations servent à contrôler chaque nouvelle facture de ce fournisseur.</p>
        </section>
      </div>
    </div>`
  );
}

function bind() {
  document.getElementById("app").addEventListener("click", (e) => {
    const b = e.target.closest("[data-iban]");
    if (!b) return;
    const s = supplierData(NAME);
    const id = s.ibanCheck.id;
    const check = CHECKS[id].find((c) => c.key === "iban");
    const opt = check.options.find((o) => o.value === b.dataset.iban);
    // Même décision que sur la fiche facture : les deux écrans restent d'accord
    const snap = snapshot();
    store.data.choix[id] = { ...(store.data.choix[id] || {}), iban: opt.value };
    (store.data.events[id] = store.data.events[id] || []).push({ when: "3 nov., 10:00", who: PEOPLE[CURRENT_USER].nom, what: `${check.title} : ${opt.label} (depuis la fiche fournisseur)` });
    store.save();
    render();
    document.querySelector(".iban-card")?.classList.add("anim-pop");
    toast(opt.value === "known" ? "IBAN enregistré conservé." : "IBAN confirmé : les virements sont débloqués.", snap);
  });
  bindCommon();
}

render();
bind();
