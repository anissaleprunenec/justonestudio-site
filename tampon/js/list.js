// Liste des factures fournisseurs.

const TABS = [
  { id: "toutes", label: "Toutes" },
  // Filtre transversal : une facture en retard garde son statut.
  { id: "retard", label: "En retard", filter: isLate },
  { id: "verifier", label: "À vérifier" },
  // côté Clara, la facture est chez Julien ; côté Julien, c'est à lui d'agir
  { id: "valider", label: CURRENT_USER === "JL" ? "À valider" : "En validation" },
  { id: "payer", label: "Prêtes à payer" },
  { id: "payee", label: "Réglées" },
  { id: "refusee", label: "Refusées" },
];

// Carte du haut → onglet qu'elle ouvre
const KPI_TABS = { verifier: "verifier", valider: "valider", late: "retard", payer: "payer" };

const NOW = "3 nov., 10:00";

const state = { tab: "toutes", q: "", selected: new Set(), resp: new Set(), doubts: false };

// Le tableau de bord ouvre la liste sur un onglet précis (?tab=retard…)
const params = new URLSearchParams(location.search);
const askedTab = params.get("tab");
if (TABS.some((t) => t.id === askedTab)) state.tab = askedTab;
// Julien arrive directement sur ce qu'il doit valider
else if (CURRENT_USER === "JL" && invoices().some((f) => f.statut === "valider")) state.tab = "valider";
// …ou sur un fournisseur (?q=Maintenance du torréfacteur)
state.q = params.get("q") || "";

function kpis(all) {
  const aVerifier = all.filter((f) => f.statut === "verifier");
  const aRevoir = aVerifier.filter((f) => openChecks(f.id).length > 0);
  const aValider = all.filter((f) => f.statut === "valider");
  // Depuis combien de jours la plus ancienne facture attend le gérant
  const attente = aValider.length ? Math.max(...aValider.map((f) => -daysFromToday(f.recue))) : 0;
  const enRetard = all.filter(isLate);
  // Factures déjà validées dont l'échéance tombe dans les 7 prochains jours.
  const semaine = all.filter((f) => {
    const d = daysFromToday(f.echeance);
    return f.statut === "payer" && d >= 0 && d <= 7;
  });
  return [
    { key: "verifier", icon: "linear-receipt-search", tile: "orange", label: "À vérifier", value: aVerifier.length, detail: ["Points à revoir", aRevoir.length] },
    { key: "valider", avatar: "JL", label: CURRENT_USER === "JL" ? "À valider par vous" : "En validation chez Julien", value: aValider.length, detail: ["Attend depuis", `${attente} j`] },
    { key: "late", icon: "linear-info-circle", tile: "red", label: "En retard", value: eur.format(sum(enRetard)), detail: ["Factures échues", enRetard.length] },
    { key: "payer", icon: "linear-money-send", tile: "blue", label: "Prêtes à payer d'ici le 10 nov.", value: eur.format(sum(semaine)), detail: ["Échéances cette semaine", semaine.length] },
  ];
}

function renderPage() {
  renderShell(
    "Factures",
    `
    <header class="page-head">
      <div>
        <p class="eyebrow">${COMPANY.nom} · mardi 3 novembre 2026</p>
        <h1>Factures fournisseurs</h1>
      </div>
      <div class="head-actions">
        <label class="search">${icon("search")}<input type="search" id="q" placeholder="Rechercher un fournisseur, un n°" aria-label="Rechercher" value="${state.q.replace(/"/g, "&quot;")}"></label>
        <button class="btn btn-primary" id="import-btn" aria-haspopup="dialog">${icon("upload")}Importer des factures</button>
      </div>
    </header>

    <section class="kpis" id="kpis" aria-label="Résumé"></section>

    <section class="panel">
      <div class="toolbar">
        <div class="tabs" role="tablist" id="tabs"></div>
        <button class="btn btn-ghost btn-sm filter-btn" id="filter-btn" data-pop="filters" aria-haspopup="dialog" aria-expanded="false"></button>
      </div>
      <div class="bulk" id="bulk" hidden>
        <span class="bulk-info" id="bulk-info"></span>
        <div class="bulk-actions" id="bulk-actions"></div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="c-check"><input type="checkbox" id="check-all" aria-label="Tout sélectionner"></th>
              <th>Fournisseur</th>
              <th>Reçue le</th>
              <th>Échéance</th>
              <th class="num">Montant TTC</th>
              <th>Statut</th>
              <th>Lecture IA</th>
              <th>Responsable</th>
              <th class="c-action"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <p class="table-foot" id="foot"></p>
    </section>`
  );
}

