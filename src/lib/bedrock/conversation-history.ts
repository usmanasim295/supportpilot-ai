import type { Message } from "@aws-sdk/client-bedrock-runtime";

const store = new Map<string, Message[]>();

export function loadConversationMessages(conversationId: string | undefined): Message[] {
  if (!conversationId) return [];
  const history = store.get(conversationId);
  return history ? structuredClone(history) : [];
}

export function saveConversationMessages(conversationId: string | undefined, messages: Message[]) {
  if (!conversationId) return;
  store.set(conversationId, structuredClone(messages));
}

/** Test helper */
export function clearConversationHistory() {
  store.clear();
}
