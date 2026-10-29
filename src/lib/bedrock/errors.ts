import { BedrockInvocationError } from "./invoke";
import {
  AgentLoopLimitError,
  MalformedModelOutputError,
  UnsupportedModelCapabilityError,
} from "./types";
import { ToolNotAllowedError, ToolValidationError } from "./execute-tool";

export interface MappedAgentError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
}

export function mapAgentError(error: unknown): MappedAgentError {
  if (error instanceof BedrockInvocationError) {
    const status =
      error.code === "ACCESS_DENIED" || error.code === "MODEL_UNAVAILABLE"
        ? 403
        : error.code === "THROTTLED"
          ? 429
          : error.code === "TIMEOUT"
            ? 504
            : 502;
    return {
      code: error.code,
      message: error.message,
      status,
      retryable: error.retryable,
    };
  }
  if (error instanceof UnsupportedModelCapabilityError) {
    return { code: "UNSUPPORTED_CAPABILITY", message: error.message, status: 400, retryable: false };
  }
  if (error instanceof MalformedModelOutputError) {
    return { code: "MALFORMED_MODEL_OUTPUT", message: error.message, status: 502, retryable: true };
  }
  if (error instanceof AgentLoopLimitError) {
    return {
      code: "TOOL_LOOP_LIMIT",
      message: "The assistant needed too many tool steps. Please simplify your request and try again.",
      status: 500,
      retryable: true,
    };
  }
  if (error instanceof ToolValidationError) {
    return { code: "TOOL_VALIDATION_ERROR", message: error.message, status: 400, retryable: false };
  }
  if (error instanceof ToolNotAllowedError) {
    return { code: "TOOL_NOT_ALLOWED", message: "An unsupported tool was requested.", status: 400, retryable: false };
  }
  return {
    code: "INTERNAL_ERROR",
    message: "Support is temporarily unavailable. Please try again later.",
    status: 500,
    retryable: true,
  };
}
