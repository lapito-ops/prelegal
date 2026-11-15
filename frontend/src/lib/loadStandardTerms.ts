import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseStandardTerms, type Clause } from "./terms";

/**
 * Server-only: reads the Standard Terms from the repository's template
 * dataset so the legal text has a single source of truth.
 */
export async function loadStandardTerms(): Promise<Clause[]> {
  const file = path.join(process.cwd(), "..", "templates", "Mutual-NDA.md");
  const clauses = parseStandardTerms(await readFile(file, "utf8"));
  if (clauses.length === 0) {
    throw new Error(`No Standard Terms clauses could be parsed from ${file}`);
  }
  return clauses;
}
