// ---------------------------------------------------------------------------
// build-data.mjs
// ---------------------------------------------------------------------------
// Turns raw snapshots from the Trends MCP into the data file the front-end
// consumes (web/data.js -> window.TREND_DATA). Fully static, works from file://.
//
// Three sections are produced:
//   1. hashtags  — Trends MCP "TikTok Trending Hashtags"   (real TikTok data)
//   2. searches  — Trends MCP "Google Trends"              (real search trends)
//   3. live      — derived from the hashtags feed          (LIVE-themed view)
//
// To refresh:
//   get_top_trends(type="TikTok Trending Hashtags", limit=100)  -> RAW_HASHTAGS
//   get_top_trends(type="Google Trends", limit=75)              -> RAW_SEARCHES
//   then: npm run build:data
//
// Honesty notes baked into the UI:
//   * The TikTok hashtags feed is GLOBAL (no country filter in the source); the
//     "KSA" flag is editorial highlighting only.
//   * Trends MCP has NO dedicated "TikTok Trending Searches" or "Popular LIVE"
//     feed. "Trending Searches" therefore uses Google Trends (clearly labelled),
//     and "Popular LIVE" is derived from the LIVE-themed trending hashtags plus
//     the hottest categories — real per-stream LIVE ranking needs TikTok's API.
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ===========================================================================
// RAW SNAPSHOT 1 — TikTok Trending Hashtags
// Source: get_top_trends(type="TikTok Trending Hashtags", limit=100)
// ===========================================================================
const RAW_HASHTAGS = {
  source: "Trends MCP · get_top_trends · TikTok Trending Hashtags",
  scope: "global",
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

// ===========================================================================
// RAW SNAPSHOT 2 — Google Trends (used for the "Trending Searches" tab)
// Source: get_top_trends(type="Google Trends", limit=75)
// ===========================================================================
const RAW_SEARCHES = {
  source: "Trends MCP · get_top_trends · Google Trends",
  scope: "global",
  as_of: "2026-06-13T22:01:40.312818+00:00",
  rows: [
    [1, "spacex stock"], [2, "karmelo anthony"], [3, "tornado watch"], [4, "heat advisory"],
    [5, "disclosure day"], [6, "whos playing today world cup"], [7, "is facebook down"],
    [8, "yvette hinds mcdonald's lawsuit"], [9, "every year after"], [10, "southwest"],
    [11, "olivia rodrigo"], [12, "cbs watson show cancellation"], [13, "sleeping bag"],
    [14, "social security electronic benefits update"], [15, "simone biles"], [16, "papal"],
    [17, "ariana grande tour"], [18, "chipotle bogo"], [19, "philippines earthquake"],
    [20, "nintendo direct"], [21, "kristen welker"], [22, "tony awards 2026"], [23, "earthquake"],
    [24, "love island voting"], [25, "wwdc"], [26, "tony awards"], [27, "tornado watch"],
    [28, "hoosier lottery technical issue"], [29, "taylor parker"], [30, "james harden"],
    [31, "gene shalit"], [32, "mexico world cup"], [33, "david hockney"], [34, "nancy guthrie"],
    [35, "kennedy center"], [36, "us-iran"], [37, "fda farm rich pizza recall"],
    [38, "mariska hargitay"], [39, "midland texas"], [40, "katy perry"], [41, "elle"],
    [42, "belfast"], [43, "carmelo anthony trial"], [44, "nancy mace"], [45, "ocarina of time remake"],
    [46, "kingdom hearts 4"], [47, "fable 5"], [48, "tefi pessoa"], [49, "susan collins"],
    [50, "kharg island"], [51, "weston higginbotham"], [52, "tornado watch"], [53, "toledo shooting"],
    [54, "severe thunderstorm watch"], [55, "tornado watch"], [56, "youtube tv"], [57, "disney+"],
    [58, "national park sign restoration order"], [59, "world cup today"], [60, "bryan rojas ice detention doral"],
    [61, "restaurant chain"], [62, "nogales search anonymous tip"], [63, "bankruptcy"],
    [64, "jeremy sisto new look"], [65, "shakira"], [66, "bill ritter"], [67, "raising kanan"],
    [68, "anti weaponization fund judge ruling"], [69, "dan and shay"], [70, "anthropic fable mythos ban"],
    [71, "el nino 2026"], [72, "fear"], [73, "cash app mobile phone service"], [74, "tornado watch"],
    [75, "judge mcconnell dhs immigration ruling"],
  ],
};

// ===========================================================================
// CATEGORY DEFINITIONS (shared)
// ===========================================================================
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

// HASHTAG -> CATEGORY (hand-tagged)
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

const KSA_RELEVANT = new Set([
  "worldcup", "footbal", "mundial2026", "florentinoperez", "formel1",
  "primevideo", "koreantrend", "koreavibes", "boynextdoor", "datacenter",
]);

// LIVE-themed hashtags (explicitly about going live / streaming)
const LIVE_TAGS = new Set(["justgolive", "sidehustlelive"]);

// Categories that map naturally to TikTok LIVE rooms.
const LIVE_ROOM_CATEGORIES = [
  "gaming", "music", "sports", "creator", "beauty",
  "shopping", "lifestyle", "entertainment", "business",
];

// Keyword classifier for Google Trends search queries.
function classifySearch(q) {
  q = q.toLowerCase();
  const rules = [
    [/(world cup|harden|biles|nba|nfl|soccer|football|playing today)/, "sports"],
    [/(rodrigo|grande|katy perry|shakira|dan and shay|tour|eurovision|\bsong\b)/, "music"],
    [/(nintendo|kingdom hearts|ocarina|fable|kanan|\bgame\b|playstation|xbox|zelda)/, "gaming"],
    [/(spacex|wwdc|facebook|youtube tv|disney\+|cash app|stock|\bai\b|app\b)/, "tech"],
    [/(tony awards|love island|hockney|jeremy sisto|cbs|\bshow\b|\bmovie\b|elle|tefi|mariska|welker|bill ritter|gene shalit)/, "entertainment"],
    [/(bankruptcy|southwest|chipotle|restaurant|lawsuit|mcdonald|lottery|benefits|recall|bogo)/, "business"],
    [/(tornado|earthquake|advisory|thunderstorm|shooting|\bice\b|immigration|ruling|iran|island|el nino|weather|watch|papal|kennedy|collins|mace|fund|dhs|disclosure)/, "news"],
  ];
  for (const [re, cat] of rules) if (re.test(q)) return cat;
  return "news";
}

// ===========================================================================
// BUILD — hashtags
// ===========================================================================
const hCount = RAW_HASHTAGS.rows.length;
const hashtagItems = RAW_HASHTAGS.rows.map(([rank, tag]) => {
  const category = TAGS[tag] || "other";
  const heat = Math.round(((hCount - rank + 1) / hCount) * 100);
  return {
    rank, tag, label: "#" + tag, category, heat,
    ksa: KSA_RELEVANT.has(tag), live: LIVE_TAGS.has(tag),
    url: "https://www.tiktok.com/tag/" + encodeURIComponent(tag),
  };
});
const hashtagBreakdown = Object.keys(CATEGORIES)
  .map((key) => ({ key, ...CATEGORIES[key], count: hashtagItems.filter((i) => i.category === key).length }))
  .filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count);

