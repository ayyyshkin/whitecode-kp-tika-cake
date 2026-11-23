# WhiteCode: interactive proposal template

One link per client: headline, proposal column with its own scroll, a live demo in a laptop,
related WhiteCode cases at the end and a request that opens WhatsApp with a ready message.
First filled example: Tika Cake.

## Run locally

```bash
python3 -m http.server 5180
```

Open http://localhost:5180. No build step, no dependencies.

## Files

| File | What it is |
| --- | --- |
| `assets/kp-data.js` | Everything about this client: title, demo scenarios, modules, stages, price, open questions, FAQ, final block, `project.tags`. A new client = a copy of this file. |
| `assets/studio.js` | WhiteCode itself: manager and WhatsApp, published facts, the 8 cases with tags, client logos. Shared by all proposals. |
| `assets/kp.js` | Renders the page from both files, drives the demo, picks cases, builds the WhatsApp request, motion. |
| `assets/kp.css` | Brand styles (Coolvetica + Inter, cool white, chrome drop), motion, phone layout, print. |
| `assets/fonts`, `brand`, `cases`, `logos` | Brand fonts, wordmark and chrome drop, case covers, client logos (from whitecode.kz materials). |
| `demo/` | The client demo: shop + team workspace, hash routes, state in `localStorage`. Uses the client's own palette. |

## How cases are picked

`kp-data.js → project.tags` lists what the project is about, most important first.
Every case in `studio.js` has its own `tags`. Score = sum of shared tags, earlier project tags weigh more.
The top 3 are shown; the subtitle names the shared topics. Tika Cake: `food` first, so Hiba leads,
then U-Market and Telekom Srbija. A marketplace proposal would put `marketplace` first and get Hiba and U-Market.

Tags in use: `ecommerce marketplace catalog orders food b2b automation erp integration bank fintech security telecom education content uxui corporate`.
Labels for them are in `studio.js → tagLabels`.

## The request

The final form has a name field and topic chips. The WhatsApp text is shown live and includes
the demo scenarios the visitor opened, the chosen topics, price, timeline and the proposal link.
"Оставить заявку" opens `wa.me/<manager.whatsapp>` with that text. Event `lead_whatsapp` goes to `dataLayer`.

## Demo routes (for `route` fields)

`/` · `/catalog` · `/product/<id>` · `/cart` · `/cart?seed=1` (fills a test order) · `/checkout` · `/account` ·
`/admin` · `/admin/orders` · `/admin/production` · `/admin/stock`

## Motion

One authored moment on load: headline words rise, the marker draws under the client's name, the price plate lands
and counts up, the laptop lid opens and the screen turns on. Below, each group arrives its own way once
(scenarios slide in, stage bars grow, case pictures wipe up). No idle loops, no scroll listeners for reveals,
`prefers-reduced-motion` removes movement. In a hidden browser tab animations pause, so check visually with the tab in view
or with `playwright-cli`.

## Before sending to a client

- [ ] Confirm stages, payment split and open questions for this client.
- [ ] `og:image` 1200×630, host on a WhiteCode domain (for example `kp.whitecode.kz/<client>`).
- [ ] Kazakh UI strings in `demo/demo.js` (I18N.kz) checked by a native speaker.
- [ ] After editing CSS/JS bump `?v=` in `index.html` so browsers drop the cache.
