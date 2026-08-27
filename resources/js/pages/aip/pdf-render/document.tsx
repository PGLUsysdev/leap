// resources\js\pages\aip\pdf-render\document.tsx

import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PpmpPdfTable } from "@/pages/ppmp/pdf-render/table";
import type { TableRow } from "@/pages/ppmp/pdf-render/types";
import type { App, FiscalYear } from "@/types";
import { getAppColumnDefs } from "./cols";
import { getGrandTotalAmount, prepareAppRows } from "./prepare-rows";
import AppTableHeader from "./table-header";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: "Helvetica" },

    // Banner rows (colors match the legacy APP document)
    categoryRow: {
        flexDirection: "row",
        backgroundColor: "#d0cece",
        borderBottomWidth: 0.5,
        minHeight: 11,
        alignItems: "stretch",
    },
    coaRow: {
        flexDirection: "row",
        backgroundColor: "#fbe4d5",
        borderBottomWidth: 0.5,
        minHeight: 11,
        alignItems: "stretch",
    },
    bannerText: {
        margin: 2,
        fontSize: 6.5,
        fontWeight: "bold",
        textTransform: "uppercase",
    },

    // Total rows
    summaryRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        minHeight: 11,
        alignItems: "stretch",
    },
    totalText: {
        fontSize: 6.5,
        fontWeight: "bold",
        color: "#000000",
    },

    footerSection: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "flex-start",
    },
    certText: {
        fontSize: 8,
        width: "40%",
        fontStyle: "italic",
        lineHeight: 1.4,
    },
    signatureWrapper: {
        width: "60%",
        flexDirection: "column",
        alignItems: "center",
        gap: 20, // Space between the two signatories
    },
    sigBlock: {
        alignItems: "center",
        width: "100%",
    },
    sigName: {
        fontSize: 9,
        fontWeight: "bold",
        textDecoration: "underline",
        textTransform: "uppercase",
    },
    sigTitle: {
        fontSize: 9,
        marginTop: 2,
    },
});

/**
 * Maps generic table rows onto the legacy APP styling:
 * gray category banners, peach chart-of-account banners and bold totals.
 */
function appRowStyleResolver(row: TableRow): { rowStyle?: object; textStyle?: object } | null {
    if (row.type === "banner") {
        return row.id.startsWith("cat-")
            ? { rowStyle: styles.categoryRow, textStyle: styles.bannerText }
            : { rowStyle: styles.coaRow, textStyle: styles.bannerText };
    }

    if (row.id.startsWith("summary-")) {
        return { rowStyle: styles.summaryRow, textStyle: styles.totalText };
    }

    return null;
}

interface AppDocumentProps {
    data: App;
    fiscalYear: FiscalYear;
    officeLabel: string;
    signatories: {
        deptHead: string;
        deptHeadPosition: string;
        gov: string;
        govPosition: string;
    };
}

export function AppDocument({ data, fiscalYear, officeLabel, signatories }: AppDocumentProps) {
    const columns = getAppColumnDefs();
    const rows = prepareAppRows(data);
    const grandTotal = getGrandTotalAmount(data);

    return (
        <Document title="">
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                <View style={{ gap: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                        FDP Form 4a - Annual Procurement Plan or Procurement List
                    </Text>
                    <View fixed style={{ marginBottom: 10, textAlign: "center" }}>
                        <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                            ANNUAL PROCUREMENT PLAN
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                            FOR THE YEAR {fiscalYear.year}
                        </Text>
                    </View>
                </View>

                <AppTableHeader officeLabel={officeLabel} plannedAmount={grandTotal} />

                <PpmpPdfTable
                    columns={columns}
                    rows={rows}
                    headerComponent={null}
                    rowStyleResolver={appRowStyleResolver}
                    cellVerticalAlign="center"
                />

                {/* Certification + signatories */}
                <View style={styles.footerSection} wrap={false}>
                    <View style={styles.certText}>
                        <Text>
                            This is to certify that the above procurement plan is in accordance with
                            the objective of this Office.
                        </Text>
                    </View>

                    <View style={styles.signatureWrapper}>
                        <View style={styles.sigBlock}>
                            <Text style={styles.sigName}>
                                {signatories.deptHead.trim() || "____________________________"}
                            </Text>
                            <Text style={styles.sigTitle}>
                                {signatories.deptHeadPosition.trim() || "Department Head"}
                            </Text>
                        </View>

                        <View style={styles.sigBlock}>
                            <Text style={styles.sigName}>
                                {signatories.gov.trim() || "____________________________"}
                            </Text>
                            <Text style={styles.sigTitle}>
                                {signatories.govPosition.trim() || "Provincial Governor"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    fixed
                    style={{
                        position: "absolute",
                        bottom: 20,
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    <Text
                        style={{ fontSize: 8 }}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
}

export { styles as appDocumentStyles };
