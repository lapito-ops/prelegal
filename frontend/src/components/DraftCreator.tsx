"use client";

import { useState } from "react";
import { emptyDraft, missingFields, pdfFileName, type Draft, type LoadedDocument } from "@/lib/draft";
import DraftChat from "./DraftChat";
import DraftPreview from "./DraftPreview";

type Status = "idle" | "generating" | "error";

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

export default function DraftCreator({ documents }: { documents: LoadedDocument[] }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<Status>("idle");

  const doc = documents.find((d) => d.id === draft.documentId);

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
      <div className="space-y-6">
        <DraftChat draft={draft} onChange={setDraft} />

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

function DownloadPanel({ status, missing, onDownload }: DownloadPanelProps) {
  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-5">
      <button
        type="button"
        onClick={onDownload}
        disabled={status === "generating"}
        className="w-full rounded-md bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-purple/90 disabled:cursor-wait disabled:opacity-60"
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
    <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
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
