/**
 * Data model for the Common Paper Mutual NDA cover page, plus pure helpers
 * that turn form data into display-ready content. Both the HTML preview and
 * the PDF renderer consume `buildCoverPage` / `buildSignatureRows`, so the
 * two outputs always say the same thing.
 */

export interface Party {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export interface NdaData {
  purpose: string;
  /** ISO date (yyyy-mm-dd) as produced by <input type="date">. */
  effectiveDate: string;
  mndaTermType: "expires" | "untilTerminated";
  mndaTermYears: number;
  confidentialityType: "years" | "perpetual";
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
}

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export const defaultNda: NdaData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityType: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty,
  party2: emptyParty,
};

export const COVER_PAGE_INTRO =
  "This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“Cover Page”) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (“Standard Terms”) identical to those posted at commonpaper.com/standards/mutual-nda/1.0. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.";

export const SIGNING_STATEMENT =
  "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.";

export const ATTRIBUTION =
  "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.";

export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

function years(n: number): string {
  return `${n} year${n === 1 ? "" : "s"}`;
}

/** Returns the value, or the template's bracketed placeholder when blank. */
function orPlaceholder(value: string, placeholder: string): string {
  return value.trim() || `[${placeholder}]`;
}

export interface CoverOption {
  text: string;
  selected: boolean;
}

export interface CoverSection {
  title: string;
  hint?: string;
  lines?: string[];
  options?: CoverOption[];
}

export function buildCoverPage(d: NdaData): CoverSection[] {
  return [
    {
      title: "Purpose",
      hint: "How Confidential Information may be used",
      lines: [orPlaceholder(d.purpose, "Purpose")],
    },
    {
      title: "Effective Date",
      lines: [formatDate(d.effectiveDate) || "[Effective Date]"],
    },
    {
      title: "MNDA Term",
      hint: "The length of this MNDA",
      options: [
        {
          text: `Expires ${years(d.mndaTermYears)} from Effective Date.`,
          selected: d.mndaTermType === "expires",
        },
        {
          text: "Continues until terminated in accordance with the terms of the MNDA.",
          selected: d.mndaTermType === "untilTerminated",
        },
      ],
    },
    {
      title: "Term of Confidentiality",
      hint: "How long Confidential Information is protected",
      options: [
        {
          text: `${years(d.confidentialityYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
          selected: d.confidentialityType === "years",
        },
        { text: "In perpetuity.", selected: d.confidentialityType === "perpetual" },
      ],
    },
    {
      title: "Governing Law & Jurisdiction",
      lines: [
        `Governing Law: ${orPlaceholder(d.governingLaw, "Fill in state")}`,
        `Jurisdiction: ${orPlaceholder(d.jurisdiction, "Fill in city or county and state")}`,
      ],
    },
    {
      title: "MNDA Modifications",
      lines: [d.modifications.trim() || "None."],
    },
  ];
}

export interface SignatureRow {
  label: string;
  hint?: string;
  values: [string, string];
}

/** Signature and Date are intentionally left blank for the parties to sign. */
export function buildSignatureRows(d: NdaData): SignatureRow[] {
  const row = (label: string, key: keyof Party | null, hint?: string): SignatureRow => ({
    label,
    hint,
    values: key ? [d.party1[key], d.party2[key]] : ["", ""],
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
export function missingFields(d: NdaData): string[] {
  const missing: string[] = [];
  const check = (value: string, label: string) => {
    if (!value.trim()) missing.push(label);
  };
  check(d.purpose, "Purpose");
  check(d.effectiveDate, "Effective Date");
  check(d.governingLaw, "Governing Law");
  check(d.jurisdiction, "Jurisdiction");
  (["party1", "party2"] as const).forEach((key, i) => {
    const p = d[key];
    check(p.name, `Party ${i + 1} name`);
    check(p.company, `Party ${i + 1} company`);
    check(p.noticeAddress, `Party ${i + 1} notice address`);
  });
  return missing;
}

export function pdfFileName(d: NdaData): string {
  const slug = (s: string) =>
    s.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const parts = ["Mutual-NDA", slug(d.party1.company), slug(d.party2.company)].filter(Boolean);
  return `${parts.join("-")}.pdf`;
}
