#!/usr/bin/env node
/**
 * gen-assets.mjs — generates every static SVG asset in the repo.
 *
 * Deterministic: same seed, same pixels. Run `node scripts/gen-assets.mjs`
 * from the repo root after changing the palette or a layout.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../apps/web/public");
const DOCS = resolve(import.meta.dirname, "../docs/images");

const C = {
  abyss: "#070b12",
  surface: "#0d1420",
  surface2: "#111a2b",
  hull: "#1b2942",
  bio: "#38e8b0",
  cyan: "#7dd3fc",
  amber: "#fbbf24",
  danger: "#f87171",
  star: "#e8eefc",
  muted: "#8ba3c7",
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stars(rng, w, h, n, maxR = 1.4) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (rng() * w).toFixed(1);
    const y = (rng() * h).toFixed(1);
    const r = (0.3 + rng() * maxR).toFixed(2);
    const o = (0.25 + rng() * 0.55).toFixed(2);
    const fill = rng() > 0.85 ? C.cyan : C.star;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}"/>`;
  }
  return out;
}

function helix(x, y, len, amp, color, width = 3) {
  // two sine waves + rungs
  let a = `M ${x} ${y}`;
  let b = `M ${x} ${y + amp}`;
  const steps = 40;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 4;
    const px = x + (i / steps) * len;
    a += ` L ${px.toFixed(1)} ${(y + Math.sin(t) * amp).toFixed(1)}`;
    b += ` L ${px.toFixed(1)} ${(y + amp + Math.sin(t + Math.PI) * amp).toFixed(1)}`;
  }
  const rungs = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * Math.PI * 4;
    const px = x + (i / 8) * len;
    rungs.push(`<line x1="${px.toFixed(1)}" y1="${(y + Math.sin(t) * amp).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(y + amp + Math.sin(t + Math.PI) * amp).toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.5"/>`);
  }
  return `<path d="${a}" fill="none" stroke="${color}" stroke-width="${width}"/><path d="${b}" fill="none" stroke="${color}" stroke-width="${width}" opacity="0.7"/>${rungs.join("")}`;
}

function orbit(cx, cy, rx, ry, color, dotAngle) {
  const dx = cx + Math.cos(dotAngle) * rx;
  const dy = cy + Math.sin(dotAngle) * ry;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6" transform="rotate(-18 ${cx} ${cy})"/><circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4" fill="${color}"/>`;
}

const svg = (w, h, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ${extra}>${body}</svg>\n`;

function write(relPath, content) {
  const full = resolve(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`wrote ${relPath}`);
}

function writeDocs(relPath, content) {
  const full = resolve(DOCS, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`wrote docs/images/${relPath}`);
}

/* ---------------- logo / favicon ---------------- */
{
  const body = `
<rect width="64" height="64" rx="14" fill="${C.abyss}"/>
${helix(12, 14, 40, 10, C.bio, 3)}
<circle cx="50" cy="16" r="3" fill="${C.cyan}"/>
<circle cx="14" cy="48" r="2.4" fill="${C.cyan}" opacity="0.8"/>`;
  write("images/logo.svg", svg(64, 64, body, `aria-label="chromoforge logo"`));
}
{
  const body = `
<rect width="32" height="32" rx="7" fill="${C.abyss}"/>
<path d="M 8 8 Q 16 16 8 24 Q 16 24 8 8" fill="none" stroke="${C.bio}" stroke-width="2.5"/>
<path d="M 24 8 Q 16 16 24 24" fill="none" stroke="${C.bio}" stroke-width="2.5" opacity="0.7"/>
<circle cx="24" cy="8" r="1.8" fill="${C.cyan}"/>`;
  write("images/favicon.svg", svg(32, 32, body));
  write("favicon.svg", svg(32, 32, body));
}

