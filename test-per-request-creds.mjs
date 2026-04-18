#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_URL = "https://mcp.gurkerl.at/mcp";
const REQUEST_TIMEOUT_MS = 150_000;

function loadEnvFile() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
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

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function hiddenQuestion(prompt) {
  if (!process.stdin.isTTY) return question(prompt);

  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let answer = "";

    function cleanup() {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    }

    function onData(chunk) {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\u0003") {
          cleanup();
          process.exit(130);
        }
        if (char === "\r" || char === "\n" || char === "\u0004") {
          cleanup();
          resolve(answer);
          return;
        }
        if (char === "\u007f") {
          answer = answer.slice(0, -1);
          continue;
        }
        answer += char;
      }
    }

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

function textFromToolResult(result) {
  return (result.content ?? [])
    .map((item) => (item.type === "text" ? item.text : JSON.stringify(item)))
    .join("\n");
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, canonicalize(val)])
  );
}

function fingerprint(value) {
  const canonical = JSON.stringify(canonicalize(value));
  return createHash("sha256").update(canonical).digest("hex").slice(0, 12);
}

function redactEmail(value) {
  const [local, domain] = String(value).split("@");
  if (!domain) return "[redacted]";
  const visible = local.length <= 2 ? local[0] ?? "*" : `${local[0]}***${local.at(-1)}`;
  return `${visible}@${domain}`;
}

function redactScalar(key, value) {
  if (value == null) return value;
  const lower = key.toLowerCase();
  const stringValue = String(value);

  if (lower.includes("email")) return redactEmail(stringValue);
  if (lower.includes("phone") || lower.includes("mobile")) return `[redacted:${stringValue.slice(-2)}]`;
  if (lower.includes("name")) return `[redacted:${stringValue.slice(0, 1)}…]`;
  if (lower === "id" || lower.endsWith("_id") || lower.endsWith("id")) return stringValue;
  if (typeof value === "boolean" || typeof value === "number") return value;
  return "[redacted]";
}

function extractIdentitySummary(value) {
  const summary = [];
  const interesting = /(^id$|_id$|id$|email|name|phone|mobile|customer|user)/i;

  function visit(node, path = []) {
    if (!node || typeof node !== "object" || summary.length >= 12) return;

    if (Array.isArray(node)) {
      for (const item of node.slice(0, 3)) visit(item, path);
      return;
    }

    for (const [key, val] of Object.entries(node)) {
      const nextPath = [...path, key];
      if (val && typeof val === "object") {
        visit(val, nextPath);
      } else if (interesting.test(key)) {
        summary.push(`${nextPath.join(".")}: ${redactScalar(key, val)}`);
      }
    }
  }

  visit(value);
  return summary;
}

function minimalChildEnv(configDir) {
  const allowed = [
    "HOME",
    "PATH",
    "SHELL",
    "TMPDIR",
    "USER",
    "LOGNAME",
    "LANG",
    "LC_ALL",
    "npm_config_cache",
  ];

  const env = {};
  for (const key of allowed) {
    if (process.env[key]) env[key] = process.env[key];
  }

  env.MCP_REMOTE_CONFIG_DIR = configDir;
  env.NO_COLOR = "1";
  return env;
}

function redactKnownSecrets(text, secrets) {
  let redacted = text;
  for (const secret of secrets.filter(Boolean)) {
    redacted = redacted.split(secret).join("[redacted]");
  }
  return redacted;
}

