import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

function response(body, status, origin = "null") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin"
    }
  });
}

async function authenticate(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Google sign-in is required.");
  if (!env.GOOGLE_WEB_CLIENT_ID || env.GOOGLE_WEB_CLIENT_ID.startsWith("REPLACE_")) {
    throw new Error("The server Google OAuth client ID is not configured.");
  }
  const verified = await jwtVerify(match[1], GOOGLE_KEYS, {
    issuer: GOOGLE_ISSUERS,
    audience: env.GOOGLE_WEB_CLIENT_ID
  });
  if (!verified.payload.sub || !verified.payload.email_verified) throw new Error("A verified Google account is required.");
  return verified.payload;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const expectedOrigin = env.APP_ORIGIN || "null";
    if (origin !== expectedOrigin) return response({ error: { message: "Origin not allowed." } }, 403, expectedOrigin);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": expectedOrigin,
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin"
      }
    });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/v1/chat/completions") {
      return response({ error: { message: "Not found." } }, 404, expectedOrigin);
    }
    if (!env.DEEPSEEK_API_KEY) return response({ error: { message: "The DeepSeek server key is not configured." } }, 503, expectedOrigin);

    let identity;
    try {
      identity = await authenticate(request, env);
    } catch (error) {
      return response({ error: { message: error.message || "Google authentication failed." } }, 401, expectedOrigin);
    }

    if (env.AI_RATE_LIMITER) {
      const limit = await env.AI_RATE_LIMITER.limit({ key: String(identity.sub) });
      if (!limit.success) return response({ error: { message: "Too many requests. Please wait a moment." } }, 429, expectedOrigin);
    }

    let incoming;
    try {
      const raw = await request.text();
      if (raw.length > 120000) return response({ error: { message: "Request is too large." } }, 413, expectedOrigin);
      incoming = JSON.parse(raw);
    } catch (_) {
      return response({ error: { message: "Invalid JSON request." } }, 400, expectedOrigin);
    }
    if (!Array.isArray(incoming.messages) || incoming.messages.length < 1 || incoming.messages.length > 80) {
      return response({ error: { message: "Invalid messages." } }, 400, expectedOrigin);
    }
    const body = {
      model: "deepseek-flash",
      messages: incoming.messages,
      temperature: 0.25,
      stream: false,
      thinking: { type: "disabled" }
    };
    if (Array.isArray(incoming.tools) && incoming.tools.length <= 40) {
      body.tools = incoming.tools;
      body.tool_choice = "auto";
      body.parallel_tool_calls = false;
    }

    let upstream;
    try {
      upstream = await fetch(DEEPSEEK_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.DEEPSEEK_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    } catch (_) {
      return response({ error: { message: "Could not reach DeepSeek. Try again later." } }, 502, expectedOrigin);
    }
    const upstreamText = await upstream.text();
    return new Response(upstreamText, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": expectedOrigin,
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin"
      }
    });
  }
};
