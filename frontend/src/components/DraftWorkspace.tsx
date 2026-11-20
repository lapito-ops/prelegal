"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getDocument, type SavedDocument } from "@/lib/api";
import { emptyDraft, type LoadedDocument } from "@/lib/draft";
import DraftCreator from "./DraftCreator";

/** Starts a new document, or resumes the saved one named by `?id=`. */
export default function DraftWorkspace({ documents }: { documents: LoadedDocument[] }) {
  const savedId = useSearchParams().get("id");
  return savedId ? (
    <ResumeDraft key={savedId} id={savedId} documents={documents} />
  ) : (
    <DraftCreator documents={documents} initialDraft={emptyDraft} initialMessages={[]} />
  );
}

const loadErrorMessage = (err: unknown) =>
  err instanceof ApiError && err.status === 404
    ? "This document was not found."
    : "This document could not be loaded.";

function ResumeDraft({ id, documents }: { id: string; documents: LoadedDocument[] }) {
  const [saved, setSaved] = useState<SavedDocument | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocument(id)
      .then(setSaved)
      .catch((err) => {
        console.error(err);
        setError(loadErrorMessage(err));
      });
  }, [id]);

  if (error) {
    return (
      <p className="text-sm text-red-700">
        {error}{" "}
        <Link href="/documents/" className="font-semibold text-brand-blue underline">
          Back to My documents
        </Link>
      </p>
    );
  }
  if (!saved) return <p className="text-sm text-brand-gray">Loading document…</p>;
  return (
    <DraftCreator documents={documents} savedId={id} initialDraft={saved.draft} initialMessages={saved.messages} />
  );
}
