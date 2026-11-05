// Tableau de bord : ce qu'il faut faire aujourd'hui, ce qu'il faudra payer,
// et où part l'argent. Tous les chiffres viennent des factures.

const all = invoices();
const open = all.filter(isOpen);
const plural = (n, s = "s") => (n > 1 ? s : "");
const tabLink = (tab) => `index.html?tab=${tab}`;

/* Chiffres clés */

// Chaque chiffre a son petit visuel : répartition, évolution, rythme, objectif.
const DELAY_GOAL = 15; // objectif de démonstration, en jours
// Montants réglés par semaine sur 6 semaines (k€), valeurs de démonstration
const PAID_SERIES = [2.1, 2.8, 3.0, 2.6, 3.3, 3.6];

function sparkline(vals) {
  const W = 160, H = 36, min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * W, H - ((v - min) / (max - min || 1)) * (H - 8) - 4]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d} L${W} ${H} L0 ${H} Z" fill="#24923a" fill-opacity="0.08"/>
    <path d="${d}" fill="none" stroke="#24923a" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    <circle cx="${lx}" cy="${ly}" r="3.5" fill="#24923a"/></svg>`;
}

function renderStats() {
  const paid = all.filter((f) => f.statut === "payee");
  // Délai entre la réception et le virement (le virement part la veille de l'échéance)
  const delays = paid.map((f) => Math.round((addDays(f.echeance, -1) - toDate(f.recue)) / 86400000));
  const avg = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;
  const received = all.filter((f) => daysFromToday(f.recue) >= -30);

  // Reste à payer, découpé par état (le retard passe avant le statut)
  const parts = [
    { cls: "s-late", label: "En retard", fs: open.filter(isLate) },
    { cls: "s-verifier", label: "À vérifier", fs: open.filter((f) => !isLate(f) && f.statut === "verifier") },
    { cls: "s-valider", label: "En validation", fs: open.filter((f) => !isLate(f) && f.statut === "valider") },
    { cls: "s-payer", label: "Prête à payer", fs: open.filter((f) => !isLate(f) && f.statut === "payer") },
  ].filter((p) => p.fs.length);

  // Factures reçues par semaine, sur les 6 dernières semaines (vraies dates)
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = -7 * (5 - i), start = end - 7;
    const n = all.filter((f) => daysFromToday(f.recue) > start && daysFromToday(f.recue) <= end).length;
    return { n, from: addDays("2026-11-03", start + 1) };
  });
  const maxW = Math.max(...weeks.map((w) => w.n), 1);
  const short = (v) => eur.format(v).replace(/,\d\d/, "");

  return `
    <a class="stat" href="index.html" aria-label="Reste à payer : voir les factures en cours">
      <span class="stat-label">Reste à payer</span>
      <b class="stat-value">${short(sum(open))}</b>
      <span class="stat-sub">${open.length} facture${plural(open.length)} en cours</span>
      <div class="stat-viz"><div class="stat-bar">${parts
        .map((p) => `<i class="${p.cls}" style="flex-grow:${sum(p.fs)}" data-tip="<b>${p.label}</b><span>${eur.format(sum(p.fs))} · ${p.fs.length} facture${plural(p.fs.length)}</span>"></i>`)
        .join("")}</div></div>
    </a>
    <a class="stat" href="index.html?tab=payee">
      <span class="stat-label">Réglé sur 30 jours</span>
      <b class="stat-value">${short(sum(paid))}</b>
      <span class="stat-trend"><span class="trend up-good">↑ +6 %</span><span class="vs">vs octobre</span></span>
      <div class="stat-viz">${sparkline(PAID_SERIES)}</div>
    </a>
    <a class="stat" href="index.html">
      <span class="stat-label">Factures reçues</span>
      <b class="stat-value">${received.length}</b>
      <span class="stat-sub">par semaine, sur 6 semaines</span>
      <div class="stat-viz"><div class="stat-cols">${weeks
        .map((w, i) => `<i class="${i === weeks.length - 1 ? "now" : ""}" style="height:${Math.max(8, (w.n / maxW) * 100)}%" data-tip="<b>Semaine du ${shortDate.format(w.from)}</b><span>${w.n} facture${plural(w.n)} reçue${plural(w.n)}</span>"></i>`)
        .join("")}</div></div>
    </a>
    <div class="stat">
      <span class="stat-label">Délai de traitement</span>
      <b class="stat-value">${avg} j</b>
      <span class="stat-sub">${avg <= DELAY_GOAL ? "dans l'objectif" : "au-dessus de l'objectif"} de ${DELAY_GOAL} j</span>
      <div class="stat-viz"><div class="gauge"><i style="width:${(avg / 30) * 100}%"></i><b style="left:${(DELAY_GOAL / 30) * 100}%"></b></div>
        <div class="gauge-lbl"><span>0 j</span><span>objectif ${DELAY_GOAL} j</span><span>30 j</span></div></div>
    </div>`;
}

/* À faire aujourd'hui : du plus urgent au plus calme */

function todos() {
  const late = all.filter(isLate);
  const doubtful = all.filter((f) => f.statut === "verifier" && openChecks(f.id).length);
  const ready = all.filter((f) => f.statut === "verifier" && !openChecks(f.id).length);
  const waiting = all.filter((f) => f.statut === "valider");
  const wait = waiting.length ? Math.max(...waiting.map((f) => -daysFromToday(f.recue))) : 0;
  const toPay = all.filter((f) => f.statut === "payer" && daysFromToday(f.echeance) >= 0 && daysFromToday(f.echeance) <= 7);
  const doubts = doubtful.reduce((n, f) => n + openChecks(f.id).length, 0);

  // Julien : ce qu'il doit valider, et ce qui part bientôt en paiement
  if (CURRENT_USER === "JL") {
    const oldest = waiting.slice().sort((a, b) => (a.recue < b.recue ? -1 : 1))[0];
    const refused = all.filter((f) => f.statut === "refusee" && store.data.refusals[f.id] && !store.data.refusals[f.id].avoir && store.data.refusals[f.id].motif !== "Facture en double");
    return [
      waiting.length && { tone: "gray", avatar: "JL", title: `Valider ${waiting.length} facture${plural(waiting.length)}`, sub: `${eur.format(sum(waiting))} · la plus ancienne attend depuis ${wait} j`, href: oldest ? `facture.html?id=${oldest.id}` : tabLink("valider"), cta: "Valider" },
      late.length && { tone: "red", icon: "alert", title: `${late.length} facture${plural(late.length)} en retard`, sub: "Clara les règle en priorité dès votre validation", href: tabLink("retard"), cta: "Voir" },
      toPay.length && { tone: "blue", icon: "card", title: `${eur.format(sum(toPay))} partent cette semaine`, sub: `${toPay.length} virement${plural(toPay.length)} programmé${plural(toPay.length)} par Clara`, href: tabLink("payer"), cta: "Voir" },
      refused.length && { tone: "gray", icon: "x", title: `${refused.length} avoir${plural(refused.length)} attendu${plural(refused.length)}`, sub: "Factures refusées, fournisseurs prévenus", href: tabLink("refusee"), cta: "Voir" },
    ].filter(Boolean);
  }

  return [
    late.length && { tone: "red", icon: "alert", title: `${late.length} facture${plural(late.length)} en retard`, sub: `${eur.format(sum(late))} à régulariser au plus vite`, href: tabLink("retard"), cta: "Voir" },
    doubtful.length && { tone: "orange", icon: "spark", title: `Trancher ${doubts} doute${plural(doubts)} de l'IA`, sub: `Sur ${doubtful.map((f) => f.fournisseur).join(" et ")}`, href: `facture.html?id=${doubtful[0].id}`, cta: "Vérifier" },
    ready.length && { tone: "orange", icon: "check", title: `${ready.length} facture${plural(ready.length)} prête${plural(ready.length)} à envoyer en validation`, sub: "Lues sans doute par l'IA", href: tabLink("verifier"), cta: "Envoyer" },
    toPay.length && { tone: "blue", icon: "card", title: `Programmer ${toPay.length} virement${plural(toPay.length)}`, sub: `${eur.format(sum(toPay))} avant le 10 novembre`, href: "paiements.html", cta: "Payer" },
    waiting.length && { tone: "gray", avatar: "JL", title: `Relancer ${PEOPLE.JL.nom.split(" ")[0]}`, sub: `${waiting.length} facture${plural(waiting.length)} attend${waiting.length > 1 ? "ent" : ""} sa validation depuis ${wait} j`, href: tabLink("valider"), cta: store.data.reminded ? "Relancé" : "Relancer", remind: true },
  ].filter(Boolean);
}