/* ---------------- banner (1280x640) ---------------- */
{
  const rng = mulberry32(20261010);
  const body = `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.abyss}"/>
    <stop offset="1" stop-color="${C.surface}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.8" cy="0.2" r="0.6">
    <stop offset="0" stop-color="${C.bio}" stop-opacity="0.16"/>
    <stop offset="1" stop-color="${C.bio}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="1280" height="640" fill="url(#bg)"/>
<rect width="1280" height="640" fill="url(#glow)"/>
${stars(rng, 1280, 640, 150, 1.6)}
${orbit(1010, 200, 170, 62, C.cyan, 0.8)}
${orbit(1010, 200, 120, 44, C.bio, 2.4)}
${helix(80, 420, 420, 26, C.bio, 4)}
<text x="80" y="180" font-family="'Space Grotesk', sans-serif" font-size="34" letter-spacing="10" fill="${C.cyan}">SYNTHETIC BIOLOGY LAB</text>
<text x="80" y="280" font-family="'Space Grotesk', sans-serif" font-size="84" font-weight="800" fill="${C.star}">chromoforge</text>
<text x="80" y="340" font-family="'Space Grotesk', sans-serif" font-size="36" fill="${C.muted}">Design life for worlds we know exist.</text>
<g font-family="'JetBrains Mono', monospace" font-size="20">
  ${["real NASA data", "zero API keys", "deterministic sim"].map((t, i) => `
  <rect x="${80 + i * 260}" y="540" width="240" height="48" rx="24" fill="none" stroke="${C.hull}" stroke-width="2"/>
  <text x="${100 + i * 260}" y="570" fill="${C.cyan}">${t}</text>`).join("")}
</g>`;
  write("images/banner.svg", svg(1280, 640, body, `aria-label="chromoforge banner"`));
}

/* ---------------- og card (1200x630) ---------------- */
{
  const rng = mulberry32(7331);
  const body = `
<rect width="1200" height="630" fill="${C.abyss}"/>
${stars(rng, 1200, 630, 110, 1.3)}
<text x="72" y="120" font-family="monospace" font-size="28" letter-spacing="8" fill="${C.bio}">SYNTHETIC BIOLOGY LAB</text>
<text x="72" y="280" font-family="sans-serif" font-size="110" font-weight="800" fill="${C.star}">chromoforge</text>
<text x="72" y="350" font-family="monospace" font-size="40" fill="${C.muted}">Design life for worlds we know exist.</text>
${helix(760, 380, 360, 30, C.bio, 4)}
<g font-family="monospace" font-size="26">
  ${["real NASA data", "zero API keys", "deterministic sim"].map((t, i) => `
  <rect x="${72 + i * 300}" y="500" width="272" height="56" rx="28" fill="none" stroke="${C.hull}" stroke-width="2"/>
  <text x="${96 + i * 300}" y="536" fill="${C.cyan}">${t}</text>`).join("")}
</g>`;
  write("images/og.svg", svg(1200, 630, body));
}

