// V34 : confirmation des remplacements de valeurs déjà renseignées.
function replacement34(oldValue, newValue, fields, label) {
  const changes = fields.filter(
    (k) =>
      oldValue?.[k] != null &&
      oldValue[k] !== "" &&
      oldValue[k] !== newValue[k],
  );
  if (!changes.length) return true;
  const fmt = (v) => (v == null || v === "" ? "—" : String(v));
  return confirm(
    label +
      "\n" +
      changes
        .map((k) => k + " : " + fmt(oldValue[k]) + " → " + fmt(newValue[k]))
        .join("\n") +
      "\nVoulez-vous vraiment remplacer la valeur existante ?",
  );
}
function syncReplacement34(owner, oldValue, newValue, fields, label, slot) {
  const changes = fields.filter(
    (k) =>
      oldValue?.[k] != null &&
      oldValue[k] !== "" &&
      oldValue[k] !== newValue[k],
  );
  if (!changes.length) {
    if (owner.refused34) delete owner.refused34[slot];
    return true;
  }
  const signature = JSON.stringify(
    changes.map((k) => [k, oldValue[k], newValue[k]]),
  );
  if (owner.refused34?.[slot] === signature) return false;
  if (replacement34(oldValue, newValue, fields, label)) {
    if (owner.refused34) delete owner.refused34[slot];
    return true;
  }
  (owner.refused34 ??= {})[slot] = signature;
  return false;
}
const readNumber = (el) => (el.value.trim() === "" ? null : Number(el.value));
const initial = {
  assets: [],
  debt: null,
  pea: null,
  history: [],
  goal: null,
  income: [
    { name: "Dividendes", value: null },
    { name: "SCPI / Immobilier", value: null },
    { name: "Staking / Crypto", value: null },
  ],
  tasks: [],
};
const demoMode = sessionStorage.getItem("mon-patrimoine-demo-mode") === "1";
const key = demoMode ? "mon-patrimoine-v8-demo" : "mon-patrimoine-v7";
let data;
try {
  data = JSON.parse(localStorage.getItem(key)) || structuredClone(initial);
} catch {
  data = structuredClone(initial);
}
const $ = (id) => document.getElementById(id),
  eur = (n) =>
    n == null || !Number.isFinite(n)
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(n === 0 ? 0 : n),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  sum = (a, k) => a.reduce((s, x) => s + Number(x[k]), 0),
  colors = ["#3985ef", "#ffad32", "#a76bf1", "#ffc13c", "#54c9aa", "#94a3b8"];
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    alert(
      "Sauvegarde locale indisponible. Utilise Exporter pour conserver tes données.",
    );
  }
}
function render() {
  const total = sum(data.assets, "value"),
    cash = sum(
      data.assets.filter((a) => a.type === "Liquidités"),
      "value",
    ),
    invested = data.assets.filter((a) => a.type !== "Liquidités"),
    cost = sum(invested, "cost"),
    gain = sum(invested, "value") - cost,
    net = total - data.debt;
  const kpis = [
    ["Patrimoine net", net, "Actifs moins dettes"],
    ["Capital investi", cost, "Hors liquidités"],
    ["Liquidités", cash, "Épargne totale"],
    [
      "Plus-value latente",
      gain,
      cost
        ? `${((gain / cost) * 100).toFixed(1)} % du coût investi`
        : "Non calculable",
    ],
  ];
  $("kpis").innerHTML = kpis
    .map(
      ([n, v, s], i) =>
        `<div class="kpi"><span class="kpi-icon icon-${i}">${[`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 7 10-5 10 5-10 5z" fill="currentColor" stroke="none"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/></svg>`, `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V13h4v8zm7 0V8h4v13zm7 0V3h4v18z" fill="currentColor" stroke="none"/></svg>`, `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 10c0 4 18 4 18 0M3 15c0 4 18 4 18 0"/></svg>`, `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 18 7-7 4 3 8-9m-6 0h6v6"/></svg>`][i]}</span><div><small>${n}</small><strong class="${i === 3 ? (v >= 0 ? "positive" : "negative") : ""}">${eur(v)}</strong><small>${s}</small></div></div>`,
    )
    .join("");
  const etfs = data.assets.filter((a) => a.type === "ETF"),
    et = sum(etfs, "value");
  $("etfTotal").textContent = eur(et);
  function table(a, isETF = false) {
    return `<table><thead><tr><th>${isETF ? "ETF" : "Actif"}</th><th>Valeur</th>${isETF ? "<th>Poids</th>" : ""}<th>Gain (%)</th></tr></thead><tbody>${a
      .map((x, i) => {
        let g = x.cost ? (x.value / x.cost - 1) * 100 : null;
        return `<tr><td><i class="marker" style="background:${colors[i % colors.length]}"></i>${esc(x.name)}</td><td>${eur(x.value)}</td>${isETF ? `<td>${et ? ((x.value / et) * 100).toFixed(1) : 0} %</td>` : ""}<td><span class="badge ${g >= 0 ? "positive" : "negative"}">${g === null ? "—" : (g >= 0 ? "+" : "") + g.toFixed(1) + " %"}</span></td></tr>`;
      })
      .join("")}</tbody></table>`;
  }
  $("etfTable").innerHTML = table(etfs, true);
  $("assetTable").innerHTML =
    table(data.assets.filter((a) => a.type !== "ETF")) +
    (data.debt
      ? `<div class="line"><span>Dettes</span><b>${eur(data.debt)}</b></div>`
      : "");
  let groups = {};
  data.assets.forEach(
    (a) => (groups[a.type] = (groups[a.type] || 0) + a.value),
  );
  let angle = 0;
  const entries = types
    .map((t) => [t, groups[t] || 0])
    .filter(([, v]) => v > 0);
  const stops = entries.map(([n, v], i) => {
    let start = angle;
    angle += total ? (v / total) * 360 : 0;
    return `${colors[types.indexOf(n)]} ${start}deg ${angle}deg`;
  });
  $("donut").innerHTML =
    `<div class="ring" style="background:${total ? "conic-gradient(" + stops.join(",") + ")" : "#293749"}"><div>${eur(total)}<small>Actifs bruts</small></div></div>`;
  $("legend").innerHTML = entries
    .map(
      ([n, v], i) =>
        `<div class="legend-row"><span><i class="dot" style="background:${colors[types.indexOf(n)]}"></i>${esc(n)}</span><b>${total ? ((v / total) * 100).toFixed(1) : 0} %</b></div>`,
    )
    .join("");
  let h = data.history,
    lo = Math.min(...h),
    hi = Math.max(...h),
    points = h
      .map(
        (v, i) =>
          `${15 + (i * 290) / Math.max(1, h.length - 1)},${145 - ((v - lo) * 120) / Math.max(1, hi - lo)}`,
      )
      .join(" ");
  $("chart").innerHTML = h.length
    ? `<svg viewBox="0 0 320 180" role="img" aria-label="Évolution historique"><g stroke="#293749"><path d="M15 25H305 M15 65H305 M15 105H305 M15 145H305"/></g><defs><linearGradient id="fill" x2="0" y2="1"><stop stop-color="#42dda0" stop-opacity=".28"/><stop offset="1" stop-color="#42dda0" stop-opacity="0"/></linearGradient></defs><polygon points="15,145 ${points} 305,145" fill="url(#fill)"/><polyline points="${points}" fill="none" stroke="#42dda0" stroke-width="3" stroke-linejoin="round"/><text x="15" y="170" fill="#9daec3" font-size="11">${eur(h[0])}</text><text x="305" y="170" text-anchor="end" fill="#9daec3" font-size="11">${eur(h.at(-1))}</text></svg>`
    : "Aucun historique";
  let pct = data.goal > 0 ? (net / data.goal) * 100 : 0;
  $("goalList").innerHTML =
    `<div class="goal">Atteindre ${eur(data.goal)}<div class="line"><span>${eur(net)}</span><b>${pct.toFixed(1)} %</b></div><progress max="100" value="${Math.max(0, Math.min(100, pct))}"></progress></div>`;
  $("goalList").innerHTML += [
    ["Renforcer le PEA", 100000, null],
    ["Générer des revenus annuels", 10000, sum(data.income, "value")],
  ]
    .map(
      ([n, t, v]) =>
        `<div class="goal">${n} (${eur(t)})<div class="goalbar"><progress max="100" value="${v === null ? 0 : Math.min(100, (v / t) * 100)}"></progress><small>${v === null ? "À renseigner" : Math.round((v / t) * 100) + " %"}</small></div></div>`,
    )
    .join("");
  $("incomeList").innerHTML =
    `<h1>${eur(sum(data.income, "value"))}</h1>` +
    data.income
      .map(
        (x) =>
          `<div class="line"><span>${esc(x.name)}</span><b>${eur(x.value)}</b></div>`,
      )
      .join("");
  $("taskList").innerHTML = data.tasks
    .map(
      (t, i) =>
        `<label class="task ${t.done ? "done" : ""}"><input type="checkbox" data-task="${i}" ${t.done ? "checked" : ""}>${esc(t.name)}</label>`,
    )
    .join("");
  $("taskList")
    .querySelectorAll("input")
    .forEach(
      (el) =>
        (el.onchange = () => {
          data.tasks[el.dataset.task].done = el.checked;
          save();
          render();
        }),
    );
}
const types = [
  "ETF",
  "Actions",
  "Crypto",
  "Immobilier",
  "Liquidités",
  "Autres",
];
function assetRow(a = { name: "", type: "ETF", value: null, cost: null }) {
  const row = document.createElement("div");
  row.className = "editrow";
  row.innerHTML = `<input aria-label="Nom" required value="${esc(a.name)}" placeholder="Nom"><select aria-label="Catégorie">${types.map((t) => `<option ${t === a.type ? "selected" : ""}>${t}</option>`).join("")}</select><input aria-label="Valeur actuelle" type="number" min="0" step="0.01" required placeholder="À renseigner" value="${a.value ?? ""}"><input aria-label="Coût investi" type="number" min="0" step="0.01" required placeholder="À renseigner" value="${a.cost ?? ""}"><button type="button">×</button>`;
  row.lastElementChild.onclick = () => row.remove();
  $("assetFields").append(row);
}
$("edit").onclick = () => {
  $("fields").innerHTML =
    `<div class="editgroup"><h3>Actifs</h3><small>Nom · Catégorie · Valeur actuelle · Coût investi</small><div id="assetFields"></div><button type="button" id="addAsset">+ Ajouter un actif</button></div><label>Dettes restantes (€)<input id="debt" type="number" min="0" step="0.01" placeholder="À renseigner" value="${data.debt ?? ""}"></label><label>Objectif de patrimoine net (€)<input id="goal" type="number" min="1" placeholder="À renseigner" value="${data.goal ?? ""}"></label><div class="editgroup"><h3>Historique du patrimoine net</h3><small>Valeurs successives en euros, séparées par des points-virgules.</small><input id="hist" value="${data.history.join("; ")}"></div><div class="editgroup"><h3>Revenus annuels</h3>${data.income.map((x, i) => `<label>${esc(x.name)}<input class="incomeInput" type="number" min="0" step="0.01" placeholder="À renseigner" value="${x.value ?? ""}"></label>`).join("")}</div>`;
  data.assets.forEach(assetRow);
  $("addAsset").onclick = () => assetRow();
  $("editor").showModal();
};
$("cancel").onclick = () => $("editor").close();
$("editForm").onsubmit = (e) => {
  e.preventDefault();
  const history = $("hist").value.trim()
    ? $("hist")
        .value.split(";")
        .map((x) =>
          x.trim() === "" ? NaN : Number(x.trim().replace(",", ".")),
        )
    : [];
  if (history.some((x) => !Number.isFinite(x))) {
    alert("Historique invalide.");
    return;
  }
  data.assets = [...$("assetFields").children].map((r) => {
    const [n, t, v, c] = r.querySelectorAll("input,select");
    return {
      ...(data.assets.find((a) => a.name === n.value && a.type === t.value) ||
        {}),
      name: n.value,
      type: t.value,
      value: readNumber(v),
      cost: readNumber(c),
    };
  });
  data.debt = readNumber($("debt"));
  data.goal = readNumber($("goal"));
  data.history = history;
  document
    .querySelectorAll(".incomeInput")
    .forEach((x, i) => (data.income[i].value = readNumber(x)));
  save();
  render();
  $("editor").close();
};
$("export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "patrimoine.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
render();

$("date").innerHTML =
  `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18m-14 4h3m4 0h3m-10 3h3"/></svg> Aujourd’hui · ` +
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date());
const baseRender = render;
const icons = {
  Actions: '<path d="M2 17l6-6 4 3 8-9m-5 0h5v5"/>',
  Crypto:
    '<path d="M8 3v18m4-18v3m0 12v3M5 6h9a4 4 0 010 8H5m3 0h7a4 4 0 010 8H5" transform="translate(0 -1) scale(.95)"/>',
  Immobilier: '<path d="M2 11l10-9 10 9M5 9v12h5v-7h5v7h5V9"/>',
  Liquidités:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 10c0 4 18 4 18 0M3 15c0 4 18 4 18 0"/>',
  Autres: '<circle cx="12" cy="12" r="8"/>',
};
function icon(t) {
  return `<i class="asset-icon"><svg viewBox="0 0 24 24" fill="none" stroke="${t === "Crypto" ? "#ffbd35" : t === "Immobilier" ? "#ffd080" : "#dce5ef"}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[t]}</svg></i>`;
}
render = function () {
  baseRender();
  const names = {
    Actions: "Actions (titres vifs)",
    Crypto: "Cryptomonnaies",
    Immobilier: "Immobilier / SCPI",
    Liquidités: "Épargne & Liquidités",
    Autres: "Autres",
  };
  const groups = Object.keys(names)
    .map((t) => {
      let a = data.assets.filter((x) => x.type === t);
      return [t, sum(a, "value"), sum(a, "cost")];
    })
    .filter((x) => x[1] || x[2]);
  $("assetTable").innerHTML =
    groups
      .map(([t, v, c]) => {
        let p = c ? (v / c - 1) * 100 : null;
        return `<div class="asset-row"><span>${icon(t)}${names[t]}</span><span>${eur(v)}</span><span class="badge ${p >= 0 ? "positive" : "negative"}">${p === null ? "—" : (p >= 0 ? "+" : "") + p.toFixed(1) + " %"}</span></div>`;
      })
      .join("") +
    (data.debt
      ? `<div class="line">Dettes <b>${eur(data.debt)}</b></div>`
      : "");
  let net = sum(data.assets, "value") - data.debt;
  let goals = [
    [`Atteindre ${eur(data.goal)}`, (net / data.goal) * 100],
    [
      `Renforcer le PEA (100 000 €)`,
      data.pea === undefined ? null : (data.pea / 100000) * 100,
    ],
    [`Générer 10 000 € / an de revenus`, sum(data.income, "value") / 100],
  ];
  $("goalList").innerHTML = goals
    .map(
      ([n, p], i) =>
        `<div class="goal"><div class="goal-label"><span class="goal-check ${p !== null && p >= 99 ? "checked" : ""}">${p !== null && p >= 99 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>' : ""}</span>${n}</div><div class="goalbar"><progress max="100" value="${Math.max(0, Math.min(100, p || 0))}"></progress><small>${p === null ? "À renseigner" : Math.floor(p) + " %"}</small></div></div>`,
    )
    .join("");
  let h = data.history;
  if (h.length) {
    let lo = Math.floor((Math.min(...h) - 10000) / 20000) * 20000 + 10000,
      hi = Math.ceil((Math.max(...h) - 10000) / 20000) * 20000 + 10000 + 20000;
    let X = (i) => 37 + (i * 283) / Math.max(1, h.length - 1),
      Y = (v) => 137 - ((v - lo) * 116) / (hi - lo);
    let pts = h.map((v, i) => [X(i), Y(v)]);
    let path = pts.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ");
    let months = [
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
      "Jan",
    ];
    let grid = "";
    for (let v = lo; v <= hi; v += 20000) {
      grid += `<path d="M37 ${Y(v)}H320" stroke="#283442"/><text x="31" y="${Y(v) + 3}" text-anchor="end">${v / 1000} k€</text>`;
    }
    let last = pts.at(-1);
    $("chart").innerHTML =
      `<svg viewBox="0 0 330 160" role="img" aria-label="Historique du patrimoine"><defs><linearGradient id="greenfill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#35dc91" stop-opacity=".32"/><stop offset="1" stop-color="#35dc91" stop-opacity=".015"/></linearGradient></defs><g fill="#c8d0db" font-size="9">${grid}<path d="M37 21V137H320" stroke="#59616d" fill="none"/>${months.map((m, i) => `<text x="${37 + (i * 283) / 11}" y="151" text-anchor="middle">${m}</text>`).join("")}</g><path d="${path} L${last[0]} 137 L37 137Z" fill="url(#greenfill)"/><path d="${path}" fill="none" stroke="#42dda0" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="#42dda0"/></svg>`;
    let pct = h[0] ? (h.at(-1) / h[0] - 1) * 100 : 0;
    document.querySelector("#history h2").innerHTML =
      `Évolution du patrimoine <span class="history-badge">${pct >= 0 ? "+" : ""}${pct.toFixed(1)} %</span>`;
  }
};
const oldEdit = $("edit").onclick;
$("edit").onclick = () => {
  oldEdit();
  $("fields").insertAdjacentHTML(
    "beforeend",
    `<label>Valeur du PEA (€)<input id="peaValue" type="number" min="0" value="${data.pea ?? ""}" placeholder="À renseigner"></label>`,
  );
};
const oldSubmit = $("editForm").onsubmit;
$("editForm").onsubmit = (e) => {
  const v = $("peaValue").value;
  data.pea = v === "" ? undefined : Number(v);
  oldSubmit(e);
};
render();
// V6 — revenus réellement encaissés, hors double comptage.
const rentDefaults = {
  reference: null,
  months: null,
  inflation: null,
  margin: null,
  flows: null,
  etf: null,
  scpi: null,
  other: null,
  tax: null,
  reserve: null,
  included: false,
  wanted: null,
  targets: {
    ETF: null,
    Actions: null,
    Crypto: null,
    Immobilier: null,
    Liquidités: null,
    Autres: null,
  },
};
data.rent = { ...rentDefaults, ...data.rent };
function rentCalc(r, net) {
  const gross = r.etf + r.scpi + r.other,
    income = gross - r.tax,
    available = Math.max(0, income + r.reserve),
    target = Math.max(
      0,
      r.reference *
        Math.pow(1 + (r.inflation + r.margin) / 100, r.months / 12) +
        r.flows,
    ),
    wealth = net + (r.included ? 0 : income + r.reserve),
    gap = wealth - target;
  return {
    gross,
    income,
    available,
    target,
    wealth,
    gap,
    salary: Math.min(available, Math.max(0, gap)),
    deficit: Math.max(0, -gap),
  };
}
const row = (n, v) => `<div class="line"><span>${n}</span><b>${v}</b></div>`;
const previousRender = render;
render = function () {
  previousRender();
  const r = data.rent,
    net = sum(data.assets, "value") - data.debt,
    c = rentCalc(r, net);
  $("kpis").insertAdjacentHTML(
    "beforeend",
    `<div class="kpi"><span class="kpi-icon icon-2">${icon("Liquidités")}</span><div><small>Revenus encaissés</small><strong>${eur(c.gross)}</strong><small>Brut ce mois</small></div></div>`,
  );
  $("rentCards").innerHTML = [
    ["Salaire disponible", c.salary, "Retrait maximal indicatif", "positive"],
    ["Capital à préserver", c.target, "Inflation + marge", ""],
    [
      "Déficit à compenser",
      c.deficit,
      "Apport éventuel",
      c.deficit ? "negative" : "",
    ],
  ]
    .map(
      ([n, v, t, cl]) =>
        `<div class="rentCard"><small>${n}</small><strong class="${cl}">${eur(v)}</strong><small>${t}</small></div>`,
    )
    .join("");
  $("preserveRows").innerHTML =
    row("Capital de référence", eur(r.reference > 0 ? r.reference : null)) +
    row("Capital cible", eur(c.target)) +
    row("Patrimoine avec revenus", eur(c.wealth)) +
    row(
      "Excédent / déficit",
      `<span class="${c.gap >= 0 ? "positive" : "negative"}">${eur(c.gap)}</span>`,
    );
  $("incomeList").innerHTML =
    row("ETF distribuants", eur(r.etf)) +
    row("SCPI / loyers", eur(r.scpi)) +
    row("Autres revenus", eur(r.other)) +
    row("Impôts et frais", eur(-r.tax)) +
    row("Total net", `<span class="positive">${eur(c.income)}</span>`);
  $("simRows").innerHTML =
    row("Inflation + marge", `${r.inflation + r.margin} % / an`) +
    row("Réserve de rente antérieure", eur(r.reserve)) +
    row("Salaire souhaité", eur(r.wanted)) +
    row("Salaire disponible", eur(c.salary)) +
    row("Écart au salaire souhaité", eur(c.salary - r.wanted));
  const total = sum(data.assets, "value");
  $("legend").innerHTML =
    '<div class="allocHead">Actif <span>Réel / cible</span></div>' +
    types
      .map((t, i) => {
        const v = total
          ? (sum(
              data.assets.filter((a) => a.type === t),
              "value",
            ) /
              total) *
            100
          : 0;
        return `<div class="legend-row"><span><i class="dot" style="background:${colors[i]}"></i>${t}</span><b>${v.toFixed(1)} / ${r.targets[t] ?? 0} %</b></div>`;
      })
      .join("");
  $("detailBody").innerHTML =
    $("etfTable").innerHTML + $("assetTable").innerHTML;
};
$("details").onclick = () => $("detailDialog").showModal();
document.querySelectorAll('nav a[href="#etf"],nav a[href="#assets"]').forEach(
  (a) =>
    (a.onclick = (e) => {
      e.preventDefault();
      $("details").click();
    }),
);
const rentEdit = $("edit").onclick;
$("edit").onclick = () => {
  rentEdit();
  const labels = {
    reference: "Capital de départ (€)",
    months: "Mois écoulés depuis le départ",
    inflation: "Inflation annuelle (%)",
    margin: "Marge annuelle supplémentaire (%)",
    flows: "Apports externes cumulés revalorisés (€)",
    etf: "Dividendes ETF encaissés ce mois (€)",
    scpi: "SCPI / loyers encaissés ce mois (€)",
    other: "Autres revenus encaissés (€)",
    tax: "Impôts et frais non déjà déduits (€)",
    reserve: "Réserve de rente antérieure disponible (€)",
    wanted: "Salaire mensuel souhaité (€)",
  };
  $("fields").insertAdjacentHTML(
    "beforeend",
    `<div class="editgroup"><h3>Ma rente patrimoniale</h3><p>Indiquer les revenus bruts encaissés. La réserve antérieure exclut les revenus du mois. Les apports sont hors revenus réinvestis.</p>${Object.entries(
      labels,
    )
      .map(
        ([k, l]) =>
          `<label>${l}<input id="rent_${k}" type="number" step="any" min="${k === "inflation" ? -99 : k === "flows" ? -1e12 : 0}" placeholder="À renseigner" value="${data.rent[k] ?? ""}"></label>`,
      )
      .join(
        "",
      )}<label><input id="rent_included" type="checkbox" ${data.rent.included ? "checked" : ""}> Le patrimoine net saisi inclut déjà les revenus nets du mois et la réserve de rente</label><h3>Allocation cible (%)</h3>${types.map((t, i) => `<label>${t}<input id="target_${i}" type="number" min="0" max="100" step="any" placeholder="À renseigner" value="${data.rent.targets[t] ?? ""}"></label>`).join("")}</div>`,
  );
};
const rentSubmit = $("editForm").onsubmit;
$("editForm").onsubmit = (e) => {
  e.preventDefault();
  const targets = Object.fromEntries(
    types.map((t, i) => [t, readNumber($("target_" + i))]),
  );
  if (
    Object.values(targets).some((v) => v !== null) &&
    Math.abs(Object.values(targets).reduce((a, b) => a + b, 0) - 100) > 0.001
  ) {
    alert("Les allocations cibles doivent totaliser 100 %.");
    return;
  }
  for (const k of Object.keys(rentDefaults)) {
    if (k === "targets") data.rent.targets = targets;
    else if (k === "included") data.rent.included = $("rent_included").checked;
    else data.rent[k] = readNumber($("rent_" + k));
  }
  rentSubmit(e);
};
render();

