// resources\js\pages\ppmp\pdf-render\coa-summary\cols.tsx

import { Text } from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "../types";

const cellStyle = (align: "left" | "center" | "right") => ({
    textAlign: align,
    fontSize: 5,
    color: "#000000",
});

const headerStyle = (align: "left" | "center" | "right") => ({
    textAlign: align,
    fontSize: 5,
    fontWeight: "bold" as const,
});

export const getSummaryColumnDefs = <T extends Record<string, any>>(): ColumnDef<T>[] => [
    {
        id: "description",
        header: <Text style={headerStyle("left")}>Chart of Account</Text>,
        width: "28%",
        cell: (item) => (
            <Text style={cellStyle("left")}>{item.accountTitle || item.description || "-"}</Text>
        ),
    },
    {
        id: "account_code",
        header: <Text style={headerStyle("center")}>ACCOUNT CODE</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("center")}>{item.accountCode || "-"}</Text>,
    },
    {
        id: "total",
        header: <Text style={headerStyle("right")}>TOTAL (IN PPMP)</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("right")}>{formatCurrency(item.total || 0)}</Text>,
    },
    {
        id: "q1",
        header: <Text style={headerStyle("right")}>1ST QTR</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("right")}>{formatCurrency(item.q1 || 0)}</Text>,
    },
    {
        id: "q2",
        header: <Text style={headerStyle("right")}>2ND QTR</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("right")}>{formatCurrency(item.q2 || 0)}</Text>,
    },
    {
        id: "q3",
        header: <Text style={headerStyle("right")}>3RD QTR</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("right")}>{formatCurrency(item.q3 || 0)}</Text>,
    },
    {
        id: "q4",
        header: <Text style={headerStyle("right")}>4TH QTR</Text>,
        width: "12%",
        cell: (item) => <Text style={cellStyle("right")}>{formatCurrency(item.q4 || 0)}</Text>,
    },
];
