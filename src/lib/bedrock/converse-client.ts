import {
  ConverseCommand,
  type BedrockRuntimeClient,
  type ConverseCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import type { BedrockConversePort } from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

export function createBedrockConversePort(
  client: BedrockRuntimeClient,
  options: { timeoutMs?: number } = {},
): BedrockConversePort {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return {
    async converse(input) {
      const command = new ConverseCommand(input as ConverseCommandInput);
      const abortController = new AbortController();
      const timer = setTimeout(() => abortController.abort(), timeoutMs);
      try {
        return await client.send(command, { abortSignal: abortController.signal });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
