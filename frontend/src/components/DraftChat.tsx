"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isSignedOut } from "@/lib/api";
import { sendChat, type ChatMessage } from "@/lib/chat";
import type { Draft } from "@/lib/draft";
import { cardClass, inputClass, primaryButton } from "./styles";

interface Props {
  draft: Draft;
  initialMessages: ChatMessage[];
  onTurn: (messages: ChatMessage[], draft: Draft) => void;
}

/**
 * Freeform chat with the AI, which picks the document, asks questions and fills it in.
 * A new chat starts with the AI's greeting; a resumed one continues from `initialMessages`.
 */
export default function DraftChat({ draft, initialMessages, onTurn }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(initialMessages.length === 0);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runTurn(history: ChatMessage[]) {
    setPending(true);
    setError(false);
    try {
      const turn = await sendChat(history, draft);
      const updated: ChatMessage[] = [...history, { role: "assistant", content: turn.reply }];
      setMessages(updated);
      onTurn(updated, turn.draft);
    } catch (err) {
      if (isSignedOut(err)) router.replace("/");
      console.error(err);
      setError(true);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialMessages.length === 0) runTurn([]);
    // Greeting runs once on mount, and only for a new chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);

  // Clicking Send moves focus to the button; return it to the input once the AI answers.
  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (pending || !content) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    runTurn(history);
  }

  return (
    <section className={`${cardClass} flex h-[34rem] flex-col`}>
      <header className="flex items-center gap-2 border-b border-stone-200 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <h2 className="text-sm font-semibold text-brand-navy">AI drafting assistant</h2>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-brand-blue text-white"
                : "bg-stone-100 text-stone-800"
            }`}
          >
            {m.content}
          </p>
        ))}
        {pending && <p className="text-sm text-brand-gray">Thinking…</p>}
        {error && (
          <p className="text-sm text-red-700">
            Something went wrong reaching the AI.{" "}
            <button type="button" onClick={() => runTurn(messages)} className="underline">
              Try again
            </button>
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-stone-200 p-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          aria-label="Message"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className={`${primaryButton} py-2`}
        >
          Send
        </button>
      </form>
    </section>
  );
}
