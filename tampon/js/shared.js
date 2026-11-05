// Code commun à la liste et à la fiche : format, icônes, coque, démo.

const TODAY = new Date(2026, 10, 3);
const PRODUCT = "Tampon";

// Logo : un « t » dont la queue remonte en coche (piste D).
const LOGO_MARK = `<svg class="brand-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 10.5h11.5"/><path d="M11.5 3.5v17c0 3.9 3.9 5.1 6.4 2.3L27 11.5"/></svg>`;

const STATUTS = {
  verifier: "À vérifier",
  valider: "En validation",
  payer: "Prête à payer",
  payee: "Réglée",
  refusee: "Refusée",
};

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>',
  export: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  alert: '<path d="M12 3 2 20h20zM12 10v4M12 17.5v.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  more: '<circle cx="12" cy="5.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18.5" r="1.2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

// Noms internes → icônes Iconsax du kit (js/icons.js). Les autres restent dessinées ici.
const KIT_ICONS = {
  home: "outline-home",
  file: "linear-bill",
  users: "linear-profile",
  card: "linear-money-send",
  export: "outline-import",
  upload: "linear-document-upload",
  search: "linear-search-normal",
  filter: "linear-filter",
  alert: "linear-info-circle",
  check: "linear-tick-circle",
  back: "linear-arrow-left",
  next: "linear-arrow-right",
  arrow: "linear-arrow-right",
  zoomIn: "linear-add",
  zoomOut: "linear-minus",
  doc: "linear-document",
  setting: "linear-setting",
  help: "linear-message-question",
  bell: "linear-notification",
  calendar: "linear-calendar",
  clock: "linear-clock",
};

