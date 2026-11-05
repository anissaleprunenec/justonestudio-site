// Paiements : Clara prépare un lot de virements avec les factures validées,
// choisit la date d'envoi, et l'outil vérifie IBAN, échéances et solde avant l'envoi.

const BANK = { label: "Compte courant", iban: "FR76 •••• •••• 4821", balance: 41250 }; // compte fictif
const plural = (n) => (n > 1 ? "s" : "");
const short = (v) => eur.format(v).replace(/,\d\d/, "");

// Dates d'envoi proposées (le virement arrive le jour même dans la démo)
const DATES = [
  { id: "auj", label: "Aujourd'hui", day: 0 },
  { id: "dem", label: "Demain", day: 1 },
  { id: "ven", label: "Vendredi", day: 3 },
];

const state = { date: "auj", selected: null, sent: null };

// Ce qui peut partir dans un lot : validé, et IBAN confirmé
function payables() {
  return invoices()
    .filter((f) => f.statut === "payer")
    .map((f) => ({ ...f, ibanPending: !!supplierData(f.fournisseur).ibanCheck }))
    .sort((a, b) => (a.echeance < b.echeance ? -1 : 1));
}

function paidOn(f) {
  // Réglée pendant la démo : aujourd'hui ; sinon la veille de l'échéance
  return store.data.statuts[f.id] === "payee" ? TODAY : addDays(f.echeance, -1);
}

function renderStats(list) {
  const late = list.filter(isLate);
  const ready = list.filter((f) => !f.ibanPending);
  const paid = invoices().filter((f) => f.statut === "payee");
  const after = BANK.balance - sum(ready);
  return `
    <div class="stat"><span class="stat-label">Prêtes à payer</span><b class="stat-value">${short(sum(list))}</b>
      <span class="stat-sub">${list.length} facture${plural(list.length)} validée${plural(list.length)}</span>
      <div class="stat-viz"><div class="stat-bar">${list.map((f) => `<i class="${isLate(f) ? "s-late" : "s-payer"}" style="flex-grow:${f.ttc}" data-tip="<b>${f.fournisseur}</b><span>${eur.format(f.ttc)}</span>"></i>`).join("")}</div></div></div>
    <div class="stat${late.length ? " stat--late" : ""}"><span class="stat-label">Dont en retard</span><b class="stat-value">${short(sum(late))}</b>
      <span class="stat-sub">${late.length ? `${late.length} virement${plural(late.length)} à faire au plus vite` : "aucun retard"}</span></div>
    <div class="stat"><span class="stat-label">${BANK.label}</span><b class="stat-value">${short(BANK.balance)}</b>
      <span class="stat-sub">${short(after)} après les virements prêts</span>
      <div class="stat-viz"><div class="gauge"><i style="width:${(after / BANK.balance) * 100}%"></i></div></div></div>
    <div class="stat"><span class="stat-label">Réglé sur 30 jours</span><b class="stat-value">${short(sum(paid))}</b>
      <span class="stat-sub">${paid.length} virement${plural(paid.length)}</span></div>`;
}

// Étiquette de chaque carte : bloquée, en retard, trop tard pour la date choisie, ou à temps
function cardChip(f, payDay) {
  if (f.ibanPending) return `<span class="vchip is-late">${icon("alert")}IBAN à confirmer</span>`;
  const d = daysFromToday(f.echeance);
  if (d < 0) return `<span class="vchip is-late">${icon("alert")}En retard de ${-d} j</span>`;
  if (payDay > d) return `<span class="vchip is-warn">${icon("clock")}Après l'échéance du ${shortDate.format(toDate(f.echeance))}</span>`;
  return `<span class="vchip is-ok">${icon("check")}À temps · ${shortDate.format(toDate(f.echeance))}</span>`;
}

