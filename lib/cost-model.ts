// Cost model — ported verbatim from COST_MODEL.md.
//
// Every rupee figure the product shows comes out of this file. All the numbers
// here are the invented, internally-consistent stand-ins described in
// COST_MODEL.md. They must be replaced with sourced data before launch; when you
// do, keep the "last updated" date on each source chip honest.
//
// The model is decoupled from the pincode on purpose: callers resolve a pincode
// into a `City` (client-side, so the pincode never leaves the device) and the
// shareable token carries the resolved city key, never the six digits.

export type DebtKey = "edu" | "vehicle" | "card" | "other";
export type ToggleKey = "out" | "trip" | "save";

export interface DebtEntry {
  on: boolean;
  /** digits only, "" means the user left it blank (fall back to preset) */
  emi: string;
  /** digits only, "" means unanswered */
  yrs: string;
}

/**
 * Who this earner is covering. Defaults to "just me" (no partner, no kids, no
 * dependent parents), which reproduces the individual model exactly — so every
 * pre-existing shared link still opens.
 *
 * Family costs are NOT a flat multiple of household size. Different categories
 * scale very differently, so we apply a category-specific equivalence weight
 * (an OECD-modified-scale style assumption: first adult 1.0, extra adult +0.5,
 * child +0.3) rather than ×N. This is a stated assumption, surfaced as such.
 */
export interface Household {
  /** a partner/spouse who shares the home and its costs */
  partner: boolean;
  /** ages of children, e.g. [3, 8]; length is the number of kids */
  kidsAges: number[];
  /** number of dependent parents (0–2) */
  parents: number;
  /** optional override of the monthly kids cost; "" falls back to the derived figure */
  kidsCost: string;
  /** optional override of the monthly parents cost; "" falls back to the derived figure */
  parentsCost: string;
}

export interface Answers {
  /** digits only, clamped 18–70 on blur */
  age: string;
  /** two-digit city prefix, or "" when unknown (falls back to the 0.50 index) */
  cityKey: string;
  roof: number;
  commute: number;
  foodBase: number;
  foodFun: number;
  bills: number;
  body: number;
  d: Record<DebtKey, DebtEntry>;
  t: Record<ToggleKey, boolean>;
  household: Household;
}

export interface City {
  name: string;
  state: string;
  /** rent index, Bengaluru = 1.00 */
  idx: number;
  known: boolean;
}

// --- Location -------------------------------------------------------------
// The pincode's first two digits select a city. Each city carries a rent index.
// 24-row stand-in for a real pincode-to-rent-band data set.
export const CITY_TABLE: Record<string, [name: string, state: string, idx: number]> = {
  "40": ["Mumbai", "Maharashtra", 1.55],
  "41": ["Pune", "Maharashtra", 0.85],
  "44": ["Nagpur", "Maharashtra", 0.5],
  "11": ["Delhi", "Delhi", 1.15],
  "12": ["Gurugram", "Haryana", 1.25],
  "20": ["Noida", "Uttar Pradesh", 1.0],
  "56": ["Bengaluru", "Karnataka", 1.0],
  "57": ["Mysuru", "Karnataka", 0.5],
  "50": ["Hyderabad", "Telangana", 0.8],
  "60": ["Chennai", "Tamil Nadu", 0.8],
  "64": ["Coimbatore", "Tamil Nadu", 0.5],
  "70": ["Kolkata", "West Bengal", 0.7],
  "38": ["Ahmedabad", "Gujarat", 0.6],
  "39": ["Surat", "Gujarat", 0.55],
  "30": ["Jaipur", "Rajasthan", 0.55],
  "45": ["Indore", "Madhya Pradesh", 0.5],
  "46": ["Bhopal", "Madhya Pradesh", 0.45],
  "22": ["Lucknow", "Uttar Pradesh", 0.45],
  "80": ["Patna", "Bihar", 0.4],
  "75": ["Bhubaneswar", "Odisha", 0.45],
  "68": ["Kochi", "Kerala", 0.55],
  "14": ["Chandigarh", "Punjab", 0.65],
  "78": ["Guwahati", "Assam", 0.5],
  "24": ["Dehradun", "Uttarakhand", 0.5],
};

const UNKNOWN_CITY: City = { name: "your city", state: "your state", idx: 0.5, known: false };

