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
  args: ["-y", "mcp-remote", "https://mcp.gurkerl.at/mcp",
    "--header", `rhl-email: ${process.env.RHL_EMAIL}`,
    "--header", `rhl-pass: ${process.env.RHL_PASS}`],
  env: { ...process.env, MCP_REMOTE_CONFIG_DIR: join(__dirname, ".mcp-auth") },
  stderr: "pipe",
});
transport.stderr?.on("data", () => {});
const client = new Client({ name: "sweep", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

async function exists(id) {
  try {
    const r = await client.callTool(
      { name: "get_recipe_detail", arguments: { recipe_id: id, include_product_mapping: false, include_prices: "basic" } },
      undefined,
      { timeout: 30_000 }
    );
    const text = r.content[0].text;
    const o = JSON.parse(text);
    return o.success === true;
  } catch {
    return false;
  }
}

// 1) Find upper bound by sparse probes every 50 from 894 upward
console.log("=== finding top of ID range ===");
let top = 894;
for (let id = 900; id <= 3000; id += 50) {
  const ok = await exists(id);
  if (ok) top = id;
  process.stdout.write(`${id}:${ok ? "1" : "."} `);
  if (id % 500 === 0) process.stdout.write("\n");
}
console.log(`\nlast hit during sparse probe: ${top}`);

// 2) Narrow down: probe every 5 past top
console.log("\n=== narrowing end ===");
let end = top;
let miss = 0;
for (let id = top + 1; id < top + 200; id++) {
  const ok = await exists(id);
  if (ok) { end = id; miss = 0; } else miss++;
  if (miss >= 60) break;
}
console.log(`final top recipe_id: ${end}`);

// 3) Full sweep 1..end with concurrency
console.log(`\n=== sweeping 1..${end} ===`);
const ids = Array.from({ length: end }, (_, i) => i + 1);
const CONCURRENCY = 10;
const hits = [];
let done = 0;
async function worker() {
  while (ids.length) {
    const id = ids.shift();
    const ok = await exists(id);
    if (ok) hits.push(id);
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${end}  found=${hits.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
hits.sort((a, b) => a - b);
writeFileSync(join(__dirname, "recipe-ids.json"), JSON.stringify(hits));
console.log(`\nTOTAL valid recipe IDs: ${hits.length}`);
console.log(`range: ${hits[0]}..${hits[hits.length - 1]}`);

await client.close();
