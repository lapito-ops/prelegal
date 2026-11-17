"use client";

import { useEffect, useState } from "react";
import { defaultNda, missingFields, pdfFileName, todayIso, type NdaData } from "@/lib/nda";
import type { Clause } from "@/lib/terms";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

async function downloadPdf(data: NdaData, terms: Clause[]) {
  // Loaded on demand: the PDF renderer is large and only needed on download.
  const [{ pdf }, { NdaPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./NdaPdf"),
  ]);
  const blob = await pdf(<NdaPdf data={data} terms={terms} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFileName(data);
  a.click();
  // Defer revocation so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function NdaCreator({ terms }: { terms: Clause[] }) {
  const [data, setData] = useState<NdaData>(defaultNda);
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  // Default the Effective Date to today on the client, avoiding a
  // server/client mismatch from a date baked in at build time.
  useEffect(() => {
    setData((d) => (d.effectiveDate ? d : { ...d, effectiveDate: todayIso() }));
  }, []);

  const missing = missingFields(data);

  async function handleDownload() {
    setStatus("generating");
    try {
      await downloadPdf(data, terms);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-6">
        <NdaForm data={data} onChange={setData} />

        <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-5">
          <button
            type="button"
            onClick={handleDownload}
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
            <p className="text-xs text-red-700">
              Something went wrong generating the PDF. Please try again.
            </p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <NdaPreview data={data} terms={terms} />
      </div>
    </div>
  );
}
