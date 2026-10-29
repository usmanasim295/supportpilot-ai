import { describe, expect, it, vi } from "vitest";
import { handleChatRequest } from "@/app/api/chat/route";
import type { SupportAgent } from "@/lib/bedrock/agent";
import { BedrockInvocationError } from "@/lib/bedrock/invoke";
import { resolveModel } from "@/lib/bedrock/model-registry";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/validation/chat";

function request(body: string) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/chat", () => {
  it("rejects malformed JSON", async () => {
    const response = await handleChatRequest(request("{"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
  });

  it.each([
    ["empty", { message: "" }],
    ["oversized", { message: "x".repeat(MAX_CHAT_MESSAGE_LENGTH + 1) }],
    ["unknown fields", { message: "hello", modelId: "arbitrary-model" }],
  ])("rejects %s request bodies", async (_name, body) => {
    const response = await handleChatRequest(request(JSON.stringify(body)));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  });

  it("reports an unavailable model configuration without using AWS", async () => {
    const response = await handleChatRequest(request(JSON.stringify({ message: "Where is my order?" })), { env: {} });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "MODEL_NOT_CONFIGURED" } });
  });

  it("returns agent data when a model is configured and agent is injected", async () => {
    const agent: SupportAgent = {
      respond: vi.fn().mockResolvedValue({
        message: "Returns are accepted within 30 days.",
        citations: [{ id: "1", title: "Returns", path: "returns.md", excerpt: "30 days" }],
      }),
    };
    const response = await handleChatRequest(request(JSON.stringify({ message: "What is your return policy?" })), {
      env: { AWS_REGION: "us-east-1", BEDROCK_MODEL_ID: "global.anthropic.claude-sonnet-5-5" },
      agent,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { message: "Returns are accepted within 30 days.", citations: [{ title: "Returns" }] },
    });
  });

  it("maps throttling errors from the agent", async () => {
    const agent: SupportAgent = {
      respond: vi.fn().mockRejectedValue(new BedrockInvocationError("THROTTLED", "busy", true)),
    };
    const model = resolveModel("claude-sonnet-5-5", {
      AWS_REGION: "us-east-1",
      BEDROCK_SONNET_55_MODEL_ID: "global.anthropic.claude-sonnet-5-5",
    });
    expect(model.configuredModelId).toBeTruthy();
    const response = await handleChatRequest(request(JSON.stringify({ message: "hello", modelKey: "claude-sonnet-5-5" })), {
      env: { AWS_REGION: "us-east-1", BEDROCK_SONNET_55_MODEL_ID: "global.anthropic.claude-sonnet-5-5" },
      agent,
    });
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "THROTTLED", retryable: true } });
  });
});
