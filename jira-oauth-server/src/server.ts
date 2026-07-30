import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const MAX_BODY_BYTES = 16 * 1024;

export interface ServerConfig {
  jiraClientId: string;
  jiraClientSecret: string;
  jiraRedirectUri: string;
  allowedExtensionOrigin: string;
  fetchImpl?: typeof fetch;
}

type TokenRequest =
  | { grant_type: "authorization_code"; code: string }
  | { grant_type: "refresh_token"; refresh_token: string };

function json(
  response: ServerResponse,
  status: number,
  body: unknown,
  origin?: string
): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function parseTokenRequest(value: unknown): TokenRequest | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  if (
    input.grant_type === "authorization_code" &&
    typeof input.code === "string" &&
    input.code.length > 0 &&
    input.code.length <= 4096
  ) {
    return { grant_type: "authorization_code", code: input.code };
  }

  if (
    input.grant_type === "refresh_token" &&
    typeof input.refresh_token === "string" &&
    input.refresh_token.length > 0 &&
    input.refresh_token.length <= 8192
  ) {
    return {
      grant_type: "refresh_token",
      refresh_token: input.refresh_token,
    };
  }

  return null;
}

export function createOAuthServer(config: ServerConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;

  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      json(response, 200, { status: "ok" });
      return;
    }

    if (requestUrl.pathname !== "/v1/oauth/token") {
      json(response, 404, { error: "not_found" });
      return;
    }

    const origin = request.headers.origin;
    if (origin !== config.allowedExtensionOrigin) {
      json(response, 403, { error: "origin_not_allowed" });
      return;
    }

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.setHeader("Access-Control-Max-Age", "3600");
      response.setHeader("Vary", "Origin");
      response.end();
      return;
    }

    if (request.method !== "POST") {
      json(response, 405, { error: "method_not_allowed" }, origin);
      return;
    }

    if (!request.headers["content-type"]?.startsWith("application/json")) {
      json(response, 415, { error: "content_type_must_be_json" }, origin);
      return;
    }

    try {
      const tokenRequest = parseTokenRequest(await readJson(request));
      if (!tokenRequest) {
        json(response, 400, { error: "invalid_token_request" }, origin);
        return;
      }

      const payload =
        tokenRequest.grant_type === "authorization_code"
          ? {
              grant_type: tokenRequest.grant_type,
              client_id: config.jiraClientId,
              client_secret: config.jiraClientSecret,
              code: tokenRequest.code,
              redirect_uri: config.jiraRedirectUri,
            }
          : {
              grant_type: tokenRequest.grant_type,
              client_id: config.jiraClientId,
              client_secret: config.jiraClientSecret,
              refresh_token: tokenRequest.refresh_token,
            };

      const atlassianResponse = await fetchImpl(ATLASSIAN_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await atlassianResponse.text();
      response.statusCode = atlassianResponse.status;
      response.setHeader(
        "Content-Type",
        atlassianResponse.headers.get("content-type") ?? "application/json"
      );
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.end(responseText);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "REQUEST_TOO_LARGE") {
        json(response, 413, { error: "request_too_large" }, origin);
      } else if (message === "INVALID_JSON") {
        json(response, 400, { error: "invalid_json" }, origin);
      } else {
        console.error("Atlassian token exchange failed");
        json(response, 502, { error: "token_exchange_unavailable" }, origin);
      }
    }
  });
}
