import type { Draft } from "./draft";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatTurn {
  reply: string;
  draft: Draft;
}

/** Sends the conversation and current draft; an empty history returns the AI's greeting. */
export async function sendChat(messages: ChatMessage[], draft: Draft): Promise<ChatTurn> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, draft }),
  });
  if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
  return response.json();
}
