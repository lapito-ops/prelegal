import AppShell from "@/components/AppShell";
import DocumentHistory from "@/components/DocumentHistory";
import { loadDocuments } from "@/lib/loadDocuments";

export default async function DocumentsPage() {
  const names = Object.fromEntries((await loadDocuments()).map((d) => [d.id, d.name]));

  return (
    <AppShell>
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">My documents</h1>
        <p className="text-sm text-brand-gray">Open a draft to keep editing it or download it again.</p>
      </header>
      <DocumentHistory names={names} />
    </AppShell>
  );
}
