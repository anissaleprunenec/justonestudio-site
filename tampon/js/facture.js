// Fiche facture : le document à gauche, ce que l'IA en a lu à droite.

const ID = Number(new URLSearchParams(location.search).get("id")) || 1;
const ORDER = ["verifier", "valider", "payer", "payee"];
const NOW = "3 nov., 10:00";
let zoom = 1;

const current = () => invoices().find((f) => f.id === ID);
const original = allInvoices().find((f) => f.id === ID);
if (!original) location.replace("index.html");

const sup = SUPPLIERS[original.fournisseur];
const checks = CHECKS[ID] || [];
const checkFor = (key) => checks.find((c) => c.key === key);
const choices = () => store.data.choix[ID] || {};

// HT et TVA suivent le TTC retenu (corrigé à la main ou lu par l'IA)
const htOf = (ttc) => Math.round((ttc / (1 + sup.tva / 100)) * 100) / 100;
const ht = htOf(original.ttc);
const tva = Math.round((original.ttc - ht) * 100) / 100;
const edits = () => store.data.edits[ID] || {};
let editing = new URLSearchParams(location.search).get("edit"); // champ en cours de correction (?edit=ttc)
const fr = (n) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const docIban = checkFor("iban")?.docValue || sup.iban;

function ibanValue() {
  const c = choices().iban;
  if (edits().iban) return edits().iban;
  if (c === "known") return sup.iban;
  return docIban;
}

// Champs qu'on peut corriger à la main, et sous quelle forme
const EDITABLE = {
  numero: { type: "text", raw: (f) => f.numero },
  emission: { type: "date", raw: (f) => edits().emission || f.recue },
  echeance: { type: "date", raw: (f) => f.echeance },
  ttc: { type: "text", raw: (f) => fr(f.ttc), inputmode: "decimal" },
  iban: { type: "text", raw: () => ibanValue() },
};

function fields(f) {
  const fHt = htOf(f.ttc);
  return [
    { key: "fournisseur", label: "Fournisseur", value: f.fournisseur, conf: 99 },
    { key: "numero", label: "N° de facture", value: f.numero, conf: 98 },
    { key: "emission", label: "Date d'émission", value: longDate.format(toDate(edits().emission || f.recue)), conf: 97 },
    { key: "echeance", label: "Échéance", value: longDate.format(toDate(f.echeance)), conf: 96 },
    { key: "ht", label: "Montant HT", value: eur.format(fHt), conf: 96 },
    { key: "tva", label: `TVA ${String(sup.tva).replace(".", ",")} %`, value: eur.format(Math.round((f.ttc - fHt) * 100) / 100), conf: 95 },
    { key: "ttc", label: "Montant TTC", value: eur.format(f.ttc), conf: 98 },
    { key: "iban", label: "IBAN", value: ibanValue(), conf: 97 },
  ].map((field) => {
    if (field.key in edits()) return { ...field, state: "edited" };
    const c = checkFor(field.key);
    if (!c) return { ...field, state: "ok" };
    return { ...field, conf: c.conf, state: field.key in choices() ? "resolved" : "review" };
  });
}

function history(f) {
  const steps = [{ when: shortDate.format(toDate(original.recue)), who: PRODUCT, what: `Reçue par e-mail et lue par l'IA (${original.ia} %)` }];
  const rank = ORDER.indexOf(original.statut);
  if (rank >= 1) steps.push({ when: shortDate.format(addDays(original.recue, 1)), who: PEOPLE.CM.nom, what: "Lecture vérifiée, envoyée en validation" });
  if (rank >= 2) steps.push({ when: shortDate.format(addDays(original.recue, 2)), who: PEOPLE.JL.nom, what: "Validée pour paiement" });
  if (rank >= 3) steps.push({ when: shortDate.format(addDays(original.echeance, -1)), who: PEOPLE.CM.nom, what: "Réglée par virement" });
  if (original.statut === "refusee") {
    steps.push({ when: shortDate.format(addDays(original.recue, 2)), who: PEOPLE.SB.nom, what: `Refusée : ${original.alerte}` });
    steps.push({ when: shortDate.format(addDays(original.recue, 2)), who: PRODUCT, what: "Fournisseur prévenu, avoir demandé" });
  }
  return steps.concat(store.data.events[ID] || []);
}

