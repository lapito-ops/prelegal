import { afterEach, describe, expect, it, vi } from "vitest";
import { sendChat, type ChatMessage } from "./chat";
import { defaultNda } from "./nda";

afterEach(() => vi.unstubAllGlobals());

describe("sendChat", () => {
  it("posts messages and fields and returns the turn", async () => {
    const turn = { reply: "Hi", fields: { ...defaultNda, governingLaw: "Delaware" } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(turn)));
    vi.stubGlobal("fetch", fetchMock);
    const messages: ChatMessage[] = [{ role: "user", content: "hello" }];

    expect(await sendChat(messages, defaultNda)).toEqual(turn);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(init.body)).toEqual({ messages, fields: defaultNda });
  });

  it("throws on a failed response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    await expect(sendChat([], defaultNda)).rejects.toThrow("500");
  });
});
