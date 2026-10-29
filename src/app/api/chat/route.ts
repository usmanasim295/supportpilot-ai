import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { SupportAgent } from "@/lib/bedrock/agent";
import { mapAgentError } from "@/lib/bedrock/errors";
import { getSupportAgent } from "@/lib/bedrock/factory";
import { resolveModel, type Environment } from "@/lib/bedrock/model-registry";
import { chatRequestSchema, MAX_CHAT_REQUEST_BYTES } from "@/lib/validation/chat";
import type { ApiResponse } from "@/types";

function errorResponse(code: string, message: string, status: number, retryable = false) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error: { code, message, retryable } }, { status });
}

export async function handleChatRequest(
  request: Request,
  dependencies: { agent?: SupportAgent; env?: Environment } = {},
) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_CHAT_REQUEST_BYTES) {
    return errorResponse("REQUEST_TOO_LARGE", "Request body exceeds the 16 KB limit.", 413);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_CHAT_REQUEST_BYTES) {
      return errorResponse("REQUEST_TOO_LARGE", "Request body exceeds the 16 KB limit.", 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  try {
    const input = chatRequestSchema.parse(body);
    const model = resolveModel(input.modelKey, dependencies.env ?? process.env);
    if (!model.configuredModelId) {
      return errorResponse(
        "MODEL_NOT_CONFIGURED",
        `${model.displayName} is catalog-verified but not configured for this environment. Add its server-side model or inference profile ID.`,
        503,
      );
    }
    let agent: SupportAgent;
    try {
      agent = dependencies.agent ?? getSupportAgent();
    } catch {
      return errorResponse(
        "MODEL_NOT_CONFIGURED",
        "AWS_REGION is not configured. Set server-side AWS environment variables before invoking Bedrock.",
        503,
      );
    }
    const result = await agent.respond({ ...input, model, conversationId: input.conversationId });
    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request.", 400);
    }
    const mapped = mapAgentError(error);
    return errorResponse(mapped.code, mapped.message, mapped.status, mapped.retryable);
  }
}

export async function POST(request: Request) {
  return handleChatRequest(request);
}
