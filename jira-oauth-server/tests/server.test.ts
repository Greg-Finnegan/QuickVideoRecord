import assert from "node:assert/strict";
import { once } from "node:events";
import { afterEach, test } from "node:test";
import type { AddressInfo } from "node:net";
import { createOAuthServer } from "../src/server.js";

const origin = "chrome-extension://abcdefghijklmnop";
const servers: ReturnType<typeof createOAuthServer>[] = [];

async function start(fetchImpl: typeof fetch) {
  const server = createOAuthServer({
    jiraClientId: "client-id",
    jiraClientSecret: "server-secret",
    jiraRedirectUri: "https://abcdefghijklmnop.chromiumapp.org/oauth2",
    allowedExtensionOrigin: origin,
    fetchImpl,
  });
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => server.close(() => resolve()))
    )
  );
});

test("exchanges an authorization code and forwards Atlassian's response", async () => {
  let outboundBody = "";
  const baseUrl = await start(async (_input, init) => {
    outboundBody = String(init?.body);
    return new Response(
      JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 3600,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });

  const response = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ grant_type: "authorization_code", code: "code" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    access_token: "access",
    refresh_token: "refresh",
    expires_in: 3600,
  });
  assert.deepEqual(JSON.parse(outboundBody), {
    grant_type: "authorization_code",
    client_id: "client-id",
    client_secret: "server-secret",
    code: "code",
    redirect_uri: "https://abcdefghijklmnop.chromiumapp.org/oauth2",
  });
});

test("exchanges a refresh token and forwards rotated tokens", async () => {
  let outboundBody = "";
  const baseUrl = await start(async (_input, init) => {
    outboundBody = String(init?.body);
    return new Response(
      JSON.stringify({
        access_token: "next-access",
        refresh_token: "next-refresh",
        expires_in: 3600,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });

  const response = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: "old-refresh",
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(outboundBody), {
    grant_type: "refresh_token",
    client_id: "client-id",
    client_secret: "server-secret",
    refresh_token: "old-refresh",
  });
});

test("preserves Atlassian error status and body", async () => {
  const baseUrl = await start(async () =>
    new Response(JSON.stringify({ error: "invalid_grant" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  );

  const response = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ grant_type: "authorization_code", code: "bad" }),
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "invalid_grant" });
});

test("rejects disallowed origins and malformed requests", async () => {
  const baseUrl = await start(async () => {
    throw new Error("should not be called");
  });

  const forbidden = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "chrome-extension://wrong",
    },
    body: "{}",
  });
  assert.equal(forbidden.status, 403);

  const invalid = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  assert.equal(invalid.status, 400);
});

test("serves health without authentication", async () => {
  const baseUrl = await start(fetch);
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});