const blankRender = render;
render = function () {
  blankRender();
  const r = data.rent,
    has = data.assets.length > 0,
    ready =
      has &&
      data.debt !== null &&
      r.reference > 0 &&
      [
        "reference",
        "months",
        "inflation",
        "margin",
        "flows",
        "etf",
        "scpi",
        "other",
        "tax",
        "reserve",
      ].every((k) => r[k] !== null),
    d = "—";
  if (!has) {
    document
      .querySelectorAll("#kpis .kpi strong")
      .forEach((e) => (e.textContent = d));
    $("donut").querySelector(".ring div").innerHTML =
      "—<small>Actifs bruts</small>";
    $("etfTotal").textContent = d;
    $("detailBody").textContent = "Aucun actif renseigné.";
  }
  if (data.debt === null)
    document.querySelector("#kpis .kpi strong").textContent = d;
  document.querySelector("#kpis .kpi:last-child strong").textContent = [
    "etf",
    "scpi",
    "other",
  ].every((k) => r[k] !== null)
    ? eur(r.etf + r.scpi + r.other)
    : d;
  if (!ready) {
    document
      .querySelectorAll("#rentCards strong")
      .forEach((e) => (e.textContent = d));
    $("preserveRows").innerHTML =
      row("Capital de référence", eur(r.reference > 0 ? r.reference : null)) +
      row("Capital cible", d) +
      row("Patrimoine avec revenus", d) +
      row("Excédent / déficit", d);
    $("simRows").innerHTML =
      row(
        "Inflation + marge",
        r.inflation === null || r.margin === null
          ? d
          : r.inflation + r.margin + " % / an",
      ) +
      row("Réserve de rente", eur(r.reserve)) +
      row("Salaire souhaité", eur(r.wanted)) +
      row("Salaire disponible", d) +
      row("Écart au salaire souhaité", d);
  }
  if (r.wanted === null)
    $("simRows").lastElementChild.querySelector("b").textContent = d;
  $("incomeList").innerHTML =
    row("ETF distribuants", eur(r.etf)) +
    row("SCPI / loyers", eur(r.scpi)) +
    row("Autres revenus", eur(r.other)) +
    row("Impôts et frais", eur(r.tax === null ? null : -r.tax)) +
    row(
      "Total net",
      ["etf", "scpi", "other", "tax"].every((k) => r[k] !== null)
        ? eur(r.etf + r.scpi + r.other - r.tax)
        : d,
    );
  $("legend").innerHTML =
    '<div class="allocHead">Actif <span>Réel / cible</span></div>' +
    types
      .map((t, i) => {
        const total = sum(data.assets, "value");
        return `<div class="legend-row"><span><i class="dot" style="background:${colors[i]}"></i>${t}</span><b>${
          total
            ? (
                (sum(
                  data.assets.filter((a) => a.type === t),
                  "value",
                ) /
                  total) *
                100
              ).toFixed(1) + " %"
            : d
        } / ${r.targets[t] === null ? d : r.targets[t] + " %"}</b></div>`;
      })
      .join("");
  $("goalList").innerHTML =
    data.goal > 0 && has
      ? `<div class="goal">Objectif patrimoine : ${eur(data.goal)}<progress max="100" value="${Math.max(0, Math.min(100, ((sum(data.assets, "value") - (data.debt || 0)) / data.goal) * 100))}"></progress></div>`
      : "Objectif à renseigner dans Paramètres.";
  if (!data.tasks.length) {
    $("taskList").innerHTML =
      '<button id="startEntry">Renseigner mes données</button>';
    $("startEntry").onclick = () => $("edit").click();
  }
};
render();

