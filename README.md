# Handoff: Kitna Chahiye

## Overview

Kitna Chahiye is a nine-question quiz that tells an urban Indian what their life
actually costs per month, and what gross salary pays for it. The user answers nine
screens, watches a running total tick up in the corner as they go, sits through a
short calculating beat, and lands on a result screen with one enormous number, a
tappable breakdown, a comparison against what people actually earn, and one line
they did not expect.

There is no signup, no email capture, and no account. The result is shareable as a
URL that reproduces the same answer.

**Target user:** single earners, 22 to 32, urban India, mostly on a mid-range
Android phone on a patchy connection.

**Success looks like:** someone finishes, sees the number, says "no way",
screenshots it, and sends it to a friend.

---

## About the design files

The files in `design-reference/` are **design references created in HTML**. They
are prototypes that show the intended look, copy, motion and behaviour. They are
not production code and should not be copied into the app as-is.

The task is to **recreate these designs in your codebase's own environment** —
React, Next.js, Vue, whatever the project already uses — following its established
patterns, component library and conventions. If no environment exists yet, pick the
framework that fits the project and build there.

`Kitna Chahiye.dc.html` is a single-file prototype written in a bespoke authoring
format. Open it in a browser to click through the flow. Read it for layout and
exact styling values; do not port its structure.

## Fidelity

**High fidelity.** Colours, typography, spacing, copy and motion are final and
should be matched closely. Every hex value, font size and piece of copy in this
document is the intended value.

Two things are deliberately *not* final:

1. **The cost data.** All rent bands, tariffs, fuel rates and percentile figures in
   the prototype are plausible invented numbers standing in for a real data set.
   See `COST_MODEL.md` — the arithmetic is specified exactly, the inputs need
   replacing with sourced data before launch.
2. **The phone frame.** The prototype renders inside an Android bezel purely so the
   design reads as mobile. Ship the screens, not the bezel.

---

## Non-negotiables

1. **Mobile first.** Assume 90% of traffic is a phone. Design width in the
   prototype is 412px. Everything above that is a centred column.
2. **Under three minutes to complete.** If a change pushes it over, cut a screen.
3. **No signup.** Not before the result, not after.
4. **The result must be linkable.** A shared URL reproduces the same result. The
   prototype encodes answers into the URL fragment; production should do the same
   or better (see *State management*).
5. **The number must render server-side for the share preview.** Open Graph tags
   need the actual number, not a client-rendered placeholder.
6. **Every displayed number carries a source.** No exceptions. Where a figure is an
   assumption rather than a measurement, the chip says so in those words.

---

## Screens

There are four states: landing, quiz (nine screens), calculating, result.

### 1. Landing

**Purpose:** one question and a button. The whole page should take under two
seconds to understand.

**Layout:** full-height flex column, `justify-content: space-between`, padding
`64px 24px 28px`.

Top group:
- Wordmark "Kitna Chahiye" — Bricolage Grotesque 800, 22px, `-0.02em`, `#17130D`,
  `margin-bottom: 40px`.
- H1 "How much does your life actually cost?" — Bricolage Grotesque 800, 56px,
  line-height 0.95, letter-spacing `-0.035em`, `#17130D`, `text-wrap: pretty`,
  `margin: 0 0 20px`.
- Sub "Nine questions. / Then the salary you need to pay for it." (line break
  between sentences) — Plus Jakarta Sans 16px, line-height 1.6, `#6F6557`,
  `max-width: 19em`.

Bottom group (`gap: 16px`):
- Primary button "Find out" — full width, `min-height: 60px`, `border-radius: 999px`,
  background `#17130D`, text `#FFFBF2`, 17px/700. Hover `background: #2A241B`.
  Active `transform: scale(0.985)`.
- Three-up meta row, `justify-content: space-between` — JetBrains Mono 11px
  `#938876`: "Under 3 minutes", "No signup", "Free".

No hero illustration, no feature grid, no testimonials.

### 2. Quiz shell (all nine screens)

Full-height flex column on `#FFFBF2`.

