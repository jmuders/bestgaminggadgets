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
