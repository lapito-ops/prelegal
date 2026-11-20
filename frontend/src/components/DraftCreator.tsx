"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDocument, isSignedOut, saveDocument } from "@/lib/api";
import type { ChatMessage } from "@/lib/chat";
import { missingFields, pdfFileName, type Draft, type LoadedDocument } from "@/lib/draft";
import DraftChat from "./DraftChat";
import DraftPreview from "./DraftPreview";
import { cardClass, primaryButton } from "./styles";

type Status = "idle" | "generating" | "error";
type SaveStatus = "unsaved" | "saving" | "saved" | "error";

async function downloadPdf(draft: Draft, doc: LoadedDocument) {
  // Loaded on demand: the PDF renderer is large and only needed on download.
  const [{ pdf }, { DraftPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./DraftPdf"),
  ]);
  const blob = await pdf(<DraftPdf draft={draft} doc={doc} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFileName(draft, doc);
  a.click();
  // Defer revocation so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface Props {
  documents: LoadedDocument[];
  /** The saved document being resumed; a new one is created on the first save. */
  savedId?: string;
  initialDraft: Draft;
  initialMessages: ChatMessage[];
}

/** Chat plus live preview; every AI turn after the user has spoken is saved to their history. */
export default function DraftCreator({ documents, savedId, initialDraft, initialMessages }: Props) {
  const router = useRouter();
  const [id, setId] = useState(savedId);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [status, setStatus] = useState<Status>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(savedId ? "saved" : "unsaved");

  const doc = documents.find((d) => d.id === draft.documentId);

  async function handleTurn(messages: ChatMessage[], updated: Draft) {
    setDraft(updated);
    if (!messages.some((m) => m.role === "user")) return;
    setSaveStatus("saving");
    try {
      if (id) await saveDocument(id, updated, messages);
      else setId((await createDocument(updated, messages)).id);
      setSaveStatus("saved");
    } catch (err) {
      if (isSignedOut(err)) router.replace("/");
      console.error(err);
      setSaveStatus("error");
    }
  }

  async function handleDownload(doc: LoadedDocument) {
    setStatus("generating");
    try {
      await downloadPdf(draft, doc);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="truncate text-lg font-semibold text-brand-navy">{doc?.name ?? "New document"}</h2>
          <SaveIndicator status={saveStatus} />
        </div>
        <DraftChat draft={draft} initialMessages={initialMessages} onTurn={handleTurn} />

        {doc && (
          <DownloadPanel
            status={status}
            missing={missingFields(draft, doc)}
            onDownload={() => handleDownload(doc)}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        {doc ? (
          <DraftPreview draft={draft} doc={doc} />
        ) : (
          <DocumentList documents={documents} />
        )}
      </div>
    </div>
  );
}

interface DownloadPanelProps {
  status: Status;
  missing: string[];
  onDownload: () => void;
}

const SAVE_LABELS: Record<SaveStatus, string> = {
  unsaved: "Saved after your first message",
  saving: "Saving…",
  saved: "Saved to My documents",
  error: "Could not save. Your next message will retry.",
};

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <p className={`shrink-0 text-xs ${status === "error" ? "text-red-700" : "text-brand-gray"}`}>
      {SAVE_LABELS[status]}
    </p>
  );
}

function DownloadPanel({ status, missing, onDownload }: DownloadPanelProps) {
  return (
    <div className={`${cardClass} space-y-2 p-5`}>
      <button
        type="button"
        onClick={onDownload}
        disabled={status === "generating"}
        className={`${primaryButton} w-full`}
      >
        {status === "generating" ? "Generating PDF…" : "Download PDF"}
      </button>
      {missing.length > 0 && (
        <p className="text-xs text-amber-700">
          Still blank (will appear as placeholders): {missing.join(", ")}.
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-700">Something went wrong generating the PDF. Please try again.</p>
      )}
    </div>
  );
}

/** Shown until the AI has picked a document: what Prelegal can draft. */
function DocumentList({ documents }: { documents: LoadedDocument[] }) {
  return (
    <section className={`${cardClass} space-y-4 p-6`}>
      <h2 className="text-lg font-bold text-brand-navy">Documents we can draft</h2>
      <ul className="space-y-3">
        {documents.map((d) => (
          <li key={d.id}>
            <p className="font-semibold text-brand-blue">{d.name}</p>
            <p className="text-sm text-brand-gray">{d.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
