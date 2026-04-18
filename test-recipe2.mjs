#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
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
const client = new Client({ name: "recipe2", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

async function call(name, args, label) {
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 180_000 });
  const text = (r.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
  writeFileSync(join(__dirname, `out-${label}.json`), text);
  return text;
}

// Resolve IDs from the earlier generate response
await call(
  "get_product_details",
  { product_ids: [10029, 30180, 19766, 36143, 32269, 39454, 36780, 36781, 36330] },
  "product-details"
);

// Get recipe detail with product mapping
await call(
  "get_recipe_detail",
  { recipe_id: 6, include_product_mapping: true, include_meta: ["image", "author", "link"], include_brand: true, include_prices: "full" },
  "recipe-detail"
);

await client.close();
console.log("done");
