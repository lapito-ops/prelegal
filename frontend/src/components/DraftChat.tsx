"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat, type ChatMessage } from "@/lib/chat";
import type { Draft } from "@/lib/draft";
import { inputClass } from "./styles";

interface Props {
  draft: Draft;
  onChange: (draft: Draft) => void;
}

/** Freeform chat with the AI, which picks the document, asks questions and fills it in. */
export default function DraftChat({ draft, onChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(true);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runTurn(history: ChatMessage[]) {
    setPending(true);
    setError(false);
    try {
      const turn = await sendChat(history, draft);
      setMessages([...history, { role: "assistant", content: turn.reply }]);
      onChange(turn.draft);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    runTurn([]);
    // Greeting runs once on mount.
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
    <section className="flex h-[32rem] flex-col rounded-lg border border-stone-200 bg-white">
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
          className="rounded-md bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-purple/90 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </section>
  );
}
