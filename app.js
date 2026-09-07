import { parseCSV, parseData, fetchCSV } from "./data.js";
const BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQBAd926glCKt96V0vcwLhk2MX9y-skPq3v2kO0HvBKXeP6Oxgbwv94rNSKcrGYGl11oSpQ5NmrqPbY/pub";
const gids = { windows: "0", android: "1032283982" };
const states = Object.fromEntries(
  Object.keys(gids).map((p) => [
    p,
    {
      data: null,
      loading: true,
      error: "",
      dataset: "__timespy__",
      metric: "",
      selections: new Map(),
      stars: new Set(),
      query: "",
    },
  ]),
);
let platform = "windows";
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const format = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const current = () => states[platform];
function entries(s = current()) {
  if (!s.data) return [];
  if (s.dataset === "__timespy__") return s.data.timespy;
  const game = s.data.games[s.dataset];
  return Object.entries(game.devices).map(([name, metrics]) => ({
    name,
    score: metrics[s.metric],
    condition: game.conditions[name],
  }));
}
function selection(s = current()) {
  if (!s.selections.has(s.dataset))
    s.selections.set(
      s.dataset,
      new Set(
        entries(s)
          .filter(
            (d) =>
              s.dataset !== "__timespy__" ||
              !s.data.notReallyHandhelds.has(d.name),
          )
          .map((d) => d.name),
      ),
    );
  return s.selections.get(s.dataset);
}
function visible() {
  return entries()
    .filter((d) => selection().has(d.name) && Number.isFinite(d.score))
    .sort(
      $("sort").value === "name"
        ? (a, b) => a.name.localeCompare(b.name)
        : (a, b) => b.score - a.score,
    );
}
function renderDevices() {
  const s = current(),
    list = entries(),
    selected = selection();
  $("device-count").textContent =
    `${list.filter((d) => selected.has(d.name)).length}/${list.length}`;
  const matches = list
    .filter((d) => d.name.toLowerCase().includes(s.query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  $("devices").innerHTML =
    matches
      .map(
        (d, i) =>
          `<div class="device"><label><input type="checkbox" data-index="${i}" ${selected.has(d.name) ? "checked" : ""}><span>${esc(d.name)}</span></label><button class="star" data-index="${i}" aria-label="Highlight ${esc(d.name)}" aria-pressed="${s.stars.has(d.name)}">${s.stars.has(d.name) ? "★" : "☆"}</button></div>`,
      )
      .join("") || '<p class="filter-help">No devices match your search.</p>';
  $("devices")
    .querySelectorAll("input")
    .forEach((el) =>
      el.addEventListener("change", () => {
        const name = matches[el.dataset.index].name;
        el.checked ? selected.add(name) : selected.delete(name);
        $("device-count").textContent =
          `${list.filter((d) => selected.has(d.name)).length}/${list.length}`;
        renderChart();
      }),
    );
  $("devices")
    .querySelectorAll("button")
    .forEach((el) =>
      el.addEventListener("click", () => {
        const name = matches[el.dataset.index].name;
        s.stars.has(name)
          ? s.stars.delete(name)
          : (s.stars.add(name), selected.add(name));
        renderDevices();
        renderChart();
        const replacement = $("devices").querySelector(
          `button[data-index="${el.dataset.index}"]`,
        );
        replacement?.focus();
      }),
    );
}
function renderChart() {
  const s = current(),
    rows = visible(),
    best = [...rows].sort((a, b) => b.score - a.score)[0];
  const isGame = s.dataset !== "__timespy__",
    title = isGame ? s.dataset : "Time Spy Average";
  $("stat-count").textContent = rows.length;
  $("stat-score").textContent = best ? format(best.score) : "—";
  $("stat-leader").textContent = best?.name || "No devices selected";
  $("stat-type").textContent = isGame ? "Game performance" : "Time Spy";
  $("stat-unit").textContent = isGame ? s.metric : "Average benchmark score";
  $("chart-title").textContent = title;
  $("chart-subtitle").textContent =
    `${isGame ? s.metric : "Average score"} · Higher is better · ${$("sort").value === "name" ? "Alphabetical order" : "Ranked high to low"}`;
  $("result-count").textContent =
    `${rows.length} of ${entries().length} devices with selected results`;
  $("export").disabled = !rows.length;
  const anyStar = rows.some((d) => s.stars.has(d.name));
  const ranks = new Map(
    [...rows].sort((a, b) => b.score - a.score).map((d, i) => [d.name, i + 1]),
  );
  $("chart").className = rows.length ? "chart" : "";
  $("chart").innerHTML = rows.length
    ? rows
        .map(
          (d) =>
            `<div class="bar-row ${s.stars.has(d.name) ? "focused" : anyStar ? "muted" : ""}"><span class="rank">${String(ranks.get(d.name)).padStart(2, "0")}</span><div class="bar-label">${s.stars.has(d.name) ? "★ " : ""}${esc(d.name)}${d.condition ? `<small>${esc(d.condition)}</small>` : ""}</div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${Math.max(0, (d.score / best.score) * 100)}%"></div></div><span class="bar-value">${format(d.score)}</span></div>`,
        )
        .join("")
    : '<div class="empty">No results in this comparison.<br>Select devices or choose another metric.<button id="restore">Select all devices</button></div>';
  $("restore")?.addEventListener("click", () => {
    entries().forEach((d) => selection().add(d.name));
    renderDevices();
    renderChart();
  });
}
function render() {
  const s = current();
  document.body.dataset.platform = platform;
  document.querySelectorAll("[data-platform]").forEach((el) => {
    if (el.tagName === "BUTTON")
      el.setAttribute("aria-pressed", String(el.dataset.platform === platform));
  });
  $("legend").textContent =
    `${platform === "windows" ? "Windows" : "Android"} devices`;
  $("sheet-link").href = `${BASE}?gid=${gids[platform]}&single=true`;
  for (const id of ["dataset", "search", "reset", "all", "none", "sort"])
    $(id).disabled = !s.data;
  $("search").value = s.query;
  $("connection").textContent = s.loading
    ? "Connecting to Google Sheets…"
    : s.error
      ? "Source unavailable"
      : "Live source · loaded just now";
  if (!s.data) {
    $("dataset").innerHTML = "<option>Benchmark data unavailable</option>";
    $("metric-group").hidden = true;
    $("devices").innerHTML = "";
    $("device-count").textContent = "";
    ["stat-count", "stat-score", "stat-type"].forEach(
      (id) => ($(id).textContent = "—"),
    );
    $("stat-leader").textContent = s.loading
      ? "Waiting for data"
      : "Source unavailable";
    $("stat-unit").textContent = "Source-reported results";
    $("chart-title").textContent = "Performance ranking";
    $("chart-subtitle").textContent = s.loading
      ? "Loading the latest published results."
      : "The source could not be reached.";
    $("export").disabled = true;
    $("result-count").textContent = "No results loaded";
    $("chart").className = "";
    $("chart").innerHTML =
      `<div class="empty">${s.loading ? "Loading benchmark data…" : `Unable to load this platform.<br>${esc(s.error)}<button id="retry">Try again</button>`}</div>`;
    $("retry")?.addEventListener("click", () => load(platform));
    return;
  }
  const options = [
    ...(s.data.timespy.length ? [["__timespy__", "Time Spy Average"]] : []),
    ...Object.keys(s.data.games).map((g) => [g, g]),
  ];
  $("dataset").innerHTML = options
    .map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`)
    .join("");
  $("dataset").value = s.dataset;
  const metrics = s.data.games[s.dataset]?.metrics || [];
  $("metric-group").hidden = !metrics.length;
  $("metric").innerHTML = metrics
    .map((m) => `<option>${esc(m)}</option>`)
    .join("");
  $("metric").value = s.metric;
  renderDevices();
  renderChart();
}
async function load(p) {
  const s = states[p];
  s.loading = true;
  s.error = "";
  if (p === platform) render();
  try {
    s.data = parseData(
      parseCSV(await fetchCSV(`${BASE}?gid=${gids[p]}&single=true&output=csv`)),
    );
    if (!s.data.timespy.length) s.dataset = Object.keys(s.data.games)[0];
    s.metric = s.data.games[s.dataset]?.metrics[0] || "";
  } catch (error) {
    s.error =
      error.name === "AbortError"
        ? "Google Sheets took too long to respond. Please retry."
        : "Check your connection and retry, or open the source spreadsheet below.";
  } finally {
    s.loading = false;
    if (p === platform) render();
  }
}
document.querySelectorAll("button[data-platform]").forEach((button) =>
  button.addEventListener("click", () => {
    platform = button.dataset.platform;
    render();
  }),
);
$("dataset").addEventListener("change", () => {
  const s = current();
  s.dataset = $("dataset").value;
  s.metric = s.data.games[s.dataset]?.metrics[0] || "";
  s.query = "";
  render();
});
$("metric").addEventListener("change", () => {
  current().metric = $("metric").value;
  renderChart();
});
$("search").addEventListener("input", () => {
  current().query = $("search").value;
  renderDevices();
});
$("sort").addEventListener("change", () => {
  if (current().data) renderChart();
});
$("all").addEventListener("click", () => {
  entries().forEach((d) => selection().add(d.name));
  renderDevices();
  renderChart();
});
$("none").addEventListener("click", () => {
  selection().clear();
  renderDevices();
  renderChart();
});
$("reset").addEventListener("click", () => {
  const s = current();
  s.selections.delete(s.dataset);
  s.stars.clear();
  s.query = "";
  render();
});
$("export").addEventListener("click", () => {
  const s = current();
  // Neutralize spreadsheet formulas in source-provided strings.
  const cell = (value) =>
    `"${String(typeof value === "string" && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const records = [
    ["Device", "Score", "Benchmark", "Metric", "Configuration"],
    ...visible().map((d) => [
      d.name,
      d.score,
      s.dataset === "__timespy__" ? "Time Spy Average" : s.dataset,
      s.metric || "Average score",
      d.condition || "",
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + records.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `handheld-benchmarks-${platform}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
Promise.allSettled(Object.keys(gids).map(load));