/* ---------------- screen mockups ---------------- */
function screen(title, seed, buildPanels) {
  const rng = mulberry32(seed);
  const W = 800, H = 500;
  let panels = "";
  let y = 74;
  const groups = buildPanels(rng);
  for (const g of groups) {
    const h = g.h;
    panels += `<rect x="24" y="${y}" width="${g.w}" height="${h}" rx="10" fill="${C.surface}" stroke="${C.hull}"/>`;
    if (g.title) {
      panels += `<text x="40" y="${y + 24}" font-family="monospace" font-size="12" fill="${C.muted}" letter-spacing="2">${g.title.toUpperCase()}</text>`;
    }
    if (g.kind === "bars") {
      g.items.forEach((it, i) => {
        const bw = ((g.w - 48) * it).toFixed(0);
        panels += `<rect x="40" y="${y + 40 + i * 22}" width="${(g.w - 48)}" height="10" rx="5" fill="${C.surface2}"/>
        <rect x="40" y="${y + 40 + i * 22}" width="${bw}" height="10" rx="5" fill="${i % 2 ? C.cyan : C.bio}"/>`;
      });
    } else if (g.kind === "rows") {
      g.items.forEach((it, i) => {
        panels += `<rect x="40" y="${y + 38 + i * 20}" width="${(g.w - 80) * it}" height="8" rx="4" fill="${C.hull}"/>
        <circle cx="${g.w - 52}" cy="${y + 42 + i * 20}" r="4" fill="${i % 3 === 0 ? C.bio : C.cyan}"/>`;
      });
    } else if (g.kind === "chart") {
      const pts = [];
      for (let i = 0; i <= 20; i++) pts.push(`${40 + (i / 20) * (g.w - 80)},${y + h - 24 - Math.sin(i / 2.4) * 24 - i * 2}`);
      panels += `<polyline points="${pts.join(" ")}" fill="none" stroke="${C.bio}" stroke-width="2.5"/>`;
      const pts2 = [];
      for (let i = 0; i <= 20; i++) pts2.push(`${40 + (i / 20) * (g.w - 80)},${y + h - 24 - Math.cos(i / 3) * 18 - i * 1.2}`);
      panels += `<polyline points="${pts2.join(" ")}" fill="none" stroke="${C.cyan}" stroke-width="2" opacity="0.8"/>`;
    } else if (g.kind === "sky") {
      panels += `<ellipse cx="${24 + g.w / 2}" cy="${y + h / 2}" rx="${g.w / 2 - 30}" ry="${h / 2 - 20}" fill="${C.surface2}" stroke="${C.hull}"/>`;
      for (let i = 0; i < 14; i++) {
        const px = 24 + 40 + rng() * (g.w - 80);
        const py = y + 30 + rng() * (h - 60);
        panels += `<circle cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" r="3" fill="${rng() > 0.5 ? C.bio : C.cyan}"/>`;
      }
    } else if (g.kind === "terminal") {
      g.lines.forEach((l, i) => {
        panels += `<text x="40" y="${y + 42 + i * 20}" font-family="monospace" font-size="11" fill="${i === g.lines.length - 1 ? C.bio : C.muted}">${l}</text>`;
      });
    }
    y += h + 14;
  }
  const body = `
<rect width="${W}" height="${H}" fill="${C.abyss}"/>
<rect x="0" y="0" width="${W}" height="44" fill="${C.surface}"/>
<circle cx="22" cy="22" r="5" fill="${C.danger}"/><circle cx="40" cy="22" r="5" fill="${C.amber}"/><circle cx="58" cy="22" r="5" fill="${C.bio}"/>
<text x="${W / 2}" y="27" text-anchor="middle" font-family="monospace" font-size="13" fill="${C.muted}">chromoforge — ${title}</text>
${stars(rng, W, H, 50, 1)}
${panels}`;
  return body;
}

const SCREENS = {
  landing: () => [
    { w: 752, h: 96, kind: "rows", title: "hero", items: [1, 0.7, 0.85] },
    { w: 752, h: 150, kind: "bars", title: "featured worlds", items: [0.6, 0.85, 0.45, 0.72] },
    { w: 752, h: 120, kind: "rows", title: "capabilities", items: [0.9, 0.6, 0.75, 0.5] },
  ],
  composer: () => [
    { w: 240, h: 340, kind: "rows", title: "part shelf", items: [0.9, 0.7, 0.8, 0.5, 0.65, 0.4] },
    { w: 500, h: 200, kind: "bars", title: "derived phenotype", items: [0.55, 0.3, 0.62, 0.2, 0.8] },
    { w: 500, h: 120, kind: "terminal", title: "policy engine", lines: ["> verdict: allow", "> risk index 0.00", "> upkeep 18"] },
  ],
  theater: () => [
    { w: 752, h: 220, kind: "chart", title: "population & fitness" },
    { w: 752, h: 110, kind: "rows", title: "event log", items: [0.8, 0.6, 0.9] },
  ],
  atlas: () => [
    { w: 500, h: 340, kind: "sky", title: "hammer projection" },
    { w: 240, h: 340, kind: "rows", title: "worlds", items: [0.9, 0.8, 0.6, 0.7, 0.5, 0.65, 0.4] },
  ],
  safety: () => [
    { w: 752, h: 110, kind: "terminal", title: "verdict", lines: ["> verdict: block", "> BS-01 toxin + transmission chassis"] },
    { w: 752, h: 220, kind: "rows", title: "findings", items: [0.85, 0.6, 0.75] },
  ],
  release: () => [
    { w: 240, h: 340, kind: "bars", title: "predicted fitness", items: [0.62] },
    { w: 500, h: 200, kind: "terminal", title: "crew briefing", lines: ["NAVA  transit window 4 sols", "XYLO  fitness 62%", "ETHOS conditions: containment"] },
    { w: 500, h: 120, kind: "rows", title: "conditions", items: [0.7, 0.5, 0.6] },
  ],
};

