import { describe, expect, it } from "vitest";
import { mapAgentError } from "@/lib/bedrock/errors";
import { BedrockInvocationError } from "@/lib/bedrock/invoke";
import { AgentLoopLimitError, MalformedModelOutputError } from "@/lib/bedrock/types";

describe("mapAgentError", () => {
  it.each([
    ["ACCESS_DENIED", 403, false],
    ["THROTTLED", 429, true],
    ["TIMEOUT", 504, true],
    ["SERVICE_ERROR", 502, true],
  ] as const)("maps Bedrock %s errors", (code, status, retryable) => {
    const mapped = mapAgentError(new BedrockInvocationError(code, "safe message", retryable));
    expect(mapped).toMatchObject({ code, status, retryable, message: "safe message" });
  });

  it("maps malformed model output", () => {
    expect(mapAgentError(new MalformedModelOutputError())).toMatchObject({
      code: "MALFORMED_MODEL_OUTPUT",
      status: 502,
      retryable: true,
    });
  });

  it("maps tool loop exhaustion", () => {
    expect(mapAgentError(new AgentLoopLimitError())).toMatchObject({ code: "TOOL_LOOP_LIMIT", status: 500 });
  });
});
