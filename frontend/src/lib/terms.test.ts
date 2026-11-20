import { describe, expect, it } from "vitest";
import { loadDocuments } from "./loadDocuments";
import { parseRuns, parseStandardTerms } from "./terms";

describe("parseRuns", () => {
  it("splits text, bold, cover page refs and links", () => {
    const md =
      'See **Term**, <span class="keyterms_link" id="2.1">Purpose</span>, [site](https://x.com) and <https://y.com>.';
    expect(parseRuns(md)).toEqual([
      { type: "text", text: "See " },
      { type: "bold", text: "Term" },
      { type: "text", text: ", " },
      { type: "ref", text: "Purpose" },
      { type: "text", text: ", " },
      { type: "link", text: "site", href: "https://x.com" },
      { type: "text", text: " and " },
      { type: "link", text: "https://y.com", href: "https://y.com" },
      { type: "text", text: "." },
    ]);
  });
});

describe("parseStandardTerms", () => {
  it("parses bold-titled clauses and skips other lines", () => {
    const md = "# Heading\n\n1. **Intro**. Hello.\n\n2. **Term**. World.\n\nAttribution.";
    expect(parseStandardTerms(md)).toEqual([
      { depth: 0, label: "1.", title: "Intro.", body: [{ type: "text", text: "Hello." }] },
      { depth: 0, label: "2.", title: "Term.", body: [{ type: "text", text: "World." }] },
    ]);
  });

  it("numbers nested sections by position and keeps letters below", () => {
    const md = [
      '1. <span class="header_2" id="1">Service</span>',
      '    1. <span class="header_3" id="1.1">Access.</span>  Body.',
      "        a. <span id=\"1.1.a\">First</span>.",
      "            iv. Deep.",
      '1. <span class="header_2">Fees</span>',
      "    1. No title.",
    ].join("\n");
    expect(parseStandardTerms(md)).toEqual([
      { depth: 0, label: "1.", title: "Service", body: [] },
      { depth: 1, label: "1.1", title: "Access.", body: [{ type: "text", text: "Body." }] },
      { depth: 2, label: "(a)", body: [{ type: "text", text: "First." }] },
      { depth: 3, label: "(iv)", body: [{ type: "text", text: "Deep." }] },
      { depth: 0, label: "2.", title: "Fees", body: [] },
      { depth: 1, label: "2.1", body: [{ type: "text", text: "No title." }] },
    ]);
  });
});

describe("loadDocuments", () => {
  it("parses every catalog template without leftover markup", async () => {
    const documents = await loadDocuments();
    expect(documents).toHaveLength(11);
    for (const doc of documents) {
      const text = JSON.stringify(doc.clauses);
      expect(doc.clauses.length, doc.id).toBeGreaterThan(5);
      expect(text, doc.id).not.toMatch(/<span|<\/span>|\*\*/);
    }
  });

  it("parses the Mutual NDA's eleven clauses", async () => {
    const nda = (await loadDocuments()).find((d) => d.id === "mutual-nda")!;
    expect(nda.clauses.map((c) => c.label)).toEqual(nda.clauses.map((_, i) => `${i + 1}.`));
    expect(nda.clauses[0].title).toBe("Introduction.");
  });
});
