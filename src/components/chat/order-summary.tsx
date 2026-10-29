import { Box } from "lucide-react";
import type { OrderSummaryData } from "@/types";

export function OrderSummary({ order }: { order: OrderSummaryData }) {
  return (
    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-sky-700 p-2 text-white">
          <Box className="size-4" />
        </div>
        <div className="text-xs text-sky-950">
          <p className="text-sm font-bold">{order.orderId}</p>
          <p className="mt-1 capitalize">{order.status.replaceAll("_", " ")}</p>
          <p className="mt-1">Est. delivery: {order.estimatedDeliveryDate}</p>
          {order.carrier && <p>Carrier: {order.carrier}</p>}
          <ul className="mt-2 list-disc pl-4">
            {order.items.map((item) => (
              <li key={item.name}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
