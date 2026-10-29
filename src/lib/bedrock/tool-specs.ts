import type { ToolConfiguration } from "@aws-sdk/client-bedrock-runtime";

export const ALLOWED_TOOL_NAMES = ["lookupOrder", "createSupportTicket"] as const;
export type AllowedToolName = (typeof ALLOWED_TOOL_NAMES)[number];

export function isAllowedToolName(name: string): name is AllowedToolName {
  return (ALLOWED_TOOL_NAMES as readonly string[]).includes(name);
}

export const BEDROCK_TOOL_CONFIG: ToolConfiguration = {
  tools: [
    {
      toolSpec: {
        name: "lookupOrder",
        description:
          "Look up the authenticated customer's order by order ID. Returns status, delivery estimate, carrier, and line items when authorized.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              orderId: {
                type: "string",
                description: "Order identifier such as ORD-1002",
              },
            },
            required: ["orderId"],
          },
        },
      },
    },
    {
      toolSpec: {
        name: "createSupportTicket",
        description:
          "Create a support ticket linked to an order owned by the authenticated customer. Success is confirmed only after persistence.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              orderId: { type: "string", description: "Order identifier such as ORD-1001" },
              category: {
                type: "string",
                enum: ["damaged_item", "delivery_issue", "refund_request", "other"],
              },
              description: { type: "string", description: "Issue description (10–1000 characters)" },
            },
            required: ["orderId", "category", "description"],
          },
        },
      },
    },
  ],
};