/** Resolve a six-digit pincode into a City, entirely client-side. */
export function cityFromPin(pin: string): City {
  const p = (pin || "").trim();
  const hit = CITY_TABLE[p.slice(0, 2)];
  if (p.length === 6 && hit) return { name: hit[0], state: hit[1], idx: hit[2], known: true };
  return { ...UNKNOWN_CITY };
}

/** Resolve a stored two-digit city key (from a shared link) into a City. */
export function cityFromKey(key: string): City {
  const hit = CITY_TABLE[(key || "").slice(0, 2)];
  if (hit) return { name: hit[0], state: hit[1], idx: hit[2], known: true };
  return { ...UNKNOWN_CITY };
}

// --- Options --------------------------------------------------------------

export interface Option {
  label: string;
  sub: string;
  /** base monthly figure at index 1.00 (Bengaluru) */
  v: number;
  /** breakdown note fragment, with {city} / {state} placeholders */
  n: string;
}

export type QuestionKey =
  | "who"
  | "household"
  | "roof"
  | "commute"
  | "foodBase"
  | "foodFun"
  | "bills"
  | "body"
  | "children"
  | "parents"
  | "debt"
  | "comfort";

export interface Question {
  key: QuestionKey;
  eyebrow: string;
  title: string;
  sub: string;
  opts?: Option[];
  debt?: boolean;
  household?: boolean;
  /** an editable family-cost screen (children or parents) */
  familyCost?: "children" | "parents";
}

