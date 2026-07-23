import { Page, Text, View, Document, PDFViewer } from "@react-pdf/renderer";
import { useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { AipEntry, FundingSource, Ppmp } from "@/types";

interface ExpenseAccountSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ppmps: Ppmp[]; // already filtered by funding source (array, not grouped)
    aipEntry: AipEntry;
    fundingSource: FundingSource | undefined;
    auth: any;
}

const formatCurrency = (num: number) => {
    return num === 0
        ? "-"
        : new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          }).format(num);
};

const sumMonths = (priceLists: any[], months: string[]) => {
    return (priceLists || []).reduce((acc, item) => {
        const itemSum = months.reduce(
            (mAcc, m) => mAcc + (parseFloat(item[`${m}_amount`]) || 0),
            0,
        );

        return acc + itemSum;
    }, 0);
};

// Helper to group PPMPs by ChartOfAccount under each expense class
const groupByChartOfAccount = (ppmps: Ppmp[]) => {
    const mooeMap: Record<string, any> = {};
    const coMap: Record<string, any> = {};

    for (const ppmp of ppmps) {
        const coa = ppmp.ppmp_price_list?.chart_of_account_ppmp_category?.chart_of_account;

        if (!coa) {
continue;
}

        const expenseClass = coa.expense_class;

        if (expenseClass !== "MOOE" && expenseClass !== "CO") {
continue;
} // only MOOE and CO

        const targetMap = expenseClass === "MOOE" ? mooeMap : coMap;
        const coaId = coa.id;

        if (!targetMap[coaId]) {
            targetMap[coaId] = {
                ...coa,
                price_lists: [],
            };
        }

        targetMap[coaId].price_lists.push({
            ...ppmp.ppmp_price_list,
            ...ppmp,
        });
    }

    return {
        mooe: Object.values(mooeMap),
        co: Object.values(coMap),
    };
};

// Reusable row component for section headers and empty rows
function SectionHeader({
    columnData,
    displayText,
    height,
}: {
    columnData: any[];
    displayText: string;
    height?: number;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
            }}
            wrap={false}
        >
            {columnData.map((col, index) => (
                <View
                    key={`${index}`}
                    style={{
                        width: `${col.size}%`,
                        borderBottom: "1pt solid #000",
                        borderLeft: index === 0 ? "1pt solid black" : "0pt",
                        borderRight: "1pt solid #000",
                        height: height,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 9,
                            fontWeight: "bold",
                            padding: 2,
                            textTransform: "uppercase",
                        }}
                    >
                        {index === 0 ? displayText : ""}
                    </Text>
                </View>
            ))}
        </View>
    );
}