**Sticky header** (`top: 0`, `z-index: 5`, padding `14px 20px 12px`, bottom border
`1px solid #EADFCC`):
- Left: progress dots. Nine dots, `height: 6px`, `border-radius: 999px`,
  `gap: 6px`. Current dot is `width: 20px` and `#17130D`; answered dots are
  `width: 6px` and `#B9AE9B`; unseen are `width: 6px` and `#EADFCC`. Transition
  `all .25s ease-out`. **Dots, never a percentage bar.**
- Right: the running meter. Label "SO FAR" in JetBrains Mono 9px, letter-spacing
  `0.14em`, uppercase, `#B9AE9B`. Value in Bricolage Grotesque 800, 22px,
  `-0.02em`, `font-variant-numeric: tabular-nums`, colour `#17130D` once above zero
  and `#DFD3BC` while still at zero.

**The meter is the one interaction that matters.** It counts, it does not jump. See
*Interactions* below. It must never read as a progress bar.

**Body** (`flex: 1`, padding `28px 20px 24px`):
- Eyebrow — JetBrains Mono 10px, `0.16em`, uppercase, `#B9AE9B`. "One of nine"
  through "Nine of nine".
- Title — Bricolage Grotesque 800, 30px, line-height 1.05, `-0.03em`, `#17130D`,
  `text-wrap: pretty`, `margin: 0 0 6px`.
- Sub — 14px, line-height 1.5, `#938876`, `margin: 0 0 24px`.
- Then the screen's own control (below).

**Sticky footer** (`bottom: 0`, padding `14px 20px 18px`, top border
`1px solid #EADFCC`, `gap: 12px`):
- "Back" — `min-height: 56px`, padding `0 22px`, pill, `2px solid #EADFCC`,
  transparent, `#463E31`, 15px/700. Always available. Nothing is destructive.
- Next — `flex: 1`, `min-height: 56px`, pill, `#17130D` on `#FFFBF2` text, 16px/700.
  Label is "Next", or "Show me the number" on screen nine.

Every screen has a default already selected, so a user can spam-tap through and
still get a real answer.

### 3. Screen one — who

Two stacked fields, `gap: 28px`.

- **Your age.** Field label 13px/700 `#463E31`, `margin-bottom: 10px`. Input:
  full width, `min-height: 60px`, padding `0 20px`, `border-radius: 16px`,
  `2px solid #EADFCC`, background `#FFFFFF`, JetBrains Mono 24px, letter-spacing
  `0.14em`, `#17130D`. Focus border `#17130D`. Numeric, max 2 digits, clamped to
  18–70 on blur. Helper line below, 14px `#6F6557`: "It sets what a comfortable
  month looks like at your stage, and it never leaves your device."
- **Your pincode.** Same field treatment, 6 digits, placeholder `560001`. Helper
  line is state-driven:
  - fewer than 6 digits: "Six digits. We use it for rent and electricity, and it never leaves your device."
  - recognised prefix: "`<City>`, `<State>`. Using local rent and tariff data."
  - 6 digits, unrecognised: "We do not have that pincode yet. Pick the closest city."
    and a row of six fallback city chips (Mumbai, Delhi, Bengaluru, Hyderabad,
    Pune, Chennai) — `min-height: 44px`, padding `0 16px`, pill,
    `1px solid #EADFCC`, background `#F6EFE2`, 14px/600 `#463E31`. Tapping one
    fills the pincode with that city's representative code.

Default: age 26, pincode 560001.

### 4. Screens two, three, four, five, six, seven — single-choice rows

One question per screen, never two. Options are a vertical stack, `gap: 10px`.

Each row: full width, `min-height: 64px`, padding `14px 18px`,
`border-radius: 18px`, `2px solid` border, `display: flex`, `align-items: center`,
`justify-content: space-between`, `gap: 14px`, transition `all .15s ease-out`.

- Unselected: border `#EADFCC`, background `transparent`.
- Selected: border `#17130D`, background `#FFFFFF`.

Left column: label 16px/700 `-0.01em` `#17130D`; sub 13px `#938876`.
Right: the monthly rupee figure for that option, JetBrains Mono 13px — `#17130D`
when selected, `#B9AE9B` otherwise. The figure is city-adjusted live, so it changes
with the pincode.

