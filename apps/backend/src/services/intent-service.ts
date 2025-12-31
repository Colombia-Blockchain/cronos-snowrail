import { PaymentIntent, IntentStatus } from "@cronos-x402/shared-types";
import { randomUUID } from "crypto";

interface IntentWithOwner extends PaymentIntent {
  owner?: string; // TODO: Make required in Issue #9 when auth is implemented
}

class IntentService {
  private intents: Map<string, IntentWithOwner> = new Map();

  create(intent: Omit<PaymentIntent, "intentId" | "status" | "createdAt">, owner?: string): IntentWithOwner {
    const newIntent: IntentWithOwner = {
      intentId: randomUUID(),
      ...intent,
      status: "pending",
      createdAt: new Date().toISOString(),
      owner,
    };
    this.intents.set(newIntent.intentId, newIntent);
    return newIntent;
  }

  getById(intentId: string): IntentWithOwner | undefined {
    return this.intents.get(intentId);
  }

  getAll(): IntentWithOwner[] {
    return Array.from(this.intents.values());
  }

  updateStatus(intentId: string, status: IntentStatus, txHash?: string): boolean {
    const intent = this.intents.get(intentId);
    if (!intent) return false;
    intent.status = status;
    if (txHash) intent.txHash = txHash;
    return true;
  }

  verifyOwnership(intentId: string, owner: string): boolean {
    const intent = this.intents.get(intentId);
    return intent?.owner === owner;
  }
}

export const intentService = new IntentService();