export default function ExpenseAccountSummaryDialog({
    open,
    onOpenChange,
    ppmps,
    aipEntry,
    fundingSource,
    auth,
}: ExpenseAccountSummaryDialogProps) {
    const { mooe, co } = useMemo(() => groupByChartOfAccount(ppmps), [ppmps]);

    const columns = [
        {
            header: "EXPENSE ACCOUNT",
            size: 33.33,
            key: "account_title",
            alignHeader: "center",
            footer: () => "Sub-total",
        },
        {
            header: "ACCOUNT CODE",
            size: 11.11,
            key: "account_number",
            align: "center",
            alignHeader: "center",
        },
        {
            header: "TOTAL (IN PPMP)",
            size: 11.11,
            align: "right",
            alignHeader: "center",
            cell: (row: any) =>
                formatCurrency(
                    sumMonths(row.price_lists, [
                        "jan",
                        "feb",
                        "mar",
                        "apr",
                        "may",
                        "jun",
                        "jul",
                        "aug",
                        "sep",
                        "oct",
                        "nov",
                        "dec",
                    ]),
                ),
            footer: (data: any[]) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) =>
                            acc +
                            sumMonths(row.price_lists, [
                                "jan",
                                "feb",
                                "mar",
                                "apr",
                                "may",
                                "jun",
                                "jul",
                                "aug",
                                "sep",
                                "oct",
                                "nov",
                                "dec",
                            ]),
                        0,
                    ),
                ),
        },
        {
            header: "1ST QTR",
            size: 11.11,
            align: "right",
            alignHeader: "center",
            cell: (row: any) => formatCurrency(sumMonths(row.price_lists, ["jan", "feb", "mar"])),
            footer: (data: any[]) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) => acc + sumMonths(row.price_lists, ["jan", "feb", "mar"]),
                        0,
                    ),
                ),
        },
        {
            header: "2ND QTR",
            size: 11.11,
            align: "right",
            alignHeader: "center",
            cell: (row: any) => formatCurrency(sumMonths(row.price_lists, ["apr", "may", "jun"])),
            footer: (data: any[]) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) => acc + sumMonths(row.price_lists, ["apr", "may", "jun"]),
                        0,
                    ),
                ),
        },
        {
            header: "3RD QTR",
            size: 11.11,
            align: "right",
            alignHeader: "center",
            cell: (row: any) => formatCurrency(sumMonths(row.price_lists, ["jul", "aug", "sep"])),
            footer: (data: any[]) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) => acc + sumMonths(row.price_lists, ["jul", "aug", "sep"]),
                        0,
                    ),
                ),
        },
        {
            header: "4TH QTR",
            size: 11.11,
            align: "right",
            alignHeader: "center",
            cell: (row: any) => formatCurrency(sumMonths(row.price_lists, ["oct", "nov", "dec"])),
            footer: (data: any[]) =>
                formatCurrency(
                    data.reduce(
                        (acc, row) => acc + sumMonths(row.price_lists, ["oct", "nov", "dec"]),
                        0,
                    ),
                ),
        },
    ];

    const MyDocument = () => (
        <Document>
            <Page
                size={[936, 612]}
                style={{
                    flexDirection: "row",
                    padding: 36,
                }}
            >
                <View style={{ flexDirection: "column" }}>
                    {/* page header */}
                    <View
                        style={{
                            gap: 2,
                            paddingBottom: 2,
                        }}
                    >
                        {/*<Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                            {auth.user.name}
                        </Text>*/}
                        <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                            {fundingSource?.title.toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                            {aipEntry.ppa?.full_code}
                        </Text>
                        <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                            {aipEntry.ppa?.name}
                        </Text>
                    </View>

                    {/* table container */}
                    <View style={{ flexDirection: "column" }}>
                        {/* header */}
                        <View style={{ flexDirection: "row" }} wrap={false} fixed>
                            {columns.map((col, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: `${col.size}%`,
                                        borderTop: "1pt solid black",
                                        borderBottom: "1pt solid black",
                                        borderLeft: index === 0 ? "1pt solid black" : "0pt",
                                        borderRight: "1pt solid black",
                                        padding: 2,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            textAlign: col.alignHeader || "left",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {col.header}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* MOOE Section */}
                        <SectionHeader
                            columnData={columns}
                            displayText="Maintenance and Other Operating Expenses"
                        />
                        {mooe.map((row, rowIndex) => (
                            <View
                                key={`mooe-${rowIndex}`}
                                style={{ flexDirection: "row" }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={colIndex}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: "1pt solid black",
                                            borderLeft: colIndex === 0 ? "1pt solid black" : 0,
                                            borderRight: "1pt solid black",
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                textAlign: col.align || "left",
                                            }}
                                        >
                                            {typeof col.cell === "function"
                                                ? col.cell(row)
                                                : row[col.key]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                        {mooe.length > 0 && (
                            <View style={{ flexDirection: "row" }} wrap={false}>
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={`mooe-footer-${colIndex}`}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: "1pt solid black",
                                            borderLeft: colIndex === 0 ? "1pt solid black" : 0,
                                            borderRight: "1pt solid black",
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                fontWeight: "bold",
                                                textAlign: col.align || "left",
                                            }}
                                        >
                                            {typeof col.footer === "function"
                                                ? col.footer(mooe)
                                                : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* blank row spacer */}
                        <SectionHeader columnData={columns} displayText="" height={16} />

                        {/* CO Section */}
                        <SectionHeader columnData={columns} displayText="Capital Outlay" />
                        {co.map((row, rowIndex) => (
                            <View
                                key={`co-${rowIndex}`}
                                style={{ flexDirection: "row" }}
                                wrap={false}
                            >
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={colIndex}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: "1pt solid black",
                                            borderLeft: colIndex === 0 ? "1pt solid black" : 0,
                                            borderRight: "1pt solid black",
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                textAlign: col.align || "left",
                                            }}
                                        >
                                            {typeof col.cell === "function"
                                                ? col.cell(row)
                                                : row[col.key]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                        {co.length > 0 && (
                            <View style={{ flexDirection: "row" }} wrap={false}>
                                {columns.map((col, colIndex) => (
                                    <View
                                        key={`co-footer-${colIndex}`}
                                        style={{
                                            width: `${col.size}%`,
                                            borderBottom: "1pt solid black",
                                            borderLeft: colIndex === 0 ? "1pt solid black" : 0,
                                            borderRight: "1pt solid black",
                                            padding: 2,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                fontWeight: "bold",
                                                textAlign: col.align || "left",
                                            }}
                                        >
                                            {typeof col.footer === "function" ? col.footer(co) : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* blank row spacer */}
                        <SectionHeader columnData={columns} displayText="" height={16} />

                        {/* TOTAL FOR THE PPA */}
                        <View style={{ flexDirection: "row" }} wrap={false}>
                            {columns.map((col, index) => (
                                <View
                                    key={`total-${index}`}
                                    style={{
                                        width: `${col.size}%`,
                                        borderBottom: "1pt solid #000",
                                        borderLeft: index === 0 ? "1pt solid black" : "0pt",
                                        borderRight: "1pt solid #000",
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            fontWeight: "bold",
                                            padding: 2,
                                            textTransform: "uppercase",
                                            textAlign: col.align || "left",
                                        }}
                                    >
                                        {index === 0
                                            ? "TOTAL FOR THE PPA"
                                            : typeof col.footer === "function"
                                              ? col.footer([...mooe, ...co])
                                              : ""}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>Expense Account Summary</DialogTitle>
                    <DialogDescription className="sr-only" />
                </DialogHeader>
                <div className="h-full w-full">
                    <PDFViewer height="100%" width="100%">
                        <MyDocument />
                    </PDFViewer>
                </div>
            </DialogContent>
        </Dialog>
    );
}
