import { describe, expect, it } from "vitest";
import { loadStandardTerms } from "./loadStandardTerms";
import { parseRuns, parseStandardTerms } from "./terms";

describe("parseRuns", () => {
  it("splits text, bold, cover page refs and links", () => {
    const md =
      'See **Term** and <span class="coverpage_link">Purpose</span> at [site](https://x.com).';
    expect(parseRuns(md)).toEqual([
      { type: "text", text: "See " },
      { type: "bold", text: "Term" },
      { type: "text", text: " and " },
      { type: "ref", text: "Purpose" },
      { type: "text", text: " at " },
      { type: "link", text: "site", href: "https://x.com" },
      { type: "text", text: "." },
    ]);
  });
});

describe("parseStandardTerms", () => {
  it("parses numbered clauses and skips other blocks", () => {
    const md = "# Heading\n\n1. **Intro**. Hello.\n\n2. **Term**. World.";
    expect(parseStandardTerms(md)).toEqual([
      { number: 1, title: "Intro", body: [{ type: "text", text: "Hello." }] },
      { number: 2, title: "Term", body: [{ type: "text", text: "World." }] },
    ]);
  });
});

describe("loadStandardTerms", () => {
  it("parses the real Mutual NDA template from ../templates", async () => {
    const clauses = await loadStandardTerms();
    expect(clauses.length).toBeGreaterThan(5);
    expect(clauses.map((c) => c.number)).toEqual(clauses.map((_, i) => i + 1));
  });
});