/* Échéances à venir : montants ouverts par semaine, empilés par état */

const SEGMENTS = [
  { key: "verifier", label: "À vérifier", cls: "s-verifier" },
  { key: "valider", label: "En validation", cls: "s-valider" },
  { key: "payer", label: "Prête à payer", cls: "s-payer" },
];

function dueBuckets() {
  const buckets = [
    { label: "En retard", test: (d) => d < 0, late: true },
    { label: "Cette semaine", test: (d) => d >= 0 && d <= 7 },
    { label: "Semaine pro.", test: (d) => d > 7 && d <= 14 },
    { label: "Dans 3 sem.", test: (d) => d > 14 && d <= 21 },
    { label: "Plus tard", test: (d) => d > 21 },
  ];
  return buckets.map((b) => {
    const inB = open.filter((f) => b.test(daysFromToday(f.echeance)));
    return {
      ...b,
      total: sum(inB),
      count: inB.length,
      parts: b.late
        ? [{ key: "late", label: "En retard", cls: "s-late", value: sum(inB), count: inB.length }]
        : SEGMENTS.map((s) => {
            const fs = inB.filter((f) => f.statut === s.key);
            return { ...s, value: sum(fs), count: fs.length };
          }).filter((p) => p.value > 0),
    };
  });
}

