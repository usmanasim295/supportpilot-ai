import { describe, expect, it } from "vitest";
import { executeAllowlistedTool, ToolNotAllowedError, ToolValidationError } from "@/lib/bedrock/execute-tool";
import { FixtureOrderRepository } from "@/lib/repositories/orders";
import { InMemoryTicketRepository } from "@/lib/repositories/tickets";

const context = {
  customerId: "mock-customer-001",
  orders: new FixtureOrderRepository(),
  tickets: new InMemoryTicketRepository(),
};

describe("executeAllowlistedTool", () => {
  it("rejects arbitrary tool names", async () => {
    await expect(executeAllowlistedTool("deleteDatabase", {}, context)).rejects.toBeInstanceOf(ToolNotAllowedError);
  });

  it("rejects invalid lookup arguments", async () => {
    await expect(executeAllowlistedTool("lookupOrder", { orderId: "bad" }, context)).rejects.toBeInstanceOf(
      ToolValidationError,
    );
  });

  it("returns safe not-found for unauthorized orders", async () => {
    const result = await executeAllowlistedTool(
      "lookupOrder",
      { orderId: "ORD-1001" },
      { ...context, customerId: "other-customer" },
    );
    expect(result.payload).toEqual({ found: false, orderId: "ORD-1001" });
    expect(result.sideEffects.order).toBeUndefined();
  });
});