export const QUESTIONS: Question[] = [
  { key: "who", eyebrow: "One of nine", title: "Where are you living?", sub: "Rent is the whole game, and it is local." },
  {
    key: "household",
    eyebrow: "Your household",
    title: "Who are you covering?",
    sub: "The numbers change a lot with a family. Just you by default.",
    household: true,
  },
  {
    key: "roof",
    eyebrow: "Two of nine",
    title: "How do you live?",
    sub: "Rent plus maintenance. Deposit not counted.",
    opts: [
      { label: "With family / Own house", sub: "You contribute something", v: 2500, n: "You live with family in {city} and put something into the house every month." },
      { label: "PG or shared room", sub: "Your share of a flat", v: 11000, n: "Your share of a PG or a shared flat in {city}, including maintenance." },
      { label: "Rent 1BHK, alone", sub: "Decent building, okay locality", v: 24000, n: "A one-bedroom flat to yourself in {city}, including maintenance." },
      { label: "Rent 2BHK, alone", sub: "Space for a desk and guests", v: 36000, n: "A two-bedroom flat to yourself in {city}, including maintenance." },
      { label: "Rent 2BHK, prime area", sub: "The address people recognise", v: 55000, n: "A two-bedroom flat in a prime part of {city}, including maintenance." },
    ],
  },
  {
    key: "commute",
    eyebrow: "Three of nine",
    title: "How do you get to work?",
    sub: "Fuel, fares, servicing, parking.",
    opts: [
      { label: "I work from home", sub: "Occasional trips out", v: 500, n: "You work from home, so this is only the occasional trip out." },
      { label: "Metro or bus", sub: "Daily pass or monthly card", v: 1800, n: "A monthly metro or bus pass at current {state} fares." },
      { label: "Two-wheeler", sub: "Petrol, service, insurance", v: 3200, n: "A two-wheeler: petrol, servicing and insurance at current {state} rates." },
      { label: "Cabs and autos", sub: "Both ways, most days", v: 7500, n: "Cabs and autos both ways on most days, at current {state} fares." },
      { label: "Car", sub: "Fuel, EMI-free but not free", v: 14000, n: "A car: fuel, servicing, insurance and parking at current {state} rates. Any EMI is counted separately." },
    ],
  },
  {
    key: "foodBase",
    eyebrow: "Four of nine",
    title: "Does the kitchen get used?",
    sub: "Groceries, milk, the cook or the tiffin.",
    opts: [
      { label: "I cook most days", sub: "Groceries and gas", v: 5200, n: "Groceries and gas for someone who cooks most days" },
      { label: "I cook sometimes", sub: "Groceries plus a tiffin service", v: 7800, n: "Groceries plus a tiffin service" },
      { label: "I mostly do not cook", sub: "Tiffin, milk, and whatever is quick", v: 12500, n: "Tiffin, milk and whatever is quick, for a kitchen that mostly stays shut" },
    ],
  },
  {
    key: "foodFun",
    eyebrow: "Five of nine",
    title: "How often do you order food or grocery?",
    sub: "Delivery apps and eating out, both counted.",
    opts: [
      { label: "Rarely", sub: "A treat, not a habit", v: 1500, n: "plus the rare meal out." },
      { label: "Once a week", sub: "Friday is Friday", v: 4200, n: "plus about one delivery or meal out a week." },
      { label: "Two or three times a week", sub: "Plus a weekend dinner out", v: 8500, n: "plus two or three deliveries or meals out a week." },
      { label: "Most days", sub: "The app knows your address by heart", v: 14000, n: "plus something ordered in or eaten out on most days." },
    ],
  },
  {
    key: "bills",
    eyebrow: "Six of nine",
    title: "What do the bills look like?",
    sub: "Electricity, internet, phone, gas, water.",
    opts: [
      { label: "Bare minimum", sub: "Fan, lights, one broadband line", v: 2400, n: "Fans, lights and one broadband line, at the {state} slab tariff, plus phone and gas." },
      { label: "AC in summer", sub: "Three or four heavy months", v: 3800, n: "An AC running three or four months a year, at the {state} slab tariff, plus broadband, phone and gas." },
      { label: "AC most of the year", sub: "And a second connection", v: 6200, n: "An AC running most of the year, at the {state} slab tariff, plus two connections, phone and gas." },
    ],
  },
  {
    key: "body",
    eyebrow: "Seven of nine",
    title: "What do you spend on your body?",
    sub: "Gym, sport, therapy, medicines, insurance premium.",
    opts: [
      { label: "Nothing regular", sub: "Medicines when something goes wrong", v: 900, n: "No gym and no regular treatment. Medicines and the occasional consultation, nothing else." },
      { label: "A gym membership", sub: "Plus health insurance premium", v: 2600, n: "A gym membership, plus an individual health insurance premium." },
      { label: "Gym, a sport, therapy", sub: "You treat it as non-negotiable", v: 5600, n: "A gym, a sport and therapy, plus an individual health insurance premium." },
    ],
  },
  {
    key: "children",
    eyebrow: "Your kids",
    title: "What do the kids cost?",
    sub: "School fees, care, activities, health. Both counted.",
    familyCost: "children",
  },
  {
    key: "parents",
    eyebrow: "Your parents",
    title: "Supporting your parents?",
    sub: "Everyday support and a senior health cover.",
    familyCost: "parents",
  },
  { key: "debt", eyebrow: "Eight of nine", title: "What do you owe every month?", sub: "EMIs and anything you are carrying on a card. Pick all that apply.", debt: true },
  { key: "comfort", eyebrow: "Nine of nine", title: "What does comfortable mean to you?", sub: "This is where you set the standard, not us." },
];

// A step-key → model-component map used by the running meter, plus the dynamic
// screen order. Children/parents only appear when the household has them.
export function stepKeys(a: Answers): QuestionKey[] {
  const hasKids = a.household.kidsAges.length > 0;
  const hasParents = a.household.parents > 0;
  const keys: QuestionKey[] = ["who", "household", "roof", "commute", "foodBase", "foodFun", "bills", "body"];
  if (hasKids) keys.push("children");
  if (hasParents) keys.push("parents");
  keys.push("debt", "comfort");
  return keys;
}

export function questionByKey(key: QuestionKey): Question {
  return QUESTIONS.find((q) => q.key === key)!;
}

export interface DebtDef {
  k: DebtKey;
  label: string;
  sub: string;
  /** preset EMI, used only when the user leaves the field blank; not city-adjusted */
  v: number;
  years?: boolean;
}

export const DEBT_DEFS: DebtDef[] = [
  { k: "edu", label: "An education loan", sub: "The most common one at your age", v: 12000, years: true },
  { k: "vehicle", label: "A Car/Bike Loan", sub: "Bike or car", v: 9000, years: true },
  { k: "card", label: "A credit card monthly spend", sub: "Minimum due, every month", v: 6000 },
  { k: "other", label: "Personal (or any other) loan", sub: "Personal, home, family, anything else", v: 15000, years: true },
];