function renderDueChart() {
  const data = dueBuckets();
  const max = Math.max(...data.map((b) => b.total), 1);

  // Colonnes arrondies posées dans un rail clair : pas d'axe, chaque montant est écrit
  return `
    <div class="chart" role="img" aria-label="Montants à payer par semaine, répartis par état. Le détail est dans le tableau qui suit.">
      ${data
        .map(
          (b) => `
        <${b.late ? `a href="${tabLink("retard")}"` : "div"} class="col${b.late ? " is-late" : ""}${b.total ? "" : " is-empty"}">
          <span class="col-total">${b.total ? eur.format(b.total).replace(/,\d\d/, "") : "0 €"}</span>
          <div class="col-track">
            <div class="col-stack" style="height:${(b.total / max) * 100}%">
              ${b.parts
                .map(
                  (p) => `<i class="seg ${p.cls}" style="flex-grow:${p.value}" tabindex="0"
                    data-tip="<b>${b.label}</b><span><i class='dot ${p.cls}'></i>${p.label}</span><span>${eur.format(p.value)} · ${p.count} facture${plural(p.count)}</span>"></i>`
                )
                .join("")}
            </div>
          </div>
          <span class="col-label">${b.label}</span>
          <span class="col-count">${b.count ? `${b.count} facture${plural(b.count)}` : "Rien"}</span>
        </${b.late ? "a" : "div"}>`
        )
        .join("")}
    </div>
    <ul class="legend-row">
      <li><i class="dot s-late"></i>En retard</li>
      ${SEGMENTS.map((s) => `<li><i class="dot ${s.cls}"></i>${s.label}</li>`).join("")}
    </ul>
    <table class="sr-only">
      <caption>Montants à payer par semaine</caption>
      <tr><th>Période</th><th>Total</th>${SEGMENTS.map((s) => `<th>${s.label}</th>`).join("")}</tr>
      ${data
        .map(
          (b) => `<tr><th>${b.label}</th><td>${eur.format(b.total)}</td>${SEGMENTS.map((s) => {
            const p = b.parts.find((x) => x.key === s.key);
            return `<td>${p ? eur.format(p.value) : "—"}</td>`;
          }).join("")}</tr>`
        )
        .join("")}
    </table>`;
}

/* Où part l'argent : dépenses engagées par compte comptable (hors refusées) */

function renderCategories() {
  const engaged = all.filter((f) => f.statut !== "refusee");
  const byAccount = {};
  engaged.forEach((f) => {
    const c = SUPPLIERS[f.fournisseur].compte.split(" · ")[1];
    byAccount[c] = (byAccount[c] || 0) + f.ttc;
  });
  const rows = Object.entries(byAccount).sort((a, b) => b[1] - a[1]);
  const max = rows[0][1];
  const total = sum(engaged);
  return `
    <ul class="hbars">
      ${rows
        .map(
          ([name, v]) => `
        <li tabindex="0" data-tip="<b>${name}</b><span>${eur.format(v)} · ${Math.round((v / total) * 100)} % des dépenses</span>">
          <span class="hb-name">${name}</span>
          <span class="hb-track"><i style="width:${(v / max) * 100}%"></i></span>
          <span class="hb-value">${eur.format(v).replace(/,\d\d/, "")}</span>
        </li>`
        )
        .join("")}
    </ul>`;
}

/* Fournisseurs principaux */

function renderSuppliers() {
  const by = {};
  all.filter((f) => f.statut !== "refusee").forEach((f) => {
    (by[f.fournisseur] = by[f.fournisseur] || []).push(f);
  });
  return `
    <ul class="sup-list">
      ${Object.entries(by)
        .sort((a, b) => sum(b[1]) - sum(a[1]))
        .slice(0, 5)
        .map(
          ([name, fs]) => `
        <li>
          <span class="tile tile--neutral"><svg aria-hidden="true"><use href="#${SUPPLIER_ICONS[name] || "linear-bill"}"/></svg></span>
          <a class="sup-name" href="${supplierHref(name)}"><strong>${name}</strong><span>${fs.length} facture${plural(fs.length)}</span></a>
          <span class="sup-total">${eur.format(sum(fs)).replace(/,\d\d/, "")}</span>
        </li>`
        )
        .join("")}
    </ul>`;
}