function addEvent(what, who = PEOPLE[CURRENT_USER].nom) {
  logEvent(ID, what, who);
}

// Refus : la facture de départ 13 a déjà son motif ; les autres le prennent dans la fenêtre de refus
function refusalOf() {
  return (
    store.data.refusals[ID] ||
    (original.statut === "refusee"
      ? { motif: original.alerte, note: "Personne n'est venu le 21 octobre.", mail: true, by: "SB", when: shortDate.format(addDays(original.recue, 2)) }
      : null)
  );
}

// Ce qui vient de changer, pour l'animer une fois au rendu suivant.
let justChanged = null;

// snap : l'état d'avant, pris avant toute modification (notifications comprises), pour « Annuler »
function setStatut(statut, what, msg, snap = snapshot()) {
  store.data.statuts[ID] = statut;
  store.data.flash = ID; // la liste fera briller cette ligne au retour
  addEvent(what);
  store.save();
  justChanged = { statut };
  render();
  toast(msg, snap);
}

function playChange() {
  if (!justChanged) return;
  const app = document.getElementById("app");
  if (justChanged.statut) {
    app.querySelector(".inv-sum .pill")?.classList.add(justChanged.statut === "payee" ? "anim-stamp" : "anim-pop");
    app.querySelector(".inv-head .tile")?.classList.add("anim-pop");
    app.querySelector(".stepper li.is-current, .stepper li.is-done:last-child, .stepper.is-refused li:last-child")?.classList.add("anim-step");
  }
  if (justChanged.check) {
    app.querySelector(`.check[data-f="${justChanged.check}"]`)?.classList.add("anim-in");
    // Dernier point tranché : le bouton de confirmation se débloque
    if (!openChecks(ID).length) app.querySelector('[data-action="confirm"]')?.classList.add("anim-pop");
  }
  app.querySelector(".timeline li:last-child")?.classList.add("anim-in");
  justChanged = null;
}

/* Document */

function renderDoc(f) {
  const flagged = (key) => (fields(f).find((x) => x.key === key)?.state === "review" ? " is-flag" : "");
  const span = (key, text) => `<span class="doc-f${flagged(key)}" data-f="${key}">${text}</span>`;
  const pu = ht / sup.qte;
  const terms = ID === 1 ? ` ${span("echeance", "· Paiement à 30 jours fin de mois")}` : "";

  return `
    <article class="doc" style="--z:${zoom}">
      <header class="doc-head">
        <div>
          <p class="doc-sup">${span("fournisseur", original.fournisseur)}</p>
          <p>${sup.ville}</p>
          <p>SIRET 8${String(ID).padStart(2, "0")} 412 337 000${String(ID).padStart(2, "0")}</p>
        </div>
        <div class="doc-title">
          <p class="doc-h">FACTURE</p>
          <p>N° ${span("numero", original.numero)}</p>
          <p>Date : ${span("emission", numDate.format(toDate(original.recue)))}</p>
        </div>
      </header>

      <div class="doc-client">
        <p class="doc-label">Facturé à</p>
        <p><strong>${COMPANY.nom}</strong><br>69001 ${COMPANY.ville}</p>
      </div>

      <table class="doc-lines">
        <thead><tr><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead>
        <tbody><tr><td>${sup.objet}</td><td>${sup.qte}</td><td>${fr(pu)}</td><td>${fr(ht)}</td></tr></tbody>
      </table>

      <div class="doc-totals">
        <p><span>Total HT</span>${span("ht", fr(ht) + " €")}</p>
        <p><span>TVA ${String(sup.tva).replace(".", ",")} %</span>${span("tva", fr(tva) + " €")}</p>
        <p class="doc-ttc"><span>Total TTC</span>${span("ttc", fr(original.ttc) + " €")}</p>
      </div>

      <footer class="doc-foot">
        <p>Échéance : ${span("echeance", numDate.format(toDate(original.echeance)))}${terms}</p>
        <p>Règlement par virement · IBAN ${span("iban", docIban)}</p>
        <p>Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de recouvrement : 40 €.</p>
      </footer>
    </article>`;
}

