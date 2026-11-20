"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listDocuments, type DocumentSummary } from "@/lib/api";
import { draftTitle } from "@/lib/draft";
import { cardClass, primaryButton } from "./styles";

const formatUpdated = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

/** The signed-in user's saved drafts, newest first, each linking back into the creator. */
export default function DocumentHistory({ names }: { names: Record<string, string> }) {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <p className="text-sm text-red-700">Your documents could not be loaded. Please refresh.</p>;
  if (!documents) return <p className="text-sm text-brand-gray">Loading your documents…</p>;

  if (documents.length === 0) {
    return (
      <div className={`${cardClass} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
        <h2 className="text-lg font-semibold text-brand-navy">No documents yet</h2>
        <p className="max-w-md text-sm text-brand-gray">
          Describe the agreement you need and our AI assistant will draft it with you. Every draft is
          saved here automatically.
        </p>
        <Link href="/draft/" className={primaryButton}>
          Draft your first document
        </Link>
      </div>
    );
  }

  return (
    <ul className={`${cardClass} divide-y divide-stone-200`}>
      {documents.map((d) => (
        <li key={d.id}>
          <Link
            href={`/draft/?id=${d.id}`}
            className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-stone-50"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate font-semibold text-brand-navy">
                {draftTitle(d.draft, names[d.draft.documentId])}
              </p>
              <p className="text-xs text-brand-gray">Last edited {formatUpdated(d.updatedAt)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-yellow/15 px-2.5 py-1 text-xs font-medium text-amber-800">
              Draft
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
