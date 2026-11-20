"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, signIn, signUp } from "@/lib/api";
import { DISCLAIMER } from "@/lib/draft";
import { useRedirectIfSignedIn } from "@/lib/useCurrentUser";
import Logo from "./Logo";
import { inputClass, primaryButton } from "./styles";

type Mode = "signin" | "signup";

const COPY = {
  signin: {
    heading: "Welcome back",
    subheading: "Sign in to continue drafting your agreements.",
    submit: "Sign in",
    pending: "Signing in…",
    action: signIn,
    next: "/documents/",
    autoComplete: "current-password",
    minLength: undefined,
    hint: "",
    switchText: "New to Prelegal?",
    switchLink: { href: "/signup/", label: "Create an account" },
  },
  signup: {
    heading: "Create your account",
    subheading: "Start drafting standard legal agreements in minutes.",
    submit: "Create account",
    pending: "Creating account…",
    action: signUp,
    next: "/draft/",
    autoComplete: "new-password",
    minLength: 8,
    hint: "At least 8 characters.",
    switchText: "Already have an account?",
    switchLink: { href: "/", label: "Sign in" },
  },
};

const FEATURES = [
  "11 Common Paper standard agreements, from NDAs to cloud service terms",
  "An AI assistant that asks the right questions and fills in the details",
  "Live preview, PDF download and a history of every draft",
];

/** Split-panel sign in / sign up screen; signed-in visitors go straight to their documents. */
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useRedirectIfSignedIn("/documents/");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await copy.action(email, password);
      router.push(copy.next);
    } catch (err) {
      setError(err instanceof ApiError && err.detail ? err.detail : "Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-navy p-12 text-white lg:flex">
        <Logo light />
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Legal agreements, <span className="text-brand-yellow">drafted in a conversation.</span>
          </h2>
          <ul className="space-y-3 text-white/80">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-yellow" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/50">Templates by Common Paper, licensed CC BY 4.0.</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-brand-navy">{copy.heading}</h1>
            <p className="text-sm text-brand-gray">{copy.subheading}</p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-700">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-stone-700">Password</span>
              <input
                type="password"
                required
                minLength={copy.minLength}
                autoComplete={copy.autoComplete}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {copy.hint && <span className="text-xs text-brand-gray">{copy.hint}</span>}
            </label>
            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
              {pending ? copy.pending : copy.submit}
            </button>
          </form>
          <p className="text-center text-sm text-brand-gray">
            {copy.switchText}{" "}
            <Link href={copy.switchLink.href} className="font-semibold text-brand-blue hover:underline">
              {copy.switchLink.label}
            </Link>
          </p>
          <p className="border-t border-stone-200 pt-6 text-xs leading-relaxed text-brand-gray">{DISCLAIMER}</p>
        </div>
      </main>
    </div>
  );
}