function vcard(f, payDay) {
  const on = state.selected.has(f.id);
  const iban = f.ibanPending ? "IBAN à confirmer" : `IBAN •••• ${SUPPLIERS[f.fournisseur].iban.slice(-4)}`;
  if (f.ibanPending) {
    return `
      <div class="vcard is-blocked">
        <span class="vcheck is-lock" aria-hidden="true">${icon("alert")}</span>
        ${supplierTile(f)}
        <span class="vname"><strong>${f.fournisseur}</strong><span>${f.numero} · ${iban}</span></span>
        <span class="vamount">${eur.format(f.ttc)}</span>
        ${cardChip(f, payDay)}
        <a class="vfix" href="${supplierHref(f.fournisseur)}">Confirmer l'IBAN ${icon("next")}</a>
      </div>`;
  }
  return `
    <button type="button" class="vcard${on ? " is-on" : ""}" data-pick="${f.id}" aria-pressed="${on}" aria-label="${on ? "Retirer" : "Ajouter"} ${f.fournisseur} ${f.numero}, ${eur.format(f.ttc)}">
      <span class="vcheck" aria-hidden="true">${icon("check")}</span>
      ${supplierTile(f)}
      <span class="vname"><strong>${f.fournisseur}</strong><span>${f.numero} · ${iban}</span></span>
      <span class="vamount">${eur.format(f.ttc)}</span>
      ${cardChip(f, payDay)}
    </button>`;
}

function renderBatch(list) {
  const date = DATES.find((d) => d.id === state.date);
  const chosen = list.filter((f) => state.selected.has(f.id));
  const day = addDays("2026-11-03", date.day);
  const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(day);
  const afterBatch = BANK.balance - sum(chosen);

  if (!list.length) {
    return `<section class="card batch"><h2 class="card-title">Lot de virements</h2>
      <p class="batch-empty">${icon("check")}Aucune facture prête à payer. Les factures validées par Julien arriveront ici.</p></section>`;
  }

  return `
    <section class="card batch">
      <div class="card-head"><h2 class="card-title">Préparer le lot de virements</h2><span class="card-note">${list.length} facture${plural(list.length)} validée${plural(list.length)}</span></div>

      <div class="batch-date">
        <span>Date d'envoi</span>
        <div class="date-chips" role="radiogroup" aria-label="Date d'envoi">${DATES.map(
          (d) => `<button type="button" role="radio" aria-checked="${d.id === state.date}" class="chip${d.id === state.date ? " is-on" : ""}" data-date="${d.id}">${d.label}<small>${shortDate.format(addDays("2026-11-03", d.day))}</small></button>`
        ).join("")}</div>
      </div>

      ${(() => {
        // Regroupées par situation : ce qui part, puis ce qui est bloqué
        const groups = [
          { title: "À payer", dot: "var(--blue-500)", fs: list.filter((f) => !f.ibanPending) },
          { title: "Bloquées", dot: "var(--danger-500)", fs: list.filter((f) => f.ibanPending) },
        ].filter((g) => g.fs.length);
        return groups
          .map(
            (g) => `
          <p class="vgroup"><i style="background:${g.dot}"></i>${g.title}<span>${g.fs.length}</span></p>
          <div class="vgrid">${g.fs.map((f) => vcard(f, date.day)).join("")}</div>`
          )
          .join("");
      })()}

      <div class="vbar">
        <div class="vbar-sum">
          <span>${chosen.length} virement${plural(chosen.length)} · ${dayLabel}</span>
          <b>${eur.format(sum(chosen))}</b>
          <span class="${afterBatch < 5000 ? "is-low" : ""}">Solde après le lot : ${eur.format(afterBatch)}</span>
        </div>
        ${
          // Séparation des tâches : celui qui valide n'envoie pas les virements
          CURRENT_USER === "JL"
            ? `<span class="vbar-note">${icon("clock")}${PEOPLE.CM.nom} envoie le lot à la banque</span>`
            : `<button class="btn btn-primary" data-send ${chosen.length ? "" : "disabled"}>${icon("card")}Envoyer à la banque</button>`
        }
      </div>
    </section>`;
}

function renderSent() {
  const s = state.sent;
  return `
    <section class="card batch batch-done">
      <span class="done-stamp anim-stamp">${icon("check")}</span>
      <h2>Lot envoyé à la banque</h2>
      <p>${s.list.length} virement${plural(s.list.length)} · ${eur.format(sum(s.list))} · ${s.day}</p>
      <ul class="done-list">${s.list.map((f) => `<li><span>${f.fournisseur}</span><span>${eur.format(f.ttc)}</span></li>`).join("")}</ul>
      <div class="done-actions">
        <button class="btn btn-ghost" data-again>Préparer un autre lot</button>
        <a class="btn btn-ghost" href="index.html?tab=payee">Voir les factures réglées</a>
      </div>
    </section>`;
}

