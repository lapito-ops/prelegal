import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentType, LoadedDocument } from "./draft";
import { parseStandardTerms } from "./terms";

const REPO_ROOT = path.join(process.cwd(), "..");

/**
 * Server-only: reads catalog.json and each document's Standard Terms from the
 * repository at build time, so the legal text has a single source of truth.
 */
export async function loadDocuments(): Promise<LoadedDocument[]> {
  const catalog: DocumentType[] = JSON.parse(
    await readFile(path.join(REPO_ROOT, "catalog.json"), "utf8"),
  );
  return Promise.all(
    catalog.map(async (doc) => {
      const file = path.join(REPO_ROOT, doc.filename);
      const clauses = parseStandardTerms(await readFile(file, "utf8"));
      if (clauses.length === 0) throw new Error(`No clauses could be parsed from ${file}`);
      return { ...doc, clauses };
    }),
  );
}