// ===========================================================================
// BUILD — searches (dedupe repeated queries, keep best rank)
// ===========================================================================
const seen = new Set();
const dedupSearchRows = RAW_SEARCHES.rows
  .sort((a, b) => a[0] - b[0])
  .filter(([, q]) => { const k = q.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
const sCount = dedupSearchRows.length;
const searchItems = dedupSearchRows.map(([rank, query], i) => {
  const category = classifySearch(query);
  const heat = Math.round(((sCount - i) / sCount) * 100);
  return {
    rank: i + 1, srcRank: rank, query, category, heat,
    url: "https://www.google.com/search?q=" + encodeURIComponent(query),
  };
});

// ===========================================================================
// BUILD — live (derived)
// ===========================================================================
const liveHighlights = hashtagItems.filter((i) => i.live);
const liveRooms = LIVE_ROOM_CATEGORIES
  .map((key) => {
    const inCat = hashtagItems.filter((i) => i.category === key).sort((a, b) => a.rank - b.rank);
    return {
      key, ...CATEGORIES[key],
      count: inCat.length,
      bestRank: inCat.length ? inCat[0].rank : 999,
      examples: inCat.slice(0, 3).map((i) => i.tag),
    };
  })
  .filter((r) => r.count > 0)
  .sort((a, b) => a.bestRank - b.bestRank);

// ===========================================================================
// PAYLOAD
// ===========================================================================
const payload = {
  meta: {
    title: "ترندات تيك توك",
    generated_at: new Date().toISOString(),
    note_ar:
      "منصة ترندات تيك توك — البيانات حية من Trends MCP. لا يوفّر المصدر فلتر دولة، " +
      "لذا التمييز الخاص بالجمهور السعودي تحريري للإبراز فقط.",
  },
  categories: CATEGORIES,
  hashtags: {
    source: RAW_HASHTAGS.source,
    scope: RAW_HASHTAGS.scope,
    as_of: RAW_HASHTAGS.as_of,
    count: hCount,
    note_ar: "قائمة هاشتاقات تيك توك الرائجة عالمياً عبر Trends MCP. درجة الرواج محسوبة من موضع الهاشتاق في القائمة.",
    breakdown: hashtagBreakdown,
    items: hashtagItems,
  },
  searches: {
    source: RAW_SEARCHES.source,
    scope: RAW_SEARCHES.scope,
    as_of: RAW_SEARCHES.as_of,
    count: sCount,
    note_ar:
      "Trends MCP لا يوفّر feed لترندات بحث تيك توك، لذا هذا القسم يعرض ترندات البحث من " +
      "Google Trends (بيانات بحث حقيقية، عالمية وليست خاصة بتيك توك أو بالسعودية).",
    items: searchItems,
  },
  live: {
    source: "مشتق من قائمة هاشتاقات تيك توك الرائجة (Trends MCP)",
    as_of: RAW_HASHTAGS.as_of,
    note_ar:
      "Trends MCP لا يوفّر feed لـ Popular LIVE الفعلي. هذا القسم مشتق من إشارات حقيقية: " +
      "هاشتاقات البث المباشر الرائجة، وأكثر الفئات رواجاً (كغرف بث). ترتيب البثوث الفعلي يحتاج TikTok LIVE API.",
    highlights: liveHighlights,
    rooms: liveRooms,
  },
};

const outPath = resolve(__dirname, "../web/data.js");
mkdirSync(dirname(outPath), { recursive: true });
const banner =
  "// AUTO-GENERATED by scripts/build-data.mjs — do not edit by hand.\n" +
  "// Hashtags: " + RAW_HASHTAGS.source + " (as of " + RAW_HASHTAGS.as_of + ")\n" +
  "// Searches: " + RAW_SEARCHES.source + " (as of " + RAW_SEARCHES.as_of + ")\n";
writeFileSync(outPath, banner + "window.TREND_DATA = " + JSON.stringify(payload, null, 2) + ";\n", "utf8");

console.log("✓ wrote", outPath);
console.log("  hashtags:", hashtagItems.length, "| searches:", searchItems.length,
  "| live highlights:", liveHighlights.length, "| live rooms:", liveRooms.length);