/* Panneau de droite */

function renderIaCard(f) {
  const left = openChecks(ID);
  if (f.statut === "refusee") {
    return `
      <section class="card ia-card">
        <p class="ia-head">${icon("x")}<strong>Facture refusée</strong></p>
        <p class="card-text">Elle reste dans l'historique du fournisseur, mais aucun virement ne partira.</p>
      </section>`;
  }
  if (f.statut !== "verifier") {
    return `
      <section class="card ia-card is-ok">
        <p class="ia-head">${icon("check")}<strong>Lecture vérifiée</strong></p>
        <p class="card-text">Les champs ont été confirmés avant l'envoi en validation.</p>
      </section>`;
  }
  return `
    <section class="card ia-card ${left.length ? "is-warn" : "is-ok"}">
      <p class="ia-head">${icon(left.length ? "spark" : "check")}<strong>Lecture IA</strong>${left.length ? `<span class="conf conf--warn">${original.ia} %</span>` : ""}</p>
      <p class="card-text">${
        left.length
          ? `${left.length} point${left.length > 1 ? "s" : ""} à vérifier avant l'envoi en validation. Le reste a été lu sans doute.`
          : "Tous les champs sont vérifiés. Vous pouvez envoyer la facture en validation."
      }</p>
      ${checks.map((c) => renderCheck(c, f)).join("")}
    </section>`;
}

function renderCheck(c, f) {
  const chosen = choices()[c.key];
  if (chosen !== undefined) {
    const opt = c.options.find((o) => o.value === chosen);
    return `
      <div class="check is-done" data-f="${c.key}">
        <p class="check-done">${icon("check")}<span><strong>${c.title}</strong> · ${opt ? opt.label : "corrigé à la main"}</span></p>
        ${canEdit(f) && opt ? `<button class="link-btn" data-undo="${c.key}">Modifier</button>` : ""}
      </div>`;
  }
  return `
    <div class="check" data-f="${c.key}">
      <p class="check-title">${icon("alert")}<strong>${c.title}</strong><span class="conf conf--warn">${c.conf} %</span></p>
      <p class="check-text">${c.text}</p>
      <div class="check-options">
        ${
          canEdit(f)
            ? c.options.map((o) => `<button class="btn btn-sm ${o.refuse ? "btn-danger-ghost" : "btn-ghost"}" data-choose="${c.key}" data-value="${o.value}">${o.label}</button>`).join("")
            : `<span class="check-wait">Clara tranche ce point avant de vous l'envoyer.</span>`
        }
      </div>
      ${canEdit(f) && EDITABLE[c.key] && c.key !== "iban" ? `<button class="link-btn check-fix" data-edit="${c.key}">${icon("pen")}Autre valeur : corriger à la main</button>` : ""}
    </div>`;
}

// Seule Clara corrige, et seulement tant que la lecture n'est pas confirmée
function canEdit(f) {
  return f.statut === "verifier" && CURRENT_USER === "CM";
}

function onDoc(key) {
  if (key === "ttc") return fr(original.ttc) + " €";
  if (key === "iban") return docIban;
  if (key === "numero") return original.numero;
  return numDate.format(toDate(key === "emission" ? original.recue : original.echeance));
}

function renderField(x, f) {
  if (editing === x.key && EDITABLE[x.key] && canEdit(f)) {
    const e = EDITABLE[x.key];
    return `
      <form class="field is-editing" data-f="${x.key}" id="edit-form">
        <label for="edit-input">${x.label}</label>
        <input class="edit-input" id="edit-input" type="${e.type}" value="${e.raw(f)}"${e.inputmode ? ` inputmode="${e.inputmode}"` : ""} aria-describedby="edit-hint" required>
        <p class="edit-hint" id="edit-hint">Lu sur le document : ${onDoc(x.key)}</p>
        <span class="edit-actions">
          <button type="button" class="btn btn-sm btn-ghost" data-edit-cancel>Annuler</button>
          <button type="submit" class="btn btn-sm btn-primary">Enregistrer</button>
        </span>
      </form>`;
  }
  // La confiance de l'IA ne s'affiche que sur un champ douteux : ailleurs, c'est du bruit
  const badge = x.state === "edited" ? `${icon("check")}Corrigé` : x.state === "resolved" ? `${icon("check")}Vérifié` : x.state === "review" ? `${x.conf} %` : "";
  return `
    <div class="field is-${x.state}" data-f="${x.key}" tabindex="0">
      <dt>${x.label}</dt>
      <dd>${x.value}</dd>
      <span class="field-end">
        <span class="conf${x.state === "review" ? " conf--warn" : ""}">${badge}</span>
        ${canEdit(f) && EDITABLE[x.key] ? `<button class="field-edit" data-edit="${x.key}" aria-label="Corriger : ${x.label}" title="Corriger">${icon("pen")}</button>` : ""}
      </span>
    </div>`;
}

function renderFields(f) {
  return `
    <section class="card">
      <h2 class="card-title">Champs lus sur le document</h2>
      ${canEdit(f) ? `<p class="card-text fields-hint">Un champ mal lu ? Corrigez-le avec le crayon : le document d'origine reste intact.</p>` : ""}
      <dl class="fields">
        ${fields(f).map((x) => renderField(x, f)).join("")}
      </dl>
    </section>

    <section class="card">
      <h2 class="card-title">Imputation comptable</h2>
      <div class="imputation">
        <div>
          <p class="imputation-value">${sup.compte}</p>
          <p class="card-text">${icon("spark")}Suggéré d'après les factures précédentes de ce fournisseur.</p>
        </div>
        <button class="btn btn-ghost btn-sm" data-demo="Le choix du compte arrive dans la version complète.">Changer</button>
      </div>
    </section>`;
}

function renderCircuit(f) {
  const labels = f.statut === "refusee" ? ["Reçue", "Refusée"] : ["Reçue", "Vérifiée", "Validée", "Réglée"];
  const done = f.statut === "refusee" ? 2 : ORDER.indexOf(f.statut) + 1;
  // L'étape en cours prend la couleur de l'état, comme dans la liste
  return `
    <section class="card">
      <h2 class="card-title">Circuit de validation</h2>
      <ol class="stepper is-${f.statut}${f.statut === "refusee" ? " is-refused" : ""}">
        ${labels
          .map((l, i) => `<li class="${i < done ? "is-done" : i === done ? "is-current" : ""}"><span class="step-dot">${i < done ? icon("check") : i + 1}</span>${l}</li>`)
          .join("")}
      </ol>
      <ul class="timeline">
        ${history(f)
          .map((h) => `<li><span class="tl-when">${h.when}</span><span><strong>${h.who}</strong> · ${h.what}</span></li>`)
          .join("")}
      </ul>
    </section>`;
}

function renderActions(f) {
  const left = openChecks(ID).length;
  const julien = CURRENT_USER === "JL";
  // Envoyée en validation pendant la démo = aujourd'hui, sinon le lendemain de la réception.
  const since = store.data.statuts[ID] === "valider" ? 0 : -daysFromToday(f.recue) - 1;
  const sinceText = since ? `depuis ${since} j` : "depuis aujourd'hui";
  const relanced = (store.data.events[ID] || []).some((e) => e.what.startsWith("Relance"));
  switch (f.statut) {
    case "verifier":
      if (julien)
        return `
          <div class="waiting">
            <span class="kpi-avatar waiting-avatar" title="${PEOPLE.CM.nom}">CM<span class="kpi-badge">${icon("clock")}</span></span>
            <p><strong>${PEOPLE.CM.nom} vérifie la lecture</strong><span>Elle vous l'enverra en validation une fois les champs confirmés</span></p>
          </div>`;
      return `
        <button class="btn btn-ghost" data-action="refuse">Refuser</button>
        <button class="btn btn-primary" data-action="confirm"${left ? " disabled" : ""}>${icon("check")}Confirmer et envoyer en validation</button>
        ${left ? `<p class="action-hint">Encore ${left} point${left > 1 ? "s" : ""} à vérifier</p>` : ""}`;
    case "valider":
      // Séparation des tâches : c'est le gérant qui valide, Clara attend.
      if (julien)
        return `
          <p class="decide-note">${icon("alert")}Envoyée par ${PEOPLE.CM.nom} ${sinceText} · lecture vérifiée</p>
          <button class="btn btn-ghost" data-action="refuse">Refuser</button>
          <button class="btn btn-primary" data-action="approve">${icon("check")}Valider pour paiement</button>`;
      return `
        <div class="waiting">
          <span class="kpi-avatar waiting-avatar" title="${PEOPLE.JL.nom}">JL<span class="kpi-badge">${icon("clock")}</span></span>
          <p><strong>En attente de ${PEOPLE.JL.nom}</strong><span>${sinceText[0].toUpperCase() + sinceText.slice(1)} · c'est au gérant de valider la dépense</span></p>
          <button class="btn btn-ghost" data-action="remind"${relanced ? " disabled" : ""}>${relanced ? `${icon("check")}Relancé` : "Relancer"}</button>
        </div>
        <button class="link-btn demo-link" data-profile="JL">Passer dans la vue de Julien pour valider</button>`;
    case "payer":
      if (julien) {
        // Enchaîner : Julien valide sa file d'attente sans repasser par la liste
        const queue = invoices().filter((x) => x.statut === "valider");
        return `
          <p class="decide-done">${icon("check")}<span><strong>Validée</strong>${PEOPLE.CM.nom} programmera le virement avant le ${shortDate.format(toDate(f.echeance))}</span></p>
          ${
            queue.length
              ? `<a class="btn btn-primary" href="facture.html?id=${queue[0].id}">Suivante : ${queue[0].fournisseur}${queue.length > 1 ? ` (${queue.length} restantes)` : ""}${icon("next")}</a>`
              : `<a class="btn btn-ghost" href="dashboard.html">${icon("check")}Tout est validé</a>`
          }`;
      }
      return `
        <p class="action-hint is-info">Virement à programmer avant le ${longDate.format(toDate(f.echeance))}</p>
        <a class="btn btn-ghost" href="paiements.html">Préparer le lot de virements</a>
        <button class="btn btn-primary" data-action="pay">${icon("card")}Marquer comme réglée</button>`;
    case "refusee": {
      const r = refusalOf();
      if (!r) return "";
      // Un doublon ne demande pas d'avoir : il suffit de ne pas le payer deux fois
      const avoir = r.avoir || r.motif === "Facture en double";
      return `
        <section class="refusal">
          <span class="refusal-ico">${icon("x")}</span>
          <div class="refusal-main">
            <strong>Refusée : ${r.motif}</strong>
            <span>Par ${PEOPLE[r.by].nom}, le ${r.when.split(",")[0]}${r.note ? ` · « ${r.note} »` : ""}</span>
          </div>
          <div class="refusal-next">
            ${
              avoir
                ? `<span class="refusal-step is-done">${icon("check")}${r.avoir ? "Avoir reçu, dossier clos" : "Rien à payer, dossier clos"}</span>`
                : r.mail
                ? `<span class="refusal-step">${icon("clock")}Fournisseur prévenu · en attente d'un avoir</span>
                   ${julien ? "" : `<button class="btn btn-ghost btn-sm" data-action="avoir">Avoir reçu</button>`}`
                : `<span class="refusal-step">${icon("alert")}Fournisseur pas encore prévenu</span>
                   ${julien ? "" : `<button class="btn btn-ghost btn-sm" data-action="mail">Prévenir le fournisseur</button>`}`
            }
          </div>
        </section>`;
    }
    default:
      return "";
  }
}

// Vue du gérant : l'essentiel pour décider, en haut (et lisible sur téléphone)
function renderDecision(f) {
  if (CURRENT_USER !== "JL" || f.statut !== "valider") return "";
  const others = invoices().filter((x) => x.fournisseur === f.fournisseur && x.id !== ID && x.statut !== "refusee");
  const avg = others.length ? sum(others) / others.length : null;
  const diff = avg ? Math.round(((f.ttc - avg) / avg) * 100) : null;
  const days = daysFromToday(f.echeance);
  const fHt = htOf(f.ttc);
  const habit =
    diff === null
      ? original.kind === "newSupplier"
        ? `Nouveau fournisseur : première facture`
        : `Fournisseur habituel, pas d'autre facture récente pour comparer`
      : Math.abs(diff) < 10
      ? `Montant habituel pour ce fournisseur (moyenne ${eur.format(avg)})`
      : `${diff > 0 ? "+" : "−"}${Math.abs(diff)} % par rapport à d'habitude (moyenne ${eur.format(avg)})`;
  return `
    <section class="card decide-card">
      <h2 class="card-title">Ce que vous validez</h2>
      <p class="decide-obj">${sup.objet}</p>
      <dl class="decide-grid">
        <div><dt>Montant TTC</dt><dd>${eur.format(f.ttc)}</dd></div>
        <div><dt>Montant HT</dt><dd>${eur.format(fHt)}</dd></div>
        <div><dt>Échéance</dt><dd class="${days < 0 ? "is-late" : ""}">${days < 0 ? `En retard de ${-days} j` : days === 0 ? "Aujourd'hui" : `Dans ${days} j`}</dd></div>
        <div><dt>Compte</dt><dd>${sup.compte.split(" · ")[1]}</dd></div>
      </dl>
      <ul class="decide-checks">
        <li>${icon("check")}Lecture vérifiée par ${PEOPLE.CM.nom}</li>
        <li class="${diff !== null && Math.abs(diff) >= 10 ? "is-warn" : ""}">${icon(diff !== null && Math.abs(diff) >= 10 ? "alert" : "check")}${habit}</li>
      </ul>
      <a class="decide-doc" href="#viewer">${icon("doc")}Voir la facture originale</a>
    </section>`;
}

