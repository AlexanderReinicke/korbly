#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(__dirname, ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "-y", "mcp-remote", "https://mcp.gurkerl.at/mcp",
    "--header", `rhl-email: ${process.env.RHL_EMAIL}`,
    "--header", `rhl-pass: ${process.env.RHL_PASS}`,
  ],
  env: { ...process.env, MCP_REMOTE_CONFIG_DIR: join(__dirname, ".mcp-auth") },
  stderr: "pipe",
});
transport.stderr?.on("data", () => {});
const client = new Client({ name: "count", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

async function call(name, args) {
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 180_000 });
  return (r.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
}

async function tryRecipe(id) {
  try {
    const text = await call("get_recipe_detail", { recipe_id: id, include_product_mapping: false, include_prices: "basic" });
    const o = JSON.parse(text);
    return { id, ok: o.success === true, name: o.name ?? null };
  } catch (e) {
    return { id, ok: false, error: String(e.message ?? e) };
  }
}

// 1. Scrape the recipe index page
console.log("=== scraping /chef ===");
const siteText = await call("get_url_content", {
  url: "https://www.gurkerl.at/chef",
  include_links: true,
});
writeFileSync(join(__dirname, "recipe-index.json"), siteText);
const idSet = new Set();
for (const m of siteText.matchAll(/\/chef\/(\d+)-/g)) idSet.add(+m[1]);
console.log(`unique recipe IDs found on /chef: ${idSet.size}`);
if (idSet.size) {
  const ids = [...idSet].sort((a, b) => a - b);
  console.log(`min=${ids[0]} max=${ids[ids.length - 1]}`);
}

// 2. Binary-search the ID space upper bound
console.log("\n=== binary search for max valid recipe_id ===");
async function existsSafe(id) {
  const r = await tryRecipe(id);
  return r.ok;
}
let lo = 1;
let hi = 10;
while (await existsSafe(hi)) {
  lo = hi;
  hi *= 2;
  if (hi > 100000) break;
  console.log(`  bump: ${lo} → ${hi}`);
}
console.log(`bounds: lo=${lo} hi=${hi}`);
while (hi - lo > 1) {
  const mid = Math.floor((lo + hi) / 2);
  const ok = await existsSafe(mid);
  console.log(`  probe ${mid} → ${ok}`);
  if (ok) lo = mid;
  else hi = mid;
}
console.log(`\nhighest valid recipe_id ≈ ${lo}`);

// 3. Count gaps by sampling
console.log("\n=== sampling density 1..lo in buckets of 50 ===");
const samples = Math.min(60, lo);
let hits = 0;
for (let i = 1; i <= samples; i++) {
  const id = Math.floor((i * lo) / samples);
  const ok = await existsSafe(id);
  if (ok) hits++;
}
console.log(`sampled ${samples} IDs evenly across 1..${lo}, valid=${hits} (${((hits / samples) * 100).toFixed(0)}%)`);
console.log(`estimated total ≈ ${Math.round((hits / samples) * lo)}`);

await client.close();