const icon = (name) =>
  KIT_ICONS[name]
    ? `<svg class="i" aria-hidden="true"><use href="#${KIT_ICONS[name]}"/></svg>`
    : `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Pastille par fournisseur : l'icône dit de quoi il s'agit,
// la couleur dit où en est la facture, une couleur par état
// (rouge = en retard, qui passe avant le statut).
const SUPPLIER_ICONS = {
  "Importateur de café vert": "tile-grocery-basket",
  "Fabricant d'emballages": "tile-shopping-cart",
  "Transporteur": "linear-arrow-swap-horizontal",
  "Fournisseur d'électricité": "tile-expense-bill",
  "Maintenance du torréfacteur": "linear-setting",
  "Imprimeur": "linear-document",
  "Laiterie": "tile-grocery-basket",
  "Bailleur du local": "outline-home",
  "Opérateur télécom": "tile-calculator-money",
  "Société de nettoyage": "linear-flag-2",
  "Fabricant de sacs en jute": "tile-shopping-cart",
};

const TILE_COLORS = { verifier: "orange", valider: "slate", payer: "blue", payee: "green", refusee: "gray" };

const supplierTile = (f, large = false) => {
  const color = isLate(f) ? "red" : TILE_COLORS[f.statut];
  return `<span class="tile tile--${color}${large ? " tile--lg" : ""}"><svg aria-hidden="true"><use href="#${SUPPLIER_ICONS[f.fournisseur] || "linear-bill"}"/></svg></span>`;
};

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const numDate = new Intl.DateTimeFormat("fr-FR");

const toDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s, n) => {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return d;
};
const daysFromToday = (s) => Math.round((toDate(s) - TODAY) / 86400000);
const isOpen = (f) => f.statut !== "payee" && f.statut !== "refusee";
const isLate = (f) => isOpen(f) && daysFromToday(f.echeance) < 0;
const sum = (list) => list.reduce((t, f) => t + f.ttc, 0);
const initials = (name) =>
  name.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Les changements faits pendant la démo restent dans le navigateur.
const STORE_KEY = "tampon-demo-v1";
const store = (() => {
  let data = { statuts: {}, choix: {}, events: {}, resp: {}, exports: {}, messages: [], imported: [], edits: {}, refusals: {}, notifs: null, user: null };
  try {
    data = { ...data, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch (e) {}
  return {
    data,
    save() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) {}
    },
    reset() {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch (e) {}
    },
  };
})();

if (!store.data.notifs) store.data.notifs = SEED_NOTIFS.map((n) => ({ ...n }));
// Un fournisseur découvert à l'import rejoint la liste des fournisseurs
// (son IBAN n'est enregistré qu'une fois confirmé)
SAMPLE_IMPORTS.filter((s) => s.newSupplier && store.data.imported.includes(s.id)).forEach((s) => {
  const sup = (SUPPLIERS[s.fournisseur] = { ...s.newSupplier });
  if ((store.data.choix[s.id] || {}).iban) sup.iban = (store.data.edits[s.id] || {}).iban || CHECKS[s.id].find((c) => c.key === "iban").docValue;
});

const NOW_LABEL = "3 nov., 10:00";
const me = () => PEOPLE[CURRENT_USER];
const firstName = (key) => PEOPLE[key].nom.split(" ")[0];

// Factures de départ + celles importées pendant la démo (les plus récentes en tête)
function allInvoices() {
  const imported = SAMPLE_IMPORTS.filter((s) => isInvoiceSample(s) && store.data.imported.includes(s.id)).reverse();
  return imported.concat(INVOICES);
}

function invoices() {
  return allInvoices().map((f) => {
    const choix = store.data.choix[f.id] || {};
    const edits = store.data.edits[f.id] || {};
    const refusal = store.data.refusals[f.id];
    return {
      ...f,
      statut: store.data.statuts[f.id] || f.statut,
      resp: store.data.resp[f.id] || f.resp,
      // une correction faite à la main passe avant la lecture de l'IA
      numero: edits.numero || f.numero,
      ttc: edits.ttc !== undefined ? edits.ttc : f.ttc,
      echeance: edits.echeance || choix.echeance || f.echeance,
      alerte: refusal ? refusal.motif : f.alerte,
    };
  });
}

function logEvent(id, what, who = me().nom) {
  (store.data.events[id] = store.data.events[id] || []).push({ when: NOW_LABEL, who, what });
}

/* Notifications : une personne prévient l'autre */

function notify(forUser, text, href) {
  store.data.notifs.unshift({ id: Date.now() + Math.random(), for: forUser, when: NOW_LABEL, text, href, read: false });
}
const myNotifs = () => store.data.notifs.filter((n) => n.for === CURRENT_USER);

function openNotifs(btn) {
  closeFloating();
  const list = myNotifs();
  const panel = document.createElement("div");
  panel.className = "floating notif-panel";
  panel.id = "floating";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Notifications");
  panel.innerHTML = `
    <div class="np-head"><strong>Notifications</strong>${list.some((n) => !n.read) ? `<button class="link-btn" data-read-all>Tout marquer comme lu</button>` : ""}</div>
    <ul class="np-list">${
      list.length
        ? list
            .map(
              (n) => `<li class="${n.read ? "" : "is-unread"}"><a href="${n.href}" data-notif="${n.id}">
                <span class="np-dot"></span><span class="np-text">${n.text}<span>${n.when}</span></span></a></li>`
            )
            .join("")
        : `<li class="np-empty">Aucune notification.</li>`
    }</ul>`;
  document.body.appendChild(panel);
  placeFloating(panel, btn, "right");
  // le focus entre dans le panneau, sans allumer un bouton au hasard
  panel.tabIndex = -1;
  panel.focus();
}

/* Changer de profil (démo) : Clara la comptable ou Julien le gérant */

function openProfiles(btn) {
  closeFloating();
  const panel = document.createElement("div");
  panel.className = "floating row-menu profile-menu";
  panel.id = "floating";
  panel.setAttribute("role", "menu");
  panel.innerHTML = `
    <p class="menu-label">Voir la démo en tant que</p>
    ${["CM", "JL"]
      .map(
        (k) => `<button role="menuitemradio" aria-checked="${k === CURRENT_USER}" data-profile="${k}">
          <span class="avatar avatar--sm">${k}</span><span class="pm-name"><b>${PEOPLE[k].nom}</b><small>${PEOPLE[k].role}${k === "CM" ? " · vérifie et paie" : " · valide les dépenses"}</small></span>${k === CURRENT_USER ? `<span class="menu-check">${icon("check")}</span>` : ""}
        </button>`
      )
      .join("")}`;
  document.body.appendChild(panel);
  placeFloating(panel, btn, "up");
  panel.querySelector("button").focus();
}

function placeFloating(panel, btn, mode) {
  const r = btn.getBoundingClientRect();
  if (innerWidth < 861) {
    panel.style.left = "8px";
    panel.style.right = "8px";
    // le menu de profil s'ouvre au-dessus de la carte, la cloche en dessous
    panel.style.top = mode === "up" ? `${Math.max(8, r.top - panel.offsetHeight - 8)}px` : `${Math.min(r.bottom + 8, innerHeight - panel.offsetHeight - 8)}px`;
    return;
  }
  if (mode === "up") {
    panel.style.left = `${r.left}px`;
    panel.style.top = `${Math.max(8, r.top - panel.offsetHeight - 8)}px`;
  } else {
    panel.style.left = `${r.right + 12}px`;
    panel.style.top = `${Math.max(8, Math.min(r.top - 12, innerHeight - panel.offsetHeight - 16))}px`;
  }
}

function closeFloating() {
  document.getElementById("floating")?.remove();
}

/* Refus avec motif : même fenêtre partout (fiche, liste) */

function openRefuse(id, onDone, preset = {}) {
  const f = invoices().find((x) => x.id === id);
  closeModal();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="modal-back" id="modal">
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="refuse-title" id="refuse-form">
        <div class="modal-head"><h2 id="refuse-title">Refuser la facture</h2><button type="button" class="round-btn" data-modal-close aria-label="Fermer">${icon("x")}</button></div>
        <div class="modal-body">
          <p class="modal-sub">${f.fournisseur} · ${f.numero} · ${eur.format(f.ttc)}</p>
          <fieldset class="reasons"><legend>Motif du refus</legend>
            ${REFUSAL_REASONS.map((r, i) => `<label class="reason"><input type="radio" name="motif" value="${r}" ${(preset.motif ? r === preset.motif : i === 0) ? "checked" : ""}><span>${r}</span></label>`).join("")}
          </fieldset>
          <label class="field-label" for="refuse-note">Précision pour le fournisseur (facultatif)</label>
          <textarea id="refuse-note" rows="2" placeholder="Ex. : la livraison du 28 octobre n'a jamais eu lieu">${preset.note || ""}</textarea>
          <label class="check-line"><input type="checkbox" id="refuse-mail" checked><span>Prévenir le fournisseur par e-mail${preset.motif === "Facture en double" ? "" : " et demander un avoir"}</span></label>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-modal-close>Annuler</button>
            <button type="submit" class="btn btn-danger">Refuser la facture</button>
          </div>
        </div>
      </form>
    </div>`
  );
  document.querySelector("#refuse-form input[name=motif]:checked").focus();
  document.getElementById("refuse-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const motif = document.querySelector("#refuse-form input[name=motif]:checked").value;
    const note = document.getElementById("refuse-note").value.trim();
    const mail = document.getElementById("refuse-mail").checked;
    const snap = snapshot();
    store.data.statuts[id] = "refusee";
    store.data.refusals[id] = { motif, note, mail, by: CURRENT_USER, when: NOW_LABEL };
    store.data.flash = id;
    logEvent(id, `Refusée : ${motif}${note ? ` (${note})` : ""}`);
    if (mail) logEvent(id, `Fournisseur prévenu${motif === "Facture en double" ? "" : ", avoir demandé"}`, PRODUCT);
    // Prévenir l'autre personne du circuit
    const other = CURRENT_USER === "JL" ? "CM" : "JL";
    notify(other, `${firstName(CURRENT_USER)} a refusé la facture ${f.numero} (${f.fournisseur.toLowerCase()}) : ${motif.toLowerCase()}.`, `facture.html?id=${id}`);
    store.save();
    closeModal();
    toast(`Facture refusée${mail ? ", fournisseur prévenu" : ""}.`, snap);
    onDone && onDone();
  });
}