export interface ToggleDef {
  key: ToggleKey;
  label: string;
  sub: string;
  /** base monthly figure, or "pct20" for the savings toggle */
  v: number | "pct20";
}

export const TOGGLE_DEFS: ToggleDef[] = [
  { key: "out", label: "Going out without checking the bill", sub: "Drinks, films, birthdays, the round you insist on paying for.", v: 4500 },
  { key: "trip", label: "One real trip a year", sub: "Flights, a decent room, seven days off. Spread across twelve months.", v: 6250 },
  { key: "save", label: "Saving 20% of what you earn", sub: "Investing for retirement or a planned purchase.", v: "pct20" },
];

// --- Defaults -------------------------------------------------------------

/** A single-choice answer that the user has not made yet. Prices to ₹0. */
export const UNANSWERED = -1;

export function defaultAnswers(): Answers {
  return {
    age: "",
    cityKey: "56", // fallback city for pre-cityKey shared links (Bengaluru)
    // Start every choice unanswered so the running meter only adds a category
    // once the user actually picks it — nothing is assumed on their behalf.
    roof: UNANSWERED,
    commute: UNANSWERED,
    foodBase: UNANSWERED,
    foodFun: UNANSWERED,
    bills: UNANSWERED,
    body: UNANSWERED,
    d: {
      edu: { on: false, emi: "", yrs: "" },
      vehicle: { on: false, emi: "", yrs: "" },
      card: { on: false, emi: "", yrs: "" },
      other: { on: false, emi: "", yrs: "" },
    },
    t: { out: true, trip: true, save: true },
    household: { partner: false, kidsAges: [], parents: 0, kidsCost: "", parentsCost: "" },
  };
}

// --- Household equivalence weights ---------------------------------------
// Per-category multipliers relative to a single person (= 1.0). These are a
// stated assumption, not measured — surfaced as such on the family lines.

/** Total people in the household, for plain-English messaging. */
export function householdSize(h: Household): number {
  return 1 + (h.partner ? 1 : 0) + h.parents + h.kidsAges.length;
}

/** True once the household is anything other than "just me". */
export function hasFamily(h: Household): boolean {
  return h.partner || h.parents > 0 || h.kidsAges.length > 0;
}

function foodKidWeight(age: number): number {
  return age < 6 ? 0.3 : age < 14 ? 0.6 : 0.8;
}

/** Rent steps by rooms needed, not by headcount. */
function rentMult(h: Household): number {
  const rooms = 1 + (h.kidsAges.length > 0 ? Math.ceil(h.kidsAges.length / 2) : 0) + (h.parents > 0 ? 1 : 0);
  return 1 + 0.45 * (rooms - 1) + (h.partner ? 0.15 : 0);
}

function foodMult(h: Household): number {
  return 1 + 0.6 * (h.partner ? 1 : 0) + 0.6 * h.parents + h.kidsAges.reduce((s, a) => s + foodKidWeight(a), 0);
}

function billsMult(h: Household): number {
  return 1 + 0.2 * ((h.partner ? 1 : 0) + h.parents) + 0.15 * h.kidsAges.length;
}

// Parents' own health is a separate line, so this covers self + partner + kids.
function healthMult(h: Household): number {
  return 1 + 0.8 * (h.partner ? 1 : 0) + h.kidsAges.reduce((s, a) => s + (a < 5 ? 0.7 : 0.4), 0);
}

export function lifeMult(h: Household): number {
  return 1 + 0.4 * (h.partner ? 1 : 0) + 0.2 * h.kidsAges.length + 0.3 * h.parents;
}

/** The family multiplier applied to a given quiz category. */
export function familyMult(key: QuestionKey, h: Household): number {
  switch (key) {
    case "roof":
      return rentMult(h);
    case "foodBase":
    case "foodFun":
      return foodMult(h);
    case "bills":
      return billsMult(h);
    case "body":
      return healthMult(h);
    default:
      return 1;
  }
}

// --- Children and parents costs ------------------------------------------
// Base monthly figures at index 1.00 (Bengaluru), city-adjusted with costIdx.
// Invented, plausible stand-ins — replace with a sourced schooling/care basket.

function childBase(age: number): number {
  if (age < 4) return 15000; // daycare / creche
  if (age < 6) return 9000; // preschool
  if (age < 18) return 12000; // school: fees, books, transport, tuition
  return 20000; // college / higher education
}

