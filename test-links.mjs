#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync } from "node:fs";
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
const client = new Client({ name: "links", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

const r = await client.callTool(
  {
    name: "batch_search_products",
    arguments: {
      queries: [
        { keyword: "Guanciale", include_fields: ["link", "productName", "price"] },
        { keyword: "Pecorino Romano", include_fields: ["link", "productName", "price"] },
        { keyword: "Spaghetti", include_fields: ["link", "productName", "price"] },
      ],
    },
  },
  undefined,
  { timeout: 180_000 }
);

const data = JSON.parse(r.content[0].text);
const baseUrl = "https://www.gurkerl.at/";

for (const result of data.results) {
  console.log(`\n── ${result.query.keyword} ──`);
  for (const p of result.products) {
    const path = (p.link ?? "").replace(/^\?productPopup=/, "");
    const url = path ? baseUrl + path : "(no slug)";
    const price = p.price ? `€${p.price.full ?? p.price}` : "";
    console.log(`  ${p.productName ?? "(unnamed)"}  ${price}`);
    console.log(`    ${url}`);
  }
}

await client.close();
