/**
 * Data model for a document being drafted, plus pure helpers that turn it into
 * display-ready cover page content. Both the HTML preview and the PDF renderer
 * consume these helpers, so the two outputs always say the same thing.
 */

import type { Clause } from "./terms";

export interface TermDef {
  label: string;
  description: string;
  optional?: boolean;
}

/** One entry of catalog.json. */
export interface DocumentType {
  id: string;
  name: string;
  description: string;
  filename: string;
  /** The two party roles, e.g. ["Provider", "Customer"]. */
  parties: string[];
  terms: TermDef[];
}

export interface LoadedDocument extends DocumentType {
  clauses: Clause[];
}

export interface Party {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export interface Term {
  label: string;
  value: string;
}

/** Mirrors the backend `Draft`; documentId is "" until the AI picks a document. */
export interface Draft {
  documentId: string;
  parties: Party[];
  terms: Term[];
}

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export const emptyDraft: Draft = { documentId: "", parties: [emptyParty, emptyParty], terms: [] };

export const SIGNING_STATEMENT =
  "By signing this Cover Page, each party agrees to enter into this agreement as of the Effective Date.";

export function coverIntro(doc: DocumentType): string {
  return `This ${doc.name} consists of: (1) this Cover Page and (2) the Common Paper ${doc.name} Standard Terms below. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.`;
}

export function attribution(doc: DocumentType): string {
  return `Common Paper ${doc.name} free to use under CC BY 4.0.`;
}

/** Formats an ISO date as e.g. "November 15, 2026" without timezone drift. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function termValue(draft: Draft, label: string): string {
  return draft.terms.find((t) => t.label === label)?.value.trim() ?? "";
}

export interface CoverRow {
  label: string;
  hint: string;
  value: string;
}

/** Key terms with dates formatted; blanks show the template's bracketed placeholder. */
export function buildCoverRows(draft: Draft, doc: DocumentType): CoverRow[] {
  return doc.terms.map((def) => {
    const value = termValue(draft, def.label);
    const display = ISO_DATE.test(value) ? formatDate(value) : value;
    return {
      label: def.label,
      hint: def.description,
      value: display || (def.optional ? "None." : `[${def.label}]`),
    };
  });
}

export interface SignatureRow {
  label: string;
  hint?: string;
  values: string[];
}

/** Signature and Date are intentionally left blank for the parties to sign. */
export function buildSignatureRows(draft: Draft): SignatureRow[] {
  const row = (label: string, key: keyof Party | null, hint?: string): SignatureRow => ({
    label,
    hint,
    values: draft.parties.map((p) => (key ? p[key] : "")),
  });
  return [
    row("Signature", null),
    row("Print Name", "name"),
    row("Title", "title"),
    row("Company", "company"),
    row("Notice Address", "noticeAddress", "Use either email or postal address"),
    row("Date", null),
  ];
}

/** Human-readable names of required fields that are still blank. */
export function missingFields(draft: Draft, doc: DocumentType): string[] {
  const missing = doc.terms
    .filter((def) => !def.optional && !termValue(draft, def.label))
    .map((def) => def.label);
  doc.parties.forEach((role, i) => {
    const p = draft.parties[i];
    if (!p.name.trim()) missing.push(`${role} name`);
    if (!p.company.trim()) missing.push(`${role} company`);
    if (!p.noticeAddress.trim()) missing.push(`${role} notice address`);
  });
  return missing;
}

export function pdfFileName(draft: Draft, doc: DocumentType): string {
  const slug = (s: string) =>
    s.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const parts = [slug(doc.name), ...draft.parties.map((p) => slug(p.company))].filter(Boolean);
  return `${parts.join("-")}.pdf`;
}
