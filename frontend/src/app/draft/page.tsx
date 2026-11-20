import DraftCreator from "@/components/DraftCreator";
import { loadDocuments } from "@/lib/loadDocuments";

export default async function DraftPage() {
  const documents = await loadDocuments();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2 border-b-2 border-brand-yellow pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Prelegal</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Legal Document Creator</h1>
        <p className="max-w-2xl text-brand-gray">
          Tell our AI assistant what agreement you need. It picks the right Common Paper template,
          fills it in as you answer, and you can download the completed document as a PDF.
        </p>
      </header>
      <DraftCreator documents={documents} />
    </main>
  );
}
