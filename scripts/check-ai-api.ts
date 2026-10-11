// Run: npx tsx scripts/check-ai-api.ts — verifies schema enforcement via a mock model + every provider builds.
import assert from "node:assert/strict";
import { NoObjectGeneratedError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { draftFromModel, getModel } from "../src/utils/aiApi";
import { AI_API_PROVIDER_CONFIG } from "../src/types/extensionSettings";
import type { ActiveAiApiProvider } from "../src/types";

const mockReturning = (text: string) =>
  new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
      warnings: [],
    },
  });

assert.deepEqual(
  await draftFromModel(mockReturning(JSON.stringify({ title: " Login button broken ", description: "- clicks do nothing " })), "p", "t"),
  { title: "Login button broken", description: "- clicks do nothing" }
);

await assert.rejects(
  draftFromModel(mockReturning(JSON.stringify({ description: "no title" })), "p", "t"),
  (err) => NoObjectGeneratedError.isInstance(err)
);

await assert.rejects(
  draftFromModel(mockReturning(JSON.stringify({ title: "   ", description: "blank title" })), "p", "t"),
  (err) => NoObjectGeneratedError.isInstance(err)
);

for (const provider of Object.keys(AI_API_PROVIDER_CONFIG) as ActiveAiApiProvider[]) {
  const model = getModel({ provider, apiKey: "k", model: AI_API_PROVIDER_CONFIG[provider].defaultModel });
  assert.ok(typeof model === "object" && model.modelId, `${provider} model built`);
}

console.log("ok");
