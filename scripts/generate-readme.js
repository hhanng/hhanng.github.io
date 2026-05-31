#!/usr/bin/env node
// Patches the progress count inside README.md without overwriting the whole file.
// Updates the ████ bar line and the "X / 100 complete" line.
// Run directly: node scripts/generate-readme.js
// Triggered automatically by .git/hooks/pre-commit on every commit.

const fs   = require("fs");
const path = require("path");

const root       = path.resolve(__dirname, "..");
const htmlPath   = path.join(root, "index.html");
const readmePath = path.join(root, "README.md");

const html = fs.readFileSync(htmlPath, "utf8");

// Pull data-offset from the agents-grid div
const offsetMatch = html.match(/id="agents-grid"[^>]*data-offset="(\d+)"/);
const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;

// Count agent cards in the grid
const gridStart = html.indexOf('id="agents-grid"');
const gridEnd   = html.indexOf("<!-- TTTT -->", gridStart);
const gridHtml  = html.slice(gridStart, gridEnd);
const cardCount = (gridHtml.match(/<div class="card">/g) || []).length;
const total     = cardCount + offset;

// Build progress bar (50 chars wide) — clamp when challenge is complete (total ≥ 100)
const displayTotal = Math.min(total, 100);
const filled = Math.min(50, Math.round(displayTotal / 2));
const barLabel = total >= 100 ? `${total} / 100 🏆` : `${total} / 100`;
const bar    = "█".repeat(filled) + "░".repeat(50 - filled);

let readme = fs.readFileSync(readmePath, "utf8");

// Patch the ████ bar line
readme = readme.replace(
  /`{3}\n[█░ ]+.*\d+ \/ 100.*\n`{3}/,
  `\`\`\`\n${bar}  ${barLabel}\n\`\`\``
);

// Patch the "X / 100 complete" summary line
readme = readme.replace(
  /\*\*\d+ \/ 100 complete\*\*/,
  `**${total} / 100 complete**`
);

// Patch the last-updated date
const today = new Date().toISOString().split("T")[0];
readme = readme.replace(/last updated: \d{4}-\d{2}-\d{2}/, `last updated: ${today}`);

fs.writeFileSync(readmePath, readme, "utf8");
console.log(`README.md patched — ${total}/100 agents (${cardCount} cards + ${offset} offset)`);
