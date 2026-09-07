# Handheld Benchmarks

A responsive performance explorer built from [bobwulff/handheldbenchmarks](https://github.com/bobwulff/handheldbenchmarks), using Wulff Den's published Google Sheets data. This is an independent fork; original testing and data credit remain with Wulff Den.

## What's improved

- Responsive dark dashboard with Windows blue and Android green, a prominent current-leader spotlight, summary cards, and readable ranked bars.
- Interactive head-to-head comparison with device pickers, relative scores, and percentage differences. Click any chart result or use the dedicated comparison buttons.
- Top-five selection shortcut, leader badges (including ties), and percentages relative to the leading selected device.
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

Serve `index.html`, `styles.css`, `brand.css`, `motion.css`, `motion.js`, `music.css`, `music.js`, `app.js`, `data.js`, and the `assets/` directory together on any static host. For GitHub Pages, choose **Deploy from a branch**, select `main`, and use `/ (root)`. All asset paths are relative, so repository subpaths work.

## Data and interpretation

The source URLs are configured in `app.js`. Each platform loads independently on page load. The UI uses the source's “Time Spy Average” label and game metric names without independently validating the test methodology. The source data can change; there is no bundled or invented fallback dataset.

The parser reads the average-score header and `GAME:` sections. Devices beneath the source's “NOT REALLY HANDHELDS” separator remain available but are initially excluded from the average-score view. Game settings may differ across devices and are shown when provided. Missing metrics are omitted from the chart rather than treated as zero. Scores are displayed to one decimal place; CSV exports retain source numeric precision.

## Verification

`npm test` covers CSV edge cases, benchmark sorting, game configurations, reference-device defaults, unusual source keys, and failed/invalid fetch responses. The redesign was also checked in a browser with live data for device search, selection, highlighting, metrics, sorting, export, platform state, a mobile viewport, reduced motion, and recovery after simulated network failure.

## Brand references and assets

The community theme draws from Wulff Den's [YouTube channel](https://www.youtube.com/@WULFFDEN), [brand X profile](https://x.com/TheWulffDen), [Bob's X profile](https://x.com/BobWulff), and [website](https://www.thewulffden.com): cyan, the white wolf mark, grain/scanline texture, and bold typography. Cyan is the surrounding brand color; Windows blue and Android green remain platform indicators.

- `assets/wulffden-mark.png`: original mark from the official website's Squarespace asset, https://static1.squarespace.com/static/5b481be371069951dcf6e271/t/67350014f2517215e72c0cd0/1731526676143/logo_ICON2022_Artboard+5+copy+17.png?format=500w
- `assets/wulffden-channel-texture.jpg`: channel banner texture from the official YouTube channel, retrieved September 6, 2026. Source: https://yt3.googleusercontent.com/-p57WExE67j0-YM8OCW54BdgC0oMNA2sMnBlYxCBKGSfA4XnYzZJO31iIF4ku43_6He856k51A=w1138-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj

Original brand assets remain attributable to Wulff Den. This fork is labeled as an independent community edition and does not claim endorsement.

## Motion

Decorative hero drift and signal bars, one-time section entrances, and short dialog/hover transitions add restrained motion. The Pause motion control persists locally. System reduced-motion preferences disable animation; offscreen or backgrounded hero artwork pauses automatically. Results enter as they scroll into view, with a brief bar reveal. Leader accents, comparison cards, and the footer have ambient motion; numeric scores remain steady. Starred devices use amber selection rows, bars, badges, and jump shortcuts above the chart.

## Optional background music

The music button loads the official YouTube embed for [WULFF DEN x Chilled beats to relax and study to](https://www.youtube.com/watch?v=wdKbdiubuaA) only after a visitor clicks it. Volume starts at 50% each time the player is opened. The visible player loops the video, offers play/pause and volume controls, and stops when closed. Playback pauses when the tab is hidden. Browser autoplay policies may require a second Play click; mobile devices can control volume through hardware rather than the API. No audio is downloaded or hosted in this repository.
