// Inlines styles.css, data.js and app.js into a single self-contained HTML
// file you can open by double-clicking — no server, no dependencies.
// Usage: node scripts/bundle.mjs  ->  dist/trends-swarm.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = (f) => readFileSync(resolve(root, "web", f), "utf8");

let html = web("index.html");
const css = web("styles.css");
const data = web("data.js");
const app = web("app.js");

html = html
  .replace(
    '<link rel="stylesheet" href="styles.css" />',
    "<style>\n" + css + "\n</style>"
  )
  .replace('<script src="data.js"></script>', "<script>\n" + data + "\n</script>")
  .replace('<script src="app.js"></script>', "<script>\n" + app + "\n</script>");

const outDir = resolve(root, "dist");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, "trends-swarm.html");
writeFileSync(out, html, "utf8");
console.log("✓ wrote", out, "(" + Math.round(html.length / 1024) + " KB)");
