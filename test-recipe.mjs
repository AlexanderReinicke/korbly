#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
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

const client = new Client({ name: "recipe-test", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 180_000 });

async function call(name, args, label) {
  console.log(`\n\n========== ${label} ==========`);
  console.log("tool:", name);
  console.log("args:", JSON.stringify(args));
  const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 180_000 });
  const text = (r.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
  writeFileSync(join(__dirname, `out-${label}.json`), text);
  try {
    const parsed = JSON.parse(text);
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log(text);
  }
}

await call(
  "generate_recipe_with_ingredients_search",
  { user_query: "einfache Carbonara für 2 Personen" },
  "generate"
);

await call(
  "search_recipes_by_vector_similarity",
  { query: "Carbonara", limit: 1 },
  "search"
);

await client.close();
