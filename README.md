# Kitna Chahiye

A nine-question quiz that tells an urban Indian what their life actually costs
per month, and what gross salary pays for it. You answer nine screens, watch a
running total tick up as you go, sit through a short calculating beat, and land
on a result screen with one enormous number, a tappable breakdown, a comparison
against what people actually earn, and one line you did not expect.

No signup, no email, no account. The result is a shareable link that reproduces
the same answer — and renders the number server-side so link previews carry the
real figure.

> Built from the design brief in [`HANDOFF.md`](./HANDOFF.md). The cost model,
> copy, and lookup tables are specified in [`COST_MODEL.md`](./COST_MODEL.md) and
> [`COPY.md`](./COPY.md). The clickable design prototype lives in
> [`design-reference/`](./design-reference).

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **next/font** for Bricolage Grotesque (display), Plus Jakarta Sans (body),
  and JetBrains Mono (numbers)
- No CSS framework — design tokens live in `app/globals.css`, styles are inline
  and match the handoff's exact hex/size values
- No database, no backend service: all state is client-side, the shareable link
  is the only persistence

## Getting started

Requires Node.js 18.17+ (or 20+).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build   # production build
npm run start   # serve the production build
```

## How it works

### The flow

`landing → quiz (nine screens) → calculating → result`, all rendered by a single
client component (`components/KitnaChahiye.tsx`). Every screen has a default
answer already selected, so you can spam-tap through and still get a real number.

### The model

Everything the product displays comes out of `lib/cost-model.ts` — a set of pure,
typed functions shared by both the client and the server. It ports the arithmetic
in `COST_MODEL.md` verbatim: city rent index → cost index → priced options →
core + misc + debt + comfort toggles → total → salary, plus the percentile curve,
the log-scaled "gap" axis, and the auto-selected "one thing you didn't ask about"
line.

**Every figure in the model is an invented, plausible stand-in.** See
[`COST_MODEL.md` §7](./COST_MODEL.md) for what must be replaced with sourced data
before launch (the 93% gross-to-in-hand constant, rent bands, the median and
percentile curve, tariffs, and fares).

### Shareable links

The result lives at `/r/<token>`:

- **Short and opaque.** Answers are packed into a positional array and
  base64url-encoded (`lib/token.ts`) — no JSON blob that leaks the model shape.
- **Forward-compatible.** Decoding defaults any missing or malformed field, so a
  link made before a new question existed still opens.
- **Server-rendered.** `app/r/[token]/page.tsx` decodes the token, computes the
  model server-side, and emits Open Graph / Twitter tags carrying the actual
  number, the city, and one breakdown fact — so share previews are never a
  client-rendered placeholder.
- **Private.** The link carries the resolved **city**, never the six-digit
  pincode. The pincode lives only in component state and never leaves the device.
  The share card never exposes the pincode, the age, or the salary.

### Motion

Two count-ups only — the running meter (520ms) and the result reveal (1100ms) —
both cubic ease-out, with tabular figures so nothing jitters. Both respect
`prefers-reduced-motion` and snap to the final value if the tab is hidden.
Everything else is a short fade-and-lift.

## Project structure

```
app/
  layout.tsx            fonts + root metadata
  globals.css           colour tokens, base styles, kc-in entrance, reduced-motion
  page.tsx              the quiz app (/)
  r/[token]/page.tsx    server-rendered shared result + Open Graph tags
components/
  KitnaChahiye.tsx      orchestrator: landing, nine screens, calculating
  Result.tsx            the result screen (number, breakdown, gap, insight, share)
  Shell.tsx             centred 412px mobile column
  useAnimatedValue.ts   the count-up hook with reduced-motion / tab-hidden guards
lib/
  cost-model.ts         the model, city table, questions, breakdown, gap, insight
  token.ts              short, opaque, forward-compatible share-link encoding
  fonts.ts              next/font face definitions
```

## Deploying

The `/r/[token]` route is server-rendered on demand, so it needs a host that
runs Next.js (not a static-only host).

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new). Next.js is
   auto-detected; leave the defaults.
3. After the first deploy, set an environment variable so share-preview URLs are
   absolute and correct, then redeploy:

   ```
   NEXT_PUBLIC_SITE_URL = https://your-app.vercel.app
   ```

Every push to `main` then auto-deploys.

## Still to do before launch

Flagged in the handoff and not part of this build:

- **Replace the invented data** with sourced figures (see `COST_MODEL.md` §7),
  each with a dated source chip.
- **Share cards** — 9:16 and 16:9 images carrying the number, the city, one
  breakdown fact, and the URL. (The result currently ships text Open Graph tags.)
- **Methodology page** — the result links to `#methodology`.
