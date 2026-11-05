// Expert-comptable : chaque mois, Clara vérifie que tout est prêt, puis envoie
// le journal des achats au cabinet. Les échanges avec le cabinet restent à côté.

// Cabinet et contact fictifs
const CABINET = { nom: "Cabinet d'expertise comptable", contact: "Hélène Roux", role: "Expert-comptable", initials: "HR" };
const plural = (n) => (n > 1 ? "s" : "");
const short = (v) => eur.format(v).replace(/,\d\d/, "");
const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" });

const PERIODS = [
  { id: "2026-10", label: "Octobre", year: 2026, month: 9 },
  { id: "2026-11", label: "Novembre", year: 2026, month: 10 },
];
// Envois des mois précédents (démo)
const PAST_EXPORTS = [
  { label: "Septembre 2026", date: "2026-10-04", count: 12, total: 18240.5 },
  { label: "Août 2026", date: "2026-09-03", count: 9, total: 14310.0 },
];
const FORMATS = [
  { id: "fec", label: "FEC", hint: "Fichier des écritures comptables, le format officiel" },
  { id: "csv", label: "CSV", hint: "Pour un tableur" },
  { id: "pdf", label: "PDF + pièces", hint: "Le journal et toutes les factures" },
];
// Fil d'échanges de départ (démo)
const THREAD = [
  { from: "HR", when: "31 oct., 16:20", text: "Bonjour Clara, pour la clôture d'octobre, pouvez-vous me confirmer pourquoi la facture Société de nettoyage NC-0466 a été refusée ?" },
  { from: "CM", when: "31 oct., 17:05", text: "Bonjour Hélène, la prestation n'a pas été réalisée. Samia a prévenu le fournisseur, un avoir doit suivre." },
  { from: "HR", when: "2 nov., 9:12", text: "Parfait, merci. J'attends l'export d'octobre pour lancer la déclaration de TVA." },
];

const state = { period: "2026-10", format: "fec", reply: "" };

const ht = (f) => Math.round((f.ttc / (1 + SUPPLIERS[f.fournisseur].tva / 100)) * 100) / 100;

function periodInvoices(p) {
  return invoices().filter((f) => {
    const d = toDate(f.recue);
    return d.getFullYear() === p.year && d.getMonth() === p.month;
  });
}

// Ce qu'il faut vérifier avant d'envoyer le mois
function checklist(list) {
  const toCheck = list.filter((f) => f.statut === "verifier");
  const engaged = list.filter((f) => f.statut !== "refusee");
  const refused = list.filter((f) => f.statut === "refusee");
  const unpaid = engaged.filter((f) => f.statut !== "payee");
  return [
    toCheck.length
      ? { tone: "block", text: `${toCheck.length} facture${plural(toCheck.length)} encore à vérifier`, sub: "Elles doivent être vérifiées avant l'envoi.", href: "index.html?tab=verifier", cta: "Vérifier" }
      : { tone: "ok", text: "Toutes les factures du mois sont vérifiées", sub: `${engaged.length} facture${plural(engaged.length)} lue${plural(engaged.length)} et confirmée${plural(engaged.length)}` },
    { tone: "ok", text: "Chaque facture a son compte comptable", sub: "Proposé par Tampon d'après l'historique de chaque fournisseur" },
    { tone: "ok", text: "TVA contrôlée", sub: "Taux cohérents avec les factures précédentes" },
    unpaid.length && { tone: "info", text: `${unpaid.length} facture${plural(unpaid.length)} pas encore réglée${plural(unpaid.length)}`, sub: "Elles partent quand même : la comptabilité les enregistre à réception.", href: "paiements.html", cta: "Paiements" },
    refused.length && { tone: "info", text: `${refused.length} facture${plural(refused.length)} refusée${plural(refused.length)}, exclue${plural(refused.length)} de l'envoi`, sub: refused.map((f) => `${f.fournisseur} · ${f.alerte || "refusée"}`).join(", ") },
  ].filter(Boolean);
}

// Journal des achats : une ligne par compte comptable
function journal(list) {
  const rows = {};
  list
    .filter((f) => f.statut !== "refusee")
    .forEach((f) => {
      const c = SUPPLIERS[f.fournisseur].compte;
      const r = (rows[c] = rows[c] || { compte: c, count: 0, ht: 0, tva: 0, ttc: 0 });
      r.count++;
      r.ht += ht(f);
      r.tva += f.ttc - ht(f);
      r.ttc += f.ttc;
    });
  return Object.values(rows).sort((a, b) => b.ttc - a.ttc);
}