function nextToCheck() {
  const mine = CURRENT_USER === "JL" ? "valider" : "verifier";
  return invoices().find((x) => x.statut === mine && x.id !== ID);
}

function render() {
  const f = current();
  const next = nextToCheck();
  document.title = `${PRODUCT} · ${f.fournisseur} ${f.numero}`;

  renderShell(
    "Factures",
    `
    <nav class="crumbs" aria-label="Fil d'Ariane">
      <a href="index.html">${icon("back")}Factures</a>
      ${next ? `<a class="crumbs-next" href="facture.html?id=${next.id}">Suivante à ${CURRENT_USER === "JL" ? "valider" : "vérifier"} : ${next.fournisseur}${icon("next")}</a>` : ""}
    </nav>

    <header class="inv-head">
      <div class="supplier">
        ${supplierTile(f, true)}
        <div>
          <h1>${f.fournisseur}</h1>
          <p class="muted">${f.numero} · reçue le ${longDate.format(toDate(f.recue))} · suivie par ${PEOPLE[f.resp].nom} · <a class="sup-link" href="${supplierHref(f.fournisseur)}">Fiche fournisseur</a></p>
        </div>
      </div>
      <div class="inv-sum">
        <span class="pill pill--${f.statut}">${STATUTS[f.statut]}</span>
        <p class="inv-amount">${eur.format(f.ttc)}</p>
        <p class="muted">échéance ${longDate.format(toDate(f.echeance))}${isLate(f) ? ` · <span class="due-rel is-late">en retard de ${-daysFromToday(f.echeance)} j</span>` : ""}</p>
      </div>
    </header>

    <div class="inv-actions${CURRENT_USER === "JL" && f.statut === "valider" ? " is-decide" : ""}">${renderActions(f)}</div>

    <div class="inv-grid">
      <section class="viewer" id="viewer" aria-label="Document original">
        <div class="viewer-bar">
          <span class="viewer-name">${icon("file")}${f.numero.replace(/[\s/]/g, "-")}.pdf</span>
          <div class="viewer-tools">
            <button class="icon-btn" data-zoom="-1" aria-label="Dézoomer">${icon("zoomOut")}</button>
            <span class="viewer-zoom">${Math.round(zoom * 100)} %</span>
            <button class="icon-btn" data-zoom="1" aria-label="Zoomer">${icon("zoomIn")}</button>
            <button class="icon-btn" data-demo="Téléchargement simulé." aria-label="Télécharger">${icon("export")}</button>
          </div>
        </div>
        <div class="viewer-stage">${renderDoc(f)}</div>
      </section>

      <div class="side">
        ${renderDecision(f)}
        ${renderIaCard(f)}
        ${renderFields(f)}
        ${renderCircuit(f)}
      </div>
    </div>`
  );
  playChange();
}

