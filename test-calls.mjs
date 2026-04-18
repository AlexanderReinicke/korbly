#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
const { RHL_EMAIL, RHL_PASS } = process.env;

const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "-y",
    "mcp-remote",
    "https://mcp.gurkerl.at/mcp",
    "--header", `rhl-email: ${RHL_EMAIL}`,
    "--header", `rhl-pass: ${RHL_PASS}`,
  ],
  env: { ...process.env, MCP_REMOTE_CONFIG_DIR: join(__dirname, ".mcp-auth") },
  stderr: "pipe",
});
transport.stderr?.on("data", (c) => process.stderr.write(c));

const client = new Client({ name: "gurkerl-real", version: "0.1.0" }, { capabilities: {} });
const T = 120_000;

const trunc = (s, n = 2000) => {
  const str = typeof s === "string" ? s : JSON.stringify(s, null, 2);
  return str.length > n ? str.slice(0, n) + `… [+${str.length - n} chars]` : str;
};

async function call(name, args) {
  console.log(`\n━━━ ${name} ━━━`);
  console.log("args:", JSON.stringify(args));
  try {
    const r = await client.callTool({ name, arguments: args }, undefined, { timeout: T });
    const text = (r.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
    console.log(trunc(text));
    if (r.isError) console.log("(isError=true)");
  } catch (e) {
    console.log("ERROR:", e?.message ?? e);
  }
}

await client.connect(transport, { timeout: T });

await call("get_user_info", {});
await call("batch_search_products", { queries: [{ keyword: "Milch", include_nutritions: false }] });
await call("get_discounted_items", { limit: 5 });
await call("get_all_user_favorites", {});
await call("get_user_shopping_lists_preview", {});
await call("analyze_spending", { include_monthly_breakdown: false });
await call("search_recipes_by_vector_similarity", { query: "schnelles Abendessen mit Pasta", limit: 3 });

await client.close();
