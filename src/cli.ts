#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createFaturaMcpServer } from "./mcp/server";

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  const server = createFaturaMcpServer();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
