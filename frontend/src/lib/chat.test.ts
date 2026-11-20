import { afterEach, describe, expect, it, vi } from "vitest";
import { sendChat, type ChatMessage } from "./chat";
import { emptyDraft } from "./draft";

afterEach(() => vi.unstubAllGlobals());

describe("sendChat", () => {
  it("posts messages and draft and returns the turn", async () => {
    const turn = { reply: "Hi", draft: { ...emptyDraft, documentId: "mutual-nda" } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(turn)));
    vi.stubGlobal("fetch", fetchMock);
    const messages: ChatMessage[] = [{ role: "user", content: "hello" }];

    expect(await sendChat(messages, emptyDraft)).toEqual(turn);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(init.body)).toEqual({ messages, draft: emptyDraft });
  });

  it("throws on a failed response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    await expect(sendChat([], emptyDraft)).rejects.toThrow("500");
  });
});
