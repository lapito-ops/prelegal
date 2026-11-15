/**
 * Parses the Common Paper Mutual NDA Standard Terms markdown
 * (templates/Mutual-NDA.md) into a small, renderer-agnostic structure.
 *
 * The template only uses a limited markdown subset: numbered clauses whose
 * title is bold, inline **bold** definitions, links, and
 * <span class="coverpage_link">…</span> references to cover page fields.
 */

export type Run =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  /** A term defined on the Cover Page, e.g. "Purpose". */
  | { type: "ref"; text: string }
  | { type: "link"; text: string; href: string };

export interface Clause {
  number: number;
  title: string;
  body: Run[];
}

const TOKEN =
  /\*\*([^*]+)\*\*|<span class="coverpage_link">([^<]+)<\/span>|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseRuns(markdown: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const m of markdown.matchAll(TOKEN)) {
    if (m.index > last) runs.push({ type: "text", text: markdown.slice(last, m.index) });
    if (m[1] !== undefined) runs.push({ type: "bold", text: m[1] });
    else if (m[2] !== undefined) runs.push({ type: "ref", text: m[2] });
    else runs.push({ type: "link", text: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < markdown.length) runs.push({ type: "text", text: markdown.slice(last) });
  return runs;
}

const CLAUSE = /^(\d+)\.\s+\*\*(.+?)\*\*\.\s*([\s\S]*)$/;

export function parseStandardTerms(markdown: string): Clause[] {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim().match(CLAUSE))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ number: Number(m[1]), title: m[2], body: parseRuns(m[3]) }));
}