function renderKpis() {
  document.getElementById("kpis").innerHTML = kpis(invoices())
    .map((k) => {
      const active = state.tab === KPI_TABS[k.key];
      return `
      <button type="button" class="kpi kpi--${k.key}${active ? " is-active" : ""}" data-goto="${KPI_TABS[k.key]}" aria-pressed="${active}">
        ${
          k.avatar
            ? `<span class="kpi-tile kpi-avatar" title="${PEOPLE[k.avatar].nom}">${k.avatar}<span class="kpi-badge">${icon("clock")}</span></span>`
            : `<span class="tile tile--${k.tile} kpi-tile"><svg aria-hidden="true"><use href="#${k.icon}"/></svg></span>`
        }
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value">${k.value}</span>
        <span class="kpi-detail"><span>${k.detail[0]}</span><b>${k.detail[1]}</b></span>
      </button>`;
    })
    .join("");
}

// Une facture est-elle dans l'onglet donné ?
function inTab(f, tab) {
  if (tab.id === "toutes") return true;
  return tab.filter ? tab.filter(f) : f.statut === tab.id;
}

const filtersOn = () => state.resp.size + (state.doubts ? 1 : 0);

function visible() {
  const q = state.q.trim().toLowerCase();
  const tab = TABS.find((t) => t.id === state.tab);
  return invoices().filter(
    (f) =>
      inTab(f, tab) &&
      (!q || f.fournisseur.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q)) &&
      (!state.resp.size || state.resp.has(f.resp)) &&
      (!state.doubts || (f.statut === "verifier" && openChecks(f.id).length > 0))
  );
}

function dueCell(f) {
  const d = daysFromToday(f.echeance);
  let rel = "";
  if (isOpen(f)) {
    if (d < 0) rel = `<span class="due-rel is-late">En retard de ${-d} j</span>`;
    else if (d === 0) rel = `<span class="due-rel is-soon">Aujourd'hui</span>`;
    else if (d <= 7) rel = `<span class="due-rel is-soon">Dans ${d} j</span>`;
    else rel = `<span class="due-rel">Dans ${d} j</span>`;
  }
  return `<div class="stack"><span>${shortDate.format(toDate(f.echeance))}</span>${rel}</div>`;
}

// L'indice de l'IA n'est utile que tant que la lecture n'est pas vérifiée.
function iaCell(f) {
  if (f.statut === "refusee") return `<span class="ia-note is-neutral">${f.alerte || "Refusée"}</span>`;
  if (f.statut !== "verifier") return `<span class="ia ia--done">${icon("check")}Vérifiée</span>`;
  // Le pourcentage n'apparaît que quand il signale un doute
  const left = openChecks(f.id).length;
  if (!left) return `<span class="ia ia--ok">${icon("spark")}Lue sans doute</span>`;
  return `
    <span class="ia ia--warn">${icon("alert")}${f.ia} %</span>
    <span class="ia-note">${left} point${left > 1 ? "s" : ""} à revoir</span>`;
}