/* Le travail de l'IA */

function renderAi() {
  const clean = all.filter((f) => !CHECKS[f.id]).length;
  const avg = Math.round(all.reduce((t, f) => t + f.ia, 0) / all.length);
  return `
    <div class="ai-hero"><b>${Math.round((clean / all.length) * 100)} %</b><span>des factures lues sans aucune correction</span></div>
    <ul class="ai-list">
      <li>${icon("doc")}<span>${all.length} factures lues automatiquement</span></li>
      <li>${icon("spark")}<span>Confiance moyenne de ${avg} %</span></li>
      <li class="is-warn">${icon("alert")}<span>1 IBAN suspect bloqué avant paiement</span></li>
      <li class="is-warn">${icon("alert")}<span>1 doublon possible signalé</span></li>
    </ul>`;
}

function render() {
  renderShell(
    "Tableau de bord",
    `
    <header class="page-head">
      <div>
        <p class="eyebrow">${COMPANY.nom} · mardi 3 novembre 2026</p>
        <h1>Bonjour ${PEOPLE[CURRENT_USER].nom.split(" ")[0]}</h1>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="index.html">${icon("file")}Voir toutes les factures</a>
      </div>
    </header>

    <section class="stat-row" aria-label="Chiffres clés">
      ${renderStats()}
    </section>

    <div class="dash-grid">
      <section class="card d-todo">
        <h2 class="card-title">À faire aujourd'hui</h2>
        ${(() => {
          const t = todos();
          return t.length
            ? `<ul class="todo">${t
                .map(
                  (x) => `
            <li class="todo-item tone-${x.tone}">
              ${x.avatar ? `<span class="kpi-avatar todo-avatar">${x.avatar}</span>` : `<span class="todo-icon">${icon(x.icon)}</span>`}
              <span class="todo-text"><strong>${x.title}</strong><span>${x.sub}</span></span>
              ${
                x.remind
                  ? `<button class="btn btn-sm btn-ghost" data-remind${store.data.reminded ? " disabled" : ""}>${store.data.reminded ? icon("check") : ""}${x.cta}</button>`
                  : `<a class="btn btn-sm btn-ghost" href="${x.href}">${x.cta}</a>`
              }
            </li>`
                )
                .join("")}</ul>`
            : `<p class="todo-empty">${icon("check")}Rien d'urgent : tout est à jour.</p>`;
        })()}
      </section>

      <section class="card d-due">
        <div class="card-head"><h2 class="card-title">Échéances à venir</h2><span class="card-note">Montants ouverts, par semaine</span></div>
        ${renderDueChart()}
      </section>

      <section class="card d-cat">
        <div class="card-head"><h2 class="card-title">Où part l'argent</h2><span class="card-note">Par compte, hors refusées</span></div>
        ${renderCategories()}
      </section>

      <section class="card d-sup">
        <div class="card-head"><h2 class="card-title">Fournisseurs principaux</h2><span class="card-note">Montant engagé</span></div>
        ${renderSuppliers()}
      </section>

      <section class="card d-ai">
        <div class="card-head"><h2 class="card-title">L'IA ce mois-ci</h2></div>
        ${renderAi()}
      </section>
    </div>
    <div class="tip" id="tip" role="tooltip" hidden></div>`
  );
}

/* Infobulle commune aux deux graphiques (souris et clavier) */

function bindTips() {
  const tip = document.getElementById("tip");
  const show = (el) => {
    tip.innerHTML = el.dataset.tip;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const left = Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2));
    const top = r.top - tip.offsetHeight - 8 < 8 ? r.bottom + 8 : r.top - tip.offsetHeight - 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };
  const hide = () => (tip.hidden = true);
  ["mouseover", "focusin"].forEach((t) =>
    document.addEventListener(t, (e) => {
      const el = e.target.closest("[data-tip]");
      el ? show(el) : hide();
    })
  );
  document.addEventListener("mouseleave", hide, true);
  window.addEventListener("scroll", hide, true);
}

// Relancer Julien : il reçoit une notification
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-remind]")) return;
  const waiting = all.filter((f) => f.statut === "valider");
  notify("JL", `Clara vous relance : ${waiting.length} facture${waiting.length > 1 ? "s attendent" : " attend"} votre validation (${eur.format(sum(waiting))}).`, "index.html?tab=valider");
  store.data.reminded = true;
  store.save();
  render();
  toast(`Relance envoyée à ${PEOPLE.JL.nom}.`);
});

render();
bindTips();
bindCommon();
