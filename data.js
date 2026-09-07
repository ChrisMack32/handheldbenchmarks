export function parseData(rows) {
  if (!rows || rows.length < 2) throw new Error("Not enough rows in CSV.");
  const header = rows[0].map((h) => h.trim());

  // ── Find Time Spy Average column in main header row 0 ─────────────────────
  let avgCol = -1;
  for (let c = 0; c < header.length; c++) {
    const h = header[c].toLowerCase();
    if (h.includes("time spy") && h.includes("average")) {
      avgCol = c;
      break;
    }
  }
  if (avgCol === -1) {
    for (let c = 0; c < header.length; c++) {
      if (header[c].toLowerCase().includes("time spy")) {
        avgCol = c;
        break;
      }
    }
  }

  // ── Parse Time Spy entries ─────────────────────────────────────────────────
  // Read all device rows until we hit a GAME: row or PC Game Anecdotal marker.
  // Track which devices appear under "NOT REALLY HANDHELDS" so we can deselect them by default.
  const timespy = [];
  const notReallyHandhelds = new Set();
  let inNotReally = false;
  if (avgCol !== -1) {
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const label = (row[0] || "").trim();
      if (!label) continue;
      if (label.toUpperCase().startsWith("GAME:")) break;
      if (
        label.toLowerCase().includes("pc game anecdotal") ||
        label.toLowerCase().includes("no frame gen")
      )
        break;
      if (label.toLowerCase().includes("not really")) {
        inNotReally = true; // everything after this is "not really a handheld"
        continue;
      }
      const score = parseFloat((row[avgCol] || "").replace(/,/g, "").trim());
      if (!isNaN(score) && score > 0) {
        timespy.push({ name: label, score });
        if (inNotReally) notReallyHandhelds.add(label);
      }
    }
    timespy.sort((a, b) => b.score - a.score);
  }

  // ── Parse GAME sections ────────────────────────────────────────────────────
  // The GAME: row itself contains the column headers for that game:
  //   col 0 = "GAME: Marvel Rivals (practice range)"
  //   col 1 = "OS"            (header for OS column)
  //   col 2 = "Resolution"    (header for resolution column — we skip its values)
  //   col 3 = "Highsest Avg"  (first FPS metric)
  //   col 4 = "Lowest"        (second FPS metric)
  //   col 5 = "Performance Test" (third FPS metric, if present)
  //
  // Device rows immediately follow:
  //   col 0 = "Steam Deck OLED"
  //   col 1 = "SteamOS"
  //   col 2 = "1280x800p (FSR, Performance)"
  //   col 3 = 33
  //   col 4 = 19
  const games = Object.create(null);
  let currentGame = null;
  let gameMetricCols = []; // [{name, col}] — set fresh for each GAME: row

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const label = (row[0] || "").trim();
    if (!label) continue;

    if (label.toUpperCase().startsWith("GAME:")) {
      // Extract game name
      currentGame = label.replace(/^GAME:\s*/i, "").trim();

      // Read metric column names from THIS row (cols after Resolution col)
      // Find "Resolution" in this row first
      gameMetricCols = [];
      let resColInGame = -1;
      for (let c = 1; c < row.length; c++) {
        if ((row[c] || "").trim().toLowerCase().includes("resolution")) {
          resColInGame = c;
          break;
        }
      }
      if (resColInGame !== -1) {
        // Metric cols are everything to the right of Resolution in this GAME: row
        for (let c = resColInGame + 1; c < row.length; c++) {
          const name = (row[c] || "").trim();
          if (name) gameMetricCols.push({ name, col: c });
        }
      } else {
        // No Resolution col found — grab cols 3+ as metrics (skip Device=0, OS=1, Resolution=2)
        for (let c = 3; c < row.length; c++) {
          const name = (row[c] || "").trim();
          if (name) gameMetricCols.push({ name, col: c });
        }
      }

      const metricCounts = new Map();
      gameMetricCols = gameMetricCols.map((metric) => {
        const count = (metricCounts.get(metric.name) || 0) + 1;
        metricCounts.set(metric.name, count);
        return {
          ...metric,
          name: count === 1 ? metric.name : `${metric.name} (${count})`,
        };
      });
      games[currentGame] = {
        metrics: gameMetricCols.map((m) => m.name),
        devices: Object.create(null),
        conditions: Object.create(null),
      };
      continue;
    }

    if (currentGame) {
      // Skip non-device label rows
      if (
        label.toLowerCase().includes("not really") ||
        label.toLowerCase().includes("pc game") ||
        label.toLowerCase().includes("no frame gen")
      )
        continue;

      // Device row — col 0 = name, col 1 = OS
      const baseName = label;
      const os = (row[1] || "").trim();
      const deviceName = os ? `${baseName} (${os})` : baseName;

      games[currentGame].conditions[deviceName] = (row[2] || "").trim();
      gameMetricCols.forEach(({ name, col }) => {
        const raw = (row[col] || "").replace(/,/g, "").trim();
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0) {
          if (!games[currentGame].devices[deviceName])
            games[currentGame].devices[deviceName] = Object.create(null);
          games[currentGame].devices[deviceName][name] = val;
        }
      });
    }
  }

  for (const [name, game] of Object.entries(games)) {
    game.metrics = game.metrics.filter((metric) =>
      Object.values(game.devices).some((values) =>
        Number.isFinite(values[metric]),
      ),
    );
    if (!game.metrics.length) delete games[name];
  }
  if (!timespy.length && !Object.keys(games).length)
    throw new Error("No benchmark data found in the published sheet.");
  return { timespy, games, notReallyHandhelds };
}

// Handles escaped quotes and line breaks inside quoted cells (RFC 4180).
export function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted)
    throw new Error("The source contains an unfinished quoted CSV field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function fetchCSV(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new Error(`Source returned HTTP ${response.status}.`);
    const text = await response.text();
    if (!text.trim() || text.trim().startsWith("<"))
      throw new Error("The source did not return CSV data.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
