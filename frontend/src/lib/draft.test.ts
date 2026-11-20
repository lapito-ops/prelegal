import { describe, expect, it } from "vitest";
import {
  buildCoverRows,
  buildSignatureRows,
  draftTitle,
  emptyDraft,
  formatDate,
  missingFields,
  pdfFileName,
  type Draft,
  type DocumentType,
} from "./draft";

const doc: DocumentType = {
  id: "pilot",
  name: "Pilot Agreement",
  description: "",
  filename: "templates/Pilot-Agreement.md",
  parties: ["Provider", "Customer"],
  terms: [
    { label: "Effective Date", description: "Start date" },
    { label: "Pilot Period", description: "Length" },
    { label: "DPA", description: "Data terms", optional: true },
  ],
};

const party = (company: string) => ({ name: "A", title: "CEO", company, noticeAddress: "a@b.com" });

const filled: Draft = {
  documentId: "pilot",
  parties: [party("Acme Inc."), party("Globex")],
  terms: [
    { label: "Effective Date", value: "2026-11-15" },
    { label: "Pilot Period", value: "90 days" },
    { label: "DPA", value: "" },
  ],
};

describe("formatDate", () => {
  it("formats ISO dates and returns empty for blanks", () => {
    expect(formatDate("2026-11-15")).toBe("November 15, 2026");
    expect(formatDate("")).toBe("");
  });
});

describe("buildCoverRows", () => {
  it("formats dates and shows values in catalog order", () => {
    expect(buildCoverRows(filled, doc).map((r) => r.value)).toEqual([
      "November 15, 2026",
      "90 days",
      "None.",
    ]);
  });

  it("uses bracketed placeholders for blank required terms", () => {
    expect(buildCoverRows(emptyDraft, doc).map((r) => r.value)).toEqual([
      "[Effective Date]",
      "[Pilot Period]",
      "None.",
    ]);
  });
});

describe("buildSignatureRows", () => {
  it("fills party details and leaves signature and date blank", () => {
    const rows = buildSignatureRows(filled);
    expect(rows.find((r) => r.label === "Company")?.values).toEqual(["Acme Inc.", "Globex"]);
    expect(rows.find((r) => r.label === "Signature")?.values).toEqual(["", ""]);
  });
});

describe("missingFields", () => {
  it("is empty when every required field is filled", () => {
    expect(missingFields(filled, doc)).toEqual([]);
  });

  it("names blank required terms and party fields by role", () => {
    const missing = missingFields(emptyDraft, doc);
    expect(missing).toContain("Pilot Period");
    expect(missing).toContain("Customer company");
    expect(missing).not.toContain("DPA");
  });
});

describe("pdfFileName", () => {
  it("slugs the document name and companies", () => {
    expect(pdfFileName(filled, doc)).toBe("Pilot-Agreement-Acme-Inc-Globex.pdf");
    expect(pdfFileName(emptyDraft, doc)).toBe("Pilot-Agreement.pdf");
  });
});

describe("draftTitle", () => {
  it("names the document and its companies", () => {
    expect(draftTitle(filled, doc.name)).toBe("Pilot Agreement: Acme Inc. & Globex");
    expect(draftTitle(emptyDraft, doc.name)).toBe("Pilot Agreement");
    expect(draftTitle(emptyDraft)).toBe("Untitled draft");
  });
});