function renderTabs() {
  const all = invoices();
  document.getElementById("tabs").innerHTML = TABS.map((t) => {
    const n = all.filter((f) => inTab(f, t)).length;
    const active = state.tab === t.id;
    return `<button class="tab tab--${t.id}${active ? " is-active" : ""}" role="tab" aria-selected="${active}" data-tab="${t.id}">${t.label}<span class="tab-count">${n}</span></button>`;
  }).join("");
  // Sur téléphone, la bande d'onglets défile : l'onglet actif reste visible
  const tabs = document.getElementById("tabs");
  const on = tabs.querySelector(".is-active");
  if (on && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft += on.getBoundingClientRect().left - tabs.getBoundingClientRect().left - 2;

  const n = filtersOn();
  const fb = document.getElementById("filter-btn");
  fb.innerHTML = `${icon("filter")}Filtres${n ? `<span class="filter-count">${n}</span>` : ""}`;
  fb.classList.toggle("is-on", n > 0);
}

function renderRows() {
  const list = visible();

  document.getElementById("rows").innerHTML = list.length
    ? list
        .map((f) => {
          const sel = state.selected.has(f.id);
          return `
        <tr class="row--${f.statut}${sel ? " is-selected" : ""}${isLate(f) ? " is-late" : ""}" data-id="${f.id}">
          <td class="c-check"><input type="checkbox" ${sel ? "checked" : ""} aria-label="Sélectionner ${f.fournisseur} ${f.numero}"></td>
          <td>
            <div class="supplier">
              ${supplierTile(f)}
              <div><a class="row-link" href="facture.html?id=${f.id}"><strong>${f.fournisseur}</strong></a><span class="muted">${f.numero}</span></div>
            </div>
          </td>
          <td>${shortDate.format(toDate(f.recue))}</td>
          <td>${dueCell(f)}</td>
          <td class="num amount">${eur.format(f.ttc)}</td>
          <td><span class="pill pill--${f.statut}">${STATUTS[f.statut]}</span></td>
          <td class="c-ia">${iaCell(f)}</td>
          <td><span class="avatar avatar--sm" title="${PEOPLE[f.resp].nom}">${f.resp}</span></td>
          <td class="c-action">
            <div class="row-actions">
              <button class="round-btn" data-pop="row-${f.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Actions pour ${f.fournisseur} ${f.numero}">${icon("more")}</button>
            </div>
          </td>
        </tr>`;
        })
        .join("")
    : `<tr class="empty"><td colspan="9">Aucune facture ne correspond à cette recherche${filtersOn() ? " ou à ces filtres" : ""}.</td></tr>`;

  const all = document.getElementById("check-all");
  const visibleSelected = list.filter((f) => state.selected.has(f.id)).length;
  all.checked = list.length > 0 && visibleSelected === list.length;
  all.indeterminate = visibleSelected > 0 && visibleSelected < list.length;

  document.getElementById("foot").innerHTML = `<span>${list.length} facture${list.length > 1 ? "s" : ""}</span><span>Total TTC <strong class="num">${eur.format(sum(list))}</strong></span>`;
  renderBulk();
}

/* Actions groupées : on ne propose que ce qui s'applique à la sélection */

function selection() {
  const chosen = invoices().filter((f) => state.selected.has(f.id));
  return {
    chosen,
    // Chacun son rôle : Clara vérifie et paie, Julien valide
    sendable: julien ? [] : chosen.filter((f) => f.statut === "verifier" && !openChecks(f.id).length),
    doubtful: julien ? [] : chosen.filter((f) => f.statut === "verifier" && openChecks(f.id).length),
    payable: julien ? [] : chosen.filter((f) => f.statut === "payer"),
    approvable: julien ? chosen.filter((f) => f.statut === "valider") : [],
  };
}
const julien = CURRENT_USER === "JL";

function renderBulk() {
  const { chosen, sendable, doubtful, payable, approvable } = selection();
  document.getElementById("bulk").hidden = chosen.length === 0;
  if (!chosen.length) return;
  document.getElementById("bulk-info").textContent =
    `${chosen.length} sélectionnée${chosen.length > 1 ? "s" : ""} · ${eur.format(sum(chosen))}`;

  const plural = (n) => (n > 1 ? "s" : "");
  document.getElementById("bulk-actions").innerHTML = `
    ${approvable.length ? `<button class="btn btn-sm btn-light" data-bulk="approve">${icon("check")}Valider pour paiement (${approvable.length})</button>` : ""}
    ${sendable.length ? `<button class="btn btn-sm btn-light" data-bulk="send">${icon("check")}Envoyer en validation (${sendable.length})</button>` : ""}
    ${payable.length ? `<button class="btn btn-sm btn-light" data-bulk="pay">${icon("card")}Marquer réglée${plural(payable.length)} (${payable.length})</button>` : ""}
    <button class="btn btn-sm btn-ghost" data-pop="bulk-assign" aria-haspopup="menu" aria-expanded="false">Assigner</button>
    <button class="btn btn-sm btn-ghost" data-bulk="export">${icon("export")}Exporter</button>
    <button class="btn btn-sm btn-ghost" data-bulk="clear">Annuler</button>
    ${doubtful.length ? `<span class="bulk-hint">${doubtful.length} facture${plural(doubtful.length)} à revoir sur ${doubtful.length > 1 ? "leur" : "sa"} fiche avant l'envoi</span>` : ""}`;
}

function exportCsv(list) {
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Fournisseur", "Numéro", "Reçue le", "Échéance", "Montant TTC", "Statut", "Responsable"],
    ...list.map((f) => [f.fournisseur, f.numero, f.recue, f.echeance, f.ttc.toFixed(2).replace(".", ","), STATUTS[f.statut], PEOPLE[f.resp].nom]),
  ].map((r) => r.map(cell).join(";"));
  // BOM pour qu'Excel lise bien les accents
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "factures-tampon.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function bulkAction(kind) {
  const { chosen, sendable, payable, approvable } = selection();
  const snap = snapshot();
  let changed = [];
  if (kind === "approve") {
    approvable.forEach((f) => {
      store.data.statuts[f.id] = "payer";
      logEvent(f.id, "Validée pour paiement");
    });
    const n = approvable.length;
    notify("CM", `Julien a validé ${n} facture${n > 1 ? "s" : ""} (${eur.format(sum(approvable))}) : prête${n > 1 ? "s" : ""} à payer.`, "index.html?tab=payer");
    changed = approvable;
    toast(`${n} facture${n > 1 ? "s validées" : " validée"} : Clara est prévenue.`, snap);
  }
  if (kind === "clear") {
    state.selected.clear();
    renderRows();
    return;
  }
  if (kind === "export") {
    exportCsv(chosen);
    toast(`${chosen.length} facture${chosen.length > 1 ? "s" : ""} exportée${chosen.length > 1 ? "s" : ""} en CSV.`);
    return;
  }
  if (kind === "send") {
    sendable.forEach((f) => {
      store.data.statuts[f.id] = "valider";
      logEvent(f.id, "Lecture vérifiée, envoyée en validation");
    });
    notify("JL", `Clara vous a envoyé ${sendable.length} facture${sendable.length > 1 ? "s" : ""} à valider (${eur.format(sum(sendable))}).`, "index.html?tab=valider");
    changed = sendable;
    toast(`${sendable.length} facture${sendable.length > 1 ? "s envoyées" : " envoyée"} à ${PEOPLE.JL.nom}.`, snap);
  }
  if (kind === "pay") {
    payable.forEach((f) => {
      store.data.statuts[f.id] = "payee";
      logEvent(f.id, "Réglée par virement");
    });
    changed = payable;
    toast(`${payable.length} facture${payable.length > 1 ? "s réglées" : " réglée"}.`, snap);
  }
  store.save();
  changed.forEach((f) => state.selected.delete(f.id));
  refresh(changed.map((f) => f.id));
}