/** Derived monthly kids cost, summed per child and city-adjusted. A child whose
 *  age has not been entered yet contributes nothing until it is. */
export function childrenDerived(a: Answers, c: City): number {
  const costIdx = 0.78 + 0.22 * c.idx;
  return a.household.kidsAges.reduce((s, age) => (age < 0 ? s : s + Math.round((childBase(age) * costIdx) / 100) * 100), 0);
}

/** Derived monthly parents cost: everyday support (city-adjusted) + a flat senior health premium, per parent. */
export function parentsDerived(a: Answers, c: City): number {
  const costIdx = 0.78 + 0.22 * c.idx;
  const perParent = Math.round((8000 * costIdx) / 100) * 100 + 6000;
  return a.household.parents * perParent;
}

export function childrenCost(a: Answers, c: City): number {
  if (a.household.kidsAges.length === 0) return 0;
  const typed = parseInt(digitsOnly(a.household.kidsCost), 10);
  return isNaN(typed) ? childrenDerived(a, c) : typed;
}

export function parentsCost(a: Answers, c: City): number {
  if (a.household.parents === 0) return 0;
  const typed = parseInt(digitsOnly(a.household.parentsCost), 10);
  return isNaN(typed) ? parentsDerived(a, c) : typed;
}

// --- Formatting -----------------------------------------------------------

/** ₹ with Indian digit grouping, e.g. ₹1,20,000. */
export function fmt(n: number): string {
  return "\u20B9" + Math.round(n).toLocaleString("en-IN");
}

/** Lakh with one decimal place, e.g. ₹9.3 lakh. */
export function lakh(n: number): string {
  return "\u20B9" + (n / 100000).toFixed(1) + " lakh";
}

export function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Digits regrouped in the Indian style for display inside an input. */
export function grouped(s: string): string {
  const d = digitsOnly(s);
  return d ? parseInt(d, 10).toLocaleString("en-IN") : "";
}

// --- The calculation ------------------------------------------------------

export function ageNum(age: string): number {
  const n = parseInt(digitsOnly(age), 10);
  return isNaN(n) ? 26 : Math.max(18, Math.min(70, n));
}

/** Rent uses the raw rent index; everything else uses the cost index. */
function idxFor(key: string, c: City): number {
  return key === "roof" ? c.idx : 0.78 + 0.22 * c.idx;
}

/**
 * priced(base, index, familyMult) = round(base × index × mult / 100) × 100.
 * Rounded to the nearest ₹100. `h` scales the figure for household size.
 */
export function priced(key: Question["key"], optIndex: number, c: City, h?: Household): number {
  const q = QUESTIONS.find((x) => x.key === key);
  const o = q?.opts?.[optIndex];
  if (!o) return 0;
  const mult = h ? familyMult(key, h) : 1;
  return Math.round((o.v * idxFor(key, c) * mult) / 100) * 100;
}

function debtRow(a: Answers, k: DebtKey): DebtEntry {
  return (a.d && a.d[k]) || { on: false, emi: "", yrs: "" };
}

/** The monthly figure a selected debt row contributes (typed EMI, or preset). */
export function debtOf(a: Answers, k: DebtKey): number {
  const row = debtRow(a, k);
  const def = DEBT_DEFS.find((x) => x.k === k)!;
  if (!row.on) return 0;
  const typed = parseInt(digitsOnly(row.emi), 10);
  return isNaN(typed) ? def.v : typed;
}

export function debtOn(a: Answers): DebtDef[] {
  return DEBT_DEFS.filter((d) => debtRow(a, d.k).on);
}

export function debtTotal(a: Answers): number {
  return DEBT_DEFS.reduce((s, d) => s + debtOf(a, d.k), 0);
}

export interface Model {
  c: City;
  rent: number;
  commute: number;
  foodBase: number;
  foodFun: number;
  bills: number;
  body: number;
  debt: number;
  children: number;
  parents: number;
  core: number;
  misc: number;
  out: number;
  trip: number;
  save: number;
  total: number;
  food: number;
  life: number;
  salary: number;
}

