import type { NdaData } from "./nda";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatTurn {
  reply: string;
  fields: NdaData;
}

/** Sends the conversation and current fields; an empty history returns the AI's greeting. */
export async function sendChat(messages: ChatMessage[], fields: NdaData): Promise<ChatTurn> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, fields }),
  });
  if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
  return response.json();
}
