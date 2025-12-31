import { PaymentIntent, IntentStatus } from "@cronos-x402/shared-types";
import { randomUUID } from "crypto";

class IntentService {
  private intents: Map<string, PaymentIntent> = new Map();

  create(intent: Omit<PaymentIntent, "intentId" | "status" | "createdAt">): PaymentIntent {
    const newIntent: PaymentIntent = {
      intentId: randomUUID(),
      ...intent,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.intents.set(newIntent.intentId, newIntent);
    return newIntent;
  }

  getById(intentId: string): PaymentIntent | undefined {
    return this.intents.get(intentId);
  }

  getAll(): PaymentIntent[] {
    return Array.from(this.intents.values());
  }

  updateStatus(intentId: string, status: IntentStatus, txHash?: string): boolean {
    const intent = this.intents.get(intentId);
    if (!intent) return false;
    intent.status = status;
    if (txHash) intent.txHash = txHash;
    return true;
  }
}

export const intentService = new IntentService();
