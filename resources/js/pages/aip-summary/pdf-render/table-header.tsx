import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { AIP_SUMMARY_COLUMN_WIDTHS } from "./cols";

// Helper to sum width strings as numeric percentage values
const sumWidths = (indices: number[]): string => {
    const total = indices.reduce((acc, i) => acc + parseFloat(AIP_SUMMARY_COLUMN_WIDTHS[i]), 0);

    return `${total}%`;
};

const leftBorderStyle = {
    borderLeftWidth: 0.5,
    borderLeftColor: "#000000",
};

const styles = StyleSheet.create({
    tableHeaderContainer: {
        flexDirection: "row",
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderTopColor: "#000000",
        borderBottomColor: "#000000",
        minHeight: 28,
        alignItems: "stretch",
    },
    // Single-tier column spanning full height
    singleCell: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
        borderRightWidth: 0.5,
        borderRightColor: "#000000",
    },
    cellText: {
        fontSize: 5,
        fontWeight: "bold",
        textAlign: "center",
        color: "#000000",
    },
    // Two-tier column group container (no right border here to avoid shrinking inner width)
    groupContainer: {
        flexDirection: "column",
    },
    groupHeader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRightWidth: 0.5,
        borderRightColor: "#000000",
    },
    groupSubRow: {
        flexDirection: "row",
        borderTopWidth: 0.5,
        borderTopColor: "#000000",
        height: 14,
    },
    // Every subcell has its own right border matching the body rows
    subCell: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 1,
        borderRightWidth: 0.5,
        borderRightColor: "#000000",
    },
    subText: {
        fontSize: 4,
        fontWeight: "bold",
        textAlign: "center",
        color: "#000000",
    },
});

interface SingleHeaderEntry {
    type: "single";
    index: number;
    label: string;
}

interface GroupHeaderEntry {
    type: "group";
    label: string;
    columns: { index: number; label: string }[];
}

const HEADER_STRUCTURE: (SingleHeaderEntry | GroupHeaderEntry)[] = [
    { type: "single", index: 0, label: "AIP REF. CODE" },
    { type: "single", index: 1, label: "PROGRAM / PROJECT / ACTIVITY DESCRIPTION" },
    { type: "single", index: 2, label: "IMPLEMENTING OFFICE / DEPARTMENT / LOCATION" },
    {
        type: "group",
        label: "SCHEDULE OF IMPLEMENTATION",
        columns: [
            { index: 3, label: "STARTING DATE" },
            { index: 4, label: "COMPLETION DATE" },
        ],
    },
    { type: "single", index: 5, label: "EXPECTED OUTPUTS" },
    { type: "single", index: 6, label: "FUNDING SOURCE" },
    {
        type: "group",
        label: "AMOUNT (In thousand pesos)",
        columns: [
            { index: 7, label: "PERSONAL SERVICES (PS)" },
            { index: 8, label: "MAINTENANCE & OTHER OPERATING EXPENSES (MOOE)" },
            { index: 9, label: "FINANCIAL EXPENSES (FE)" },
            { index: 10, label: "CAPITAL OUTLAY (CO)" },
            { index: 11, label: "TOTAL" },
        ],
    },
    {
        type: "group",
        label: "AMOUNT of Climate Change Expenditure (in thousand pesos)",
        columns: [
            { index: 12, label: "Climate Change Adaptation" },
            { index: 13, label: "Climate Change Mitigation" },
        ],
    },
    { type: "single", index: 14, label: "CC Typology Code" },
];

function TableHeader() {
    return (
        <View fixed style={styles.tableHeaderContainer}>
            {HEADER_STRUCTURE.map((item, idx) => {
                const isFirst = idx === 0;

                if (item.type === "single") {
                    return (
                        <View
                            key={`single-${item.index}`}
                            style={[
                                styles.singleCell,
                                { width: AIP_SUMMARY_COLUMN_WIDTHS[item.index] },
                                isFirst ? leftBorderStyle : {},
                            ]}
                        >
                            <Text style={styles.cellText}>{item.label}</Text>
                        </View>
                    );
                }

                const groupIndices = item.columns.map((c) => c.index);
                const groupWidth = sumWidths(groupIndices);
                const parentWidthNumeric = parseFloat(groupWidth);

                return (
                    <View
                        key={`group-${idx}`}
                        style={[
                            styles.groupContainer,
                            { width: groupWidth },
                            isFirst ? leftBorderStyle : {},
                        ]}
                    >
                        <View style={styles.groupHeader}>
                            <Text style={styles.cellText}>{item.label}</Text>
                        </View>
                        <View style={styles.groupSubRow}>
                            {item.columns.map((col) => {
                                const colWidthNumeric = parseFloat(
                                    AIP_SUMMARY_COLUMN_WIDTHS[col.index],
                                );
                                const relativeWidth = `${(colWidthNumeric / parentWidthNumeric) * 100}%`;

                                return (
                                    <View
                                        key={`sub-${col.index}`}
                                        style={[styles.subCell, { width: relativeWidth }]}
                                    >
                                        <Text style={styles.subText}>{col.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default TableHeader;
