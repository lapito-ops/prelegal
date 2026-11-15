import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  ATTRIBUTION,
  COVER_PAGE_INTRO,
  SIGNING_STATEMENT,
  buildCoverPage,
  buildSignatureRows,
  type NdaData,
} from "@/lib/nda";
import type { Clause, Run } from "@/lib/terms";

// Never hyphenate words (e.g. URLs or defined terms) across lines.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 56, fontFamily: "Times-Roman", fontSize: 10.5, lineHeight: 1.35 },
  title: { fontFamily: "Times-Bold", fontSize: 16, textAlign: "center", marginBottom: 12 },
  h2: { fontFamily: "Times-Bold", fontSize: 11, marginBottom: 6, textTransform: "uppercase" },
  h3: { fontFamily: "Times-Bold", fontSize: 11, marginTop: 8 },
  hint: { fontFamily: "Times-Italic", fontSize: 9, color: "#78716c" },
  paragraph: { marginBottom: 6 },
  option: { flexDirection: "row", marginTop: 2 },
  box: {
    width: 8,
    height: 8,
    borderWidth: 0.75,
    borderColor: "#1c1917",
    marginTop: 3,
    marginRight: 6,
  },
  boxSelected: { backgroundColor: "#1c1917" },
  optionText: { flex: 1 },
  unselected: { color: "#a8a29e" },
  table: { marginTop: 10, borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: "#a8a29e" },
  row: { flexDirection: "row", minHeight: 22 },
  cell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: "#a8a29e",
    textAlign: "center",
  },
  labelCell: { flex: 0.7, textAlign: "left", fontFamily: "Times-Bold" },
  attribution: { fontSize: 8, color: "#78716c", marginTop: 10 },
  bold: { fontFamily: "Times-Bold" },
  ref: { fontFamily: "Times-Bold", color: "#4338ca" },
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

/** PDF rendering of the completed MNDA; mirrors NdaPreview. */
export function NdaPdf({ data, terms }: { data: NdaData; terms: Clause[] }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" author="Prelegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.h2}>Using this Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.paragraph}>{COVER_PAGE_INTRO}</Text>

        {buildCoverPage(data).map((section) => (
          <View key={section.title} wrap={false}>
            <Text style={styles.h3}>{section.title}</Text>
            {section.hint && <Text style={styles.hint}>{section.hint}</Text>}
            {section.lines?.map((line) => <Text key={line}>{line}</Text>)}
            {section.options?.map((option) => (
              <View key={option.text} style={styles.option}>
                <View style={option.selected ? [styles.box, styles.boxSelected] : styles.box} />
                <Text style={option.selected ? styles.optionText : [styles.optionText, styles.unselected]}>
                  {option.text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={[styles.paragraph, { marginTop: 12 }]}>{SIGNING_STATEMENT}</Text>

        <View style={styles.table} wrap={false}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.labelCell]} />
            <Text style={[styles.cell, styles.bold]}>PARTY 1</Text>
            <Text style={[styles.cell, styles.bold]}>PARTY 2</Text>
          </View>
          {buildSignatureRows(data).map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={[styles.cell, styles.labelCell]}>
                <Text>{row.label}</Text>
                {row.hint && <Text style={styles.hint}>{row.hint}</Text>}
              </View>
              {row.values.map((value, i) => (
                <Text key={i} style={styles.cell}>{value}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.attribution}>{ATTRIBUTION}</Text>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Standard Terms</Text>
        {terms.map((clause) => (
          <Text key={clause.number} style={styles.paragraph}>
            {clause.number}. <Text style={styles.bold}>{clause.title}</Text>. <Runs runs={clause.body} />
          </Text>
        ))}
      </Page>
    </Document>
  );
}
