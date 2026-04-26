# United Coffee — Demo Website

Demo website for **United Coffee** (Tony &amp; Marina Horani) — a neighborhood Italian café at 6447 W Jefferson Blvd, Fort Wayne, IN. Indiana's only café serving Danesi espresso from Rome, plus Belgian Liège waffles.

This is a static, dependency-free site built by [Sweet Dreams Studios](https://sweetdreamsmusic.com) as a styling proposal.

## Pages

- `index.html` — hero, philosophy, three pillars (caffè / waffles / welcome), Danesi feature, on-the-counter grid, stats, testimonials, location tease, final CTA
- `menu.html` — full menu: espresso, brew &amp; tea, Liège waffles, panini, dolci, Danesi beans-to-go
- `story.html` — Tony &amp; Marina, their journey from Italy, four chapters, six values
- `visit.html` — address, hours, contact, Google Map embed, contact form, catering
- `404.html` — friendly fallback

## Stack

- Pure HTML / CSS / JS — no build step, no framework
- Google Fonts: Anton (display), Cormorant Garamond (editorial italic), Manrope (body), JetBrains Mono (mono)
- Unsplash imagery (replace with on-brand photography for production)

## Design language

Italian editorial × Fort Wayne warmth. Cream paper background (`#F6EFE3`), espresso ink (`#2A1810`), caramel crema (`#B8865D`), Italian red (`#B8362F`). Typography mixes a brutalist display (Anton) with delicate italic serif (Cormorant) — same pattern as the ReviveFW demo, recolored for a café.

## Local preview

Open `index.html` directly in a browser, or serve with any static server:

```bash
python -m http.server 5500
# or
npx serve
```

## Deployment

Drop the contents of this folder onto:
- GitHub Pages (push to `gh-pages` or `main` with Pages enabled)
- Vercel / Netlify (zero-config — they detect static sites)
- Any web host that serves HTML

## Customization checklist (before going live)

- [ ] Swap stock imagery for real photos of the café, waffles, and the Horanis
- [ ] Verify hours, prices, and menu items with Tony &amp; Marina
- [ ] Hook up the contact form (Formspree / Netlify Forms / Resend)
- [ ] Add a real domain + favicon
- [ ] Confirm Instagram/Facebook handles
- [ ] Add Google Analytics / Plausible if desired
