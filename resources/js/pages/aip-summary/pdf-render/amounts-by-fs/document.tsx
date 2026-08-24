import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import React from "react";
import { PpmpPdfTable } from "@/pages/ppmp/pdf-render/table";
import type { AipEntry, FiscalYear } from "@/types";
import { getFsSummaryColumnDefs } from "./cols";
import { prepareFsSummaryRows } from "./prepare-row";
import TableHeader from "./table-header";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontFamily: "Helvetica",
    },
    headerContainer: {
        marginBottom: 1,
    },
    title: {
        fontSize: 9,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginTop: 2,
        color: "#0F172A",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 8,
        fontWeight: "bold",
        marginTop: 1,
        textAlign: "center",
    },
    headerSpacer: {
        height: 14,
    },
    officeLabel: {
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "left",
    },
    footer: {
        position: "absolute",
        bottom: 8,
        left: 12,
        right: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 5.5,
        color: "#94A3B8",
    },
});

interface FsSummaryDocumentProps {
    aipEntries: AipEntry[];
    fiscalYear: FiscalYear;
    officeName: string;
    currentScope?: { scope: string; supplemental_aip_id: number | null };
}

const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// Grand total component – placed inside PpmpPdfTable
const renderGrandTotal = (row: any, columns: any[]) => {
    const totals = row.totals || {};
    const labelWidth = columns[0].width;

    return (
        <View
            key={row.id}
            wrap={false}
            style={{
                flexDirection: "row",
                borderBottomWidth: 0.5,
                borderBottomColor: "#000000",
                minHeight: 13,
                alignItems: "stretch",
            }}
        >
            <View
                style={{
                    width: labelWidth,
                    borderLeftWidth: 0.5,
                    borderLeftColor: "#000000",
                    borderRightWidth: 0.5,
                    borderRightColor: "#000000",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 2,
                }}
            >
                <Text style={{ fontSize: 5, fontWeight: "bold", color: "#000000" }}>TOTAL</Text>
            </View>

            {columns.slice(1).map((col) => (
                <View
                    key={col.id}
                    style={{
                        width: col.width,
                        borderRightWidth: 0.5,
                        borderRightColor: "#000000",
                        justifyContent: "center",
                        paddingHorizontal: 1,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 5,
                            fontWeight: "bold",
                            color: "#000000",
                            textAlign: "right",
                        }}
                    >
                        {formatCurrency(String(totals[col.id] || 0))}
                    </Text>
                </View>
            ))}
        </View>
    );
};

export const FsSummaryDocument: React.FC<FsSummaryDocumentProps> = ({
    aipEntries,
    fiscalYear,
    officeName,
    currentScope,
}) => {
    const columns = getFsSummaryColumnDefs();
    const rows = prepareFsSummaryRows(aipEntries);

    console.log(rows);

    const scopeLabel =
        currentScope?.scope === "supplemental"
            ? `Supplemental Annual Investment Program (SAIP)`
            : "Annual Investment Program (AIP)";

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                {/* Fixed Header */}
                <View fixed style={styles.headerContainer}>
                    <Text style={styles.title}>
                        CY {fiscalYear.year} {scopeLabel}
                    </Text>
                    <Text style={styles.subtitle}>Summary of Amounts by Funding Source</Text>
                    <View style={styles.headerSpacer} />
                    <Text style={styles.officeLabel}>
                        OFFICE:{" "}
                        <Text style={{ textDecoration: "underline" }}>
                            {officeName.toUpperCase()}
                        </Text>
                    </Text>
                </View>

                {/* Custom Table Header – rendered outside the table */}
                <TableHeader />

                {/* Table Body – suppress default header */}
                <PpmpPdfTable
                    columns={columns}
                    rows={rows}
                    headerComponent={null}
                    grandTotalComponent={renderGrandTotal}
                    cellVerticalAlign="center"
                />

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text />
                    <Text
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
        </Document>
    );
};
