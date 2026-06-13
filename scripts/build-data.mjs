// ---------------------------------------------------------------------------
// build-data.mjs
// ---------------------------------------------------------------------------
// Turns a raw "TikTok Trending Hashtags" snapshot (fetched from the Trends MCP
// `get_top_trends` tool) into the data file the front-end consumes.
//
// The web app is fully static and works from file:// , so the output is written
// as `web/data.js`, which assigns a global `window.TREND_DATA` object.
//
// To refresh the data:
//   1. Re-run the Trends MCP tool:  get_top_trends(type="TikTok Trending Hashtags", limit=100)
//   2. Paste the returned `as_of_ts` into RAW.as_of and the `data` array into RAW.rows
//   3. Run:  npm run build:data   (or: node scripts/build-data.mjs)
//
// Note on geography: the upstream Trends MCP feed is a GLOBAL TikTok trending
// hashtags table. It does not expose a country filter, so this is not a
// Saudi-only feed. The `audience` tagging below is editorial — it flags the
// items most relevant to a Saudi/Gulf audience (football, World Cup, streaming,
// K-culture, …) but does not claim Saudi-specific ranking.
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- RAW SNAPSHOT from Trends MCP -----------------------------------------
// Source: get_top_trends(type="TikTok Trending Hashtags", limit=100)
const RAW = {
  source: "Trends MCP · get_top_trends · TikTok Trending Hashtags",
  scope: "global", // upstream feed is global, not country-filtered
  as_of: "2026-05-15T22:01:29.316598+00:00",
  rows: [
    [1, "justgolive"], [2, "sidehustlelive"], [3, "tiktokshopmemorialday"], [4, "worldcup"],
    [5, "iceman"], [6, "usebloomlearntoinvest"], [7, "dontoliver"], [8, "footbal"],
    [9, "oneiy"], [10, "primevideo"], [11, "memorialday"], [12, "melissa"],
    [13, "pethealth"], [14, "jamescharles"], [15, "offcampus"], [16, "georgieandmandy"],
    [17, "edclasvegas"], [18, "wipwednesday"], [19, "insideout"], [20, "boxen"],
    [21, "hotflashes"], [22, "formel1"], [23, "kashpatel"], [24, "niallhoran"],
    [25, "mundial2026"], [26, "kevinhart"], [27, "wednesdayvibes"], [28, "senioritis"],
    [29, "devilmaycry"], [30, "vidaderancho"], [31, "datacenter"], [32, "punisher"],
    [33, "ellekennedy"], [34, "menopausia"], [35, "octane"], [36, "dmc"],
    [37, "boynextdoor"], [38, "steviewonder"], [39, "subnautica"], [40, "offcampusseries"],
    [41, "tiktokshopdealsforyou"], [42, "goodomens"], [43, "fakenewspranktemplate"], [44, "fakenewspranktutorial"],
    [45, "howtodothefakenewsprank"], [46, "may15"], [47, "ovulation"], [48, "garrettgraham"],
    [49, "perimenopausia"], [50, "dante"], [51, "deportesentiktok"], [52, "deenthegreat"],
    [53, "thedeal"], [54, "eurovision"], [55, "bistrohuddy"], [56, "coronavirus"],
    [57, "dancevibes"], [58, "bountyhunter"], [59, "builders"], [60, "thepunisher"],
    [61, "memorialdayweekend"], [62, "summerberryrefresher"], [63, "ajo"], [64, "grizzlies"],
    [65, "memphisgrizzlies"], [66, "offcampusellekennedy"], [67, "hannahwells"], [68, "florentinoperez"],
    [69, "animalsworld"], [70, "juliofoolio"], [71, "jonbernthal"], [72, "goodomens3"],
    [73, "frankcastle"], [74, "deandilaurentis"], [75, "speedup"], [76, "fypuk"],
    [77, "aplang"], [78, "rosesarered"], [79, "tiktokgrowthchallenge"], [80, "may13"],
    [81, "chudthebuilder"], [82, "subnautica2"], [83, "georgecooper"], [84, "chelseahandler"],
    [85, "adrienbroner"], [86, "aplangexam"], [87, "alexmurdaugh"], [88, "seangathright"],
    [89, "koreantrend"], [90, "daidai"], [91, "capcutnow"], [92, "seniorfit"],
    [93, "koreabaseball"], [94, "koreavibes"], [95, "jamescharlesdrama"], [96, "pmos"],
    [97, "seniorfits"], [98, "multicolorcasualset"],
  ],
};

