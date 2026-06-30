import {
    Page,
    Text,
    View,
    Document,
    PDFViewer,
    StyleSheet,
} from '@react-pdf/renderer';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const COL = {
    description: '15%',
    type: '10%',
    qty: '8%',
    mode: '9%',
    preProc: '6%',
    timeStart: '6%',
    timeEnd: '6%',
    timeDeliv: '8%',
    fundSource: '9%',
    fundBudget: '9%',
    docs: '7%',
    remarks: '7%',
};

const FOOTER_SPACER_WIDTH = '77%';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 7,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    headerSection: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
    },
    ppmpTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    indicativeFinalRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 30,
        marginTop: 5,
        marginBottom: 5,
    },
    checkboxGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    checkboxBox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: '#000',
    },
    metaInfoRow: {
        width: '100%',
        marginTop: 5,
        gap: 2,
    },
    metaLabel: { fontFamily: 'Helvetica-Bold' },

    table: {
        display: 'flex',
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: '#000',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    headerGroupContainer: {
        flexDirection: 'column',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    headerTopLabel: {
        padding: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: 1,
    },
    headerSubRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    headerMergedCell: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerMergedCellLast: {
        padding: 4,
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainHeaderText: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 7,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subHeaderText: {
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        fontSize: 5.5,
        padding: 2,
        lineHeight: 1.1,
    },
    // Numbering Row Cell
    numberingCell: {
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    numberingCellLast: {
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    numberingText: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
    },
    dataCell: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        height: 22,
    },
    dataCellLast: {
        padding: 4,
        height: 22,
    },
    footerCellLabel: {
        width: FOOTER_SPACER_WIDTH,
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'flex-end',
        backgroundColor: '#f9f9f9',
    },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#000' },

    signatorySection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sigBlock: { width: '45%' },
    sigNameLine: {
        fontFamily: 'Helvetica-Bold',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginTop: 25,
        textAlign: 'center',
        paddingBottom: 2,
    },
    sigSubText: { textAlign: 'center', fontSize: 6, marginTop: 2 },
});

const ProcurementDocument = () => {
    const emptyRows = Array.from({ length: 10 });

    return (
        <Document>
            <Page size="LEGAL" orientation="landscape" style={styles.page}>
                {/* 1. HEADER SECTION */}
                <View style={styles.headerSection}>
                    <Text style={{ fontSize: 8 }}>
                        [Agency Letterhead with Logo]
                    </Text>
                    <Text style={styles.ppmpTitle}>
                        PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP) NO. ___
                    </Text>

                    <View style={styles.indicativeFinalRow}>
                        <View style={styles.checkboxGroup}>
                            <View style={styles.checkboxBox} />
                            <Text style={styles.metaLabel}>INDICATIVE</Text>
                        </View>
                        <View style={styles.checkboxGroup}>
                            <View style={styles.checkboxBox} />
                            <Text style={styles.metaLabel}>FINAL</Text>
                        </View>
                    </View>

                    <View style={styles.metaInfoRow}>
                        <Text>
                            <Text style={styles.metaLabel}>Fiscal Year :</Text>{' '}
                            _________________
                        </Text>
                        <Text>
                            <Text style={styles.metaLabel}>
                                End-User or Implementing Unit :
                            </Text>{' '}
                            __________________________________________________
                        </Text>
                    </View>
                </View>

                {/* 2. TABLE SECTION */}
                <View style={styles.table}>
                    {/* COMPLEX HEADER (LEVEL 1 & 2) */}
                    <View style={[styles.row, styles.borderBottom]}>
                        <View
                            style={[
                                styles.headerGroupContainer,
                                { width: '48%' },
                            ]}
                        >
                            <View style={styles.headerTopLabel}>
                                <Text style={styles.mainHeaderText}>
                                    PROCUREMENT PROJECT DETAILS
                                </Text>
                            </View>
                            <View style={styles.headerSubRow}>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '31.25%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        General Description and Objective of the
                                        Project to be Procured
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '20.83%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        Type of the Project to be Procured
                                        (whether Goods, Infrastructure and
                                        Consulting Services)
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '16.66%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        Quantity and Size of the Project to be
                                        Procured
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '18.75%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        Recommended Mode of Procurement
                                    </Text>
                                </View>
                                <View style={{ width: '12.5%' }}>
                                    <Text style={styles.subHeaderText}>
                                        Pre-Procurement Conference, if
                                        applicable (Yes/No)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.headerGroupContainer,
                                { width: '20%' },
                            ]}
                        >
                            <View style={styles.headerTopLabel}>
                                <Text style={styles.mainHeaderText}>
                                    PROJECTED TIMELINE (MM/YYYY)
                                </Text>
                            </View>
                            <View style={styles.headerSubRow}>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '30%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        Start of Procurement Activity
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '30%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        End of Procurement Activity
                                    </Text>
                                </View>
                                <View style={{ width: '40%' }}>
                                    <Text style={styles.subHeaderText}>
                                        Expected Delivery/ Implementation Period
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.headerGroupContainer,
                                { width: '18%' },
                            ]}
                        >
                            <View style={styles.headerTopLabel}>
                                <Text style={styles.mainHeaderText}>
                                    FUNDING DETAILS
                                </Text>
                            </View>
                            <View style={styles.headerSubRow}>
                                <View
                                    style={[
                                        {
                                            borderRightWidth: 1,
                                            borderRightColor: '#000',
                                            width: '50%',
                                        },
                                    ]}
                                >
                                    <Text style={styles.subHeaderText}>
                                        Source of Funds
                                    </Text>
                                </View>
                                <View style={{ width: '50%' }}>
                                    <Text style={styles.subHeaderText}>
                                        Estimated Budget / Authorized Budgetary
                                        Allocation (PhP)
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.headerMergedCell,
                                { width: COL.docs },
                            ]}
                        >
                            <Text style={styles.mainHeaderText}>
                                ATTACHED SUPPORTING DOCUMENTS
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.headerMergedCellLast,
                                { width: COL.remarks },
                            ]}
                        >
                            <Text style={styles.mainHeaderText}>REMARKS</Text>
                        </View>
                    </View>

                    {/* NEW NUMBERING ROW (1) - (12) */}
                    <View style={[styles.row, styles.borderBottom]}>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.description },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 1</Text>
                        </View>
                        <View
                            style={[styles.numberingCell, { width: COL.type }]}
                        >
                            <Text style={styles.numberingText}>Column 2</Text>
                        </View>
                        <View
                            style={[styles.numberingCell, { width: COL.qty }]}
                        >
                            <Text style={styles.numberingText}>Column 3</Text>
                        </View>
                        <View
                            style={[styles.numberingCell, { width: COL.mode }]}
                        >
                            <Text style={styles.numberingText}>Column 4</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.preProc },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 5</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.timeStart },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 6</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.timeEnd },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 7</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.timeDeliv },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 8</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.fundSource },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 9</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCell,
                                { width: COL.fundBudget },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 10</Text>
                        </View>
                        <View
                            style={[styles.numberingCell, { width: COL.docs }]}
                        >
                            <Text style={styles.numberingText}>Column 11</Text>
                        </View>
                        <View
                            style={[
                                styles.numberingCellLast,
                                { width: COL.remarks },
                            ]}
                        >
                            <Text style={styles.numberingText}>Column 12</Text>
                        </View>
                    </View>

                    {/* DATA ROWS */}
                    {emptyRows.map((_, i) => (
                        <View key={i} style={[styles.row, styles.borderBottom]}>
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.description },
                                ]}
                            />
                            <View
                                style={[styles.dataCell, { width: COL.type }]}
                            />
                            <View
                                style={[styles.dataCell, { width: COL.qty }]}
                            />
                            <View
                                style={[styles.dataCell, { width: COL.mode }]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.preProc },
                                ]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.timeStart },
                                ]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.timeEnd },
                                ]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.timeDeliv },
                                ]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.fundSource },
                                ]}
                            />
                            <View
                                style={[
                                    styles.dataCell,
                                    { width: COL.fundBudget },
                                ]}
                            />
                            <View
                                style={[styles.dataCell, { width: COL.docs }]}
                            />
                            <View
                                style={[
                                    styles.dataCellLast,
                                    { width: COL.remarks },
                                ]}
                            />
                        </View>
                    ))}

                    {/* TOTAL FOOTER */}
                    <View style={styles.row}>
                        <View style={styles.footerCellLabel}>
                            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                                TOTAL BUDGET:
                            </Text>
                        </View>
                        <View
                            style={[styles.dataCell, { width: COL.fundBudget }]}
                        />
                        <View style={[styles.dataCell, { width: COL.docs }]} />
                        <View
                            style={[
                                styles.dataCellLast,
                                { width: COL.remarks },
                            ]}
                        />
                    </View>
                </View>

                {/* SIGNATORIES */}
                <View style={styles.signatorySection}>
                    <View style={styles.sigBlock}>
                        <Text style={styles.metaLabel}>Prepared by:</Text>
                        <View style={styles.sigNameLine} />
                        <Text style={styles.sigSubText}>
                            Signature over Printed Name
                        </Text>
                        <Text style={styles.sigSubText}>
                            Position/Designation
                        </Text>
                        <Text style={styles.sigSubText}>
                            [End-User or Implementing Unit]
                        </Text>
                        <Text style={{ marginTop: 10 }}>
                            Date : _________________
                        </Text>
                    </View>

                    <View style={styles.sigBlock}>
                        <Text style={styles.metaLabel}>Submitted by:</Text>
                        <View style={styles.sigNameLine} />
                        <Text style={styles.sigSubText}>
                            Signature over Printed Name
                        </Text>
                        <Text style={styles.sigSubText}>
                            Position/Designation
                        </Text>
                        <Text style={styles.sigSubText}>
                            [Head of the End-User or Implementing Unit]
                        </Text>
                        <Text style={{ marginTop: 10 }}>
                            Date : _________________
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default function NewPpmpFormDialog({ open, onOpenChange }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <PDFViewer
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                >
                    <ProcurementDocument />
                </PDFViewer>
            </DialogContent>
        </Dialog>
    );
}
