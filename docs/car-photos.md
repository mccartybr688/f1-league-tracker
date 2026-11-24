# Real car photos (optional, private builds)

The public build draws every car as an illustration. A private deployment
can show real photos instead by adding `family/car-photos.json`:

```json
{
  "records": {
    "Ferrari|2024": { "src": "https://upload.wikimedia.org/...jpg", "page": "https://commons.wikimedia.org/wiki/File:...",
                      "author": "Photographer", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0" }
  },
  "teams": { "mclaren": { "...": "same fields" } }
}
```

- `records` keys are `Team|Year` (matching `tracks.record_team` / `record_year`), or
  `Team|Year|Driver` to pick a specific driver's car.
- `teams` keys are lower-case team names, matched against a driver's in-game car.
- Use freely licensed images (e.g. Wikimedia Commons, CC BY / CC BY-SA / CC0) and keep
  the author, licence and source fields: the app shows them as the required credit.
- Instead of `src`, an entry can give `file`: an image in `family/car-photos/` (for
  example a cut-out WebP with a transparent background). It's bundled with the site and
  credited as "background removed". Edited CC BY-SA images stay under the same licence.
- If an image fails to load, the illustration is shown instead.
