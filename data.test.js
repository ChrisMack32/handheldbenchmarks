import test from "node:test";
import assert from "node:assert/strict";
import { parseCSV, parseData, fetchCSV } from "./data.js";

test("CSV retains commas, escaped quotes, multiline fields, and empty columns", () => {
  assert.deepEqual(
    parseCSV(
      '\uFEFFDevice,Score,Notes\r\n"Ally, X","3,425","Says ""hello""\nnext line"\r\nDeck,1,\r\n',
    ),
    [
      ["Device", "Score", "Notes"],
      ["Ally, X", "3,425", 'Says "hello"\nnext line'],
      ["Deck", "1", ""],
    ],
  );
  assert.throws(() => parseCSV('a,"unfinished'), /unfinished/);
});
test("parser sorts benchmarks, tracks non-handhelds, and retains game configurations", () => {
  const data = parseData(
    parseCSV(
      'DEVICE,OS,Resolution,Time Spy Average\nDeck,,,2000\nAlly,,,"3,425"\nNOT REALLY HANDHELDS,,,\nDesktop,,,9000\nGAME: Example,OS,Resolution,Average FPS,Lowest FPS\nDeck,SteamOS,1280x800,44,21\nAlly,Windows,1920x1080,53,30',
    ),
  );
  assert.deepEqual(
    data.timespy.map((d) => d.score),
    [9000, 3425, 2000],
  );
  assert.ok(data.notReallyHandhelds.has("Desktop"));
  assert.equal(data.games.Example.devices["Deck (SteamOS)"]["Lowest FPS"], 21);
  assert.equal(data.games.Example.conditions["Ally (Windows)"], "1920x1080");
});
test("source-provided object keys do not alter prototypes", () => {
  const data = parseData(
    parseCSV(
      "Device,OS,Resolution\nGAME: __proto__,OS,Resolution,FPS\n__proto__,,720p,12",
    ),
  );
  assert.equal(data.games.__proto__.devices.__proto__.FPS, 12);
});
test("empty and HTML-like source data cannot become benchmark results", () => {
  assert.throws(() => parseData(parseCSV("<html>Error</html>")));
  assert.throws(() =>
    parseData([
      ["Device", "Score"],
      ["Unknown", ""],
    ]),
  );
});
test("fetch rejects unsuccessful and non-CSV responses", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(fetchCSV("https://example.test"), /503/);
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "<html>error</html>",
    });
    await assert.rejects(fetchCSV("https://example.test"), /CSV/);
  } finally {
    globalThis.fetch = original;
  }
});

test("duplicate metric labels retain distinct values and empty metrics are omitted", () => {
  const data = parseData(
    parseCSV(
      "Device,OS,Resolution\nGAME: Test,OS,Resolution,FPS,FPS,Notes\nDeck,Linux,720p,40,35,Text",
    ),
  );
  assert.deepEqual(data.games.Test.metrics, ["FPS", "FPS (2)"]);
  assert.equal(data.games.Test.devices["Deck (Linux)"]["FPS (2)"], 35);
});
