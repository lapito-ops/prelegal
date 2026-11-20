"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/api";
import { DISCLAIMER } from "@/lib/draft";
import { useCurrentUser } from "@/lib/useCurrentUser";
import Logo from "./Logo";
import { primaryButton } from "./styles";

/** Signed-in layout: top navigation, page content and footer. Renders nothing until signed in. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (!user) {
    return <p className="p-10 text-center text-sm text-brand-gray">Loading…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/documents/" aria-label="Prelegal home">
              <Logo />
            </Link>
            <Link
              href="/documents/"
              className={`hidden rounded-md px-3 py-2 text-sm font-medium transition sm:block ${
                pathname === "/documents/" ? "bg-stone-100 text-brand-navy" : "text-stone-600 hover:text-brand-navy"
              }`}
            >
              My documents
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* A full page load so a draft in progress is always replaced by a fresh one. */}
            <a href="/draft/" className={`${primaryButton} px-3 py-2`}>
              New document
            </a>
            <span className="hidden text-sm text-brand-gray md:inline">{user.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-medium text-stone-600 hover:text-brand-navy"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-stone-200 bg-white">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-brand-gray sm:px-6">
          {DISCLAIMER} Prelegal does not provide legal advice.
        </p>
      </footer>
    </div>
  );
}