// --- CATEGORY DEFINITIONS --------------------------------------------------
const CATEGORIES = {
  sports:        { ar: "رياضة",        en: "Sports",        icon: "⚽", color: "#25F4EE" },
  music:         { ar: "موسيقى",       en: "Music",         icon: "🎵", color: "#FE2C55" },
  entertainment: { ar: "ترفيه",        en: "Entertainment", icon: "🎬", color: "#A66BFF" },
  gaming:        { ar: "ألعاب",        en: "Gaming",        icon: "🎮", color: "#5B8CFF" },
  beauty:        { ar: "جمال",         en: "Beauty",        icon: "💄", color: "#FF6FB5" },
  health:        { ar: "صحة",          en: "Health",        icon: "🩺", color: "#3DDC97" },
  education:     { ar: "تعليم",        en: "Education",     icon: "🎓", color: "#FFB454" },
  tech:          { ar: "تقنية",        en: "Tech",          icon: "💻", color: "#00D1B2" },
  shopping:      { ar: "تسوّق",        en: "Shopping",      icon: "🛍️", color: "#FF8A5C" },
  creator:       { ar: "صنّاع المحتوى", en: "Creators",      icon: "✨", color: "#F5D547" },
  food:          { ar: "طعام",         en: "Food",          icon: "🍓", color: "#FF5C7A" },
  lifestyle:     { ar: "لايف ستايل",   en: "Lifestyle",     icon: "🌿", color: "#7CE0C3" },
  news:          { ar: "أخبار",        en: "News",          icon: "📰", color: "#9AA7B8" },
  kculture:      { ar: "الموجة الكورية", en: "K-Culture",    icon: "🇰🇷", color: "#FF4D8D" },
  books:         { ar: "كتب",          en: "Books",         icon: "📚", color: "#C792EA" },
  meme:          { ar: "ميمز",         en: "Memes",         icon: "😂", color: "#FFD93D" },
  business:      { ar: "أعمال ومال",   en: "Business",      icon: "💼", color: "#6FCF97" },
  other:         { ar: "متنوّع",       en: "Other",         icon: "＃", color: "#7E8AA0" },
};