Screen order and copy are in `COPY.md`. Rupee figures come from `COST_MODEL.md`.

### 5. Screen eight — what you owe

**Multi-select.** Five rows, same visual family as the single-choice rows, but the
right-hand slot is a checkbox rather than a figure: 24px square,
`border-radius: 8px`, `2px solid`. Off: border `#DFD3BC`, transparent. On: border
and fill `#17130D`, glyph `✓` in `#FFFBF2` 13px/700.

Rows: "Nothing" (mutually exclusive — selecting it clears the others), "An
education loan", "A vehicle EMI", "A card balance I keep rolling", "Another loan".
"Nothing" shows as checked whenever no other row is on.

Selecting a row expands it (animation `kc-in .2s ease-out both`) to reveal, inside
the same card at padding `0 18px 18px`, `gap: 14px`:

- Label "How much do you pay a month?" 13px/700 `#463E31`.
- An amount field: row with `min-height: 52px`, padding `0 16px`,
  `border-radius: 14px`, `1px solid #EADFCC`, `#FFFFFF`; a `₹` prefix in JetBrains
  Mono 18px `#938876`; a borderless numeric input, JetBrains Mono 18px.
  **The preset figure is the greyed placeholder, not a value.** It disappears on
  typing and is never submitted as the user's number. If left blank, the model
  falls back to the preset.
- For the two loan rows and "Another loan": an optional years-left field —
  "Years left on it?" 13px `#6F6557`, a 66px-wide numeric input (`min-height: 44px`,
  `border-radius: 12px`, centre-aligned, JetBrains Mono 16px, placeholder `7`), and
  the word "optional" in JetBrains Mono 11px `#B9AE9B`.

Presets: education ₹12,000 · vehicle ₹9,000 · card ₹6,000 · another ₹15,000.

### 6. Screen nine — what comfortable means

**This screen is different and should look different.** Three toggles, not a
question. This is where the user sets the standard.

Each toggle card: full width, padding 22px, `border-radius: 24px`, `2px solid`,
flex row, `align-items: flex-start`, `gap: 16px`, transition `all .2s ease-out`.
Off: border `#EADFCC`, transparent. On: border `#17130D`, background `#FFFFFF`.

Left column (`gap: 6px`): title Bricolage Grotesque 800, 20px, `-0.02em`,
line-height 1.15; sub 13px `#6F6557`; then the delta in JetBrains Mono 12px —
accent `#E14B33` when on, `#B9AE9B` when off.

Right: the switch. Track 52px × 32px, `border-radius: 999px`, padding 3px,
background `#17130D` on / `#DFD3BC` off, transition `background .2s ease-out`.
Knob 26px circle `#FFFFFF`, `transform: translateX(20px)` on, `translateX(0)` off,
transition `.2s ease-out`.

**The meter must visibly move when a toggle flips.** That is the point of the
screen. All three default to on.

### 7. Calculating

Not a fake loader — it is telling the user the thing is real. Full-height centred
column, padding `40px 28px`.

- Eyebrow "WORKING IT OUT" — JetBrains Mono 10px, `0.16em`, `#B9AE9B`.
- Three lines, `gap: 16px`, each 16px/1.4 with a monospace mark at 13px:
  1. "Checking rents around `<pincode>`."
  2. "Pulling electricity tariffs for `<State>`."
  3. "Working out your tax."

Line states: pending — mark `·`, text `#B9AE9B`, opacity 0.35. Active — mark `→` in
accent, text `#17130D`, opacity 1. Done — mark `✓` in `#1E8E5A`.

Total duration 2600ms (tweakable). Line two lights at 30%, line three at 62%, the
result shows at 100%.

### 8. Result

Scrolls. Sections in this order — **order matters, this is the whole product.**

**a. The number.** Padding `36px 24px 0`, `animation: kc-in .5s ease-out both`.
- Eyebrow "`<CITY>` · WHAT YOUR LIFE COSTS" — JetBrains Mono 11px, `0.16em`,
  uppercase, `#938876`.
