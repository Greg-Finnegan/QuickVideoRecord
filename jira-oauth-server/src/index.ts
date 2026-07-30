import { createOAuthServer } from "./server.js";

const requiredEnvironment = [
  "JIRA_CLIENT_ID",
  "JIRA_CLIENT_SECRET",
  "JIRA_REDIRECT_URI",
  "ALLOWED_EXTENSION_ORIGIN",
] as const;

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const server = createOAuthServer({
  jiraClientId: process.env.JIRA_CLIENT_ID!,
  jiraClientSecret: process.env.JIRA_CLIENT_SECRET!,
  jiraRedirectUri: process.env.JIRA_REDIRECT_URI!,
  allowedExtensionOrigin: process.env.ALLOWED_EXTENSION_ORIGIN!,
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Jira OAuth exchange server listening on port ${port}`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}; shutting down`);
  server.close((error) => {
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
