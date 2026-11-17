import NdaCreator from "@/components/NdaCreator";
import { loadStandardTerms } from "@/lib/loadStandardTerms";

export default async function Home() {
  const terms = await loadStandardTerms();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2 border-b-2 border-brand-yellow pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Prelegal</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Mutual NDA Creator</h1>
        <p className="max-w-2xl text-brand-gray">
          Fill in the key details below. The Common Paper Mutual Non-Disclosure Agreement updates
          as you type, and you can download the completed document as a PDF.
        </p>
      </header>
      <NdaCreator terms={terms} />
    </main>
  );
}