// V8 : structure visuelle permanente, données réelles uniquement.
const pictos = {
  wallet: '<path d="M20 8V5L5 8m-2 2V7l14-5 3 5M3 9h18v12H3zM21 13h-6v4h6"/>',
  shield: '<path d="M12 2 21 6v7c0 4-4 7-9 9-5-2-9-5-9-9V6z"/>',
  target:
    '<circle cx="11" cy="13" r="9"/><circle cx="11" cy="13" r="5"/><path d="m11 13 10-10m-5 0h5v5"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h10v4H7zM8 14h1m6 0h1m-8 4h1m6 0h1"/>',
  coins: icons.Liquidités,
  bars: '<path d="M3 21V13h4v8zm7 0V8h4v13zm7 0V3h4v18z" fill="currentColor" stroke="none"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
};
const pic = (name, color = "") =>
  `<svg class="ui-icon" style="${color ? "color:" + color : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pictos[name]}</svg>`;
for (const [sel, name, color] of [
  ["#rent h2", "wallet", "#42dda0"],
  ["#preserve h2", "shield", ""],
  ["#simulation h2", "calc", ""],
  ["#allocation h2", "bars", ""],
  ['nav a[href="#rent"]', "wallet", ""],
  ['nav a[href="#simulation"]', "calc", ""],
  ["#details", "bars", ""],
  ["#export", "wallet", ""],
])
  document
    .querySelector(sel)
    .insertAdjacentHTML("afterbegin", pic(name, color));