async function getUserInfoWithCredentials(label, email, password) {
  const configDir = await mkdtemp(join(tmpdir(), `korbly-mcp-${label}-`));
  const client = new Client({ name: `korbly-${label}-cred-smoke`, version: "0.1.0" }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: "npx",
    args: [
      "-y",
      "mcp-remote",
      MCP_URL,
      "--header",
      `rhl-email: ${email}`,
      "--header",
      `rhl-pass: ${password}`,
    ],
    env: minimalChildEnv(configDir),
    stderr: "pipe",
  });

  transport.stderr?.on("data", (chunk) => {
    if (process.env.MCP_SMOKE_DEBUG === "1") {
      process.stderr.write(`[${label}:mcp-remote] ${redactKnownSecrets(String(chunk), [email, password])}`);
    }
  });

  try {
    await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });
    const tools = await client.listTools(undefined, { timeout: REQUEST_TIMEOUT_MS });
    const result = await client.callTool({ name: "get_user_info", arguments: {} }, undefined, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    const rawText = textFromToolResult(result);
    const parsed = parseMaybeJson(rawText);

    return {
      label,
      ok: true,
      toolCount: tools.tools?.length ?? 0,
      isError: Boolean(result.isError),
      parsed,
      fingerprint: fingerprint(parsed),
      identitySummary: extractIdentitySummary(parsed),
    };
  } catch (err) {
    return {
      label,
      ok: false,
      toolCount: 0,
      isError: true,
      parsed: null,
      fingerprint: "ERROR",
      identitySummary: [],
      error: redactKnownSecrets(err?.message ?? String(err), [email, password]),
    };
  } finally {
    try {
      await client.close();
    } catch {}
    await rm(configDir, { recursive: true, force: true });
  }
}

function printResult(result) {
  console.log(`\n${result.label}`);
  console.log(`  status: ${result.ok ? "connected" : "failed"}`);
  console.log(`  tools visible: ${result.toolCount}`);
  console.log(`  get_user_info isError: ${result.isError}`);
  if (result.error) console.log(`  error: ${result.error}`);
  console.log(`  redacted fingerprint: ${result.fingerprint}`);
  if (result.identitySummary.length) {
    console.log("  redacted identity fields:");
    for (const line of result.identitySummary) console.log(`    - ${line}`);
  } else {
    console.log("  redacted identity fields: none detected");
  }
}

async function main() {
  loadEnvFile();

  const hostEmail = process.env.HOST_RHL_EMAIL ?? process.env.RHL_EMAIL;
  const hostPass = process.env.HOST_RHL_PASS ?? process.env.RHL_PASS;
  if (!hostEmail || !hostPass) {
    console.error("Missing host credentials. Set RHL_EMAIL/RHL_PASS in .env or HOST_RHL_EMAIL/HOST_RHL_PASS in env.");
    process.exit(1);
  }

  const userEmail = process.env.USER_RHL_EMAIL ?? (await question("User Gurkerl email: "));
  const userPass = process.env.USER_RHL_PASS ?? (await hiddenQuestion("User Gurkerl password: "));
  if (!userEmail || !userPass) {
    console.error("Missing user credentials.");
    process.exit(1);
  }

  console.log("\nConnecting two isolated MCP clients...");
  const [hostResult, userResult] = await Promise.all([
    getUserInfoWithCredentials("host", hostEmail, hostPass),
    getUserInfoWithCredentials("user", userEmail, userPass),
  ]);

  printResult(hostResult);
  printResult(userResult);

  const sameExpected = hostEmail.toLowerCase() === userEmail.toLowerCase();
  const differentFingerprints = hostResult.fingerprint !== userResult.fingerprint;

  console.log("\nverdict");
  if (!hostResult.ok || !userResult.ok) {
    console.log("  FAIL: at least one real credential set could not call get_user_info.");
    process.exitCode = 1;
  } else if (differentFingerprints) {
    console.log("  PASS: per-request credentials reached different Gurkerl account contexts.");
  } else if (sameExpected) {
    console.log("  INCONCLUSIVE: both credential sets used the same email, so account separation cannot be proven.");
    console.log("\nnegative control");
    console.log("  Trying intentionally invalid credentials in a third isolated MCP client...");
    const invalidResult = await getUserInfoWithCredentials(
      "invalid-control",
      `korbly-invalid-${Date.now()}@example.invalid`,
      "not-a-real-gurkerl-password"
    );
    printResult(invalidResult);
    if (!invalidResult.ok || invalidResult.fingerprint !== hostResult.fingerprint) {
      console.log("  PASS: invalid per-request credentials did not reuse the host account context.");
    } else {
      console.log("  FAIL: invalid credentials returned the host account fingerprint.");
      process.exitCode = 1;
    }
  } else {
    console.log("  FAIL: different emails produced the same get_user_info fingerprint.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal:", err?.message ?? err);
  process.exit(1);
});
