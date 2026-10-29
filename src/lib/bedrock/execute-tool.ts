import { ZodError } from "zod";
import { MOCK_CUSTOMER_ID } from "@/lib/context/customer";
import type { OrderRepository } from "@/lib/repositories/orders";
import type { TicketRepository } from "@/lib/repositories/tickets";
import { createSupportTicket } from "@/lib/tools/create-support-ticket";
import { lookupOrder } from "@/lib/tools/lookup-order";
import { createSupportTicketInputSchema } from "@/lib/tools/schemas";
import type { TicketSummary } from "@/types";
import { isAllowedToolName } from "./tool-specs";
import type { AgentOrderResult } from "./types";

export class ToolValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolValidationError";
  }
}

export class ToolNotAllowedError extends Error {
  constructor(public readonly toolName: string) {
    super(`Tool "${toolName}" is not allowlisted.`);
    this.name = "ToolNotAllowedError";
  }
}

export interface ToolExecutionContext {
  customerId?: string;
  orders: OrderRepository;
  tickets: TicketRepository;
}

export interface ToolSideEffects {
  order?: AgentOrderResult;
  ticket?: TicketSummary;
}

export async function executeAllowlistedTool(
  toolName: string,
  rawInput: unknown,
  context: ToolExecutionContext,
): Promise<{ payload: unknown; sideEffects: ToolSideEffects }> {
  if (!isAllowedToolName(toolName)) {
    throw new ToolNotAllowedError(toolName);
  }

  const customerId = context.customerId ?? MOCK_CUSTOMER_ID;
  const sideEffects: ToolSideEffects = {};

  try {
    if (toolName === "lookupOrder") {
      const result = await lookupOrder(rawInput, { customerId, orders: context.orders });
      if (result.found) {
        sideEffects.order = result.order;
      }
      return { payload: result, sideEffects };
    }

    const parsed = createSupportTicketInputSchema.parse(rawInput);
    const result = await createSupportTicket(parsed, {
      customerId,
      orders: context.orders,
      tickets: context.tickets,
    });
    if (result.created) {
      sideEffects.ticket = {
        ticketId: result.ticketId,
        status: result.status as TicketSummary["status"],
        category: parsed.category,
      };
    }
    return { payload: result, sideEffects };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ToolValidationError(error.issues[0]?.message ?? "Invalid tool arguments.");
    }
    throw error;
  }
}
