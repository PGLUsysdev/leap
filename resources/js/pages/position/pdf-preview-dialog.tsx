import { Page, Text, View, Document, PDFViewer, StyleSheet } from "@react-pdf/renderer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { FiscalYear, Position, SalaryStandard } from "@/types";

interface PreviewPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    positions: Position[];
    title: string;
    currentStandards: SalaryStandard[];
    budgetStandards: SalaryStandard[];
    currentFiscalYear: FiscalYear | null;
    budgetFiscalYear: FiscalYear | null;
}

const COL_WIDTHS = {
    oldItem: "7%",
    newItem: "7%",
    title: "18%",
    incumbent: "18%",
    curSgStep: "8%",
    curAmount: "12%",
    budSgStep: "8%",
    budAmount: "12%",
    incDec: "10%",
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 9,
        fontFamily: "Helvetica",
        backgroundColor: "#ffffff",
    },
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 10,
    },
    headerTitle: {
        fontFamily: "Helvetica-Bold",
        fontSize: 12,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontFamily: "Helvetica-Bold",
        fontSize: 10,
    },
    table: {
        display: "flex",
        flexDirection: "column",
        borderWidth: 1,
        borderColor: "#000000",
    },
    colGroup: {
        display: "flex",
        flexDirection: "column",
    },
    rowGroup: {
        display: "flex",
        flexDirection: "row",
    },
    tableHeaderCell: {
        padding: 6,
        textAlign: "center",
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
    },
    tableSubHeaderCell: {
        padding: 4,
        textAlign: "center",
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
    },
    tableNumberCell: {
        padding: 4,
        textAlign: "center",
        fontSize: 8,
        fontFamily: "Helvetica",
    },
    tableCell: {
        padding: 4,
        textAlign: "center",
        fontSize: 8,
        fontFamily: "Helvetica",
    },
    tableCellLeft: {
        padding: 4,
        textAlign: "left",
        fontSize: 8,
        fontFamily: "Helvetica",
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: "#000000",
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: "#000000",
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
    },
    signatoriesContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
    },
    signatoryBlock: {
        width: "30%",
        display: "flex",
        flexDirection: "column",
        gap: 25,
    },
    signatoryLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
    },
    signatoryRole: {
        borderTopWidth: 1,
        borderTopColor: "#000000",
        paddingTop: 4,
        fontSize: 8,
        textAlign: "center",
    },
});

function formatCurrency(n: string | number): string {
    const num = typeof n === "string" ? parseFloat(n) : n;
    const sign = num < 0 ? "-" : "";
    const abs = Math.abs(num);
    const parts = abs.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return sign + parts.join(".");
}

interface MyDocumentProps {
    positions: Position[];
    currentStandards: SalaryStandard[];
    budgetStandards: SalaryStandard[];
    currentFiscalYear: FiscalYear | null;
    budgetFiscalYear: FiscalYear | null;
}