function renderHistory() {
  const paid = invoices()
    .filter((f) => f.statut === "payee")
    .sort((a, b) => paidOn(b) - paidOn(a));
  return `
    <section class="card">
      <div class="card-head"><h2 class="card-title">Derniers virements</h2><a class="card-link" href="index.html?tab=payee">Tout voir ${icon("next")}</a></div>
      <ul class="hist">${paid
        .slice(0, 6)
        .map(
          (f) => `
        <li><a href="facture.html?id=${f.id}">
          <span class="hist-date"><b>${paidOn(f).getDate()}</b>${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(paidOn(f))}</span>
          <span class="hist-main"><strong>${f.fournisseur}</strong><span>${f.numero}</span></span>
          <span class="hist-amount">− ${eur.format(f.ttc)}</span>
        </a></li>`
        )
        .join("")}</ul>
    </section>
    <section class="card bank-card">
      <h2 class="card-title">${BANK.label}</h2>
      <p class="bank-iban">${BANK.iban}</p>
      <p class="card-text">${icon("spark")}Avant chaque envoi, Tampon vérifie l'IBAN du fournisseur, la date d'échéance et le solde du compte.</p>
    </section>`;
}

function render() {
  const list = payables();
  if (!state.selected) state.selected = new Set(list.filter((f) => !f.ibanPending).map((f) => f.id));
  renderShell(
    "Paiements",
    `
    <header class="page-head">
      <div>
        <p class="eyebrow">${COMPANY.nom} · mardi 3 novembre 2026</p>
        <h1>Paiements</h1>
      </div>
      <div class="head-actions"><a class="btn btn-ghost" href="index.html?tab=payer">${icon("file")}Factures prêtes à payer</a></div>
    </header>
    <section class="stat-row" aria-label="Chiffres clés">${renderStats(list)}</section>
    <div class="dash-grid">
      <div class="pay-main">${state.sent ? renderSent() : renderBatch(list)}</div>
      <div class="pay-side">${renderHistory()}</div>
    </div>
    <div class="tip" id="tip" role="tooltip" hidden></div>`
  );
}

function send() {
  const list = payables().filter((f) => state.selected.has(f.id));
  const date = DATES.find((d) => d.id === state.date);
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(addDays("2026-11-03", date.day));
  const snap = snapshot();
  list.forEach((f) => {
    store.data.statuts[f.id] = "payee";
    (store.data.events[f.id] = store.data.events[f.id] || []).push({ when: "3 nov., 10:00", who: PEOPLE[CURRENT_USER].nom, what: `Réglée par virement (lot du ${day})` });
  });
  notify("JL", `Clara a envoyé ${list.length} virement${plural(list.length)} à la banque (${eur.format(sum(list))}), exécution ${day}.`, "paiements.html");
  store.save();
  state.sent = { list, day };
  render();
  toast(`${list.length} virement${plural(list.length)} envoyé${plural(list.length)} à la banque.`, snap);
}

function bindTips() {
  const tip = document.getElementById("tip");
  ["mouseover", "focusin"].forEach((t) =>
    document.addEventListener(t, (e) => {
      const el = e.target.closest("[data-tip]");
      if (!el) return (tip.hidden = true);
      tip.innerHTML = el.dataset.tip;
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      tip.style.left = `${Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2))}px`;
      tip.style.top = `${r.top - tip.offsetHeight - 8 < 8 ? r.bottom + 8 : r.top - tip.offsetHeight - 8}px`;
    })
  );
  addEventListener("scroll", () => (tip.hidden = true), true);
}

function bind() {
  const app = document.getElementById("app");
  app.addEventListener("click", (e) => {
    const d = e.target.closest("[data-date]");
    if (d) {
      state.date = d.dataset.date;
      return render();
    }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const id = Number(pick.dataset.pick);
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      render();
      return document.querySelector(`[data-pick="${id}"]`)?.focus();
    }
    if (e.target.closest("[data-send]")) return send();
    if (e.target.closest("[data-again]")) {
      state.sent = null;
      state.selected = null;
      return render();
    }
  });
  bindTips();
  bindCommon();
}

render();
bind();