export function model(a: Answers, city: City): Model {
  const c = city;
  const h = a.household;
  const costIdx = 0.78 + 0.22 * c.idx;
  const life = lifeMult(h);
  const rent = priced("roof", a.roof, c, h);
  const commute = priced("commute", a.commute, c, h);
  const foodBase = priced("foodBase", a.foodBase, c, h);
  const foodFun = priced("foodFun", a.foodFun, c, h);
  const bills = priced("bills", a.bills, c, h);
  const body = priced("body", a.body, c, h);
  const debt = debtTotal(a);
  const children = childrenCost(a, c);
  const parents = parentsCost(a, c);
  const core = rent + commute + foodBase + foodFun + bills + body;
  const misc = Math.round((core * 0.08) / 100) * 100;
  // Comfort spend scales mildly with the household too.
  const out = a.t.out ? Math.round((4500 * costIdx * life) / 100) * 100 : 0;
  const trip = a.t.trip ? Math.round((6250 * costIdx * life) / 100) * 100 : 0;
  const preSave = core + misc + debt + children + parents + out + trip;
  // 25% on top of the rest makes savings exactly 20% of the resulting total.
  const save = a.t.save ? Math.round((preSave * 0.25) / 100) * 100 : 0;
  const total = preSave + save;
  // 93% in-hand: a single blunt constant standing in for slabs + PF. Replace me.
  const salary = (total * 12) / 0.93;
  return {
    c,
    rent,
    commute,
    foodBase,
    foodFun,
    bills,
    body,
    debt,
    children,
    parents,
    core,
    misc,
    out,
    trip,
    save,
    total,
    food: foodBase + foodFun,
    life: out + trip + misc,
    salary,
  };
}

/** The model amount a given step reveals into the running meter. */
export function stepAmount(key: QuestionKey, m: Model): number {
  switch (key) {
    case "roof":
      return m.rent;
    case "commute":
      return m.commute;
    case "foodBase":
      return m.foodBase;
    case "foodFun":
      return m.foodFun;
    case "bills":
      return m.bills;
    case "body":
      return m.body;
    case "children":
      return m.children;
    case "parents":
      return m.parents;
    case "debt":
      return m.debt;
    case "comfort":
      return m.out + m.trip + m.save + m.misc;
    default:
      return 0;
  }
}

/**
 * The running meter only includes what the user has actually seen. `seen` is the
 * high-water index into the current dynamic step list.
 */
export function partialTotal(a: Answers, m: Model, seen: number): number {
  const keys = stepKeys(a);
  let t = 0;
  for (let i = 1; i <= seen && i < keys.length; i++) t += stepAmount(keys[i], m);
  return t;
}

// --- The gap --------------------------------------------------------------

/** Median urban salaried take-home. Invented — replace with a PLFS-equivalent. */
export const MEDIAN_TAKE_HOME = 22000;

/** Piecewise-logarithmic percentile through the invented distribution table. */
export function percentile(x: number): number {
  const t: [number, number][] = [
    [10000, 20],
    [22000, 50],
    [38000, 75],
    [62000, 90],
    [95000, 95],
    [185000, 99],
  ];
  if (x <= t[0][0]) return 15;
  for (let i = 1; i < t.length; i++) {
    if (x <= t[i][0]) {
      const [x0, p0] = t[i - 1];
      const [x1, p1] = t[i];
      return p0 + (p1 - p0) * (Math.log(x / x0) / Math.log(x1 / x0));
    }
  }
  return 99.4;
}

/** Logarithmic axis position, inset 8%/84% to keep labels on-screen. */
export function logPos(v: number): string {
  const lo = Math.log(12000);
  const hi = Math.log(260000);
  const p = (Math.log(Math.max(12000, Math.min(260000, v))) - lo) / (hi - lo);
  return (8 + p * 84).toFixed(1) + "%";
}

// --- The unexpected line --------------------------------------------------

