/**
 * Parses Common Paper Standard Terms markdown (templates/*.md) into a small,
 * renderer-agnostic list of clauses.
 *
 * Templates are nested markdown lists, four spaces per level. A clause title is
 * either a <span class="header_N"> or a leading **Title**. Inline markup is
 * limited to **bold**, links, and <span class="*_link"> references to cover page
 * terms. Lines that are not list items (headings, attribution) are skipped.
 */

export type Run =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  /** A term defined on the Cover Page, e.g. "Governing Law". */
  | { type: "ref"; text: string }
  | { type: "link"; text: string; href: string };

export interface Clause {
  /** Nesting level, 0 for top-level sections. */
  depth: number;
  /** Display number: "1.", "1.1", "(a)", "(iv)". */
  label: string;
  title?: string;
  body: Run[];
}

const TOKEN =
  /\*\*([^*]+)\*\*|<span class="[a-z]+_link"[^>]*>([^<]+)<\/span>|\[([^\]]+)\]\(([^)]+)\)|<(https?:[^>]+)>/g;

export function parseRuns(markdown: string): Run[] {
  const runs: Run[] = [];
  let last = 0;
  for (const m of markdown.matchAll(TOKEN)) {
    if (m.index > last) runs.push({ type: "text", text: markdown.slice(last, m.index) });
    // Bold passages may contain term references; keep their words, drop the markup.
    if (m[1] !== undefined) runs.push({ type: "bold", text: m[1].replace(/<[^>]+>/g, "") });
    else if (m[2] !== undefined) runs.push({ type: "ref", text: m[2] });
    else if (m[3] !== undefined) runs.push({ type: "link", text: m[3], href: m[4] });
    else runs.push({ type: "link", text: m[5], href: m[5] });
    last = m.index + m[0].length;
  }
  if (last < markdown.length) runs.push({ type: "text", text: markdown.slice(last) });
  return runs;
}

const ITEM = /^( *)([0-9]+|[a-z]+)\.\s+(.*)$/;
/** Anchor spans used for cross-references; they never nest other markup. */
const ANCHOR = /<span id="[^"]*">([^<]*)<\/span>/g;
const TITLE = /^(?:<span class="header_\d"[^>]*>([^<]+)<\/span>|\*\*([^*]+)\*\*(\.))\s*/;

/** Sections and subsections are numbered by position ("1.", "1.1"); deeper levels keep their letter. */
function labeler() {
  let section = 0;
  let subsection = 0;
  return (depth: number, marker: string): string => {
    if (depth === 0) {
      section += 1;
      subsection = 0;
      return `${section}.`;
    }
    if (depth === 1) return `${section}.${++subsection}`;
    return `(${marker})`;
  };
}

export function parseStandardTerms(markdown: string): Clause[] {
  const label = labeler();
  const clauses: Clause[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const item = line.match(ITEM);
    if (!item) continue;
    const depth = Math.floor(item[1].length / 4);
    const text = item[3].replace(ANCHOR, "$1");
    const title = text.match(TITLE);
    const body = title ? text.slice(title[0].length) : text;
    clauses.push({
      depth,
      label: label(depth, item[2]),
      ...(title && { title: title[1] ?? title[2] + title[3] }),
      body: parseRuns(body.trim()),
    });
  }
  return clauses;
}