- The number — Bricolage Grotesque 800, **72px**, line-height 0.88, letter-spacing
  `-0.045em`, `font-variant-numeric: tabular-nums`, colour accent `#E14B33`.
  Counts up from zero over 1100ms.
- "a month, in hand." — Bricolage Grotesque 800, 26px, `-0.03em`, `#17130D`.
- Hairline `1px #EADFCC`, margin `26px 0 18px`.
- "That is a **₹X lakh** salary, before tax and PF." — 17px/1.55 `#463E31`, the
  figure at weight 800.
- Source line — JetBrains Mono 11px `#B9AE9B`: "Gross to in-hand assumed at 93% ·
  updated Jun 2026".

**b. Where it goes.** Padding `28px 20px 0`.
- Eyebrow "WHERE IT GOES".
- Horizontal stacked bar: `height: 22px`, `border-radius: 999px`, `gap: 2px`,
  segments in descending size, each `width` = its share of the total. Tapping a
  segment opens its row. Non-focused segments drop to `opacity: 0.35` while a row
  is open.
- Then one row per line item, each with `border-bottom: 1px solid #EADFCC`,
  `min-height: 52px`, padding `15px 0`, `gap: 12px`: a 10px colour swatch
  (`border-radius: 3px`), the label 15px/700, the percentage in JetBrains Mono 12px
  `#B9AE9B`, and the amount in JetBrains Mono 15px tabular.
- Tapping a row expands it (padding `0 0 18px 22px`, `gap: 12px`): a plain-English
  note at 14px/1.6 `#6F6557`, then **the source chip** — `min-height: 30px`,
  padding `0 12px`, pill, `1px solid #EADFCC`, background `#F6EFE2`, JetBrains Mono
  11px `#6F6557`. Tapping the chip reveals the provenance detail at 13px/1.6
  `#938876` with a `2px solid #EADFCC` left rule and 12px left padding.
- **The rent row additionally carries the correction link** — "This isn't right for
  my area", 13px `#6F6557`, underlined at 3px offset. It opens a single field plus
  a "Send" button. This is a real data pipeline, not a support form: it needs to be
  visible without being loud.

Segment colours in order of definition: rent = accent `#E14B33`, food `#463E31`,
what you owe `#6F6557`, getting around `#938876`, bills `#B9AE9B`, the rest of your
life `#DFD3BC`, health `#EFE6D5`, savings `#F6EFE2`. Rows with a zero amount are
dropped; the rest sort by amount descending.

**c. The gap.** Padding `44px 20px 0`. This is the emotional payload: their number
against what people actually earn. Two markers on one logarithmic axis.
- Eyebrow "THE GAP".
- A 118px-tall relative box. Baseline: 2px `#EADFCC` at `top: 64px`, full width.
- Median marker below the line: 2px × 26px `#938876` tick, then the amount in
  JetBrains Mono 13px `#6F6557` and "median urban salaried" at 11px `#938876`.
- Their marker above the line: "you need" at 11px `#938876`, the amount in
  JetBrains Mono 14px/700 in the accent, and a 2px × 22px accent tick.
- Both positioned by `logPos()` — see `COST_MODEL.md`.
- Sentence below at 16px/1.6 `#463E31`, then a JetBrains Mono 11px `#B9AE9B` source
  line: "Salaried income distribution, urban India · 2026".

**d. One line they did not expect.** A dark card: margin `44px 20px 0`, padding
`28px 24px`, `border-radius: 28px`, background `#17130D`.
- Eyebrow "ONE THING YOU DIDN'T ASK ABOUT" — JetBrains Mono 10px `#938876`.
- The line — Bricolage Grotesque 800, 26px, line-height 1.15, `-0.025em`,
  `#FFFBF2`, `text-wrap: pretty`. Auto-selected from their answers, whichever is
  most extreme. Selection logic in `COST_MODEL.md`.

**e. Share.** Padding `44px 20px 0`, `gap: 10px`.
- "Copy my link" — full width, `min-height: 58px`, pill, `#17130D` / `#FFFBF2`,
  16px/700. On tap it writes the URL to the clipboard and the label becomes "Link
  copied" for 2000ms.
