# Best Gaming Gadgets

A mobile-first gaming affiliate buying guide built around one promise: **only three picks per category** (Best Overall, Best Value, Budget Pick). Cyberpunk neon design, Tailwind utility classes, and accessible comparisons.

## Quick start

Serve `dist/` as the web root:

```sh
python3 -m http.server 8000 --directory dist
```

Browse to http://localhost:8000. No JavaScript build step is required for the current static deployment. The Tailwind browser CDN is loaded at runtime for layout utilities; **before production launch, replace it with a compiled Tailwind CSS asset** for performance and production support. The custom cyberpunk styling lives in `dist/styles.css`.

## Content

- `dist/catalog.js`: 19 category shortlists with 3 options each. Treat these as *initial editorial candidates*, not independently tested products or a guarantee of current Amazon stock. Validate specs and current US availability before launch.
- `dist/site.js`: category routing via `?category=`, product card rendering, safety-conscious Amazon link construction and accessible comparison.
- `dist/index.html`: landing-page structure, Tailwind utilities and disclosures.
- `dist/amazon-config.js`: enter only an approved Amazon.com Associates tracking ID ending `-20`.

Category content is escaped before insertion into the page. The US store is hard-coded for this iteration; a regional marketplace adapter can replace it later.

## IMPORTANT: Amazon stock and affiliate compliance

**No direct-link or Amazon search URL proves an item is in stock.** Mini-PC entries use pre-existing ASIN links from the repository and need manual verification. All other shortlisted products use Amazon.com **search URLs** to avoid fabricating ASINs or directing users to a wrong variant. Search results may include unavailable items or other sellers. Never label an item "available now" based on these links.

A truthful "in stock" guarantee requires a supported and authorized Amazon catalog integration, with inventory freshness rules. For future implementation:

1. Obtain the appropriate US Amazon affiliate catalog API credentials and confirm applicable license and display restrictions.
2. Fetch product ID, canonical detail URL, variant, eligibility and availability through a **server-side** job. Never expose credentials in browser code.
3. Cache data with a short, policy-compliant TTL; track `checkedAt` and last validation state; do not interpret API failures as available.
4. Exclude products without positive fresh inventory/offer status from the public three, and replenish from a broader *reviewed* candidate pool. If fewer than three pass verification, explicitly display fewer than three rather than inventing availability.
5. Add recurring checks, error logging and alerting, and ensure display follows Amazon's API and Associates terms. Never scrape Amazon as a workaround.

Do not hardcode prices or star ratings that will become stale. Only Amazon.com is targeted; no localized prices, links or guarantees are currently offered.

## QA checklist

- Open desktop and mobile layouts; keyboard-test category buttons.
- Choose several categories: every one must render exactly three cards and matching comparison columns.
- Confirm all Amazon links use `amazon.com`, have `rel="sponsored noopener noreferrer"`, and optionally include the approved US Associates tag.
- Check all products and trade-offs editorially and independently. No fabricated inventory or prices.
- Replace the Tailwind browser CDN with a compiled, pinned asset ahead of production.


## GitHub Pages and scheduled review engine

The Pages site is designed to publish at **https://jmuders.github.io/bestgaminggadgets/** after PR #1 is merged and the repository has GitHub Pages set to **Settings → Pages → Build and deployment → Source: GitHub Actions**. This repository-setting step is required; merely adding the workflow does not enable the site.

The workflow `.github/workflows/pages.yml` runs on pushes to `main`, twice daily (07:17 and 19:17 UTC), and on manual workflow dispatch. It validates the shortlists, fetches publisher RSS feeds, writes `dist/data/insights.json`, builds production Tailwind CSS, and deploys the `dist/` folder. Third-party feed failures are logged and do not produce false review or availability claims.

`engine/sources.json` contains publisher feed candidates; their URLs, terms, and uptime need validation. This first engine stage gathers attributed headlines and direct source links, performs conservative model matching, produces source-coverage metrics and a discovery feed. **It does not currently auto-replace the three editorial picks or compute consensus review scores.** It also does not collect Amazon customer reviews or availability. Those capabilities need permissioned feeds or licensed API access, quality controls, verified ASIN matching and a scoring policy before automated publication.

For local development:

```sh
npm install
npm test
npm run aggregate
npm run css
python3 -m http.server 8000 --directory dist
```

Never include Amazon credentials in this public repository or in browser scripts. Use GitHub Actions secrets for permitted API access.


## Product image enrichment (scheduled)

`npm run images` now runs in the same GitHub Pages Actions pipeline as review ingestion. It queries Wikimedia Commons for up to 3 product-specific images per gadget, rejects unlicensed or ambiguous model matches, and exports `dist/data/images.json`. The frontend uses a compact responsive gallery with source/creator/license links; images are shown beside the *matching* gadget in its comparison card. Existing local mini-PC product photography is retained as a fallback.

Only explicitly recognized public-domain or Creative Commons BY/BY-SA/CC0 images of sufficient resolution are automatically accepted. This is **not** a generic web-image scraper: Amazon images and review-site photographs are excluded. If no reliable reusable photo can be found, the product card shows a deliberate placeholder instead of a wrong product. Attribution and all applicable license requirements must be respected, and a human should periodically audit matches and licensing. Some products will therefore have fewer than three images until an authorized manufacturer's media feed or licensed catalog provider is added.

For production-grade coverage, add a manufacturer media asset adapter with written reuse permission and an authorized Amazon catalog-media integration if permitted by the Associates/API terms. Product photos and product listing data should be refreshed together when those integrations become available. Images are retrieved only via HTTPS from Wikimedia and are not downloaded/re-hosted without further rights checks.

## Full-width swipeable galleries and image-quality gate

Product cards use a full-width 5:4 image viewport with horizontal touch swiping, previous/next arrows, page dots, accessible keyboard controls, and a current-image counter. The image occupies the card width and no longer appears as a cramped tiled grid. Photos are shown at their actual source quality.

**Publishing rule:** A product without a verified exact-model photo is **not published as a recommendation card**, and its category comparison is withheld until all three choices are photo-backed. The category remains visible with an explanatory "photography under verification" state; do not represent it as a completed category. The three original mini PCs already have bundled images. This strict gate currently limits other categories because Wikimedia Commons supplies almost no product-specific licensed photos (only one out of 57 in the latest feed scan).

The image engine's discovery results are candidates, **not approved photographs**. An editor must check that the pictured model matches the listed variant and that display rights are valid, then mark photo metadata as `approved: true` via a future approved-media pipeline. Never scrape, copy, or rehost Amazon product images. Use an authorized Amazon Creators API image response within its licensing restrictions, or obtain supplier press assets with explicit editorial rights. A complete 57-product catalog is therefore blocked until qualified photography is sourced.

The carousel supports up to five exact-model images per product. Never fill a five-image gallery by repeating an image or substituting generic category imagery.
