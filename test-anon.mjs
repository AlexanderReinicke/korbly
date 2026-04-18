#!/usr/bin/env node
// Test MCP server with no credentials — direct HTTP transport, no mcp-remote shim.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ENDPOINT = new URL("https://mcp.gurkerl.at/mcp");

async function run(label, headers) {
  console.log(`\n══════ ${label} ══════`);
  console.log("headers:", headers);
  const transport = new StreamableHTTPClientTransport(ENDPOINT, {
    requestInit: { headers },
  });
  const client = new Client({ name: "anon-probe", version: "0.1.0" }, { capabilities: {} });
  await client.connect(transport, { timeout: 60_000 });

  async function try_(name, args) {
    process.stdout.write(`  ${name}(${JSON.stringify(args)}) → `);
    try {
      const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 60_000 });
      const txt = r.content?.[0]?.text ?? "";
      let preview;
      try {
        const o = JSON.parse(txt);
        if (o.success === false || o.error) preview = `ERR ${JSON.stringify(o).slice(0, 150)}`;
        else preview = `OK ${JSON.stringify(o).slice(0, 150)}`;
      } catch {
        preview = txt.slice(0, 150);
      }
      console.log(preview);
    } catch (e) {
      console.log(`THROW ${e.message ?? e}`);
    }
  }

  await try_("batch_search_products", { queries: [{ keyword: "Milch" }] });
  await try_("get_product_details", { product_ids: [7994] });
  await try_("get_discounted_items", { limit: 2 });
  await try_("get_user_info", {});
  await try_("get_cart", {});
  await try_("add_items_to_cart", { items: [{ productId: 7994, quantity: 1 }] });
  await try_("get_cart", {});

  await client.close();
}

await run("no headers", {});
await run("empty creds", { "rhl-email": "", "rhl-pass": "" });
await run("bogus creds", { "rhl-email": "nobody@example.invalid", "rhl-pass": "x" });
