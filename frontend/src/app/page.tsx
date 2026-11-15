import NdaCreator from "@/components/NdaCreator";
import { loadStandardTerms } from "@/lib/loadStandardTerms";

export default async function Home() {
  const terms = await loadStandardTerms();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Prelegal</p>
        <h1 className="text-3xl font-bold tracking-tight">Mutual NDA Creator</h1>
        <p className="max-w-2xl text-stone-600">
          Fill in the key details below. The Common Paper Mutual Non-Disclosure Agreement updates
          as you type, and you can download the completed document as a PDF.
        </p>
      </header>
      <NdaCreator terms={terms} />
    </main>
  );
}
