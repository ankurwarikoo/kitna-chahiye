# Cost model

Everything the product displays comes out of this. Read it before writing
calculation code.

**Every figure in this document is invented.** They are internally consistent and
sized to be plausible, but none of them is sourced. They exist so the prototype
produces believable numbers. Replace them with real data before launch, and keep
the "last updated" date on each source chip honest as you do.

---

## 1. Location

The pincode's **first two digits** select a city. Each city carries a **rent
index** where Bengaluru = 1.00.

| Prefix | City | State | Rent index |
|---|---|---|---|
| 40 | Mumbai | Maharashtra | 1.55 |
| 12 | Gurugram | Haryana | 1.25 |
| 11 | Delhi | Delhi | 1.15 |
| 20 | Noida | Uttar Pradesh | 1.00 |
| 56 | Bengaluru | Karnataka | 1.00 |
| 41 | Pune | Maharashtra | 0.85 |
| 50 | Hyderabad | Telangana | 0.80 |
| 60 | Chennai | Tamil Nadu | 0.80 |
| 70 | Kolkata | West Bengal | 0.70 |
| 14 | Chandigarh | Punjab | 0.65 |
| 38 | Ahmedabad | Gujarat | 0.60 |
| 39 | Surat | Gujarat | 0.55 |
| 30 | Jaipur | Rajasthan | 0.55 |
| 68 | Kochi | Kerala | 0.55 |
| 44 | Nagpur | Maharashtra | 0.50 |
| 57 | Mysuru | Karnataka | 0.50 |
| 64 | Coimbatore | Tamil Nadu | 0.50 |
| 45 | Indore | Madhya Pradesh | 0.50 |
| 78 | Guwahati | Assam | 0.50 |
| 24 | Dehradun | Uttarakhand | 0.50 |
| 46 | Bhopal | Madhya Pradesh | 0.45 |
| 22 | Lucknow | Uttar Pradesh | 0.45 |
| 75 | Bhubaneswar | Odisha | 0.45 |
| 80 | Patna | Bihar | 0.40 |

Unrecognised or incomplete pincode: name "your city", state "your state", rent
index **0.50**, and the UI offers the six fallback city chips.

This is a 24-row stand-in for a real pincode-to-rent-band data set. A real one
should key on more than the first two digits — rent inside Mumbai varies more than
rent between two tier-2 cities.

### Two indices

```
rentIndex  = the table value
costIndex  = 0.78 + 0.22 × rentIndex
```

Rent scales fully with the city. Everything else scales at 22% of it — a dosa costs
more in Mumbai than in Patna, but not 3.9× more. `costIndex` therefore runs 0.87
(Patna) to 1.12 (Mumbai) against Bengaluru's 1.00.

### Pricing a chosen option

```
priced(base, index) = round(base × index / 100) × 100
```

Rounded to the nearest ₹100 so the interface never shows a figure like ₹23,847 that
implies precision the model does not have. Rent uses `rentIndex`; every other
category uses `costIndex`.

---

## 2. Base figures

Monthly, at index 1.00 (Bengaluru). These are the numbers shown against each option
on the quiz screens, city-adjusted live.

**Roof** — uses `rentIndex`

| Option | Base |
|---|---|
| With family | 2,500 |
| PG or shared room | 11,000 |
| 1BHK, alone | 24,000 |
| 2BHK, alone | 36,000 |
| 2BHK, prime area | 55,000 |

**Getting around**

| Option | Base |
|---|---|
| I work from home | 500 |
| Metro or bus | 1,800 |
| Two-wheeler | 3,200 |
| Cabs and autos | 7,500 |
| Car | 14,000 |

**Food, base** (groceries, gas, tiffin)

| Option | Base |
|---|---|
| I cook most days | 5,200 |
| I cook sometimes | 7,800 |
| I mostly do not cook | 12,500 |

**Food, delivery and eating out**

| Option | Base |
|---|---|
| Rarely | 1,500 |
| Once a week | 4,200 |
| Two or three times a week | 8,500 |
| Most days | 14,000 |

**Bills**

| Option | Base |
|---|---|
| Bare minimum | 2,400 |
| AC in summer | 3,800 |
| AC most of the year | 6,200 |

**Health**

| Option | Base |
|---|---|
| Nothing regular | 900 |
| A gym membership | 2,600 |
| Gym, a sport, therapy | 5,600 |

**Comfort toggles** (screen nine)

| Toggle | Base | Notes |
|---|---|---|
| Going out without checking the bill | 4,500 | city-adjusted |
| One real trip a year | 6,250 | city-adjusted. ₹75,000 a year spread over twelve months |
| Saving 20% of what you earn | — | a percentage, see below |

**Debt presets** — *not* city-adjusted, and only used when the user leaves the
field blank

| Row | Preset |
|---|---|
| An education loan | 12,000 |
| A vehicle EMI | 9,000 |
| A card balance I keep rolling | 6,000 |
| Another loan | 15,000 |

---

## 3. The calculation

```
rent      = priced(roof.base,      rentIndex)
commute   = priced(commute.base,   costIndex)
foodBase  = priced(foodBase.base,  costIndex)
foodFun   = priced(foodFun.base,   costIndex)
bills     = priced(bills.base,     costIndex)
body      = priced(body.base,      costIndex)

debt      = Σ over each selected debt row of (typed EMI, or its preset if blank)

core      = rent + commute + foodBase + foodFun + bills + body
misc      = round(core × 0.08 / 100) × 100

out       = toggle on ? priced(4500, costIndex) : 0
trip      = toggle on ? priced(6250, costIndex) : 0

preSave   = core + misc + debt + out + trip
save      = toggle on ? round(preSave × 0.25 / 100) × 100 : 0

TOTAL     = preSave + save
SALARY    = TOTAL × 12 / 0.93
```

