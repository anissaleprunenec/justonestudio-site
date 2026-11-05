// Liste des fournisseurs : qui on paie, combien, et lesquels surveiller.

const plural = (n) => (n > 1 ? "s" : "");
const short = (v) => eur.format(v).replace(/,\d\d/, "");

const TABS = [
  { id: "tous", label: "Tous" },
  { id: "surveiller", label: "À surveiller", test: (s) => s.ibanCheck || s.late.length },
  { id: "ajour", label: "À jour", test: (s) => !s.ibanCheck && !s.late.length },
];
const state = { tab: "tous", q: "" };

const suppliers = () =>
  Object.keys(SUPPLIERS)
    .map(supplierData)
    .sort((a, b) => b.engaged - a.engaged);

// Étiquettes d'état : risque d'abord, puis retard, sinon « À jour »
function tags(s) {
  const out = [];
  if (s.ibanCheck) out.push(`<span class="pill pill--verifier">IBAN à confirmer</span>`);
  if (s.late.length) out.push(`<span class="pill pill--late">${s.late.length} en retard</span>`);
  if (!out.length) out.push(`<span class="pill pill--payee">À jour</span>`);
  return out.join("");
}

function renderStats(list) {
  const total = sum(invoices().filter((f) => f.statut !== "refusee"));
  const top = list.slice(0, 3);
  const rest = total - top.reduce((t, s) => t + s.engaged, 0);
  const watch = list.filter((s) => s.ibanCheck || s.late.length);
  const withOpen = list.filter((s) => s.open.length).length;
  const shades = ["#2c2c30", "#6c7278", "#acb5bb"];
  return `
    <div class="stat">
      <span class="stat-label">Fournisseurs actifs</span>
      <b class="stat-value">${list.length}</b>
      <span class="stat-sub">dont ${withOpen} avec une facture en cours</span>
    </div>
    <div class="stat">
      <span class="stat-label">Montant engagé</span>
      <b class="stat-value">${short(total)}</b>
      <span class="stat-sub">${Math.round((top[0].engaged / total) * 100)} % chez ${top[0].name}</span>
      <div class="stat-viz"><div class="stat-bar">${top
        .map((s, i) => `<i style="flex-grow:${s.engaged};background:${shades[i]}" data-tip="<b>${s.name}</b><span>${eur.format(s.engaged)}</span>"></i>`)
        .join("")}<i style="flex-grow:${rest};background:#e5e9ec" data-tip="<b>Autres fournisseurs</b><span>${eur.format(rest)}</span>"></i></div></div>
    </div>
    <button type="button" class="stat stat--watch" data-goto="surveiller">
      <span class="stat-label">À surveiller</span>
      <b class="stat-value">${watch.length}</b>
      <span class="stat-sub">${watch.map((s) => s.name).join(", ") || "Aucun"}</span>
    </button>
    <div class="stat">
      <span class="stat-label">IBAN vérifiés</span>
      <b class="stat-value">${list.filter((s) => !s.ibanCheck).length}/${list.length}</b>
      <span class="stat-sub">${(() => {
        const n = list.filter((s) => s.ibanCheck).length;
        return n ? `${n} IBAN à confirmer` : "tous confirmés";
      })()}</span>
      <div class="stat-viz"><div class="gauge"><i style="width:${(list.filter((s) => !s.ibanCheck).length / list.length) * 100}%"></i></div></div>
    </div>`;
}

function render() {
  renderShell(
    "Fournisseurs",
    `
    <header class="page-head">
      <div>
        <p class="eyebrow">${COMPANY.nom} · mardi 3 novembre 2026</p>
        <h1>Fournisseurs</h1>
      </div>
      <div class="head-actions">
        <label class="search">${icon("search")}<input type="search" id="q" placeholder="Rechercher un fournisseur, une ville" aria-label="Rechercher"></label>
        <button class="btn btn-primary" data-demo="L'ajout d'un fournisseur arrive dans la version complète.">${icon("users")}Ajouter un fournisseur</button>
      </div>
    </header>
    <section class="stat-row" id="stats" aria-label="Chiffres clés"></section>
    <section class="panel">
      <div class="toolbar"><div class="tabs" role="tablist" id="tabs"></div></div>
      <div class="table-wrap">
        <table class="table sup-table">
          <thead><tr>
            <th>Fournisseur</th><th>Catégorie</th><th class="num">Factures</th><th class="num">Engagé</th><th class="num">En cours</th><th>État</th><th class="c-action"><span class="sr-only">Ouvrir</span></th>
          </tr></thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <p class="table-foot" id="foot"></p>
    </section>
    <div class="tip" id="tip" role="tooltip" hidden></div>`
  );
}

function refresh() {
  const all = suppliers();
  document.getElementById("stats").innerHTML = renderStats(all);
  document.getElementById("tabs").innerHTML = TABS.map((t) => {
    const n = t.test ? all.filter(t.test).length : all.length;
    const active = state.tab === t.id;
    return `<button class="tab tab--s-${t.id}${active ? " is-active" : ""}" role="tab" aria-selected="${active}" data-tab="${t.id}">${t.label}<span class="tab-count">${n}</span></button>`;
  }).join("");

  const q = state.q.trim().toLowerCase();
  const tab = TABS.find((t) => t.id === state.tab);
  const list = all.filter((s) => (!tab.test || tab.test(s)) && (!q || s.name.toLowerCase().includes(q) || s.sup.ville.toLowerCase().includes(q)));

  document.getElementById("rows").innerHTML = list.length
    ? list
        .map(
          (s) => `
      <tr data-href="${supplierHref(s.name)}" class="${s.late.length ? "is-late" : ""}">
        <td><div class="supplier">
          <span class="tile tile--neutral"><svg aria-hidden="true"><use href="#${SUPPLIER_ICONS[s.name] || "linear-bill"}"/></svg></span>
          <div><a class="row-link" href="${supplierHref(s.name)}"><strong>${s.name}</strong></a><span class="muted">${s.sup.ville}</span></div>
        </div></td>
        <td>${s.sup.compte.split(" · ")[1]}</td>
        <td class="num">${s.invoices.length}</td>
        <td class="num eng">${eur.format(s.engaged)}</td>
        <td class="num">${s.open.length ? eur.format(sum(s.open)) : `<span class="muted">—</span>`}</td>
        <td><div class="tags">${tags(s)}</div></td>
        <td class="c-action"><span class="go">${icon("next")}</span></td>
      </tr>`
        )
        .join("")
    : `<tr class="empty"><td colspan="7">Aucun fournisseur ne correspond à cette recherche.</td></tr>`;

  document.getElementById("foot").innerHTML = `<span>${list.length} fournisseur${plural(list.length)}</span><span>Montant engagé <strong class="num">${eur.format(list.reduce((t, s) => t + s.engaged, 0))}</strong></span>`;
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
  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) {
      state.tab = b.dataset.tab;
      refresh();
    }
  });
  document.getElementById("stats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto]");
    if (b) {
      state.tab = state.tab === b.dataset.goto ? "tous" : b.dataset.goto;
      refresh();
    }
  });
  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value;
    refresh();
  });
  document.getElementById("rows").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-href]");
    if (tr && !e.target.closest("a")) location.href = tr.dataset.href;
  });
  bindTips();
  bindCommon();
}

render();
refresh();
bind();