- "Change my answers" — `min-height: 52px`, pill, `2px solid #EADFCC`, transparent,
  `#463E31`, 15px/700. Returns to the landing screen with answers preserved.
- Note below at 12px `#B9AE9B`: "The link carries your answers, not your pincode."

**f. Footer.** `margin-top: 44px`, padding `24px 20px 0`, `border-top: 1px solid
#EADFCC`. A "Methodology and sources" link at 13px `#6F6557`, underlined.

---

## Interactions and behaviour

**Motion happens in exactly two places.** Do not add a third.

1. **The running meter.** Every answer animates the total to its new value over
   520ms with a cubic ease-out (`1 - (1-t)³`), rendering intermediate values so it
   counts rather than jumps. Digits use tabular figures so nothing jitters.
   Guard: if the tab is hidden or the frame loop is suspended, snap straight to the
   final value — the meter must never be left showing a stale partial number.
2. **The reveal.** The result number counts from zero over 1100ms with the same
   easing. It is a beat, not a fanfare.

Everything else is a fade or a small lift, 120–320ms, standard ease-out, no bounce.
`kc-in` is the shared entrance: `opacity 0 → 1`, `translateY(10px) → 0`.

Respect `prefers-reduced-motion`: skip the count-ups and show final values.

**Meter reveal order.** The meter only includes what the user has actually seen, so
it climbs as they progress:

| After screen | Adds |
|---|---|
| 1 who | (nothing) |
| 2 roof | rent |
| 3 commute | commute |
| 4 food base | groceries |
| 5 food fun | delivery and eating out |
| 6 bills | bills |
| 7 body | health |
| 8 debt | repayments |
| 9 comfort | going out, trip, savings, and the 8% miscellaneous |

Going back does not reduce it — the reveal high-water mark only rises.

**Navigation.** Back is always available and never destructive. Back from screen
one returns to the landing screen. Next from screen nine starts the calculating
beat.

**Result interactions.** Tapping a breakdown row or its bar segment toggles that
row open and closes any other. Tapping a source chip toggles the provenance detail.
These are independent — opening a row does not open its source.

---

## State management

All state is client-side. Nothing is persisted to a server, no account exists.

```
step        'landing' | 'quiz' | 'calc' | 'result'
qi          0–8, current question index
seen        high-water mark of qi, drives the meter reveal
answers {
  age       string, digits only, clamped 18–70 on blur
  pin       string, 6 digits
  roof      index into that screen's options
  commute   index
  foodBase  index
  foodFun   index
  bills     index
  body      index
  d {                       one entry per debt type
    edu     { on, emi, yrs }   emi and yrs are digit strings, '' means unanswered
    vehicle { on, emi, yrs }
    card    { on, emi, yrs }
    other   { on, emi, yrs }
  }
  t {                       screen nine toggles
    out, trip, save         all default true
  }
}
meter       animated display value for the header
big         animated display value for the result number
calcStep    0–2, which calculating line is lit
openRow     which breakdown row is expanded, or null
openSrc     which source chip is expanded, or null
```

**Shareable URLs.** The prototype serialises `answers` to JSON, URI-encodes it and
writes it to `location.hash` as `#kc=<encoded>` via `replaceState` whenever the
result is shown. On mount, a matching hash is parsed and merged over the defaults,
jumping straight to the result.

For production this needs to be better in two ways:

1. **Short and opaque.** A JSON blob in the fragment is long and leaks the shape of
   the model. Encode to a short token, or store the answer set server-side and use
   a short ID.
2. **Server-rendered.** Fragments are never sent to the server, so Open Graph tags
   cannot see them. Move the payload into the path or query string so the number,
   the city and one breakdown fact can be rendered into the share preview
   server-side. This is a launch requirement, not a nicety.

**Reading a shared link must be forward-compatible.** The prototype defaults any
missing key rather than trusting the payload — a link created before a new debt row
existed still opens. Keep that property.

---

## Privacy

