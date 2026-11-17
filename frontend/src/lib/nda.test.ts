import { describe, expect, it } from "vitest";
import { buildCoverPage, defaultNda, formatDate, missingFields, pdfFileName, type NdaData } from "./nda";

const party = (company: string) => ({ name: "A", title: "CEO", company, noticeAddress: "a@b.com" });

const filled: NdaData = {
  ...defaultNda,
  effectiveDate: "2026-11-15",
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  party1: party("Acme Inc."),
  party2: party("Globex"),
};

describe("formatDate", () => {
  it("formats ISO dates and returns empty for blanks", () => {
    expect(formatDate("2026-11-15")).toBe("November 15, 2026");
    expect(formatDate("")).toBe("");
  });
});

describe("buildCoverPage", () => {
  it("uses placeholders for blank fields", () => {
    const law = buildCoverPage(defaultNda).find((s) => s.title === "Governing Law & Jurisdiction");
    expect(law?.lines).toEqual([
      "Governing Law: [Fill in state]",
      "Jurisdiction: [Fill in city or county and state]",
    ]);
  });

  it("marks the selected term option with correct pluralization", () => {
    const term = buildCoverPage({ ...filled, mndaTermYears: 2 }).find((s) => s.title === "MNDA Term");
    expect(term?.options?.[0]).toEqual({ text: "Expires 2 years from Effective Date.", selected: true });
    expect(term?.options?.[1].selected).toBe(false);
  });
});

describe("missingFields", () => {
  it("lists blank required fields and is empty when complete", () => {
    expect(missingFields(defaultNda)).toContain("Effective Date");
    expect(missingFields(defaultNda)).toContain("Party 2 company");
    expect(missingFields(filled)).toEqual([]);
  });
});

describe("pdfFileName", () => {
  it("slugs company names and falls back when blank", () => {
    expect(pdfFileName(filled)).toBe("Mutual-NDA-Acme-Inc-Globex.pdf");
    expect(pdfFileName(defaultNda)).toBe("Mutual-NDA.pdf");
  });
});
