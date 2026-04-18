#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const { RHL_EMAIL, RHL_PASS } = process.env;
if (!RHL_EMAIL || !RHL_PASS) {
  console.error("Missing RHL_EMAIL or RHL_PASS. Create .env from .env.example.");
  process.exit(1);
}

const MCP_URL = "https://mcp.gurkerl.at/mcp";
const mode = process.argv[2] ?? "smoke";

const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "-y",
    "mcp-remote",
    MCP_URL,
    "--header",
    `rhl-email: ${RHL_EMAIL}`,
    "--header",
    `rhl-pass: ${RHL_PASS}`,
    "--debug",
  ],
  env: {
    ...process.env,
    MCP_REMOTE_CONFIG_DIR: join(__dirname, ".mcp-auth"),
  },
  stderr: "pipe",
});

const REQUEST_TIMEOUT_MS = 150_000;

transport.stderr?.on("data", (chunk) => {
  process.stderr.write(`[mcp-remote] ${chunk}`);
});

const client = new Client(
  { name: "gurkerl-smoke-test", version: "0.1.0" },
  { capabilities: {} }
);

function truncate(str, max = 400) {
  if (typeof str !== "string") str = JSON.stringify(str, null, 2);
  return str.length > max ? str.slice(0, max) + `… [${str.length - max} more chars]` : str;
}

function logSection(title) {
  console.log("\n" + "=".repeat(8) + " " + title + " " + "=".repeat(8));
}

async function main() {
  console.log(`Connecting to ${MCP_URL} as ${RHL_EMAIL}…`);
  await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });

  const serverInfo = client.getServerVersion?.();
  if (serverInfo) console.log("Server:", serverInfo);
  const caps = client.getServerCapabilities?.();
  if (caps) console.log("Capabilities:", caps);

  logSection("tools/list");
  const toolsRes = await client.listTools(undefined, { timeout: REQUEST_TIMEOUT_MS });
  for (const t of toolsRes.tools) {
    console.log(`- ${t.name}: ${t.description ?? "(no description)"}`);
    if (t.inputSchema) {
      const props = t.inputSchema.properties
        ? Object.keys(t.inputSchema.properties).join(", ")
        : "(no args)";
      console.log(`    args: ${props}`);
    }
  }

  if (mode === "list") {
    await client.close();
    return;
  }

  logSection("resources/list");
  try {
    const res = await client.listResources();
    console.log(`${res.resources?.length ?? 0} resource(s)`);
    for (const r of (res.resources ?? []).slice(0, 5)) {
      console.log(`- ${r.uri} — ${r.name ?? ""}`);
    }
  } catch (e) {
    console.log("(no resources or unsupported)", e?.code ?? e?.message);
  }

  logSection("prompts/list");
  try {
    const res = await client.listPrompts();
    console.log(`${res.prompts?.length ?? 0} prompt(s)`);
  } catch (e) {
    console.log("(no prompts or unsupported)", e?.code ?? e?.message);
  }

  const toolNames = new Set(toolsRes.tools.map((t) => t.name));
  const tryCall = async (name, args) => {
    if (!toolNames.has(name)) return;
    logSection(`tools/call ${name}`);
    console.log("args:", JSON.stringify(args));
    try {
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: REQUEST_TIMEOUT_MS });
      const text = (result.content ?? [])
        .map((c) => (c.type === "text" ? c.text : JSON.stringify(c)))
        .join("\n");
      console.log(truncate(text, 1200));
      if (result.isError) console.log("(tool reported isError=true)");
    } catch (e) {
      console.log("ERROR:", e?.message ?? e);
    }
  };

  const searchCandidates = ["search_products", "searchProducts", "search", "product_search", "find_products"];
  const cartCandidates = ["get_cart", "getCart", "view_cart", "cart", "show_cart"];
  const recCandidates = ["recommendations", "get_recommendations", "recommended_products"];

  for (const n of searchCandidates) await tryCall(n, { query: "Milch", limit: 3 });
  for (const n of cartCandidates) await tryCall(n, {});
  for (const n of recCandidates) await tryCall(n, { limit: 3 });

  await client.close();
}

main().catch(async (err) => {
  console.error("Fatal:", err);
  try {
    await client.close();
  } catch {}
  process.exit(1);
});