The pincode is used for rent and tariff lookup and is stated to the user as never
leaving their device. Honour that: resolve it client-side against a shipped lookup
table, or if it must go to a server, change the copy.

**The share card must not contain the pincode, the age, or any salary the user
entered.** People will share this. It must not become a privacy incident. Permitted
on the card: the number, the city, one breakdown fact, the URL. Nothing else.

---

## Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| cream | `#FFFBF2` | page background, text on dark |
| sand | `#F6EFE2` | chips, inset surfaces, the area around the phone |
| paper | `#FFFFFF` | selected cards, input fields |
| ink | `#17130D` | primary text, primary button, selected borders, dark cards |
| ink hover | `#2A241B` | primary button hover |
| ink rule | `#3A332A` | hairline inside dark cards |
| ink 700 | `#463E31` | body text on cream, secondary button text |
| ink 500 | `#6F6557` | supporting text, notes |
| ink 400 | `#938876` | muted labels, sub-copy |
| ink 300 | `#B9AE9B` | eyebrows, source lines, disabled figures |
| line 2 | `#DFD3BC` | toggle track off, checkbox border off |
| line | `#EADFCC` | all hairline borders and dividers |
| tint | `#EFE6D5` | breakdown segment |
| accent | `#E14B33` | the number, active marks, live deltas |
| positive | `#1E8E5A` | completed calculating marks |

**One accent, used sparingly, mostly on the number.** No fintech blue, no banking
green, no gradients, no rupee symbols as decoration.

### Type

| Role | Family | Notes |
|---|---|---|
| Display | Bricolage Grotesque 800 | headlines and every large figure. Tracking `-0.02em` to `-0.045em`, tighter as it gets bigger. Tabular figures on all numerals. |
| Body | Plus Jakarta Sans | 400 default, 600/700/800 for emphasis. Line-height 1.5–1.65. |
| Mono | JetBrains Mono | eyebrows, labels, source chips, numeric inputs, every rupee figure inside a row. Uppercase eyebrows track `0.14em`–`0.18em`. |

These are the design system's substitutes for the real brand faces. If a licensed
display face is available, the requirement is a face that holds at 72px with
tabular figures so digits do not jitter during the count-up.

Sizes in use: 72 / 64 / 56 / 44 / 34 / 30 / 26 / 24 / 22 / 20 / 19 / 18 / 17 / 16 /
15 / 14 / 13 / 12 / 11 / 10 / 9.

### Spacing, radius, hit targets

- Screen padding: 20px on quiz and result sections, 24px on landing and the result
  hero.
- Section rhythm on the result: 44px between blocks, 28px inside a block.
- Radius: 8px checkbox · 12–16px inputs · 18px option row · 20px option card ·
  24px toggle card · 28px dark card · 999px every button and chip.
- **No interactive element below 44px.** Rows are 52–64px, primary buttons 56–60px.

### Shadows

None. Separation is done with hairlines and the paper/cream contrast.

---

## Assets

No images, icons, illustrations or photography. Every mark in the design is a
Unicode glyph (`₹`, `✓`, `→`, `·`) or a CSS shape. Nothing needs to be sourced.

If icons are introduced later, the design system standardises on Lucide at ~2px
stroke, rounded variants. Do not use emoji.

---

## Still to design

These were in the original brief and are not in this build. Flag them before
scoping:

- **Share cards.** 9:16 for stories and 16:9 for Twitter and LinkedIn. Must carry
  the number, the city, one breakdown fact and the URL, and nothing else. Test at
  200px wide — if the number is not readable, redo it.
- **Methodology page.** Long, dense, fully sourced, every assumption listed with a
  date. It will get almost no traffic and it is the reason the tool survives its
  first argument. The result screen already links to `#methodology`.

---

## Files

| File | What it is |
|---|---|
| `README.md` | this document |
| `COST_MODEL.md` | the arithmetic, the lookup tables, and every invented figure that needs replacing |
| `COPY.md` | every string in the product, verbatim |
| `design-reference/Kitna Chahiye.dc.html` | the clickable prototype |

Read `COST_MODEL.md` before writing any calculation code. The model is the product;
the UI is how it gets read.
