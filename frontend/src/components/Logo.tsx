/** Wordmark: a yellow-accented monogram followed by the product name. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-navy text-sm font-bold text-white ring-2 ring-brand-yellow">
        P
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-brand-navy"}`}>
        Prelegal
      </span>
    </span>
  );
}
