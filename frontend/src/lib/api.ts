import type { ChatMessage } from "./chat";
import type { Draft } from "./draft";

export interface User {
  id: number;
  email: string;
}

export interface DocumentSummary {
  id: string;
  draft: Draft;
  updatedAt: string;
}

export interface SavedDocument extends DocumentSummary {
  messages: ChatMessage[];
}

/** A failed API call; `detail` is the backend's human-readable message when it sent one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail?: string,
  ) {
    super(`Request failed: ${status}${detail ? ` ${detail}` : ""}`);
  }
}

/** True when a request failed because the session is missing or expired. */
export const isSignedOut = (err: unknown) => err instanceof ApiError && err.status === 401;

/** JSON request to the same-origin API; the session cookie is sent automatically. */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, typeof error.detail === "string" ? error.detail : undefined);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const signUp = (email: string, password: string) =>
  request<User>("POST", "/api/auth/signup", { email, password });

export const signIn = (email: string, password: string) =>
  request<User>("POST", "/api/auth/signin", { email, password });

export const signOut = () => request<void>("POST", "/api/auth/signout");

export const getMe = () => request<User>("GET", "/api/auth/me");

export const listDocuments = () => request<DocumentSummary[]>("GET", "/api/documents");

export const getDocument = (id: string) => request<SavedDocument>("GET", `/api/documents/${id}`);

export const createDocument = (draft: Draft, messages: ChatMessage[]) =>
  request<SavedDocument>("POST", "/api/documents", { draft, messages });

export const saveDocument = (id: string, draft: Draft, messages: ChatMessage[]) =>
  request<SavedDocument>("PUT", `/api/documents/${id}`, { draft, messages });
