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

const client = new Client({ name: "schema-dump", version: "0.1.0" }, { capabilities: {} });
await client.connect(transport, { timeout: 120_000 });
const { tools } = await client.listTools(undefined, { timeout: 120_000 });

function formatParam(name, schema, required) {
  const type = schema.type ?? (schema.enum ? "enum" : schema.anyOf ? "anyOf" : "?");
  const req = required ? " (required)" : "";
  const enumStr = schema.enum ? ` — one of: ${schema.enum.map((v) => JSON.stringify(v)).join(", ")}` : "";
  const def = schema.default !== undefined ? ` — default: ${JSON.stringify(schema.default)}` : "";
  const desc = schema.description ? ` — ${schema.description.replace(/\s+/g, " ").trim()}` : "";
  let extra = "";
  if (schema.type === "array" && schema.items) {
    if (schema.items.type) extra = ` of ${schema.items.type}`;
    if (schema.items.properties) {
      extra += ` { ${Object.keys(schema.items.properties).join(", ")} }`;
    }
  }
  if (schema.type === "object" && schema.properties) {
    extra = ` { ${Object.keys(schema.properties).join(", ")} }`;
  }
  return `  • ${name}: ${type}${extra}${req}${enumStr}${def}${desc}`;
}

let out = "";
for (const t of tools) {
  out += `\n### ${t.name}\n`;
  const s = t.inputSchema ?? {};
  const props = s.properties ?? {};
  const required = new Set(s.required ?? []);
  const keys = Object.keys(props);
  if (keys.length === 0) {
    out += "  (no parameters)\n";
    continue;
  }
  for (const k of keys) {
    out += formatParam(k, props[k], required.has(k)) + "\n";
  }
}

writeFileSync(join(__dirname, "tool-schemas.txt"), out);
writeFileSync(
  join(__dirname, "tool-schemas.json"),
  JSON.stringify(tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })), null, 2)
);
process.stdout.write(out);
await client.close();
