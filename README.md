# Handheld Benchmarks

A responsive performance explorer built from [bobwulff/handheldbenchmarks](https://github.com/bobwulff/handheldbenchmarks), using Wulff Den's published Google Sheets data. This is an independent fork; original testing and data credit remain with Wulff Den.

## What's improved

- Responsive dark dashboard with platform colors, summary cards, and readable ranked bars.
- Searchable device checkboxes and keyboard/touch-accessible star highlighting.
- Per-platform, per-benchmark selections retained while switching views (for the current page session).
- Game metric selection, score/alphabetical sorting, and CSV export of the current comparison.
- Source-reported game resolutions and settings displayed alongside results.
- Direct Google Sheets requests, parallel platform loading, a 15-second request timeout, and retryable error states.
- CSV parsing that handles quoted commas, escaped quotes, and multiline cells; source text is escaped before rendering and exports neutralize formula prefixes.
- Reduced-motion support, labeled controls, visible keyboard focus, and no continuous grain or full-screen blur effects.

## Run locally

Requires Python 3 to serve the site. Node.js 18+ is only needed for tests.

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. Serve over HTTP rather than opening the HTML file directly, because the JavaScript uses ES modules.

```sh
npm test
```

There are no runtime packages, build step, API keys, or third-party CORS proxies. Google Fonts is optional; system fonts are used if unavailable.

## Hosting

Serve `index.html`, `styles.css`, `app.js`, `data.js`, and `favicon.svg` together on any static host. For GitHub Pages, choose **Deploy from a branch**, select `main`, and use `/ (root)`. All asset paths are relative, so repository subpaths work.

## Data and interpretation

The source URLs are configured in `app.js`. Each platform loads independently on page load. The UI uses the source's “Time Spy Average” label and game metric names without independently validating the test methodology. The source data can change; there is no bundled or invented fallback dataset.

The parser reads the average-score header and `GAME:` sections. Devices beneath the source's “NOT REALLY HANDHELDS” separator remain available but are initially excluded from the average-score view. Game settings may differ across devices and are shown when provided. Missing metrics are omitted from the chart rather than treated as zero. Scores are displayed to one decimal place; CSV exports retain source numeric precision.

## Verification

`npm test` covers CSV edge cases, benchmark sorting, game configurations, reference-device defaults, unusual source keys, and failed/invalid fetch responses. The redesign was also checked in a browser with live data for device search, selection, highlighting, metrics, sorting, export, platform state, a mobile viewport, reduced motion, and recovery after simulated network failure.