// --- HASHTAG -> CATEGORY (hand-tagged for accuracy) ------------------------
const TAGS = {
  justgolive: "creator", sidehustlelive: "business", tiktokshopmemorialday: "shopping",
  worldcup: "sports", iceman: "entertainment", usebloomlearntoinvest: "business",
  dontoliver: "music", footbal: "sports", oneiy: "other", primevideo: "entertainment",
  memorialday: "lifestyle", melissa: "other", pethealth: "health", jamescharles: "beauty",
  offcampus: "books", georgieandmandy: "entertainment", edclasvegas: "music",
  wipwednesday: "creator", insideout: "entertainment", boxen: "sports", hotflashes: "health",
  formel1: "sports", kashpatel: "news", niallhoran: "music", mundial2026: "sports",
  kevinhart: "entertainment", wednesdayvibes: "lifestyle", senioritis: "education",
  devilmaycry: "gaming", vidaderancho: "lifestyle", datacenter: "tech", punisher: "entertainment",
  ellekennedy: "books", menopausia: "health", octane: "gaming", dmc: "gaming",
  boynextdoor: "kculture", steviewonder: "music", subnautica: "gaming", offcampusseries: "books",
  tiktokshopdealsforyou: "shopping", goodomens: "entertainment", fakenewspranktemplate: "meme",
  fakenewspranktutorial: "meme", howtodothefakenewsprank: "meme", may15: "other",
  ovulation: "health", garrettgraham: "other", perimenopausia: "health", dante: "gaming",
  deportesentiktok: "sports", deenthegreat: "creator", thedeal: "entertainment",
  eurovision: "music", bistrohuddy: "food", coronavirus: "news", dancevibes: "music",
  bountyhunter: "entertainment", builders: "lifestyle", thepunisher: "entertainment",
  memorialdayweekend: "lifestyle", summerberryrefresher: "food", ajo: "other",
  grizzlies: "sports", memphisgrizzlies: "sports", offcampusellekennedy: "books",
  hannahwells: "entertainment", florentinoperez: "sports", animalsworld: "lifestyle",
  juliofoolio: "music", jonbernthal: "entertainment", goodomens3: "entertainment",
  frankcastle: "entertainment", deandilaurentis: "entertainment", speedup: "music",
  fypuk: "creator", aplang: "education", rosesarered: "meme", tiktokgrowthchallenge: "creator",
  may13: "other", chudthebuilder: "creator", subnautica2: "gaming", georgecooper: "entertainment",
  chelseahandler: "entertainment", adrienbroner: "sports", aplangexam: "education",
  alexmurdaugh: "news", seangathright: "creator", koreantrend: "kculture", daidai: "other",
  capcutnow: "creator", seniorfit: "lifestyle", koreabaseball: "sports", koreavibes: "kculture",
  jamescharlesdrama: "beauty", pmos: "other", seniorfits: "lifestyle", multicolorcasualset: "shopping",
};

// Editorial flag: items globally relevant to a Saudi / Gulf audience.
const KSA_RELEVANT = new Set([
  "worldcup", "footbal", "mundial2026", "florentinoperez", "formel1",
  "primevideo", "koreantrend", "koreavibes", "boynextdoor", "datacenter",
]);

// --- BUILD -----------------------------------------------------------------
const count = RAW.rows.length;

const items = RAW.rows.map(([rank, tag]) => {
  const category = TAGS[tag] || "other";
  // Heat: rank 1 -> 100, last rank -> ~1. Linear on rank.
  const heat = Math.round(((count - rank + 1) / count) * 100);
  return {
    rank,
    tag,
    label: "#" + tag,
    category,
    heat,
    ksa: KSA_RELEVANT.has(tag),
    url: "https://www.tiktok.com/tag/" + encodeURIComponent(tag),
  };
});

// Category breakdown (sorted by count desc).
const breakdown = Object.keys(CATEGORIES)
  .map((key) => ({
    key,
    ...CATEGORIES[key],
    count: items.filter((i) => i.category === key).length,
  }))
  .filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count);

const payload = {
  meta: {
    title: "ترندات تيك توك",
    source: RAW.source,
    scope: RAW.scope,
    as_of: RAW.as_of,
    generated_at: new Date().toISOString(),
    count,
    note_ar:
      "هذه القائمة مصدرها Trends MCP وهي قائمة هاشتاقات تيك توك الرائجة عالمياً. " +
      "لا يوفّر المصدر فلتر دولة، لذلك التمييز الخاص بالجمهور السعودي تحريري للإبراز فقط.",
  },
  categories: CATEGORIES,
  breakdown,
  items,
};

const outPath = resolve(__dirname, "../web/data.js");
mkdirSync(dirname(outPath), { recursive: true });
const banner =
  "// AUTO-GENERATED by scripts/build-data.mjs — do not edit by hand.\n" +
  "// Source: " + RAW.source + " (as of " + RAW.as_of + ")\n";
writeFileSync(
  outPath,
  banner + "window.TREND_DATA = " + JSON.stringify(payload, null, 2) + ";\n",
  "utf8",
);

console.log("✓ wrote", outPath);
console.log("  items:", items.length, "| categories:", breakdown.length);
console.log("  top category:", breakdown[0].en, "(" + breakdown[0].count + ")");
