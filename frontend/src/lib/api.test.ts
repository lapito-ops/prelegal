import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createDocument, getMe, isSignedOut, saveDocument, signIn, signOut } from "./api";
import { emptyDraft } from "./draft";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api", () => {
  it("posts credentials as JSON", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ id: 1, email: "a@b.co" })));
    expect(await signIn("a@b.co", "pw")).toEqual({ id: 1, email: "a@b.co" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/signin");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.co", password: "pw" });
  });

  it("throws ApiError with the backend detail", async () => {
    mockFetch(new Response(JSON.stringify({ detail: "Incorrect email or password" }), { status: 401 }));
    const error = await signIn("a@b.co", "x").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.detail).toBe("Incorrect email or password");
  });

  it("ignores non-string details such as validation errors", async () => {
    mockFetch(new Response(JSON.stringify({ detail: [{ msg: "bad" }] }), { status: 422 }));
    const error = await getMe().catch((e) => e);
    expect(error.status).toBe(422);
    expect(error.detail).toBeUndefined();
  });

  it("handles empty 204 responses", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(signOut()).resolves.toBeUndefined();
  });

  it("creates a document with POST", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ id: "abc" }), { status: 201 }));
    expect(await createDocument(emptyDraft, [])).toEqual({ id: "abc" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/documents");
    expect(init.method).toBe("POST");
  });

  it("saves a document with PUT", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({})));
    const messages = [{ role: "user" as const, content: "hi" }];
    await saveDocument("abc", emptyDraft, messages);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/documents/abc");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ draft: emptyDraft, messages });
  });
});

describe("isSignedOut", () => {
  it("is true only for 401 API errors", () => {
    expect(isSignedOut(new ApiError(401))).toBe(true);
    expect(isSignedOut(new ApiError(500))).toBe(false);
    expect(isSignedOut(new Error("network"))).toBe(false);
  });
});
