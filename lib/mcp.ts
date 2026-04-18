import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.gurkerl.at/mcp";
const REQUEST_TIMEOUT_MS = 150_000;

export type McpToolCaller = {
  callTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
};

type Credentials = {
  email: string;
  password: string;
};

type RemoteTransport = StreamableHTTPClientTransport | SSEClientTransport;

function requestHeaders(credentials: Credentials): HeadersInit {
  return {
    "rhl-email": credentials.email,
    "rhl-pass": credentials.password
  };
}

function debugLog(label: string, message: string): void {
  if (process.env.MCP_DEBUG === "1") {
    process.stderr.write(`[${label}:mcp] ${message}\n`);
  }
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
  let client = new Client({ name: `korbly-${label}`, version: "0.1.0" }, { capabilities: {} });
  let transport: RemoteTransport | null = null;

  try {
    const url = new URL(MCP_URL);
    const requestInit = { headers: requestHeaders(credentials) };

    try {
      transport = new StreamableHTTPClientTransport(url, { requestInit });
      await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });
    } catch (streamableError) {
      debugLog(label, `Streamable HTTP transport failed, falling back to SSE: ${String(streamableError)}`);
      await transport?.close().catch(() => undefined);

      client = new Client({ name: `korbly-${label}`, version: "0.1.0" }, { capabilities: {} });
      transport = new SSEClientTransport(url, { requestInit });
      await client.connect(transport, { timeout: REQUEST_TIMEOUT_MS });
    }

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
  } catch (error) {
    debugLog(label, `MCP request failed: ${String(error)}`);
    throw error;
  } finally {
    await transport?.close().catch(() => undefined);
    try {
      await client.close();
    } catch {
      // Closing best-effort.
    }
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
