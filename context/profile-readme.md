# Profile README context

## Source of truth

The profile README now inherits its visual system from the sibling `portfolio` project. The relevant portfolio context is documented in `portfolio/context/PROJECT_BRIEF.md`; exact implementation details remain in the portfolio source.

## Brand direction

- Editorial white surface: `#f7f7f7`
- Primary neon blue: `#0011ff`
- Black typography: `#050505`
- Thin blue technical grids and deliberate rounded frames
- Black Rolmer for oversized display copy, embedded directly in the authored SVG assets
- Compact monospaced labels paired with plain sans-serif body copy
- Asymmetric panels, clipped corners, large typography, and blue spatial surfaces
- Copy should sound technically capable, direct, and lightly funny

Avoid dark dashboard styling, generic badge walls, decorative card grids, or loose mascot interpretations.

## Character pipeline

The animated ASCII character is derived from the actual portfolio model at:

`portfolio/public/models/character.glb`

Four transparent head-only turntable renders were produced from the original GLB to match the supplied three-quarter, front, side, and rear references. Each view is sampled into a 148 × 72 grid (10,656 glyph cells). The portfolio material mapping was reproduced for the render so the face screen, blue frame, hoodie, bag, gloves, shorts, and shoes affect glyph density correctly. Those renders were converted into monospaced, three-tone ASCII frames embedded directly into both hero SVGs.

The README hero no longer relies on SVG font loading or CSS frame animation. It uses 120 actual model angles assembled into lossless animated WebP files with a 4,000 ms loop. Alternating 33/34 ms frame delays produce exactly 30 FPS. The desktop and mobile WebPs are the runtime assets; the SVG hero files are retained only as editable visual-source references.

## Responsive strategy

GitHub README markup cannot use ordinary project CSS, so responsiveness is handled with `<picture>` and viewport-aware `<source>` elements:

- Desktop SVGs use a wide editorial composition.
- `*-mobile.svg` assets use purpose-built stacked compositions with larger type and ASCII cells.
- The breakpoint is `680px`.
- Do not replace this with a desktop SVG merely scaled down; the text becomes unreadable on mobile.
- Dynamic GitHub statistics are stacked at `width="100%"` so they remain legible at every width.

## Asset map

- `profile-hero.webp` / `profile-hero-mobile.webp`: identity panel and live 120-frame, 30 FPS ASCII head turntable
- `about.svg` / `about-mobile.svg`: operator statement and working process
- `stack.svg` / `stack-mobile.svg`: grouped core technology system with 41 official vector marks embedded directly inside the authored desktop and mobile panels
- `certifications.svg` / `certifications-mobile.svg`: Meta credentials, embedded certificate badges, and 20+ archived certifications
- `telemetry.svg` / `telemetry-mobile.svg`: GitHub statistics heading
- `snake-heading.svg` / `snake-heading-mobile.svg`: contribution animation heading
- `contact.svg` / `contact-mobile.svg`: final contact call-to-action
- `button-website.svg`, `button-linkedin.svg`, `button-github.svg`, `button-email.svg`: capsule link controls modeled after the portfolio button system

## Content facts

- Name: Abdul Rafay Khalid
- Role: Full-Stack Software Engineer / Software Engineering student
- Focus: full-stack products, frontend craft, motion, and spatial/3D web
- Meta Full-Stack, Front-End, and Back-End Developer certifications, plus 20+ archived certifications
- Portfolio: `abdulrafaykhalid.dev`
- LinkedIn: `linkedin.com/in/abdulrafaykhalid`
- Email: `abdulrafaykhalidjameel@gmail.com`
- GitHub username: `ARafaykhalid`
- The additional stack includes Base UI, Embla Carousel, Lenis, Pretext, Ably, Upstash Redis/QStash, Resend, bcrypt, JOSE, Sentry, PostHog, Vercel Analytics/Speed Insights, Web Vitals, and `schema-dts`.

## Maintenance rules

- Keep essential information as real text inside collapsed `<details>` sections for accessibility and searchability.
- Keep the extended toolbox `<details>` section synchronized with the portfolio `package.json`; the SVG remains the curated core visual inventory rather than an exhaustive dependency list.
- Continue the portfolio language: strong display copy, compact technical labels, and motion that communicates state.
- New authored sections should include both desktop and mobile assets when dense text is involved.
- Keep the snake URLs scoped to `ARafaykhalid/ARafaykhalid` and the generated `output` branch.
- Snake generation uses the brand palette in both light and dark modes: neon blue `#0011ff` with staged blue contribution dots.
- All 41 technology marks are embedded vector paths inside the responsive stack panels; do not restore a separate badge or icon wall.
- `.github/workflows/contribution-trail.yml` uses the standard `Platane/snk` renderer so the snake shape, eating movement, timing, and progress bar match the familiar contribution snake exactly. Its output query strings contain the editable light/dark brand palettes and write `github-snake-blue.svg` and `github-snake-blue-dark.svg`.
- Preserve reduced-motion fallbacks in animated SVGs.
