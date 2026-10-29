import type { SourceCitation, TicketSummary } from "@/types";

export type ModelKey =
  | "claude-opus-4-8"
  | "claude-opus-5"
  | "claude-opus-5-5"
  | "claude-sonnet-5-5"
  | "claude-haiku-5-5";

export type ModelVerification = "catalog_verified" | "unverified";

export interface ModelCapabilities {
  converse: boolean;
  streaming: boolean;
  toolUse: boolean;
  vision: boolean;
}

export interface ModelDefinition {
  key: ModelKey;
  displayName: string;
  catalogModelId: string | null;
  configuredModelId: string | null;
  envVar: string;
  verification: ModelVerification;
  capabilities: ModelCapabilities;
  configurationSource: "BEDROCK_MODEL_ID" | string | "not_configured";
  constraints: string[];
}

export interface AgentRequest {
  conversationId?: string;
  message: string;
  model: ModelDefinition;
}

export interface AgentOrderResult {
  orderId: string;
  status: string;
  estimatedDeliveryDate: string;
  carrier: string | null;
  items: { name: string; quantity: number }[];
}

export interface AgentResponse {
  message: string;
  citations: SourceCitation[];
  order?: AgentOrderResult;
  ticket?: TicketSummary;
}

export class AgentLoopLimitError extends Error {
  constructor() {
    super("The support agent exceeded the maximum tool loop iterations.");
    this.name = "AgentLoopLimitError";
  }
}

export class MalformedModelOutputError extends Error {
  constructor(message = "The model returned an unexpected response format.") {
    super(message);
    this.name = "MalformedModelOutputError";
  }
}

export class UnsupportedModelCapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedModelCapabilityError";
  }
}

export interface BedrockConversePort {
  converse(input: unknown): Promise<unknown>;
}

export class AgentNotImplementedError extends Error {
  constructor() {
    super("Bedrock agent orchestration has not been implemented.");
    this.name = "AgentNotImplementedError";
  }
}