/** Highest-scoring candidate wins: the most extreme fact about them. */
export function insightLine(a: Answers, m: Model): string {
  const rentPct = m.rent / m.total;
  const foodYr = m.foodFun * 12;
  const cands: { s: number; text: string }[] = [
    { s: foodYr / 60000, text: "You will spend " + fmt(foodYr) + " on delivery and eating out next year." },
    { s: rentPct / 0.25, text: "Rent is " + Math.round(rentPct * 100) + "% of your take-home. The rule of thumb is 25%." },
  ];
  if (m.children > 0) {
    const kidsPct = m.children / m.total;
    const yr = m.children * 12;
    cands.push({ s: kidsPct / 0.2, text: "Raising your kids runs " + fmt(yr) + " a year — " + Math.round(kidsPct * 100) + "% of your take-home." });
  }
  if (m.parents > 0) {
    const parentsYr = m.parents * 12;
    cands.push({ s: (m.parents / m.total) / 0.12, text: "Supporting your parents is " + fmt(parentsYr) + " a year." });
  }
  if (m.debt > 0) {
    const debtPct = m.debt / (m.total - m.debt);
    cands.push({ s: debtPct / 0.15, text: "What you owe is " + Math.round(debtPct * 100) + "% of everything else you spend." });
    const withYrs = debtOn(a).filter((d) => parseInt(digitsOnly(debtRow(a, d.k).yrs), 10) > 0);
    if (withYrs.length) {
      const first = withYrs[0];
      const y = parseInt(digitsOnly(debtRow(a, first.k).yrs), 10);
      const name = first.label.replace(/^An? /, "").replace(/^A /, "");
      cands.push({ s: 1.4, text: name + " ends in " + (2026 + y) + ". That is " + fmt(debtOf(a, first.k) * 12 * y) + " between now and then." });
    }
  }
  cands.sort((x, y) => y.s - x.s);
  return cands[0].text;
}

export function gapLine(m: Model): string {
  const pc = percentile(m.total);
  return (
    "Your number sits above " +
    pc.toFixed(0) +
    "% of salaried earners in urban India. Half of them take home under " +
    fmt(MEDIAN_TAKE_HOME) +
    " a month."
  );
}

// --- Breakdown grouping ---------------------------------------------------

export interface BreakdownRow {
  k: string;
  label: string;
  amt: number;
  color: string;
  note: string;
  src: string;
  srcDetail: string;
  isRent?: boolean;
}

function fillPlaceholders(s: string, c: City): string {
  return (s || "").split("{city}").join(c.name).split("{state}").join(c.state);
}

/**
 * Assemble the breakdown rows in definition order, drop zero-amount lines, then
 * sort by amount descending. The bar and the list share this order.
 */
