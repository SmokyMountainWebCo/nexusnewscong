#!/usr/bin/env node
// First-load JS budget for the static export.
// Measures script tags in exported HTML, not the whole chunks directory.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'out');

const THRESHOLDS = {
  // Uncompressed first-load JS (script src in the HTML). Baseline on main was
  // ~634 KB home / ~644 KB story. Headroom covers Lenis + GSAP, not Three or DuckDB.
  homeBytes: 850 * 1024,
  storyBytes: 880 * 1024,
};

const PAGES = {
  home: 'index.html',
  story: path.join('press', 'factcheck-nov-17-blackout-hoax', 'index.html'),
};

const HEAVY = [
  { name: 'three', pattern: /from ['"]three['"]|THREE\.Scene|WebGLRenderer/ },
  { name: 'duckdb', pattern: /duckdb-wasm|AsyncDuckDB|getJsDelivrBundles/ },
];

function firstLoad(rel) {
  const htmlPath = path.join(outDir, rel);
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Missing ${rel}. Run npm run build first.`);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1].split('?')[0]);
  const seen = new Set();
  const files = [];
  let bytes = 0;
  for (const src of srcs) {
    if (seen.has(src)) continue;
    seen.add(src);
    const file = path.join(outDir, src.replace(/^\//, ''));
    const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
    files.push({ src, bytes: size });
    bytes += size;
  }
  return { bytes, files };
}

function containsHeavy(filePath, pattern) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.js')) return false;
  const text = fs.readFileSync(filePath, 'utf8');
  return pattern.test(text);
}

if (!fs.existsSync(outDir)) {
  console.error('No out/ directory. Run npm run build first.');
  process.exit(1);
}

const home = firstLoad(PAGES.home);
const story = firstLoad(PAGES.story);

const report = {
  home: { bytes: home.bytes, kb: +(home.bytes / 1024).toFixed(1), files: home.files },
  story: { bytes: story.bytes, kb: +(story.bytes / 1024).toFixed(1), files: story.files },
  thresholdsKb: { home: THRESHOLDS.homeBytes / 1024, story: THRESHOLDS.storyBytes / 1024 },
};

const failures = [];
if (home.bytes > THRESHOLDS.homeBytes) {
  failures.push(`Home first-load JS ${report.home.kb} KB exceeds ${THRESHOLDS.homeBytes / 1024} KB.`);
}
if (story.bytes > THRESHOLDS.storyBytes) {
  failures.push(`Story first-load JS ${report.story.kb} KB exceeds ${THRESHOLDS.storyBytes / 1024} KB.`);
}

for (const [label, result] of [['home', home], ['story', story]]) {
  for (const file of result.files) {
    const abs = path.join(outDir, file.src.replace(/^\//, ''));
    for (const heavy of HEAVY) {
      if (containsHeavy(abs, heavy.pattern)) {
        failures.push(`${heavy.name} appeared in first-load JS on ${label} (${file.src}). It must stay on a dynamic chunk.`);
      }
    }
  }
}

const reportPath = path.join(root, 'budget-report.json');
fs.writeFileSync(reportPath, JSON.stringify({ ...report, ok: failures.length === 0, failures }, null, 2));

console.log(`Home first-load JS:  ${report.home.kb} KB (limit ${THRESHOLDS.homeBytes / 1024} KB)`);
console.log(`Story first-load JS: ${report.story.kb} KB (limit ${THRESHOLDS.storyBytes / 1024} KB)`);
if (failures.length) {
  for (const failure of failures) console.error(`BUDGET FAIL: ${failure}`);
  process.exit(1);
}
console.log('Budget check passed.');