/* Correction à la main d'un champ mal lu */

function saveEdit(key, raw) {
  const f = current();
  const before = fields(f).find((x) => x.key === key);
  let value = raw;
  if (key === "ttc") {
    value = Number(raw.replace(/[\s  €]/g, "").replace(",", "."));
    if (!isFinite(value) || value <= 0) {
      const hint = document.getElementById("edit-hint");
      hint.textContent = "Montant non reconnu : écrivez-le comme 1 234,56.";
      hint.classList.add("is-error");
      document.getElementById("edit-input").setAttribute("aria-invalid", "true");
      return;
    }
    value = Math.round(value * 100) / 100;
  }
  if (key === "iban") value = raw.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
  editing = null;
  // Rien n'a changé : on referme sans rien enregistrer
  if (String(value) === String(EDITABLE[key].raw(f)).replace(/\s/g, " ") || (key === "ttc" && value === f.ttc)) {
    render();
    return;
  }
  const snap = snapshot();
  store.data.edits[ID] = { ...edits(), [key]: value };
  // Corriger un champ douteux tranche aussi le point soulevé par l'IA
  if (checkFor(key)) store.data.choix[ID] = { ...choices(), [key]: "manual" };
  const after = fields(current()).find((x) => x.key === key);
  addEvent(`${before.label} corrigé : ${before.value} → ${after.value}`);
  store.save();
  justChanged = { check: key };
  render();
  document.querySelector(`.field[data-f="${key}"]`)?.classList.add("anim-flash");
  toast(`${before.label} corrigé.`, snap);
}