const v8Render = render;
render = function () {
  v8Render();
  const r = data.rent,
    total = sum(data.assets, "value"),
    net = total - (data.debt ?? 0),
    d = "—";
  const cards = $("rentCards").children;
  ["coins", "shield", "target"].forEach((p, i) =>
    cards[i].firstElementChild.insertAdjacentHTML(
      "afterbegin",
      pic(p, ["#42dda0", "#488fff", "#ff8585"][i]),
    ),
  );
  $("legend").innerHTML =
    '<div class="allocHead"><span>Actif</span><span>Réel</span><span>Cible</span><span>Écart</span></div>' +
    types
      .map((t, i) => {
        const actual =
            total > 0
              ? (sum(
                  data.assets.filter((a) => a.type === t),
                  "value",
                ) /
                  total) *
                100
              : null,
          target = r.targets[t],
          delta = actual !== null && target != null ? actual - target : null;
        return `<div class="legend-row"><span><i class="dot" style="background:${colors[i]}"></i>${t}</span><span>${actual === null ? d : actual.toFixed(actual > 0 && actual < 1 ? 2 : 1) + " %"}</span><span>${target == null ? d : target + " %"}</span><span>${delta === null ? d : (delta > 0 ? "+" : "") + delta.toFixed(Math.abs(delta) > 0 && Math.abs(delta) < 1 ? 2 : 1)}</span></div>`;
      })
      .join("");
  const annual = data.income.every((x) => x.value != null)
    ? sum(data.income, "value")
    : null;
  const goals = [
    [
      "Objectif de patrimoine",
      data.goal,
      data.assets.length && data.debt !== null ? net : null,
    ],
    ["Objectif de PEA", data.peaGoal, data.pea],
    ["Objectif de revenus annuels", data.incomeGoal, annual],
  ];
  $("goalList").innerHTML = goals
    .map(([n, t, v]) => {
      const p = t > 0 && v != null ? (v / t) * 100 : null;
      return `<div class="goal"><div class="goal-label"><span class="goal-check ${p >= 100 ? "checked" : ""}">${p >= 100 ? pic("check") : ""}</span>${n}${t > 0 ? " · " + eur(t) : ""}</div><div class="goalbar"><progress max="100" value="${p === null ? 0 : Math.max(0, Math.min(100, p))}"></progress><small>${p === null ? d : Math.floor(p) + " %"}</small></div></div>`;
    })
    .join("");
  if (!data.tasks.length) {
    $("taskList").innerHTML = [
      "Renseigner mes données",
      "Actualiser les revenus du mois",
      "Vérifier la répartition des actifs",
      "Contrôler le capital à préserver",
    ]
      .map(
        (t, i) =>
          `<label class="task"><input type="checkbox" data-default-task="${i}" ${data.checklist?.[i] ? "checked" : ""}><span>${t}</span></label>`,
      )
      .join("");
    $("taskList")
      .querySelectorAll("input")
      .forEach(
        (e) =>
          (e.onchange = () => {
            data.checklist ??= {};
            data.checklist[e.dataset.defaultTask] = e.checked;
            save();
          }),
      );
  }
  const h = data.history.slice(-12),
    now = new Date(),
    months = Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat("fr-FR", { month: "short" })
        .format(new Date(now.getFullYear(), now.getMonth() - 11 + i, 1))
        .replace(".", ""),
    );
  const min = h.length ? Math.min(...h) : 0,
    max = h.length ? Math.max(...h) : 0,
    step = h.length
      ? Math.pow(10, Math.floor(Math.log10(Math.max(1, (max - min) / 4))))
      : 1;
  const lo = h.length ? Math.floor(min / step) * step - step : 0,
    hi = h.length
      ? Math.max(lo + 4 * step, Math.ceil(max / step) * step + step)
      : 4;
  const X = (i) => 47 + (i * 325) / 11,
    Y = (v) => 145 - ((v - lo) * 120) / (hi - lo);
  let grid = Array.from({ length: 5 }, (_, i) => {
    const y = 145 - i * 30,
      v = lo + ((hi - lo) * i) / 4;
    return `<path d="M47 ${y}H372" stroke="#293442"/><text x="41" y="${y + 3}" text-anchor="end">${h.length ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v / 1000) + " k€" : "—"}</text>`;
  }).join("");
  const pts = h.map((v, i) => [X(12 - h.length + i), Y(v)]),
    path = pts.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" "),
    last = pts.at(-1);
  $("chart").innerHTML =
    `<svg viewBox="0 0 390 170" role="img" aria-label="Historique mensuel du patrimoine en euros"><defs><linearGradient id="v8fill" x2="0" y2="1"><stop stop-color="#42dda0" stop-opacity=".32"/><stop offset="1" stop-color="#42dda0" stop-opacity=".01"/></linearGradient></defs><g fill="#c8d0db" font-size="10">${grid}<path d="M47 25V145H372" stroke="#59616d" fill="none"/>${months.map((m, i) => `<text x="${X(i)}" y="160" text-anchor="middle">${m}</text>`).join("")}<text x="5" y="14">k€</text></g>${last ? `<path d="${path} L${last[0]} 145 L${pts[0][0]} 145Z" fill="url(#v8fill)"/><path d="${path}" fill="none" stroke="#42dda0" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="#42dda0"/>` : '<text x="210" y="85" text-anchor="middle" fill="#9daec3" font-size="11">Historique à renseigner</text>'}</svg>`;
  if (!h.length)
    document.querySelector("#history h2").textContent =
      "Évolution du patrimoine";
};
const v8Edit = $("edit").onclick;
$("edit").onclick = () => {
  v8Edit();
  $("fields").insertAdjacentHTML(
    "beforeend",
    `<div class="editgroup"><h3>Objectifs complémentaires</h3><label>Objectif PEA (€)<input id="peaGoal" type="number" min="1" value="${data.peaGoal ?? ""}"></label><label>Objectif de revenus annuels (€)<input id="incomeGoal" type="number" min="1" value="${data.incomeGoal ?? ""}"></label></div>`,
  );
};
const v8Submit = $("editForm").onsubmit;
$("editForm").onsubmit = (e) => {
  data.peaGoal = readNumber($("peaGoal"));
  data.incomeGoal = readNumber($("incomeGoal"));
  v8Submit(e);
};
render();