/* Fenêtres flottantes : menu ⋮, assignation groupée, filtres */

let openKey = null;

function closePop() {
  document.getElementById("pop")?.remove();
  document.querySelector(`[data-pop="${openKey}"]`)?.setAttribute("aria-expanded", "false");
  openKey = null;
}

function showPop(btn, html, role = "menu") {
  closePop();
  const pop = document.createElement("div");
  pop.id = "pop";
  pop.className = "row-menu";
  pop.setAttribute("role", role);
  pop.innerHTML = html;
  document.body.appendChild(pop);

  // Sous le bouton, aligné à droite, et au-dessus s'il manque de place en bas
  const r = btn.getBoundingClientRect();
  const h = pop.offsetHeight;
  const top = r.bottom + 6 + h > innerHeight ? r.top - 6 - h : r.bottom + 6;
  pop.style.top = `${Math.max(8, top)}px`;
  pop.style.left = `${Math.max(8, r.right - pop.offsetWidth)}px`;

  openKey = btn.dataset.pop;
  btn.setAttribute("aria-expanded", "true");
  pop.querySelector("a, button, input")?.focus();
}

function peopleItems(current) {
  return Object.entries(PEOPLE)
    .map(
      ([key, p]) => `
      <button role="menuitemradio" aria-checked="${current === key}" data-assign="${key}">
        <span class="avatar avatar--sm">${key}</span>${p.nom}${current === key ? `<span class="menu-check">${icon("check")}</span>` : ""}
      </button>`
    )
    .join("");
}

