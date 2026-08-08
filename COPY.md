# Copy

Every string in the product, verbatim. English only — the name carries the
Hinglish, and forcing more of it reads as a brand trying too hard to an audience
that spots it instantly.

Voice: plain, matter-of-fact, a little dry. Second person. No exclamation marks, no
emoji, no encouragement. The tool is not cheering for the user; it is telling them
something true.

---

## Landing

> **Kitna Chahiye**
>
> # How much does your life actually cost?
>
> Nine questions.
> Then the salary you need to pay for it.
>
> [ Find out ]
>
> Under 3 minutes · No signup · Free

---

## Screen 1 — who

> ONE OF NINE
> ## Where are you living?
> Rent is the whole game, and it is local.

**Your age** — placeholder `26`
> It sets what a comfortable month looks like at your stage, and it never leaves your device.

**Your pincode** — placeholder `560001`

Helper line, by state:
- under 6 digits — "Six digits. We use it for rent and electricity, and it never leaves your device."
- recognised — "`<City>`, `<State>`. Using local rent and tariff data."
- unrecognised — "We do not have that pincode yet. Pick the closest city."

Fallback chips: Mumbai · Delhi · Bengaluru · Hyderabad · Pune · Chennai

---

## Screen 2 — roof

> TWO OF NINE
> ## How do you live?
> Rent plus maintenance. Deposit not counted.

| Option | Sub | Breakdown note |
|---|---|---|
| With family | You contribute something | You live with family in `<city>` and put something into the house every month. |
| PG or shared room | Your share of a flat | Your share of a PG or a shared flat in `<city>`, including maintenance. |
| 1BHK, alone | Decent building, okay locality | A one-bedroom flat to yourself in `<city>`, including maintenance. |
| 2BHK, alone | Space for a desk and guests | A two-bedroom flat to yourself in `<city>`, including maintenance. |
| 2BHK, prime area | The address people recognise | A two-bedroom flat in a prime part of `<city>`, including maintenance. |

Every rent note is followed by: "A deposit is not part of a monthly number."

Source chip: `Rent index · Jun 2026`
Detail: "Median listed rent for this configuration in `<city>`, adjusted to a
mid-band locality. Prototype data set, last refreshed June 2026."

Correction link: **This isn't right for my area** → field placeholder "What do you
actually pay?" → button "Send" → "Thanks"

---

## Screen 3 — commute

> THREE OF NINE
> ## How do you get to work?
> Fuel, fares, servicing, parking.

| Option | Sub | Breakdown note |
|---|---|---|
| I work from home | Occasional trips out | You work from home, so this is only the occasional trip out. |
| Metro or bus | Daily pass or monthly card | A monthly metro or bus pass at current `<state>` fares. |
| Two-wheeler | Petrol, service, insurance | A two-wheeler: petrol, servicing and insurance at current `<state>` rates. |
| Cabs and autos | Both ways, most days | Cabs and autos both ways on most days, at current `<state>` fares. |
| Car | Fuel, EMI-free but not free | A car: fuel, servicing, insurance and parking at current `<state>` rates. Any EMI is counted separately. |

Source chip: `Fuel + fare rates · Jul 2026`
Detail: "State fuel price, transport authority fare tables, and manufacturer
service intervals. Prototype data set."

---

## Screen 4 — food, base

> FOUR OF NINE
> ## Does the kitchen get used?
> Groceries, milk, the cook or the tiffin.

| Option | Sub | Note fragment |
|---|---|---|
| I cook most days | Groceries and gas | Groceries and gas for someone who cooks most days |
| I cook sometimes | Groceries plus a tiffin service | Groceries plus a tiffin service |
| I mostly do not cook | Tiffin, milk, and whatever is quick | Tiffin, milk and whatever is quick, for a kitchen that mostly stays shut |

---

## Screen 5 — food, fun

> FIVE OF NINE
> ## How often do you order food or grocery?
> Delivery apps and eating out, both counted.

| Option | Sub | Note fragment |
|---|---|---|
| Rarely | A treat, not a habit | plus the rare meal out. |
| Once a week | Friday is Friday | plus about one delivery or meal out a week. |
| Two or three times a week | Plus a weekend dinner out | plus two or three deliveries or meals out a week. |
| Most days | The app knows your address by heart | plus something ordered in or eaten out on most days. |

**The Food breakdown note joins the two fragments with a comma**, e.g. "Groceries
plus a tiffin service, plus two or three deliveries or meals out a week."

Source chip: `Grocery basket + delivery averages · May 2026`
Detail: "Groceries from a 28-item urban basket priced monthly. Delivery averages
from published order-value data for metro users. Prototype data set."

---

## Screen 6 — bills

> SIX OF NINE
> ## What do the bills look like?
> Electricity, internet, phone, gas, water.

| Option | Sub | Breakdown note |
|---|---|---|
| Bare minimum | Fan, lights, one broadband line | Fans, lights and one broadband line, at the `<state>` slab tariff, plus phone and gas. |
| AC in summer | Three or four heavy months | An AC running three or four months a year, at the `<state>` slab tariff, plus broadband, phone and gas. |
| AC most of the year | And a second connection | An AC running most of the year, at the `<state>` slab tariff, plus two connections, phone and gas. |

Source chip: `<State> tariff · Apr 2026`
Detail: "Domestic slab tariff as notified by the state regulator, applied to a
usage profile matching your answer. Prototype data set."