### Why `misc` is 8%

It is the things nobody budgets for: clothes, haircuts, gifts, subscriptions,
repairs. It is an **assumption, not a measurement**, and its source chip says so in
those words. Do not dress it up as sourced. 8% of core spend is roughly what
household surveys leave unclassified.

### Why savings is 25% of the rest

The toggle says "Saving 20% of what you earn". Adding 25% on top of everything else
makes savings exactly 20% of the resulting total:

```
save = 0.25 × preSave        total = preSave + save = 1.25 × preSave
save / total = 0.25 / 1.25 = 20%
```

This is the one place where the arithmetic is not the same as the copy, and it is
deliberate. Getting it wrong by using 20% of `preSave` makes savings 16.7% of the
total and the label a lie.

### Gross to in-hand at 93%

`SALARY = TOTAL × 12 / 0.93` treats in-hand as 93% of gross. It is a single blunt
constant standing in for the new-regime slab table plus employee PF. **Replace it
with a real tax calculation** — it is the second-most quoted number on the result
screen and the one most likely to be argued with. Whatever replaces it needs its
own dated source chip.

---

## 4. Breakdown grouping

The result screen shows eight possible lines, built from the model:

| Line | Amount | Colour |
|---|---|---|
| Rent | `rent` | `#E14B33` |
| Food | `foodBase + foodFun` | `#463E31` |
| What you owe | `debt` | `#6F6557` |
| Getting around | `commute` | `#938876` |
| Bills | `bills` | `#B9AE9B` |
| The rest of your life | `out + trip + misc` | `#DFD3BC` |
| Health | `body` | `#EFE6D5` |
| Savings | `save` | `#F6EFE2` |

Lines with a zero amount are dropped entirely. The rest sort by amount descending,
largest segment first, and the bar and the list use the same order.

Percentages are `round(amount / TOTAL × 100)`. They can sum to slightly off 100 —
that is fine and better than fabricating precision.

Each line's expanded note is written from the user's actual answers, not a generic
template. See `COPY.md` for the sentence fragments each option contributes.

---

## 5. The gap

Two markers on one axis, positioned logarithmically because income is
log-distributed and a linear axis would bunch everyone at the left edge.

```
lo   = ln(12,000)
hi   = ln(260,000)
p    = (ln(clamp(value, 12000, 260000)) - lo) / (hi - lo)
left = 8% + p × 84%
```

The 8%/84% inset keeps the labels from running off either edge on a 412px screen.

**Median urban salaried take-home: ₹22,000/month.** Invented. Replace with a real
PLFS or equivalent figure and date the chip accordingly.

### Percentile

Piecewise-logarithmic interpolation through this table:

| Monthly in-hand | Percentile |
|---|---|
| 10,000 | 20 |
| 22,000 | 50 |
| 38,000 | 75 |
| 62,000 | 90 |
| 95,000 | 95 |
| 1,85,000 | 99 |

Below ₹10,000 returns 15. Above ₹1,85,000 returns 99.4 — the curve is not
extrapolated past the top of the table, because the tail is where an invented curve
would produce absurd claims.

Sentence: *"Your number sits above `<pc>`% of salaried earners in urban India. Half
of them take home under ₹22,000 a month."*

---

## 6. The unexpected line

Candidates are scored and the highest-scoring one is shown. Score is "how far past
normal is this", so the line that appears is whichever fact about them is most
extreme.

| Candidate | Score | Line |
|---|---|---|
| Delivery spend | `foodFun × 12 / 60,000` | "You will spend ₹X on delivery and eating out next year." |
| Rent share | `(rent / TOTAL) / 0.25` | "Rent is X% of your take-home. The rule of thumb is 25%." |
| Debt share *(only if debt > 0)* | `(debt / (TOTAL − debt)) / 0.15` | "What you owe is X% of everything else you spend." |
| Loan end *(only if a years-left value was given)* | `1.4` | "`<loan>` ends in `<2026 + years>`. That is ₹X between now and then." |

The loan-end line uses the first debt row that has a years-left value, and its
total is `EMI × 12 × years`. Its fixed score of 1.4 means it wins unless something
else is genuinely extreme — it is the nicest sentence the product can show a
24-year-old, so it is weighted to surface often.

Add candidates freely, but keep the rule: one line, auto-selected, never a list.

---

## 7. What must be replaced before launch

In rough order of how much trouble each will cause:

1. **The 93% gross-to-in-hand constant.** Needs a real slab and PF calculation.
2. **Rent bands.** The whole product rests on these, and a two-digit pincode
   prefix is far too coarse.
3. **The median and the percentile curve.** Both are the emotional payload, and
   both are currently invented.
4. **State electricity tariffs.** Currently a flat national assumption dressed as a
   state figure — the copy names the state, so the number needs to actually vary by
   state.
5. **Fuel and fare rates.** Same problem, smaller stakes.
6. **Debt presets.** These only appear as placeholders and fall back gracefully, so
   they are the least urgent.
7. **The 8% miscellaneous.** This one can stay an assumption forever, as long as it
   keeps saying so.

Every one of these needs a "last updated" date that the source chip displays, and a
plan for who refreshes it and how often. The correction link on the rent row is the
intake for the first of these — it is a data pipeline, not a support form, and it
should write somewhere a human actually looks.