function openRowMenu(btn) {
  const id = Number(btn.dataset.pop.slice(4));
  const f = invoices().find((x) => x.id === id);
  showPop(
    btn,
    `
    <a role="menuitem" href="facture.html?id=${id}">${icon("doc")}Ouvrir la fiche</a>
    <button role="menuitem" data-demo="Téléchargement de ${f.numero}.pdf simulé.">${icon("export")}Télécharger le PDF</button>
    <div class="menu-sep"></div>
    <p class="menu-label">Assigner à</p>
    ${peopleItems(f.resp)}
    ${isOpen(f) ? `<div class="menu-sep"></div><button role="menuitem" class="is-danger" data-refuse="${id}">${icon("alert")}Refuser la facture</button>` : ""}`
  );
}

function openAssignMenu(btn) {
  showPop(btn, `<p class="menu-label">Assigner la sélection à</p>${peopleItems(null)}`);
}

function openFilters(btn) {
  showPop(
    btn,
    `
    <p class="menu-label">Responsable</p>
    ${Object.entries(PEOPLE)
      .map(
        ([key, p]) => `
      <label class="menu-check-row"><input type="checkbox" data-f-resp="${key}" ${state.resp.has(key) ? "checked" : ""}>
        <span class="avatar avatar--sm">${key}</span>${p.nom}</label>`
      )
      .join("")}
    <div class="menu-sep"></div>
    <label class="menu-check-row"><input type="checkbox" data-f-doubts ${state.doubts ? "checked" : ""}>${icon("alert")}Avec des points IA à revoir</label>
    <div class="menu-sep"></div>
    <button class="menu-reset" data-f-reset ${filtersOn() ? "" : "disabled"}>Effacer les filtres</button>`,
    "dialog"
  );
}

function popAction(e) {
  const assign = e.target.closest("[data-assign]");
  const refuse = e.target.closest("[data-refuse]");
  const reset = e.target.closest("[data-f-reset]");

  if (reset) {
    state.resp.clear();
    state.doubts = false;
    closePop();
    refresh();
    return;
  }
  if (!assign && !refuse) return;

  if (refuse) {
    // Refuser demande un motif : même fenêtre que sur la fiche
    const id = Number(refuse.dataset.refuse);
    closePop();
    openRefuse(id, () => refresh([id]));
    return;
  }

  const ids = openKey === "bulk-assign" ? [...state.selected] : [Number(openKey.slice(4))];
  const snap = snapshot();
  if (assign) {
    const key = assign.dataset.assign;
    const moved = invoices().filter((f) => ids.includes(f.id) && f.resp !== key);
    moved.forEach((f) => {
      store.data.resp[f.id] = key;
      logEvent(f.id, `Assignée à ${PEOPLE[key].nom}`);
    });
    if (moved.length) toast(moved.length === 1 ? `La facture ${moved[0].numero} est assignée à ${PEOPLE[key].nom}.` : `${moved.length} factures assignées à ${PEOPLE[key].nom}.`, snap);
  }
  store.save();
  closePop();
  refresh(ids);
}

/* Rendu global */

function refresh(flashIds = []) {
  renderKpis();
  renderTabs();
  renderRows();
  const todo = invoices().filter((f) => (julien ? f.statut === "valider" : f.statut === "verifier" || f.statut === "valider")).length;
  const count = document.querySelector(".nav-item.is-active .nav-count");
  if (count) count.textContent = todo;
  flashIds.forEach((id) => document.querySelector(`#rows tr[data-id="${id}"]`)?.classList.add("anim-flash"));
}

function setTab(tab) {
  state.tab = tab;
  renderKpis();
  renderTabs();
  renderRows();
}