function closeModal() {
  document.getElementById("modal")?.remove();
}

// Tout ce qu'on sait d'un fournisseur, à partir de ses factures.
function supplierData(name) {
  const fs = invoices().filter((f) => f.fournisseur === name);
  const engaged = fs.filter((f) => f.statut !== "refusee");
  // Un IBAN reçu sur une facture et pas encore confirmé
  const ibanCheck = fs.find((f) => (CHECKS[f.id] || []).some((c) => c.key === "iban") && !("iban" in (store.data.choix[f.id] || {})));
  const ibanChoice = fs.map((f) => (store.data.choix[f.id] || {}).iban).find(Boolean);
  const paid = fs.filter((f) => f.statut === "payee");
  return {
    name,
    sup: SUPPLIERS[name],
    invoices: fs.slice().sort((a, b) => (a.recue < b.recue ? 1 : -1)),
    engaged: sum(engaged),
    open: fs.filter(isOpen),
    late: fs.filter(isLate),
    paid,
    ibanCheck,
    ibanChoice,
    since: fs.map((f) => f.recue).sort()[0],
  };
}

const supplierHref = (name) => `fournisseur.html?n=${encodeURIComponent(name)}`;

// Points à vérifier encore ouverts pour une facture.
function openChecks(id) {
  const choix = store.data.choix[id] || {};
  return (CHECKS[id] || []).filter((c) => !(c.key in choix));
}

