import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  SIGNING_STATEMENT,
  attribution,
  buildCoverRows,
  buildSignatureRows,
  coverIntro,
  type Draft,
  type LoadedDocument,
} from "@/lib/draft";
import type { Run } from "@/lib/terms";

// Brand palette; react-pdf cannot read the Tailwind theme in globals.css.
const BRAND_BLUE = "#209dd7";
const BRAND_NAVY = "#032147";
const BRAND_GRAY = "#888888";
const BRAND_YELLOW = "#ecad0a";

// Never hyphenate words (e.g. URLs or defined terms) across lines.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Times-Roman", fontSize: 10.5, lineHeight: 1.35 },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    textAlign: "center",
    color: BRAND_NAVY,
    paddingBottom: 6,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_YELLOW,
  },
  h2: { fontFamily: "Times-Bold", fontSize: 11, marginBottom: 6, textTransform: "uppercase" },
  hint: { fontFamily: "Times-Italic", fontSize: 9, color: BRAND_GRAY },
  paragraph: { marginBottom: 6 },
  table: { marginTop: 10, borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: "#a8a29e" },
  row: { flexDirection: "row", minHeight: 22 },
  cell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: "#a8a29e",
  },
  center: { textAlign: "center" },
  labelCell: { flex: 0.7, fontFamily: "Times-Bold" },
  attribution: { fontSize: 8, color: BRAND_GRAY, marginTop: 10 },
  bold: { fontFamily: "Times-Bold" },
  ref: { fontFamily: "Times-Bold", color: BRAND_BLUE },
});

function Runs({ runs }: { runs: Run[] }) {
  return runs.map((run, i) => {
    switch (run.type) {
      case "bold":
        return <Text key={i} style={styles.bold}>{run.text}</Text>;
      case "ref":
        return <Text key={i} style={styles.ref}>{run.text}</Text>;
      case "link":
        return <Link key={i} src={run.href}>{run.text}</Link>;
      default:
        return <Text key={i}>{run.text}</Text>;
    }
  });
}

/** PDF rendering of the drafted document; mirrors DraftPreview. */
export function DraftPdf({ draft, doc }: { draft: Draft; doc: LoadedDocument }) {
  return (
    <Document title={doc.name} author="Prelegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{doc.name}</Text>
        <Text style={styles.h2}>Cover Page</Text>
        <Text style={styles.paragraph}>{coverIntro(doc)}</Text>

        <View style={styles.table}>
          {buildCoverRows(draft, doc).map((row) => (
            <View key={row.label} style={styles.row} wrap={false}>
              <View style={[styles.cell, styles.labelCell]}>
                <Text>{row.label}</Text>
                <Text style={styles.hint}>{row.hint}</Text>
              </View>
              <Text style={styles.cell}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.paragraph, { marginTop: 12 }]}>{SIGNING_STATEMENT}</Text>

        <View style={styles.table} wrap={false}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.labelCell]} />
            {doc.parties.map((role) => (
              <Text key={role} style={[styles.cell, styles.center, styles.bold]}>
                {role.toUpperCase()}
              </Text>
            ))}
          </View>
          {buildSignatureRows(draft).map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={[styles.cell, styles.labelCell]}>
                <Text>{row.label}</Text>
                {row.hint && <Text style={styles.hint}>{row.hint}</Text>}
              </View>
              {row.values.map((value, i) => (
                <Text key={i} style={[styles.cell, styles.center]}>{value}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.attribution}>{attribution(doc)}</Text>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Standard Terms</Text>
        {doc.clauses.map((clause, i) => (
          <Text key={i} style={[styles.paragraph, { marginLeft: clause.depth * 16 }]}>
            {clause.label} {clause.title && <Text style={styles.bold}>{clause.title}</Text>}{" "}
            <Runs runs={clause.body} />
          </Text>
        ))}
      </Page>
    </Document>
  );
}
