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
const client = new Client({ name: "slug-test", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

async function call(name, args, label) {
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 180_000 });
  const text = (r.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
  writeFileSync(join(__dirname, `slug-${label}.json`), text);
  return text;
}

// 1. Try include_fields with "slug"
await call(
  "batch_search_products",
  { queries: [{ keyword: "Apfel Granny Smith", include_fields: ["slug", "url", "productSlug", "link"] }] },
  "search-fields"
);

// 2. Plain search — does response include slug by default?
await call(
  "batch_search_products",
  { queries: [{ keyword: "Apfel Granny Smith" }] },
  "search-plain"
);

// 3. Ask for product details of 7994
await call("get_product_details", { product_ids: [7994] }, "pd-7994");

await client.close();
console.log("done");
