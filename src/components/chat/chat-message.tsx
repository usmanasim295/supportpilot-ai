import { Bot, RefreshCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage as Message } from "@/types";
import { OrderSummary } from "./order-summary";
import { SourceCitation } from "./source-citation";
import { TicketConfirmation } from "./ticket-confirmation";

export function ChatMessage({ message, onRetry }: { message: Message; onRetry?(): void }) {
  const assistant = message.role === "assistant";
  return (
    <article className={`flex gap-3 ${assistant ? "justify-start" : "justify-end"}`} aria-live={message.state === "pending" ? "polite" : undefined}>
      {assistant && (
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
          <Bot className="size-4" />
        </div>
      )}
      <div className={`max-w-[82%] ${assistant ? "order-none" : "order-first"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
            assistant
              ? message.state === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-950"
                : "border border-slate-200 bg-white text-slate-700"
              : "bg-slate-950 text-white"
          }`}
        >
          {message.state === "pending" ? (
            <span className="flex items-center gap-2 text-slate-500"><span className="size-2 animate-pulse rounded-full bg-teal-500" />Checking available support services…</span>
          ) : message.content}
          {message.state === "error" && onRetry && (
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          )}
          {message.order && <OrderSummary order={message.order} />}
          {message.ticket && <TicketConfirmation ticket={message.ticket} />}
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 grid gap-2">
            {message.citations.map((citation, index) => <SourceCitation key={citation.id} citation={citation} index={index + 1} />)}
          </div>
        )}
      </div>
      {!assistant && (
        <div className="grid size-8 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600">
          <UserRound className="size-4" />
        </div>
      )}
    </article>
  );
}