// V9 : finition visuelle et état de la rente.
const v9Render = render;
render = function () {
  v9Render();
  const r = data.rent,
    ready =
      data.assets.length > 0 &&
      data.debt != null &&
      r.reference > 0 &&
      [
        "reference",
        "months",
        "inflation",
        "margin",
        "flows",
        "etf",
        "scpi",
        "other",
        "tax",
        "reserve",
      ].every((k) => r[k] != null);
  const c = ready ? rentCalc(r, sum(data.assets, "value") - data.debt) : null;
  const state = !c
    ? "empty"
    : c.gap < 0
      ? "deficit"
      : c.salary < c.available || c.salary === 0
        ? "caution"
        : "surplus";
  $("rent").dataset.state = state;
  $("rentCards").children[0].lastElementChild.textContent = {
    empty: "À renseigner",
    deficit: "Capital sous la cible",
    caution: "Revenus à conserver en partie ou en totalité",
    surplus: "Retrait maximal indicatif",
  }[state];
  if (!(r.reference > 0))
    $("preserveRows").firstElementChild.querySelector("b").textContent = "—";
  const rows = $("incomeList").children;
  const symbols = [
    ["bars", "#488fff"],
    ["shield", "#ffc13c"],
    ["wallet", "#b77cff"],
    ["calc", "#aab9ca"],
  ];
  symbols.forEach(([p, col], i) => {
    if (rows[i])
      rows[i].firstElementChild.insertAdjacentHTML("afterbegin", pic(p, col));
  });
  if (rows.length) rows[rows.length - 1].classList.add("net-income");
  const k = document.querySelector(".kpi:last-child .kpi-icon");
  if (k) k.innerHTML = pic("coins", "#b77cff");
  const svg = $("chart").querySelector("svg");
  if (svg) {
    svg.setAttribute("preserveAspectRatio", "none");
    svg
      .querySelectorAll("text")
      .forEach((t) => t.setAttribute("font-size", "10"));
  }
};
render();
// V10 : stratégie et historique des deux séries, sans inventer les cibles passées.
pictos.house = icons.Immobilier;
pictos.pyramid = '<path d="M12 2 23 22H1zM5 15h14M8 9h8"/>';
const strategy = document.createElement("dialog");
strategy.id = "strategyDialog";
strategy.innerHTML =
  '<h2>Ma stratégie patrimoniale</h2><div class="strategy-layout"><svg class="strategy-pyramid" viewBox="0 0 720 620" role="img" aria-label="Pyramide patrimoniale : 5 % actifs alternatifs, 5 % crypto, 80 % immobilier et bourse, 10 % sécurité"><defs><clipPath id="strategyTriangle"><path d="M360 10 L710 610 H10 Z"/></clipPath></defs><g clip-path="url(#strategyTriangle)"><rect width="720" height="198" fill="#24503f"/><rect y="198" width="720" height="116" fill="#33796b"/><rect y="314" width="720" height="174" fill="#bad9cb"/><rect y="488" width="720" height="132" fill="#e9ddbc"/><path d="M0 198H720 M0 314H720 M0 488H720" stroke="#f0f5f3" stroke-width="2.5"/></g><path d="M360 10 L710 610 H10 Z" fill="none" stroke="#f0f5f3" stroke-width="2.5"/><g text-anchor="middle" font-family="system-ui,sans-serif" fill="#fff"><text x="360" y="103" font-size="26" font-weight="700">5 %</text><text x="360" y="128" font-size="18" font-weight="600">Actifs</text><text x="360" y="150" font-size="18" font-weight="600">alternatifs</text><text x="360" y="178" font-size="14">Or · Argent · Private equity</text><text x="360" y="233" font-size="28" font-weight="700">5 %</text><text x="360" y="264" font-size="22" font-weight="600">Crypto</text><text x="360" y="289" font-size="16">BTC · ETH</text></g><g text-anchor="middle" font-family="system-ui,sans-serif" fill="#173b30"><text x="360" y="354" font-size="32" font-weight="700">80 %</text><path d="M360 370 V464" stroke="#789f90"/><text x="250" y="397" font-size="23" font-weight="700">Immobilier</text><text x="250" y="423" font-size="16">Résidence principale</text><text x="250" y="446" font-size="16">Locatif · SCPI</text><text x="470" y="397" font-size="23" font-weight="700">Bourse</text><text x="470" y="423" font-size="16">ETF · Actions</text><text x="470" y="446" font-size="16">PEA · CTO · AV</text><text x="360" y="530" font-size="32" font-weight="700">10 %</text><text x="360" y="562" font-size="24" font-weight="700">Matelas de sécurité</text><text x="360" y="588" font-size="17">Livret A · LDDS · LEP</text></g></svg></div><button onclick="this.closest(\'dialog\').close()">Fermer</button>';
