import {
  ATTRIBUTION,
  COVER_PAGE_INTRO,
  SIGNING_STATEMENT,
  buildCoverPage,
  buildSignatureRows,
  type NdaData,
} from "@/lib/nda";
import type { Clause, Run } from "@/lib/terms";

function Runs({ runs }: { runs: Run[] }) {
  return runs.map((run, i) => {
    switch (run.type) {
      case "bold":
        return <strong key={i}>{run.text}</strong>;
      case "ref":
        return (
          <span key={i} className="font-medium text-indigo-700">
            {run.text}
          </span>
        );
      case "link":
        return (
          <a key={i} href={run.href} className="underline" target="_blank" rel="noreferrer">
            {run.text}
          </a>
        );
      default:
        return <span key={i}>{run.text}</span>;
    }
  });
}

/** HTML rendering of the completed MNDA, shown as a live preview. */
export default function NdaPreview({ data, terms }: { data: NdaData; terms: Clause[] }) {
  return (
    <article className="space-y-6 bg-white px-8 py-10 font-serif text-[13px] leading-relaxed text-stone-900 shadow-md sm:px-12">
      <header className="space-y-3">
        <h1 className="text-center text-xl font-bold">Mutual Non-Disclosure Agreement</h1>
        <h2 className="text-sm font-bold uppercase">Using this Mutual Non-Disclosure Agreement</h2>
        <p>{COVER_PAGE_INTRO}</p>
      </header>

      {buildCoverPage(data).map((section) => (
        <section key={section.title} className="space-y-1">
          <h3 className="font-bold">{section.title}</h3>
          {section.hint && <p className="text-xs italic text-stone-500">{section.hint}</p>}
          {section.lines?.map((line) => (
            <p key={line} className="whitespace-pre-wrap">
              {line}
            </p>
          ))}
          {section.options?.map((option) => (
            <p key={option.text} className={option.selected ? "" : "text-stone-400"}>
              <span className="mr-2 font-sans">{option.selected ? "☒" : "☐"}</span>
              {option.text}
            </p>
          ))}
        </section>
      ))}

      <p>{SIGNING_STATEMENT}</p>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="w-1/4 border border-stone-300 p-2" />
            <th className="border border-stone-300 p-2 text-center">PARTY 1</th>
            <th className="border border-stone-300 p-2 text-center">PARTY 2</th>
          </tr>
        </thead>
        <tbody>
          {buildSignatureRows(data).map((row) => (
            <tr key={row.label}>
              <th className="border border-stone-300 p-2 align-top font-semibold">
                {row.label}
                {row.hint && (
                  <span className="block text-xs font-normal italic text-stone-500">
                    {row.hint}
                  </span>
                )}
              </th>
              {row.values.map((value, i) => (
                <td key={i} className="h-10 border border-stone-300 p-2 text-center align-top">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-stone-500">{ATTRIBUTION}</p>

      <section className="space-y-3 border-t border-stone-200 pt-6">
        <h2 className="text-center text-lg font-bold">Standard Terms</h2>
        {terms.map((clause) => (
          <p key={clause.number}>
            {clause.number}. <strong>{clause.title}</strong>. <Runs runs={clause.body} />
          </p>
        ))}
      </section>
    </article>
  );
}
