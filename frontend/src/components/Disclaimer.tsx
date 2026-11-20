import { DISCLAIMER } from "@/lib/draft";

/** Prominent reminder that generated documents are drafts pending legal review. */
export default function Disclaimer() {
  return (
    <p
      role="note"
      className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/10 px-4 py-3 text-sm text-stone-700"
    >
      <span className="font-semibold text-brand-navy">Legal review required. </span>
      {DISCLAIMER}
    </p>
  );
}