document.body.append(strategy);
const link = document.createElement("a");
link.href = "#strategie";
link.innerHTML = pic("pyramid") + " Ma stratégie";
link.onclick = (e) => {
  e.preventDefault();
  strategy.showModal();
};
document.querySelector("nav").children[0].after(link);
const edit10 = $("edit").onclick;
$("edit").onclick = () => {
  edit10();
  $("fields").insertAdjacentHTML(
    "beforeend",
    `<div class="editgroup"><h3>Historique du capital à préserver</h3><small>Valeurs mensuelles en euros, de la plus ancienne à la plus récente, séparées par des points-virgules. Laisser vide si inconnu.</small><input id="targetHistory" value="${esc((data.targetHistory || []).join("; "))}"></div>`,
  );
};
const submit10 = $("editForm").onsubmit;
$("editForm").onsubmit = (e) => {
  e.preventDefault();
  const s = $("targetHistory").value.trim(),
    h = s
      ? s
          .split(";")
          .map((x) => (x.trim() ? Number(x.trim().replace(",", ".")) : NaN))
      : [];
  if (h.some((x) => !Number.isFinite(x) || x < 0)) {
    alert("Historique du capital cible invalide.");
    return;
  }
  data.targetHistory = h;
  submit10(e);
};
const render10 = render;
render = function () {
  render10();
  const r = data.rent,
    ready =
      data.assets.length > 0 &&
      data.debt != null &&
      r.reference > 0 &&
      [
        "reference",
        "months",
        "inflation",
        "margin",
        "flows",
        "etf",
        "scpi",
        "other",
        "tax",
        "reserve",
      ].every((k) => r[k] != null),
    c = ready ? rentCalc(r, sum(data.assets, "value") - data.debt) : null;
  const cards = $("rentCards");
  cards.children[2].insertAdjacentHTML(
    "beforebegin",
    `<div class="rentCard"><small>${pic("coins", "#ffbd55")} Revenus à réinvestir</small><strong style="color:#ffbd55">${eur(c ? Math.max(0, c.income - c.salary) : null)}</strong><small>Revenus du mois conservés</small></div>`,
  );
  if (!(r.reference > 0))
    $("preserveRows").firstElementChild.querySelector("b").textContent = "—";
  const sc = $("incomeList").children[1]?.querySelector("svg");
  if (sc) sc.outerHTML = pic("house", "#ffc13c");
  const el = $("chart"),
    a = data.history.slice(-12),
    b = (data.targetHistory || []).slice(-12);
  function draw() {
    const w = Math.max(300, el.clientWidth),
      h = Math.max(90, el.clientHeight),
      left = 56,
      right = w - 12,
      top = 12,
      bottom = h - 23,
      vals = [...a, ...b],
      min = vals.length ? Math.min(...vals) : 0,
      max = vals.length ? Math.max(...vals) : 4,
      step = vals.length
        ? 10 ** Math.floor(Math.log10(Math.max(1, (max - min) / 4)))
        : 1,
      lo = vals.length ? Math.floor(min / step) * step - step : 0,
      hi = vals.length
        ? Math.max(lo + 4 * step, Math.ceil(max / step) * step + step)
        : 4,
      X = (i) => left + (i * (right - left)) / 11,
      Y = (v) => bottom - ((v - lo) * (bottom - top)) / (hi - lo),
      now = new Date();
    const series = (v, color, dash = "") => {
      const p = v.map((n, i) => [X(12 - v.length + i), Y(n)]),
        d = p.map((q, i) => (i ? "L" : "M") + q.join(" ")).join(" ");
      return p.length
        ? `${!dash && p.length > 1 ? `<path d="${d} L${p.at(-1)[0]} ${bottom} L${p[0][0]} ${bottom}Z" fill="url(#fill10)"/>` : ""}<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ""}/><circle cx="${p.at(-1)[0]}" cy="${p.at(-1)[1]}" r="3" fill="${color}"/>`
        : "";
    };
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Patrimoine réel et capital cible"><defs><linearGradient id="fill10" x2="0" y2="1"><stop stop-color="#42dda0" stop-opacity=".3"/><stop offset="1" stop-color="#42dda0" stop-opacity="0"/></linearGradient></defs><g font-size="11" fill="#b9c6d5">${Array.from(
      { length: 5 },
      (_, i) => {
        const v = lo + ((hi - lo) * i) / 4,
          y = Y(v);
        return `<path d="M${left} ${y}H${right}" stroke="#293442"/><text x="${left - 5}" y="${y + 4}" text-anchor="end">${vals.length ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v / 1000) + " k€" : "—"}</text>`;
      },
    ).join(
      "",
    )}<path d="M${left} ${top}V${bottom}H${right}" fill="none" stroke="#59616d"/>${Array.from({ length: 12 }, (_, i) => `<text x="${X(i)}" y="${h - 5}" text-anchor="middle">${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)).replace(".", "")}</text>`).join("")}</g>${series(a, "#42dda0")}${series(b, "#488fff", "dash")}${!vals.length ? `<text x="${(left + right) / 2}" y="${(top + bottom) / 2}" text-anchor="middle" fill="#9daec3" font-size="12">Historique à renseigner</text>` : ""}</svg>`;
  }
  draw();
};
render();
window.addEventListener("resize", () => render());