function bind() {
  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) setTab(b.dataset.tab);
  });

  // Un clic sur une carte ouvre l'onglet correspondant, un second revient à « Toutes »
  document.getElementById("kpis").addEventListener("click", (e) => {
    const k = e.target.closest("[data-goto]");
    if (k) setTab(state.tab === k.dataset.goto ? "toutes" : k.dataset.goto);
  });

  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value;
    renderRows();
  });

  document.getElementById("bulk").addEventListener("click", (e) => {
    const b = e.target.closest("[data-bulk]");
    if (b) bulkAction(b.dataset.bulk);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pop]");
    if (btn) {
      const key = btn.dataset.pop;
      if (key === openKey) return closePop();
      if (key === "filters") openFilters(btn);
      else if (key === "bulk-assign") openAssignMenu(btn);
      else openRowMenu(btn);
      return;
    }
    if (e.target.closest("#pop")) {
      popAction(e);
      if (e.target.closest("[data-demo]")) closePop();
      return;
    }
    if (openKey) closePop();
  });

  // Les filtres s'appliquent dès qu'on coche
  document.addEventListener("change", (e) => {
    const r = e.target.closest("[data-f-resp]");
    if (r) r.checked ? state.resp.add(r.dataset.fResp) : state.resp.delete(r.dataset.fResp);
    else if (e.target.matches("[data-f-doubts]")) state.doubts = e.target.checked;
    else return;
    renderTabs();
    renderRows();
    const reset = document.querySelector("[data-f-reset]");
    if (reset) reset.disabled = !filtersOn();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openKey) {
      const key = openKey;
      closePop();
      document.querySelector(`[data-pop="${key}"]`)?.focus();
    }
  });
  window.addEventListener("scroll", () => openKey && closePop(), true);

  document.getElementById("rows").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (!tr || e.target.closest("a, button")) return;
    const id = Number(tr.dataset.id);
    if (e.target.matches('input[type="checkbox"]')) {
      e.target.checked ? state.selected.add(id) : state.selected.delete(id);
      renderRows();
    } else if (!e.target.closest(".c-check")) {
      location.href = `facture.html?id=${id}`;
    }
  });

  document.getElementById("check-all").addEventListener("change", (e) => {
    visible().forEach((f) => (e.target.checked ? state.selected.add(f.id) : state.selected.delete(f.id)));
    renderRows();
  });

  bindCommon();
}

/* Import : on dépose des PDF, l'IA les lit un par un, puis ils rejoignent la liste.
   Démo : les montants lus viennent des factures d'exemple (SAMPLE_IMPORTS). */

const READ_STEPS = ["Lecture du document", "Extraction des montants", "Contrôle avec l'historique"];
let importJob = null; // { items: [{ file, sample, step, done }], timer }

// Documents d'exemple pas encore importés (les imprévus reviennent tant qu'il reste des factures)
function availableSamples() {
  const left = SAMPLE_IMPORTS.filter((s) => isInvoiceSample(s) && !store.data.imported.includes(s.id) && !(store.data.skipped || []).includes(s.id));
  return left.length ? SAMPLE_IMPORTS.filter((s) => !isInvoiceSample(s) || left.includes(s)) : [];
}

