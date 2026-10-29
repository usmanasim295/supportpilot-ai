# Implementation notes

## Agent orchestration

`BedrockSupportAgent` drives Amazon Bedrock **Converse** through a thin port (`createBedrockConversePort`) with a 60s abort timeout. Each request:

1. Retrieves policy passages for the user message.
2. Builds a fixed system prompt plus an explicitly labeled **untrusted evidence** block.
3. Loads prior turns from an in-memory store keyed by optional `conversationId`.
4. Runs a bounded loop (max **8** iterations) until the model ends the turn or tool limits are hit.
5. Executes only allowlisted tools, validates inputs with Zod, and feeds JSON tool results back to the model.

Final responses include assistant text, citation metadata from retrieval (never fabricated), and structured order/ticket data only when repository-backed tools succeed.

## Retrieval and citations

`LocalPolicyRetriever` ranks Markdown paragraphs by keyword overlap with stop-word filtering and a minimum score threshold to drop weak matches. Passages are passed to the model as quoted excerpts; system instructions remain separate. When nothing matches, the system block states that evidence is insufficient so the model should not invent policy details. The `PolicyRetriever` interface is unchanged for a future Bedrock Knowledge Bases adapter.

## Tool authorization and validation

Only `lookupOrder` and `createSupportTicket` are published in `BEDROCK_TOOL_CONFIG`. Execution flows through `executeAllowlistedTool`, which rejects unknown tool names and Zod failures. Customer identity always comes from server context (`MOCK_CUSTOMER_ID` locally), not model arguments. Order lookup returns a uniform not-found shape without leaking cross-customer existence.

## Error handling

`invokeConverse` normalizes AWS SDK failures into `BedrockInvocationError`. The chat route uses `mapAgentError` for throttling, access denied, timeouts, malformed output, tool loop exhaustion, and internal failures—without exposing stacks, prompts, or credentials.

## Tests

Vitest covers retrieval edge cases, tool security, agent orchestration (mocked Converse), API validation, registry behavior, and error mapping. Live AWS credentials are not required for `npm test`.

## Live Bedrock configuration

Set in `.env.local` (server-only):

- `AWS_REGION`
- Credential chain (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` or IAM/SSO)
- Per-model IDs: `BEDROCK_OPUS_48_MODEL_ID`, `BEDROCK_OPUS_5_MODEL_ID`, `BEDROCK_OPUS_55_MODEL_ID`, `BEDROCK_SONNET_55_MODEL_ID`, `BEDROCK_HAIKU_55_MODEL_ID` (or `BEDROCK_MODEL_ID` for Sonnet 5.5 fallback)

Enable each model in the Bedrock console for your account/region before recording the demo.

## Limitations and production hardening

- In-memory tickets, conversations, and idempotency (non-durable, single process).
- Mock customer identity instead of real auth sessions.
- Keyword retrieval instead of semantic search / Knowledge Bases.
- Recommend DynamoDB with conditional idempotency writes, rate limits, structured logging with redaction, and Lambda-isolated tool execution at scale.
