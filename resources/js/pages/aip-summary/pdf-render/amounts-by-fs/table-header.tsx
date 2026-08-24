// resources\js\pages\aip-summary\pdf-render\amounts-by-fs\table-header.tsx

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { FS_SUMMARY_COLUMN_WIDTHS } from "./cols";

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

export default function TableHeader() {
    // Column indices:
    // 0: funding_source, 1: ps, 2: mooe, 3: fe, 4: co, 5: ccet_adapt, 6: ccet_miti, 7: total
    const amountIndices = [1, 2, 3, 4, 7];
    const ccIndices = [5, 6];

    const amountGroupWidth = amountIndices.reduce(
        (sum, i) => sum + parseFloat(FS_SUMMARY_COLUMN_WIDTHS[i]),
        0,
    );
    const ccGroupWidth = ccIndices.reduce(
        (sum, i) => sum + parseFloat(FS_SUMMARY_COLUMN_WIDTHS[i]),
        0,
    );

    return (
        <View fixed style={styles.tableHeaderContainer}>
            {/* Funding Source - single column */}
            <View
                style={[styles.singleCell, { width: FS_SUMMARY_COLUMN_WIDTHS[0] }, leftBorderStyle]}
            >
                <Text style={styles.cellText}>Funding Source</Text>
            </View>

            {/* Amount group */}
            <View style={[styles.groupContainer, { width: `${amountGroupWidth}%` }]}>
                <View style={styles.groupHeader}>
                    <Text style={styles.cellText}>AMOUNT (In thousand pesos)</Text>
                </View>
                <View style={styles.groupSubRow}>
                    {amountIndices.map((idx) => {
                        const colWidth = parseFloat(FS_SUMMARY_COLUMN_WIDTHS[idx]);
                        const relativeWidth = (colWidth / amountGroupWidth) * 100;
                        let label = "";

                        if (idx === 1) label = "Personal Services (PS)";
                        else if (idx === 2) label = "Maintenance & Other Operating Expenses (MOOE)";
                        else if (idx === 3) label = "Financial Expenses (FE)";
                        else if (idx === 4) label = "Capital Outlay (CO)";
                        else if (idx === 7) label = "TOTAL";

                        return (
                            <View
                                key={`amount-sub-${idx}`}
                                style={[styles.subCell, { width: `${relativeWidth}%` }]}
                            >
                                <Text style={styles.subText}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Climate Change Expenditure group */}
            <View style={[styles.groupContainer, { width: `${ccGroupWidth}%` }]}>
                <View style={styles.groupHeader}>
                    <Text style={styles.cellText}>
                        AMOUNT of Climate Change Expenditure (in thousand pesos)
                    </Text>
                </View>
                <View style={styles.groupSubRow}>
                    {ccIndices.map((idx) => {
                        const colWidth = parseFloat(FS_SUMMARY_COLUMN_WIDTHS[idx]);
                        const relativeWidth = (colWidth / ccGroupWidth) * 100;
                        let label = "";

                        if (idx === 5) label = "Climate Change Adaptation";
                        else if (idx === 6) label = "Climate Change Mitigation";

                        return (
                            <View
                                key={`cc-sub-${idx}`}
                                style={[styles.subCell, { width: `${relativeWidth}%` }]}
                            >
                                <Text style={styles.subText}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