for (const [name, build] of Object.entries(SCREENS)) {
  const seed = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  write(`images/screens/${name}.svg`, svg(800, 500, screen(name, seed, build), `aria-label="${name} screen"`));
}

/* ---------------- architecture poster ---------------- */
{
  const W = 1600, H = 1000;
  const layer = (y, label, boxes, color) => {
    let out = `<rect x="60" y="${y}" width="1480" height="150" rx="14" fill="${C.surface}" stroke="${C.hull}"/>`;
    out += `<text x="84" y="${y + 30}" font-family="monospace" font-size="13" letter-spacing="3" fill="${color}">${label.toUpperCase()}</text>`;
    boxes.forEach((b, i) => {
      const bx = 90 + i * 240;
      out += `<rect x="${bx}" y="${y + 48}" width="210" height="82" rx="10" fill="${C.surface2}" stroke="${color}" stroke-opacity="0.5"/>`;
      out += `<text x="${bx + 16}" y="${y + 84}" font-family="sans-serif" font-size="15" font-weight="700" fill="${C.star}">${b[0]}</text>`;
      out += `<text x="${bx + 16}" y="${y + 106}" font-family="monospace" font-size="11" fill="${C.muted}">${b[1]}</text>`;
    });
    return out;
  };
  let arrows = "";
  for (let i = 0; i < 4; i++) {
    const x = 300 + i * 240;
    arrows += `<line x1="${x}" y1="${210 + i * 190}" x2="${x}" y2="${230 + i * 190}" stroke="${C.hull}" stroke-width="2"/><polygon points="${x - 5},${230 + i * 190} ${x + 5},${230 + i * 190} ${x},${240 + i * 190}" fill="${C.hull}"/>`;
  }
  const body = `
<rect width="${W}" height="${H}" fill="${C.abyss}"/>
<text x="60" y="56" font-family="sans-serif" font-size="28" font-weight="800" fill="${C.star}">chromoforge — architecture poster</text>
${layer(80, "presentation · apps/web (Next.js 16)", [["Landing", "hero + worlds"], ["Composer", "genome bench"], ["Theater", "sim charts"], ["Atlas", "hammer sky"], ["Release", "crew gate"], ["Safety", "policy ledger"]], C.cyan)}
${layer(270, "domain · packages/core (pure TS)", [["genetics", "parts→traits"], ["guide bench", "crispr scoring"], ["biosecurity", "policy engine"], ["exoplanets", "catalog"], ["ecology", "simulation"], ["agents", "crew"], ["util", "seeded rng"]], C.bio)}
${layer(460, "reference engines · parity-checked", [["crates/ecology", "rust"], ["services/agents", "python"], ["bin/parity.sh", "diff all"], ["fixtures", "from TS"]], C.amber)}
${layer(650, "deployment", [["Vercel", "live url"], ["Docker", "compose"], ["Fly/Render", "alt paths"], ["GH Actions", "ci/cd"]], C.danger)}
${arrows}
<text x="60" y="830" font-family="monospace" font-size="12" fill="${C.muted}">one domain engine · three languages · one verified behavior · generated by scripts/gen-assets.mjs</text>`;
  writeDocs("architecture-poster.svg", svg(W, H, body, `aria-label="architecture poster"`));
  write("images/architecture-poster.svg", svg(W, H, body, `aria-label="architecture poster"`));
}

console.log("\nall assets regenerated (deterministic, seed 20261010)");