function openImport() {
  closeImport();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-back" id="import">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div class="modal-head">
          <h2 id="import-title">Importer des factures</h2>
          <button class="round-btn" data-close aria-label="Fermer">${icon("x")}</button>
        </div>
        <div class="modal-body" id="import-body"></div>
      </div>
    </div>`
  );
  renderImportStart();
  document.querySelector("#import .round-btn").focus();
}

function closeImport() {
  if (importJob?.timer) clearInterval(importJob.timer);
  importJob = null;
  document.getElementById("import")?.remove();
}

function renderImportStart() {
  const left = availableSamples();
  document.getElementById("import-body").innerHTML = `
    <label class="drop" id="drop">
      <input type="file" id="files" accept="application/pdf,image/*" multiple hidden>
      <span class="drop-ico">${icon("upload")}</span>
      <strong>Glissez vos factures ici</strong>
      <span>PDF ou photo, plusieurs à la fois · <u>parcourir</u></span>
    </label>
    <div class="import-or"><span>ou</span></div>
    <button class="btn btn-ghost import-sample" data-samples ${left.length ? "" : "disabled"}>
      ${icon("doc")}${left.length ? `Essayer avec ${left.length} document${left.length > 1 ? "s" : ""} d'exemple` : "Exemples déjà importés"}
    </button>
    <p class="import-note">${icon("spark")}Tampon lit chaque facture, retrouve le fournisseur, les montants et l'échéance, puis la compare à l'historique.</p>`;

  const drop = document.getElementById("drop");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => (e.preventDefault(), drop.classList.add("is-over"))));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    startReading([...e.dataTransfer.files].map((f) => f.name));
  });
  document.getElementById("files").addEventListener("change", (e) => startReading([...e.target.files].map((f) => f.name)));
}

function startReading(names) {
  const left = availableSamples();
  if (!left.length) return toast("Les documents d'exemple sont déjà importés. ↻ pour recommencer la démo.");
  // Chaque fichier reçoit les données d'un document d'exemple (démo)
  const items = (names.length ? names : left.map((s) => s.file))
    .slice(0, left.length)
    // un doublon est écarté par défaut : on ne l'importe que si on le demande
    .map((file, i) => ({ file, sample: left[i], step: -1, done: false, keep: left[i].kind !== "duplicate" && isInvoiceSample(left[i]) }));
  importJob = { items, timer: null };
  let tick = 0;
  renderReading();
  importJob.timer = setInterval(() => {
    tick++;
    // les fichiers démarrent l'un après l'autre, chacun passe par les trois étapes
    importJob.items.forEach((it, i) => {
      const s = tick - i;
      if (s >= 0 && !it.done) {
        // un document illisible s'arrête dès la première étape
        it.step = Math.min(s, it.sample.kind === "unreadable" ? 1 : READ_STEPS.length);
        if (it.step === READ_STEPS.length || (it.sample.kind === "unreadable" && it.step === 1)) it.done = true;
      }
    });
    renderReading();
    if (importJob.items.every((it) => it.done)) clearInterval(importJob.timer);
  }, 380);
}

// Ce que l'IA conclut de chaque document une fois lu
function readResult(it) {
  const s = it.sample;
  const checks = (CHECKS[s.id] || []).length;
  switch (s.kind) {
    case "unreadable":
      return {
        cls: "is-error",
        lead: `<span class="rd-file rd-file--error">${icon("alert")}</span>`,
        title: it.file,
        sub: "Photo trop floue pour être lue : reprenez-la à plat, bien éclairée.",
        side: `<span class="ia ia--late">Illisible</span>`,
      };
    case "notInvoice":
      return {
        cls: "is-skip",
        lead: `<span class="rd-file">${icon("doc")}</span>`,
        title: it.file,
        sub: `C'est ${s.what}, pas une facture : rien à payer pour l'instant.`,
        side: `<span class="ia ia--muted">Pas une facture</span>`,
      };
    case "duplicate": {
      const twin = INVOICES.find((f) => f.id === s.dupOf);
      return {
        cls: it.keep ? "" : "is-skip",
        lead: supplierTile(s),
        title: s.fournisseur,
        sub: `${s.numero} · déjà reçue le ${shortDate.format(toDate(twin.recue))}, même montant`,
        side: `<b>${eur.format(s.ttc)}</b><span class="ia ia--warn">${icon("alert")}Doublon</span>`,
        extra: `<div class="rd-choice" role="group" aria-label="Que faire du doublon ?">
            <button class="chip-btn${it.keep ? "" : " is-on"}" data-keep="${s.id}" data-v="0" aria-pressed="${!it.keep}">Ne pas importer</button>
            <button class="chip-btn${it.keep ? " is-on" : ""}" data-keep="${s.id}" data-v="1" aria-pressed="${it.keep}">Importer quand même</button>
          </div>`,
      };
    }
    case "newSupplier":
      return {
        lead: supplierTile(s),
        title: s.fournisseur,
        sub: `${s.numero} · nouveau fournisseur, sa fiche sera créée`,
        side: `<b>${eur.format(s.ttc)}</b><span class="ia ia--new">${icon("users")}Nouveau</span>`,
      };
    default:
      return {
        lead: supplierTile(s),
        title: s.fournisseur,
        sub: `${s.numero} · échéance ${shortDate.format(toDate(s.echeance))}`,
        side: `<b>${eur.format(s.ttc)}</b>${
          checks ? `<span class="ia ia--warn">${icon("alert")}${checks} point à revoir</span>` : `<span class="ia ia--done">${icon("spark")}Lue sans doute</span>`
        }`,
      };
  }
}

function renderReading() {
  const items = importJob.items;
  const done = items.filter((it) => it.done);
  const finished = done.length === items.length;
  const kept = items.filter((it) => it.keep);
  const set = items.length - kept.length;

  document.getElementById("import-body").innerHTML = `
    <ul class="reading">${items
      .map((it) => {
        const pct = Math.max(8, ((it.step + 1) / (READ_STEPS.length + 1)) * 100);
        if (!it.done)
          return `<li class="rd">
            <span class="rd-file">${icon("doc")}</span>
            <span class="rd-main"><strong>${it.file}</strong><span>${it.step < 0 ? "En attente" : READ_STEPS[it.step]}</span><span class="rd-bar"><i style="width:${pct}%"></i></span></span>
          </li>`;
        const r = readResult(it);
        return `<li class="rd is-done ${r.cls || ""}">
          ${r.lead}
          <span class="rd-main"><strong>${r.title}</strong><span>${r.sub}</span></span>
          <span class="rd-result">${r.side}</span>
          ${r.extra || ""}
        </li>`;
      })
      .join("")}</ul>
    <div class="import-foot">
      <span>${
        finished
          ? `${kept.length} facture${kept.length > 1 ? "s" : ""} à ajouter${set ? ` · ${set} document${set > 1 ? "s" : ""} écarté${set > 1 ? "s" : ""}` : ""}`
          : `Lecture en cours… ${done.length}/${items.length}`
      }</span>
      <button class="btn btn-primary" data-add ${finished && kept.length ? "" : "disabled"}>${icon("check")}Ajouter à la liste (${kept.length})</button>
    </div>`;
}

function addImported() {
  const snap = snapshot();
  const kept = importJob.items.filter((it) => it.keep).map((it) => it.sample);
  const ids = kept.map((s) => s.id);
  store.data.imported.push(...ids);
  // Un doublon écarté ne revient pas au prochain import
  store.data.skipped = (store.data.skipped || []).concat(importJob.items.filter((it) => !it.keep && isInvoiceSample(it.sample)).map((it) => it.sample.id));
  kept.forEach((s) => {
    logEvent(s.id, "Importée depuis un PDF");
    if (s.kind === "newSupplier") {
      SUPPLIERS[s.fournisseur] = { ...s.newSupplier };
      logEvent(s.id, `Fiche fournisseur créée : ${s.fournisseur}`, PRODUCT);
    }
    if (s.kind === "duplicate") logEvent(s.id, "Importée malgré l'alerte de doublon");
  });
  store.save();
  closeImport();
  state.tab = "verifier";
  refresh(ids);
  toast(`${ids.length} facture${ids.length > 1 ? "s ajoutées" : " ajoutée"}, à vérifier.`, snap);
}

function bindImport() {
  document.getElementById("import-btn").addEventListener("click", openImport);
  // ?open=import lance directement la démo d'import avec les documents d'exemple
  if (new URLSearchParams(location.search).get("open") === "import") {
    openImport();
    startReading([]);
  }
  document.addEventListener("click", (e) => {
    if (!document.getElementById("import")) return;
    if (e.target.closest("[data-close]") || e.target.id === "import") return closeImport();
    if (e.target.closest("[data-samples]")) return startReading([]);
    if (e.target.closest("[data-add]")) return addImported();
    const keep = e.target.closest("[data-keep]");
    if (keep) {
      importJob.items.find((it) => it.sample.id === Number(keep.dataset.keep)).keep = keep.dataset.v === "1";
      renderReading();
      document.querySelector(`[data-keep="${keep.dataset.keep}"][data-v="${keep.dataset.v}"]`)?.focus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("import")) closeImport();
  });
}

// Au retour de la fiche, la facture qui vient de changer d'état brille une fois.
function flashChanged() {
  const id = store.data.flash;
  if (!id) return;
  delete store.data.flash;
  store.save();
  document.querySelector(`#rows tr[data-id="${id}"]`)?.classList.add("anim-flash");
}

renderPage();
renderKpis();
renderTabs();
renderRows();
flashChanged();
bind();
bindImport();