function renderShell(active, main) {
  const user = PEOPLE[CURRENT_USER];
  // Julien ne compte que ce qu'il doit valider ; Clara, tout ce qui est en cours de circuit
  const todo = invoices().filter((f) => (CURRENT_USER === "JL" ? f.statut === "valider" : f.statut === "verifier" || f.statut === "valider")).length;
  const unread = myNotifs().filter((n) => !n.read).length;
  const navItems = [
    ["home", "Tableau de bord", "dashboard.html"],
    ["file", "Factures", "index.html", todo],
    ["users", "Fournisseurs", "fournisseurs.html"],
    ["card", "Paiements", "paiements.html"],
    ["doc", "Expert-comptable", "comptable.html"],
  ];

  document.getElementById("app").innerHTML = `
    ${ICON_SPRITE}
    <div class="shell">
      <aside class="nav">
        <a class="brand" href="index.html" aria-label="${PRODUCT}, accueil">${LOGO_MARK}<span class="brand-name">${PRODUCT.toLowerCase()}</span></a>
        <div class="nav-mobile">
          <button class="nav-icon-btn" data-notif-btn aria-haspopup="dialog" aria-label="Notifications${unread ? `, ${unread} non lues` : ""}">${icon("bell")}${unread ? `<span class="nav-dot">${unread}</span>` : ""}</button>
          <button class="nav-icon-btn" id="burger" aria-expanded="false" aria-controls="nav-drawer" aria-label="Ouvrir le menu">${icon("menu")}</button>
        </div>
        <div class="nav-scrim" data-drawer-close></div>
        <div class="nav-body" id="nav-drawer">
        <div class="drawer-head">
          <span class="drawer-title">Menu</span>
          <button class="nav-icon-btn" data-drawer-close aria-label="Fermer le menu">${icon("x")}</button>
        </div>
        <nav class="nav-list" aria-label="Navigation principale">
          ${navItems
            .map(
              ([ic, label, href, count]) => `
            <a class="nav-item${label === active ? " is-active" : ""}" href="${href}"${label === active ? ' aria-current="page"' : ""}${href === "#" ? ` data-demo="La page ${label} n'est pas dans cette maquette."` : ""}>
              ${icon(ic)}<span>${label}</span>${count ? `<span class="nav-count">${count}</span>` : ""}
            </a>`
            )
            .join("")}
        </nav>
        <nav class="nav-list nav-foot" aria-label="Aide et réglages">
          ${[
            ["setting", "Paramètres"],
            ["help", "Centre d'aide"],
          ]
            .map(([ic, label]) => `<a class="nav-item" href="#" data-demo="La page ${label} n'est pas dans cette maquette.">${icon(ic)}<span>${label}</span></a>`)
            .join("")}
          <button class="nav-item" id="notif-btn" data-notif-btn aria-haspopup="dialog">${icon("bell")}<span>Notifications</span>${unread ? `<span class="nav-count nav-count--dot" aria-label="${unread} non lues">${unread}</span>` : ""}</button>
        </nav>
        <div class="nav-user">
          <button class="nav-profile" id="profile-btn" aria-haspopup="menu" title="Changer de profil (démo)">
            <span class="avatar">${CURRENT_USER}</span>
            <span class="np-who"><strong>${user.nom}</strong><span>${user.role} · ${COMPANY.nom}</span></span>
          </button>
          <button class="nav-reset" id="demo-reset" title="Réinitialiser la démo" aria-label="Réinitialiser la démo">${icon("reset")}</button>
        </div>
        </div>
      </aside>
      <main class="main">${demoBar()}${main}</main>
    </div>
    <div class="toast" id="toast" role="status" hidden></div>`;
  document.body.dataset.user = CURRENT_USER;
}

