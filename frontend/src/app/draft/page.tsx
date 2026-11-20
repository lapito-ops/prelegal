import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import Disclaimer from "@/components/Disclaimer";
import DraftWorkspace from "@/components/DraftWorkspace";
import { loadDocuments } from "@/lib/loadDocuments";

export default async function DraftPage() {
  const documents = await loadDocuments();

  return (
    <AppShell>
      <header className="mb-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Legal Document Creator</h1>
          <p className="max-w-2xl text-sm text-brand-gray">
            Tell our AI assistant what agreement you need. It picks the right Common Paper template,
            fills it in as you answer, and you can download the completed document as a PDF.
          </p>
        </div>
        <Disclaimer />
      </header>
      <Suspense>
        <DraftWorkspace documents={documents} />
      </Suspense>
    </AppShell>
  );
}