function downloadCsv(p, list) {
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const num = (v) => v.toFixed(2).replace(".", ",");
  const lines = [
    ["Date", "Journal", "Compte", "Fournisseur", "Pièce", "HT", "TVA", "TTC"],
    ...list
      .filter((f) => f.statut !== "refusee")
      .map((f) => [f.recue, "AC", SUPPLIERS[f.fournisseur].compte.split(" · ")[0], f.fournisseur, f.numero, num(ht(f)), num(f.ttc - ht(f)), num(f.ttc)]),
  ].map((r) => r.map(cell).join(";"));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `journal-achats-${p.id}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderStats() {
  const oct = periodInvoices(PERIODS[0]);
  const nov = periodInvoices(PERIODS[1]);
  const sentOct = store.data.exports["2026-10"];
  const novReady = nov.filter((f) => f.statut !== "verifier" && f.statut !== "refusee").length;
  const novTotal = nov.filter((f) => f.statut !== "refusee").length;
  const msgs = THREAD.concat(store.data.messages);
  const lastMsg = msgs[msgs.length - 1];
  return `
    <div class="stat"><span class="stat-label">Octobre</span><b class="stat-value">${sentOct ? "Envoyé" : "À envoyer"}</b>
      <span class="stat-sub">${sentOct ? `le ${sentOct}` : `${oct.filter((f) => f.statut !== "refusee").length} pièces prêtes`}</span>
      <div class="stat-viz"><div class="gauge"><i style="width:${(() => {
        const e = oct.filter((f) => f.statut !== "refusee");
        return e.length ? (e.filter((f) => f.statut !== "verifier").length / e.length) * 100 : 0;
      })()}%"></i></div></div></div>
    <div class="stat"><span class="stat-label">Novembre en cours</span><b class="stat-value">${novReady}/${novTotal}</b>
      <span class="stat-sub">factures prêtes pour la clôture</span>
      <div class="stat-viz"><div class="gauge gauge--blue"><i style="width:${novTotal ? (novReady / novTotal) * 100 : 0}%"></i></div></div></div>
    <div class="stat"><span class="stat-label">Dernier envoi</span><b class="stat-value">${sentOct ? "Aujourd'hui" : "4 oct."}</b>
      <span class="stat-sub">${sentOct ? "octobre 2026" : "septembre 2026 · 12 pièces"}</span></div>
    <div class="stat"><span class="stat-label">Échanges avec le cabinet</span><b class="stat-value">${msgs.length}</b>
      <span class="stat-sub">dernier : ${lastMsg.from === CURRENT_USER ? "vous" : CABINET.contact.split(" ")[0]}, ${lastMsg.when}</span></div>`;
}

function renderExport() {
  const p = PERIODS.find((x) => x.id === state.period);
  const list = periodInvoices(p);
  const checks = checklist(list);
  const blocked = checks.some((c) => c.tone === "block");
  const rows = journal(list);
  const totals = rows.reduce((t, r) => ({ ht: t.ht + r.ht, tva: t.tva + r.tva, ttc: t.ttc + r.ttc, count: t.count + r.count }), { ht: 0, tva: 0, ttc: 0, count: 0 });
  const sent = store.data.exports[p.id];
  const icons = { ok: "check", info: "alert", block: "alert" };

  return `
    <section class="card batch export">
      <div class="card-head"><h2 class="card-title">Envoyer ${p.label.toLowerCase()} au cabinet</h2>${sent ? `<span class="pill pill--payee">Envoyé le ${sent}</span>` : ""}</div>

      <div class="batch-date">
        <span>Mois</span>
        <div class="date-chips" role="radiogroup" aria-label="Mois à envoyer">${PERIODS.map(
          (x) => `<button type="button" role="radio" aria-checked="${x.id === state.period}" class="chip${x.id === state.period ? " is-on" : ""}" data-period="${x.id}">${x.label}<small>${x.year}</small></button>`
        ).join("")}</div>
      </div>

      ${(() => {
        // L'anneau ne compte que les vrais contrôles ; les informations restent à part
        const real = checks.filter((c) => c.tone !== "info");
        const passed = real.filter((c) => c.tone === "ok").length;
        const pct = (passed / real.length) * 100;
        const notes = checks.filter((c) => c.tone === "info");
        return `
        <div class="closing${blocked ? " is-blocked" : ""}">
          <div class="ring" style="--p:${pct}" role="img" aria-label="${passed} contrôles validés sur ${real.length}">
            <div><b>${passed}/${real.length}</b><span>${blocked ? "contrôles validés" : `${p.label.toLowerCase()} est prêt`}</span></div>
          </div>
          <div class="steps">${real
            .map(
              (c) => `<div class="stp stp--${c.tone}"><span class="stp-ic">${icon(icons[c.tone])}</span>
                <span class="stp-text"><strong>${c.text}</strong><span>${c.sub}</span>${c.href ? `<a href="${c.href}">${c.cta} ${icon("next")}</a>` : ""}</span></div>`
            )
            .join("")}</div>
        </div>
        ${notes.length ? `<ul class="notes">${notes.map((c) => `<li>${icon("alert")}<span><strong>${c.text}.</strong> ${c.sub}</span>${c.href ? `<a href="${c.href}">${c.cta}</a>` : ""}</li>`).join("")}</ul>` : ""}`;
      })()}

      <details class="journal-box">
        <summary><span><strong>Journal des achats</strong><span>${rows.length} compte${plural(rows.length)} · HT ${eur.format(totals.ht)} · TVA ${eur.format(totals.tva)}</span></span>${icon("next")}</summary>
      <div class="table-wrap">
        <table class="journal">
          <thead><tr><th>Compte</th><th class="num">Pièces</th><th class="num">HT</th><th class="num">TVA</th><th class="num">TTC</th></tr></thead>
          <tbody>${rows
            .map((r) => `<tr><td>${r.compte}</td><td class="num">${r.count}</td><td class="num">${eur.format(r.ht)}</td><td class="num">${eur.format(r.tva)}</td><td class="num">${eur.format(r.ttc)}</td></tr>`)
            .join("")}</tbody>
          <tfoot><tr><td>Total</td><td class="num">${totals.count}</td><td class="num">${eur.format(totals.ht)}</td><td class="num">${eur.format(totals.tva)}</td><td class="num">${eur.format(totals.ttc)}</td></tr></tfoot>
        </table>
      </div>
      </details>

      <div class="fmt-row">
        <span>Format</span>
        <div class="date-chips" role="radiogroup" aria-label="Format">${FORMATS.map(
          (f) => `<button type="button" role="radio" aria-checked="${f.id === state.format}" class="chip${f.id === state.format ? " is-on" : ""}" data-format="${f.id}" title="${f.hint}">${f.label}</button>`
        ).join("")}</div>
      </div>

      <div class="send-band${blocked ? " is-blocked" : ""}">
        <div class="batch-sum">
          <span>${totals.count} pièce${plural(totals.count)} · ${p.label.toLowerCase()} ${p.year} · ${FORMATS.find((f) => f.id === state.format).label}</span>
          <b>${eur.format(totals.ttc)}</b>
          <span>${blocked ? "Envoi impossible tant que des factures restent à vérifier" : `Pour ${CABINET.contact}, ${CABINET.nom}`}</span>
        </div>
        <div class="export-actions">
          <button class="btn btn-ghost" data-download>${icon("export")}Télécharger</button>
          <button class="btn btn-primary" data-send-export ${blocked ? "disabled" : ""}>${icon("next")}${sent ? "Renvoyer" : `Envoyer à ${CABINET.contact.split(" ")[0]}`}</button>
        </div>
      </div>
    </section>`;
}

function renderSide() {
  const msgs = THREAD.concat(store.data.messages);
  return `
    <section class="card cabinet">
      <div class="cab-head">
        <span class="cab-avatar">${CABINET.initials}</span>
        <span class="cab-name"><strong>${CABINET.contact}</strong><span>${CABINET.role} · ${CABINET.nom}</span></span>
      </div>
      <p class="card-text">${icon("users")}Hélène a un accès en lecture seule à Tampon : elle consulte les factures et les pièces sans rien modifier.</p>
    </section>

    <section class="card">
      <h2 class="card-title">Échanges avec le cabinet</h2>
      <ul class="thread">${msgs
        .map(
          (m) => `<li class="msg${m.from === CURRENT_USER ? " is-me" : ""}">
            <span class="msg-avatar">${m.from}</span>
            <span class="msg-body"><span class="msg-meta">${m.from === CURRENT_USER ? PEOPLE[CURRENT_USER].nom : CABINET.contact} · ${m.when}</span><span class="msg-text">${m.text}</span></span>
          </li>`
        )
        .join("")}</ul>
      <form class="reply" id="reply">
        <label class="sr-only" for="reply-text">Répondre à ${CABINET.contact}</label>
        <input id="reply-text" type="text" placeholder="Répondre à ${CABINET.contact.split(" ")[0]}…" autocomplete="off" value="${state.reply.replace(/"/g, "&quot;")}">
        <button class="btn btn-primary btn-sm" type="submit">Envoyer</button>
      </form>
    </section>

    <section class="card">
      <h2 class="card-title">Envois précédents</h2>
      <ul class="hist">${(store.data.exports["2026-10"] ? [{ label: "Octobre 2026", date: "2026-11-03", count: journal(periodInvoices(PERIODS[0])).reduce((t, r) => t + r.count, 0), total: sum(periodInvoices(PERIODS[0]).filter((f) => f.statut !== "refusee")) }] : [])
        .concat(PAST_EXPORTS)
        .map(
          (e) => `<li><a href="#" data-demo="Ouverture de l'envoi « ${e.label} » simulée.">
            <span class="hist-date"><b>${toDate(e.date).getDate()}</b>${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(toDate(e.date))}</span>
            <span class="hist-main"><strong>${e.label}</strong><span>${e.count} pièces · FEC</span></span>
            <span class="hist-amount">${short(e.total)}</span>
          </a></li>`
        )
        .join("")}</ul>
    </section>`;
}

function render() {
  renderShell(
    "Expert-comptable",
    `
    <header class="page-head">
      <div>
        <p class="eyebrow">${COMPANY.nom} · mardi 3 novembre 2026</p>
        <h1>Expert-comptable</h1>
      </div>
      <div class="head-actions"><button class="btn btn-ghost" data-demo="L'invitation d'un autre collaborateur du cabinet arrive dans la version complète.">${icon("users")}Inviter un collaborateur</button></div>
    </header>
    <section class="stat-row" aria-label="Chiffres clés">${renderStats()}</section>
    <div class="dash-grid">
      <div class="pay-main">${renderExport()}</div>
      <div class="pay-side">${renderSide()}</div>
    </div>`
  );
}

function bind() {
  const app = document.getElementById("app");
  app.addEventListener("click", (e) => {
    const per = e.target.closest("[data-period]");
    if (per) {
      state.period = per.dataset.period;
      return render();
    }
    const fmt = e.target.closest("[data-format]");
    if (fmt) {
      state.format = fmt.dataset.format;
      return render();
    }
    const p = PERIODS.find((x) => x.id === state.period);
    if (e.target.closest("[data-download]")) {
      downloadCsv(p, periodInvoices(p));
      return toast(`Journal de ${p.label.toLowerCase()} téléchargé (CSV).`);
    }
    if (e.target.closest("[data-send-export]")) {
      store.data.exports[p.id] = "3 nov.";
      store.save();
      render();
      document.querySelector(".export .pill")?.classList.add("anim-stamp");
      const fmtLabel = FORMATS.find((f) => f.id === state.format).label;
      toast(`${p.label} envoyé à ${CABINET.contact} (${fmtLabel}).`);
    }
  });
  app.addEventListener("input", (e) => {
    if (e.target.id === "reply-text") state.reply = e.target.value;
  });
  app.addEventListener("submit", (e) => {
    if (e.target.id !== "reply") return;
    e.preventDefault();
    const text = state.reply.trim();
    if (!text) return;
    store.data.messages.push({ from: CURRENT_USER, when: "3 nov., 10:00", text: text.replace(/</g, "&lt;") });
    store.save();
    state.reply = "";
    render();
    document.querySelector(".thread .msg:last-child")?.classList.add("anim-in");
    document.getElementById("reply-text").focus();
  });
  bindCommon();
}

render();
bind();