// Bandeau de démo : sans lui, un visiteur ne découvre jamais le côté de Julien
function demoBar() {
  const other = CURRENT_USER === "JL" ? "CM" : "JL";
  const role = CURRENT_USER === "JL" ? "le gérant, qui valide les dépenses" : "la comptable, qui vérifie et paie";
  return `
    <div class="demo-bar">
      <span class="demo-tag">Démo</span>
      <p>Vous voyez Tampon comme <strong>${firstName(CURRENT_USER)}</strong>, ${role}.</p>
      <button class="demo-switch" data-profile="${other}"><span class="avatar avatar--sm">${other}</span>Passer côté ${firstName(other)}${icon("arrow")}</button>
    </div>`;
}

/* Messages de confirmation, avec « Annuler » quand l'action vient de changer des données */

const snapshot = () => JSON.stringify(store.data);
let toastTimer;
function toast(msg, undoSnap) {
  const t = document.getElementById("toast");
  t.innerHTML = `<span>${msg}</span>${undoSnap ? `<button class="toast-undo" type="button">Annuler</button>` : ""}`;
  t.hidden = false;
  if (undoSnap)
    t.querySelector(".toast-undo").addEventListener("click", () => {
      // on remet les données d'avant et on recharge la page dans cet état
      localStorage.setItem(STORE_KEY, undoSnap);
      sessionStorage.setItem("tampon-toast", "Action annulée.");
      location.reload();
    });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), undoSnap ? 6000 : 2800);
}

function bindCommon() {
  // Lien direct vers un état de la démo (?open=notifs, ?open=menu, ?open=refuse&id=4)
  const q = new URLSearchParams(location.search);
  const open = q.get("open");
  if (open) document.body.classList.add("is-direct"); // l'état s'affiche d'emblée, sans animation d'ouverture
  if (open === "notifs") setTimeout(() => openNotifs(document.querySelector(innerWidth < 861 ? ".nav-mobile [data-notif-btn]" : "#notif-btn")), 50);
  if (open === "menu") setTimeout(() => setDrawer(true), 50);
  if (open === "refuse" && q.get("id")) setTimeout(() => openRefuse(Number(q.get("id")), () => location.reload()), 50);
  const pending = sessionStorage.getItem("tampon-toast");
  if (pending) {
    sessionStorage.removeItem("tampon-toast");
    toast(pending);
  }
  document.addEventListener("click", (e) => {
    const d = e.target.closest("[data-demo]");
    if (d) {
      e.preventDefault();
      toast(d.dataset.demo);
    }
    if (e.target.closest("#demo-reset")) {
      store.reset();
      location.reload();
    }
    if (e.target.closest("#burger")) return setDrawer(true);
    if (e.target.closest("[data-drawer-close]")) return setDrawer(false);
    const nb = e.target.closest("[data-notif-btn]");
    if (nb) {
      // le panneau s'ouvre au-dessus de tout : on referme le menu
      if (nb.id === "notif-btn" && innerWidth < 861) {
        setDrawer(false);
        return openNotifs(document.querySelector(".nav-mobile [data-notif-btn]"));
      }
    }
    if (nb) return document.getElementById("floating")?.classList.contains("notif-panel") ? closeFloating() : openNotifs(nb);
    const pb = e.target.closest("#profile-btn");
    if (pb) return document.getElementById("floating")?.classList.contains("profile-menu") ? closeFloating() : openProfiles(pb);
    const prof = e.target.closest("[data-profile]");
    if (prof) {
      store.data.user = prof.dataset.profile;
      store.save();
      return location.reload();
    }
    if (e.target.closest("[data-read-all]")) {
      myNotifs().forEach((n) => (n.read = true));
      store.save();
      return location.reload();
    }
    const nl = e.target.closest("[data-notif]");
    if (nl) {
      const n = store.data.notifs.find((x) => String(x.id) === nl.dataset.notif);
      if (n) n.read = true;
      store.save();
      return; // le lien suit son cours
    }
    if (e.target.closest("[data-modal-close]") || e.target.id === "modal") return closeModal();
    if (!e.target.closest("#floating")) closeFloating();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeFloating();
    closeModal();
    if (document.querySelector(".nav.is-open")) setDrawer(false);
  });
}

// Menu burger (téléphone) : un tiroir qui glisse depuis la droite
function setDrawer(open) {
  const nav = document.querySelector(".nav");
  const burger = document.getElementById("burger");
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("no-scroll", open);
  if (open) document.querySelector("#nav-drawer [data-drawer-close]").focus();
  else burger.focus();
}
