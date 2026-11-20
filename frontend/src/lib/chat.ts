import { request } from "./api";
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
export const sendChat = (messages: ChatMessage[], draft: Draft) =>
  request<ChatTurn>("POST", "/api/chat", { messages, draft });
