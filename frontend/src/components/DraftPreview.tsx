import {
  SIGNING_STATEMENT,
  attribution,
  buildCoverRows,
  buildSignatureRows,
  coverIntro,
  type Draft,
  type LoadedDocument,
} from "@/lib/draft";
import type { Clause, Run } from "@/lib/terms";

function Runs({ runs }: { runs: Run[] }) {
  return runs.map((run, i) => {
    switch (run.type) {
      case "bold":
        return <strong key={i}>{run.text}</strong>;
      case "ref":
        return (
          <span key={i} className="font-medium text-brand-blue">
            {run.text}
          </span>
        );
      case "link":
        return (
          <a key={i} href={run.href} className="text-brand-blue underline" target="_blank" rel="noreferrer">
            {run.text}
          </a>
        );
      default:
        return <span key={i}>{run.text}</span>;
    }
  });
}

function ClauseText({ clause }: { clause: Clause }) {
  return (
    <p style={{ marginLeft: `${clause.depth * 1.25}rem` }}>
      {clause.label} {clause.title && <strong>{clause.title}</strong>} <Runs runs={clause.body} />
    </p>
  );
}

const cell = "border border-stone-300 p-2 align-top";

/** HTML rendering of the document being drafted, shown as a live preview. */
export default function DraftPreview({ draft, doc }: { draft: Draft; doc: LoadedDocument }) {
  return (
    <article className="space-y-6 bg-white px-8 py-10 font-serif text-[13px] leading-relaxed text-stone-900 shadow-md sm:px-12">
      <header className="space-y-3">
        <h1 className="text-center text-xl font-bold text-brand-navy">{doc.name}</h1>
        <h2 className="text-sm font-bold uppercase">Cover Page</h2>
        <p>{coverIntro(doc)}</p>
      </header>

      <table className="w-full border-collapse text-left">
        <tbody>
          {buildCoverRows(draft, doc).map((row) => (
            <tr key={row.label}>
              <th className={`${cell} w-1/3 font-semibold`}>
                {row.label}
                <span className="block text-xs font-normal italic text-brand-gray">{row.hint}</span>
              </th>
              <td className={`${cell} whitespace-pre-wrap`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>{SIGNING_STATEMENT}</p>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={`${cell} w-1/4`} />
            {doc.parties.map((role) => (
              <th key={role} className={`${cell} text-center uppercase`}>
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buildSignatureRows(draft).map((row) => (
            <tr key={row.label}>
              <th className={`${cell} font-semibold`}>
                {row.label}
                {row.hint && (
                  <span className="block text-xs font-normal italic text-brand-gray">{row.hint}</span>
                )}
              </th>
              {row.values.map((value, i) => (
                <td key={i} className={`${cell} h-10 text-center`}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-brand-gray">{attribution(doc)}</p>

      <section className="space-y-3 border-t border-stone-200 pt-6">
        <h2 className="text-center text-lg font-bold">Standard Terms</h2>
        {doc.clauses.map((clause, i) => (
          <ClauseText key={i} clause={clause} />
        ))}
      </section>
    </article>
  );
}