---

## Screen 7 — body

> SEVEN OF NINE
> ## What do you spend on your body?
> Gym, sport, therapy, medicines, insurance premium.

| Option | Sub | Breakdown note |
|---|---|---|
| Nothing regular | Medicines when something goes wrong | No gym and no regular treatment. Medicines and the occasional consultation, nothing else. |
| A gym membership | Plus health insurance premium | A gym membership, plus an individual health insurance premium. |
| Gym, a sport, therapy | You treat it as non-negotiable | A gym, a sport and therapy, plus an individual health insurance premium. |

Source chip changes with the answer:
- "Nothing regular" → `Out-of-pocket medical spend · Jan 2026` — "Reported
  out-of-pocket medical spend for an adult in your age band with no cover.
  Prototype data set."
- otherwise → `Premium tables · Jan 2026` — "Individual cover premium for a healthy
  adult in your age band at a 5 lakh sum insured, plus reported out-of-pocket
  medical spend. Prototype data set."

---

## Screen 8 — debt

> EIGHT OF NINE
> ## What do you owe every month?
> EMIs and anything you are carrying on a card. Pick all that apply.

| Row | Sub |
|---|---|
| Nothing | Loan free! :)) |
| An education loan | The most common one at your age |
| A vehicle EMI | Bike or car |
| A card balance I keep rolling | Minimum due, every month |
| Another loan | Personal, home, family, anything else |

Expanded fields:
> How much do you pay a month?
> ₹ [ 12,000 ]   ← greyed placeholder, never submitted
>
> Years left on it?  [ 7 ]   optional

Breakdown note is assembled from what they picked, e.g.
"You told us: an education loan at ₹18,000 a month, ending in 2033, and a card
balance I keep rolling at ₹6,000 a month. Repayments only, not the balances."

Source chip: `Your own numbers`
Detail: "These are the figures you entered, not an estimate. Where you left a field
blank we used a typical EMI for that loan type at current rates."

---

## Screen 9 — comfort

> NINE OF NINE
> ## What does comfortable mean to you?
> This is where you set the standard, not us.

| Toggle | Sub | Delta label |
|---|---|---|
| Going out without checking the bill | Drinks, films, birthdays, the round you insist on paying for. | + ₹X a month |
| One real trip a year | Flights, a decent room, seven days off. Spread across twelve months. | + ₹X a month |
| Saving 20% of what you earn | Investing for retirement or a planned purchase. | on: `+ ₹X` · off: `+ a quarter of the rest` |

---

## Calculating

> WORKING IT OUT
>
> → Checking rents around `<pincode>`.
> · Pulling electricity tariffs for `<State>`.
> · Working out your tax.

---

## Result

**The number**

> `<CITY>` · WHAT YOUR LIFE COSTS
> # ₹72,061
> ## a month, in hand.
> ---
> That is a **₹9.3 lakh** salary, before tax and PF.
> Gross to in-hand assumed at 93% · updated Jun 2026

**Breakdown**

> WHERE IT GOES

Row labels, in definition order: Rent · Food · What you owe · Getting around ·
Bills · The rest of your life · Health · Savings.

"The rest of your life" note, assembled from the toggles:
"Going out, one trip a year, and roughly 8% of your core spend for the things
nobody budgets for: clothes, haircuts, gifts, subscriptions, repairs."
(The opening clause drops whichever toggles are off; with both off it reads
"Roughly 8% of your core spend for…")

Source chip: `Assumption · stated, not sourced`
Detail: "This one is an assumption, not a measurement. 8% of your core spend is
what household surveys typically leave unclassified. Change it and everything else
stays the same."

"Savings" note: "A quarter of everything above, so that a fifth of your take-home
stays yours."
Source chip: `Your choice on the last screen`
Detail: "You turned this on. It is not a cost, it is the difference between
covering your life and building on it."

**The gap**

> THE GAP
>
> you need ₹72,061
> ────────────────────────
> ₹22,000 · median urban salaried
>
> Your number sits above 91% of salaried earners in urban India. Half of them take home under ₹22,000 a month.
>
> Salaried income distribution, urban India · 2026

**The unexpected line**

> ONE THING YOU DIDN'T ASK ABOUT
> ## You will spend ₹1,20,000 on delivery and eating out next year.

Alternatives, one is chosen automatically:
- "Rent is 34% of your take-home. The rule of thumb is 25%."
- "What you owe is 29% of everything else you spend."
- "An education loan ends in 2033. That is ₹12,96,000 between now and then."

**Share**

> [ Copy my link ] → "Link copied"
> [ Change my answers ]
> The link carries your answers, not your pincode.

**Footer**

> Methodology and sources

---

## Rules for anyone writing more of this

- Every number carries a source. If it is an assumption, the chip says
  "Assumption · stated, not sourced" and the detail says so in plain words. Never
  dress an assumption as a measurement.
- Never round a rupee figure in copy that the model shows exactly elsewhere.
- Indian digit grouping everywhere: ₹1,20,000, not ₹120,000.
- Lakh and crore for large figures, one decimal place: "₹9.3 lakh".
- No emoji. The one `:))` on the debt screen is a deliberate exception and the only
  informal mark in the product.
- Sentence case in body copy, uppercase only in eyebrows and source chips.