/* Interactions */

function highlight(key, on) {
  document.querySelectorAll(`[data-f="${key}"]`).forEach((el) => el.classList.toggle("is-hl", on));
}

function bind() {
  const app = document.getElementById("app");

  ["mouseover", "focusin"].forEach((type) =>
    app.addEventListener(type, (e) => {
      const el = e.target.closest("[data-f]");
      if (el) highlight(el.dataset.f, true);
    })
  );
  ["mouseout", "focusout"].forEach((type) =>
    app.addEventListener(type, (e) => {
      const el = e.target.closest("[data-f]");
      if (el && !el.contains(e.relatedTarget)) highlight(el.dataset.f, false);
    })
  );

  app.addEventListener("submit", (e) => {
    if (e.target.id !== "edit-form") return;
    e.preventDefault();
    saveEdit(editing, document.getElementById("edit-input").value.trim());
  });

  app.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      editing = edit.dataset.edit;
      render();
      const input = document.getElementById("edit-input");
      input.focus();
      if (input.type === "text") input.select();
      return;
    }
    if (e.target.closest("[data-edit-cancel]")) {
      const key = editing;
      editing = null;
      render();
      app.querySelector(`[data-edit="${key}"]`)?.focus();
      return;
    }

    const choose = e.target.closest("[data-choose]");
    if (choose) {
      const c = checkFor(choose.dataset.choose);
      const opt = c.options.find((o) => o.value === choose.dataset.value);
      if (opt.refuse) {
        // Le point n'est tranché qu'une fois le refus confirmé dans la fenêtre
        openRefuse(ID, () => {
          store.data.choix[ID] = { ...choices(), [c.key]: opt.value };
          store.save();
          justChanged = { statut: "refusee" };
          render();
        }, { motif: "Facture en double", note: c.refuseNote || "" });
        return;
      }
      // Pour l'échéance, la valeur choisie est la date retenue (lue par invoices()).
      store.data.choix[ID] = { ...choices(), [c.key]: opt.value };
      addEvent(`${c.title} : ${opt.label}`);
      store.save();
      justChanged = { check: c.key };
      render();
      return;
    }

    const undo = e.target.closest("[data-undo]");
    if (undo) {
      const all = choices();
      delete all[undo.dataset.undo];
      store.save();
      render();
      return;
    }

    const zoomBtn = e.target.closest("[data-zoom]");
    if (zoomBtn) {
      zoom = Math.min(1.4, Math.max(0.8, zoom + Number(zoomBtn.dataset.zoom) * 0.1));
      render();
      return;
    }

    const action = e.target.closest("[data-action]");
    if (!action || action.disabled) return;
    const a = action.dataset.action;
    const f = current();
    const label = `la facture ${f.numero} (${f.fournisseur.toLowerCase()})`;
    const snap = snapshot();
    if (a === "confirm") {
      notify("JL", `${firstName("CM")} vous a envoyé ${label}, ${eur.format(f.ttc)}, à valider.`, `facture.html?id=${ID}`);
      setStatut("valider", "Lecture vérifiée, envoyée en validation", `Envoyée à ${PEOPLE.JL.nom} pour validation.`, snap);
    }
    if (a === "approve") {
      notify("CM", `Julien a validé ${label} : elle est prête à payer.`, `facture.html?id=${ID}`);
      setStatut("payer", "Validée pour paiement", "Facture validée : Clara est prévenue.", snap);
    }
    if (a === "pay") setStatut("payee", "Réglée par virement", "Règlement enregistré.", snap);
    if (a === "refuse")
      openRefuse(ID, () => {
        justChanged = { statut: "refusee" };
        render();
      });
    if (a === "remind") {
      notify("JL", `Clara vous relance : ${label} attend votre validation.`, `facture.html?id=${ID}`);
      addEvent(`Relance envoyée à ${PEOPLE.JL.nom}`);
      store.save();
      render();
      toast(`Relance envoyée à ${PEOPLE.JL.nom}.`);
    }
    if (a === "mail" || a === "avoir") {
      const r = { ...refusalOf() };
      if (a === "mail") {
        r.mail = true;
        addEvent("Fournisseur prévenu, avoir demandé", PRODUCT);
      } else {
        r.avoir = true;
        addEvent("Avoir reçu du fournisseur, dossier clos");
      }
      store.data.refusals[ID] = r;
      store.save();
      render();
      toast(a === "mail" ? "Fournisseur prévenu, avoir demandé." : "Avoir enregistré, dossier clos.");
    }
  });

  bindCommon();
}

render();
bind();
