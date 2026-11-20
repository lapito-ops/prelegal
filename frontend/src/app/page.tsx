"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/styles";

/** Fake login: accepts any credentials and brings the user into the platform. */
export default function Login() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/draft/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border-t-4 border-brand-yellow bg-white p-8 shadow-md"
      >
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-brand-navy">Prelegal</h1>
          <p className="text-sm text-brand-gray">Sign in to draft your legal agreements.</p>
        </header>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-brand-gray">Email</span>
          <input type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-brand-gray">Password</span>
          <input type="password" required autoComplete="current-password" className={inputClass} />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-purple/90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
