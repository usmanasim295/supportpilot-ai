import { getBedrockClient } from "./client";
import { createBedrockConversePort } from "./converse-client";
import { BedrockSupportAgent } from "./agent";

let cachedAgent: BedrockSupportAgent | undefined;

export function getSupportAgent(): BedrockSupportAgent {
  cachedAgent ??= new BedrockSupportAgent(createBedrockConversePort(getBedrockClient()));
  return cachedAgent;
}
