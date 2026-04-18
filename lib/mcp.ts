import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MCP_URL = "https://mcp.gurkerl.at/mcp";
const REQUEST_TIMEOUT_MS = 150_000;

export type McpToolCaller = {
  callTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
};

type Credentials = {
  email: string;
  password: string;
};

function proxyPath(): string {
  return join(process.cwd(), "node_modules", "mcp-remote", "dist", "proxy.js");
}

function minimalChildEnv(configDir: string): Record<string, string> {
  const allowed = ["HOME", "PATH", "SHELL", "TMPDIR", "USER", "LOGNAME", "LANG", "LC_ALL", "npm_config_cache"];
  const env: Record<string, string> = {};
  for (const key of allowed) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.MCP_REMOTE_CONFIG_DIR = configDir;
  env.NO_COLOR = "1";
  return env;
}

function redact(text: string, secrets: string[]): string {
  return secrets.filter(Boolean).reduce((out, secret) => out.split(secret).join("[redacted]"), text);
}

function textFromToolResult(result: { content?: Array<{ type: string; text?: string }>; isError?: boolean }): string {
  return (result.content ?? [])
    .map((item) => (item.type === "text" ? item.text ?? "" : JSON.stringify(item)))
    .join("\n");
}

function parseToolText<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function withMcpClient<T>(
  label: string,
  credentials: Credentials,
  fn: (caller: McpToolCaller) => Promise<T>
): Promise<T> {
  const configDir = await mkdtemp(join(tmpdir(), `korbly-mcp-${label}-`));
  const client = new Client({ name: `korbly-${label}`, version: "0.1.0" }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      proxyPath(),
      MCP_URL,
      "--header",
      `rhl-email: ${credentials.email}`,
      "--header",
      `rhl-pass: ${credentials.password}`
    ],
    env: minimalChildEnv(configDir),
    stderr: "pipe"
  });

  transport.stderr?.on("data", (chunk) => {
    if (process.env.MCP_DEBUG === "1") {
      process.stderr.write(`[${label}:mcp-remote] ${redact(String(chunk), [credentials.email, credentials.password])}`);
    }
  });

  try {
    await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });
    const caller: McpToolCaller = {
      async callTool<TTool = unknown>(name: string, args: Record<string, unknown>) {
        const result = (await client.callTool({ name, arguments: args }, undefined, {
          timeout: REQUEST_TIMEOUT_MS
        })) as unknown as { content?: Array<{ type: string; text?: string }>; isError?: boolean };
        const text = textFromToolResult(result);
        const parsed = parseToolText<TTool>(text);
        if (result.isError) {
          throw new Error(typeof parsed === "string" ? parsed : `MCP tool ${name} reported an error`);
        }
        return parsed;
      }
    };
    return await fn(caller);
  } finally {
    try {
      await client.close();
    } catch {
      // Closing best-effort; the temp config cleanup below is the important part.
    }
    await rm(configDir, { recursive: true, force: true });
  }
}

export async function withHostClient<T>(fn: (caller: McpToolCaller) => Promise<T>): Promise<T> {
  const email = process.env.RHL_EMAIL;
  const password = process.env.RHL_PASS;
  if (!email || !password) throw new Error("Missing RHL_EMAIL or RHL_PASS for host Gurkerl browsing.");
  return withMcpClient("host", { email, password }, fn);
}

export async function withUserClient<T>(
  email: string,
  password: string,
  fn: (caller: McpToolCaller) => Promise<T>
): Promise<T> {
  return withMcpClient("user", { email, password }, fn);
}