const MyDocument = ({
    positions,
    currentStandards,
    budgetStandards,
    currentFiscalYear,
    budgetFiscalYear,
}: MyDocumentProps) => {
    const lguName = "_________________";
    const fyLabel =
        currentFiscalYear && budgetFiscalYear
            ? `${currentFiscalYear.year} - ${budgetFiscalYear.year}`
            : "_____";

    // Build lookup maps: "{salary_grade}-{step}" -> monthly_rate
    const curMap = new Map<string, number>();
    const budMap = new Map<string, number>();

    currentStandards.forEach((s) => {
        curMap.set(`${s.salary_grade}-${s.step_increment}`, Number(s.monthly_rate));
    });
    budgetStandards.forEach((s) => {
        budMap.set(`${s.salary_grade}-${s.step_increment}`, Number(s.monthly_rate));
    });

    return (
        <Document>
            <Page size={[612, 936]} orientation="landscape" style={styles.page}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>PLANTILLA OF PERSONNEL FY {fyLabel}</Text>
                        <Text style={styles.headerSubtitle}>Local Government Unit: {lguName}</Text>
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* ===== HEADER ROW 1 (Gray, grouped) ===== */}
                        <View
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "#d9d9d9",
                            }}
                        >
                            {/* Item Number group (cols 1-2) */}
                            <View style={[styles.colGroup, styles.borderRight, { width: "14%" }]}>
                                <Text style={styles.tableHeaderCell}>Item Number</Text>
                                <View style={[styles.rowGroup, styles.borderTop]}>
                                    <View style={[styles.borderRight, { width: "50%" }]}>
                                        <Text style={styles.tableSubHeaderCell}>Old</Text>
                                    </View>
                                    <View style={{ width: "50%" }}>
                                        <Text style={styles.tableSubHeaderCell}>New</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Position Title (col 3) */}
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "18%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableHeaderCell}>Position Title</Text>
                            </View>

                            {/* Name of Incumbent (col 4) */}
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "18%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableHeaderCell}>Name of Incumbent</Text>
                            </View>

                            {/* Current Year group (cols 5-6) */}
                            <View style={[styles.colGroup, styles.borderRight, { width: "20%" }]}>
                                <Text style={styles.tableHeaderCell}>
                                    Appropriation Year (Current)
                                </Text>
                                <View style={[styles.rowGroup, styles.borderTop]}>
                                    <View style={[styles.borderRight, { width: "40%" }]}>
                                        <Text style={styles.tableSubHeaderCell}>SG/Step</Text>
                                    </View>
                                    <View style={{ width: "60%" }}>
                                        <Text style={styles.tableSubHeaderCell}>Amount</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Budget Year group (cols 7-8) */}
                            <View style={[styles.colGroup, styles.borderRight, { width: "20%" }]}>
                                <Text style={styles.tableHeaderCell}>Budget Year</Text>
                                <View style={[styles.rowGroup, styles.borderTop]}>
                                    <View style={[styles.borderRight, { width: "40%" }]}>
                                        <Text style={styles.tableSubHeaderCell}>SG/Step</Text>
                                    </View>
                                    <View style={{ width: "60%" }}>
                                        <Text style={styles.tableSubHeaderCell}>Amount</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Increase/Decrease (col 9) */}
                            <View
                                style={{
                                    width: "10%",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={styles.tableHeaderCell}>Increase/Decrease</Text>
                            </View>
                        </View>

                        {/* ===== NUMBERING ROW (1)-(9) ===== */}
                        <View style={[styles.rowGroup, styles.borderTop]}>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "7%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(1)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "7%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(2)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "18%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(3)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    { width: "18%", justifyContent: "center" },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(4)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    {
                                        width: "8%",
                                        justifyContent: "center",
                                    },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(5)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    {
                                        width: "12%",
                                        justifyContent: "center",
                                    },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(6)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    {
                                        width: "8%",
                                        justifyContent: "center",
                                    },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(7)</Text>
                            </View>
                            <View
                                style={[
                                    styles.borderRight,
                                    {
                                        width: "12%",
                                        justifyContent: "center",
                                    },
                                ]}
                            >
                                <Text style={styles.tableNumberCell}>(8)</Text>
                            </View>
                            <View
                                style={{
                                    width: "10%",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={styles.tableNumberCell}>(9)</Text>
                            </View>
                        </View>

                        {/* ===== DATA ROWS ===== */}
                        {positions.map((pos, i) => {
                            const step = pos.user?.step ?? 1;
                            const curMonthly = curMap.get(`${pos.ios?.salary_grade}-${step}`) ?? 0;
                            const budMonthly = budMap.get(`${pos.ios?.salary_grade}-${step}`) ?? 0;
                            const curAnnual = curMonthly * 12;
                            const budAnnual = budMonthly * 12;
                            const increase = budAnnual - curAnnual;

                            return (
                                <View key={pos.id} style={[styles.rowGroup, styles.borderTop]}>
                                    <View style={[styles.borderRight, { width: "7%" }]}>
                                        <Text style={styles.tableCell}>{pos.item_number}</Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "7%" }]}>
                                        <Text style={styles.tableCell}>{pos.item_number}</Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "18%" }]}>
                                        <Text style={styles.tableCellLeft} wrap={false}>
                                            {pos.ios?.class ?? "—"}
                                        </Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "18%" }]}>
                                        <Text style={styles.tableCellLeft} wrap={false}>
                                            {pos.user?.name ?? "Vacant"}
                                        </Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "8%" }]}>
                                        <Text style={styles.tableCell}>
                                            {pos.ios?.salary_grade ?? "—"}/{pos.user?.step ?? 1}
                                        </Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "12%" }]}>
                                        <Text style={styles.tableCell}>
                                            {formatCurrency(curAnnual)}
                                        </Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "8%" }]}>
                                        <Text style={styles.tableCell}>
                                            {pos.ios?.salary_grade ?? "—"}/{pos.user?.step ?? 1}
                                        </Text>
                                    </View>
                                    <View style={[styles.borderRight, { width: "12%" }]}>
                                        <Text style={styles.tableCell}>
                                            {formatCurrency(budAnnual)}
                                        </Text>
                                    </View>
                                    <View style={{ width: "10%" }}>
                                        <Text style={styles.tableCell}>
                                            {formatCurrency(increase)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Signatories */}
                    <View style={styles.signatoriesContainer}>
                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>Prepared by:</Text>
                            <Text style={styles.signatoryRole}>
                                Human Resource Management Officer
                            </Text>
                        </View>

                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>Reviewed by:</Text>
                            <Text style={styles.signatoryRole}>Local Budget Officer</Text>
                        </View>

                        <View style={styles.signatoryBlock}>
                            <Text style={styles.signatoryLabel}>Approved by:</Text>
                            <Text style={styles.signatoryRole}>Local Chief Executive</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default function PreviewPdfDialog({
    open,
    onOpenChange,
    positions,
    title,
    currentStandards,
    budgetStandards,
    currentFiscalYear,
    budgetFiscalYear,
}: PreviewPdfDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader>
                    <DialogTitle>{title} — Plantilla of Personnel</DialogTitle>
                    <DialogDescription>
                        Preview of the {title} Plantilla of Personnel Document.
                    </DialogDescription>
                </DialogHeader>

                <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
                    <MyDocument
                        positions={positions}
                        currentStandards={currentStandards}
                        budgetStandards={budgetStandards}
                        currentFiscalYear={currentFiscalYear}
                        budgetFiscalYear={budgetFiscalYear}
                    />
                </PDFViewer>
            </DialogContent>
        </Dialog>
    );
}
