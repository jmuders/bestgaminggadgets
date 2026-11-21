# Best Gaming Gadgets

A static buying-guide site launching with a comparison of Amazon US mini gaming PC configurations. Product cards, the main comparison, and the buying guide are readable without JavaScript. Browser JavaScript adds graphics filters, adjustable comparison columns, and the mobile navigation toggle.

## Run locally

Serve the `dist/` directory with any static server. No dependencies or build step are required.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000.

## Amazon Associates

The site opens exact Amazon.com product listings. In [dist/amazon-config.js](dist/amazon-config.js), set `window.amazonAssociatesTag` to the approved US tracking ID ending in `-20`. The site adds the tag to its Amazon links and displays the Amazon Associates disclosure when a valid-format ID is configured. A blank value leaves the links untagged. Register the production domain with the Amazon Associates account before enabling referral links.

The site directs shoppers to Amazon for pricing and availability. When changing a configuration, update both its card and table column in [dist/index.html](dist/index.html) and confirm that the Amazon product identifier still points to the matching variant. Use a manufacturer-provided or otherwise licensed product image. The hero image is an illustration.

## Hosting

Serve `dist/` as the web root. The repository also contains a Sites hosting manifest for the private preview.