export function breakdownRows(a: Answers, m: Model): BreakdownRow[] {
  const c = m.c;
  const on = debtOn(a);
  const debtNote =
    on.length === 0
      ? ""
      : on
          .map((d) => {
            const y = parseInt(digitsOnly(debtRow(a, d.k).yrs), 10);
            return (
              d.label.replace(/^An /, "an ").replace(/^A /, "a ") +
              " at " +
              fmt(debtOf(a, d.k)) +
              " a month" +
              (y > 0 ? ", ending in " + (2026 + y) : "")
            );
          })
          .join(", and ") + ". Repayments only, not the balances.";

  // Null-safe: an unanswered choice (index -1) has no option; its row is priced
  // at 0 and dropped later, so an empty note here is harmless.
  const opt = (key: QuestionKey, i: number) => questionByKey(key).opts?.[i] ?? { label: "", sub: "", n: "", v: 0 };

  // Disclose the household equivalence scaling on the categories it touches.
  const size = householdSize(a.household);
  const eqNote = hasFamily(a.household)
    ? " Scaled for a household of " + size + " using a standard equivalence assumption (stated, not measured)."
    : "";

  const kidsN = a.household.kidsAges.length;
  const enteredAges = a.household.kidsAges.filter((x) => x >= 0);
  const kidsAgesText = enteredAges.length ? " (age" + (enteredAges.length === 1 ? " " : "s ") + enteredAges.join(", ") + ")" : "";
  const kidsNote =
    kidsN === 0
      ? ""
      : "You told us " +
        kidsN +
        (kidsN === 1 ? " child" : " children") +
        kidsAgesText +
        ". School fees, care, activities and their health, city-adjusted.";
  const parentsN = a.household.parents;
  const parentsNote =
    parentsN === 0
      ? ""
      : "Everyday support for " + parentsN + (parentsN === 1 ? " parent" : " parents") + ", plus an individual senior health cover.";

  const defs: BreakdownRow[] = [
    {
      k: "rent",
      label: "Rent",
      amt: m.rent,
      color: "#E14B33",
      note: fillPlaceholders(opt("roof", a.roof).n, c) + " A deposit is not part of a monthly number." + eqNote,
      src: "Rent index · Jun 2026",
      srcDetail:
        "Median listed rent for this configuration in " +
        c.name +
        ", adjusted to a mid-band locality. Prototype data set, last refreshed June 2026.",
      isRent: true,
    },
    {
      k: "food",
      label: "Food",
      amt: m.food,
      color: "#463E31",
      note: opt("foodBase", a.foodBase).n + ", " + opt("foodFun", a.foodFun).n + "." + eqNote,
      src: "Grocery basket + delivery averages · May 2026",
      srcDetail:
        "Groceries from a 28-item urban basket priced monthly. Delivery averages from published order-value data for metro users. Prototype data set.",
    },
    {
      k: "children",
      label: "Children",
      amt: m.children,
      color: "#8A5A44",
      note: kidsNote,
      src: "School + childcare basket · assumption",
      srcDetail:
        "A stand-in schooling and care basket by age band (daycare, preschool, school, college), city-adjusted. Assumption, not measured — replace with sourced fee data. Where you typed a figure, that is used instead.",
    },
    {
      k: "parents",
      label: "Supporting parents",
      amt: m.parents,
      color: "#7E7663",
      note: parentsNote,
      src: "Elder support + senior premium · assumption",
      srcDetail:
        "Everyday support plus an individual senior health premium per parent, city-adjusted. Assumption, not measured. Where you typed a figure, that is used instead.",
    },
    {
      k: "debt",
      label: "What you owe",
      amt: m.debt,
      color: "#6F6557",
      note: "You told us: " + debtNote,
      src: "Your own numbers",
      srcDetail:
        "These are the figures you entered, not an estimate. Where you left a field blank we used a typical EMI for that loan type at current rates.",
    },
    {
      k: "commute",
      label: "Getting around",
      amt: m.commute,
      color: "#938876",
      note: fillPlaceholders(opt("commute", a.commute).n, c),
      src: "Fuel + fare rates · Jul 2026",
      srcDetail: "State fuel price, transport authority fare tables, and manufacturer service intervals. Prototype data set.",
    },
    {
      k: "bills",
      label: "Bills",
      amt: m.bills,
      color: "#B9AE9B",
      note: fillPlaceholders(opt("bills", a.bills).n, c) + eqNote,
      src: c.state + " tariff · Apr 2026",
      srcDetail:
        "Domestic slab tariff as notified by the state regulator, applied to a usage profile matching your answer. Prototype data set.",
    },
    {
      k: "life",
      label: "The rest of your life",
      amt: m.life,
      color: "#DFD3BC",
      note:
        (a.t.out || a.t.trip
          ? a.t.out && a.t.trip
            ? "Going out, one trip a year, and roughly"
            : a.t.out
              ? "Going out, and roughly"
              : "One trip a year, and roughly"
          : "Roughly") +
        " 8% of your core spend for the things nobody budgets for: clothes, haircuts, gifts, subscriptions, repairs.",
      src: "Assumption · stated, not sourced",
      srcDetail:
        "This one is an assumption, not a measurement. 8% of your core spend is what household surveys typically leave unclassified. Change it and everything else stays the same.",
    },
    {
      k: "body",
      label: "Health",
      amt: m.body,
      color: "#EFE6D5",
      note: opt("body", a.body).n + eqNote,
      src: a.body === 0 ? "Out-of-pocket medical spend · Jan 2026" : "Premium tables · Jan 2026",
      srcDetail:
        a.body === 0
          ? "Reported out-of-pocket medical spend for an adult in your age band with no cover. Prototype data set."
          : "Individual cover premium for a healthy adult in your age band at a 5 lakh sum insured, plus reported out-of-pocket medical spend. Prototype data set.",
    },
    {
      k: "save",
      label: "Savings",
      amt: m.save,
      color: "#F6EFE2",
      note: "A quarter of everything above, so that a fifth of your take-home stays yours.",
      src: "Your choice on the last screen",
      srcDetail: "You turned this on. It is not a cost, it is the difference between covering your life and building on it.",
    },
  ];

  return defs.filter((r) => r.amt > 0).sort((x, y) => y.amt - x.amt);
}
