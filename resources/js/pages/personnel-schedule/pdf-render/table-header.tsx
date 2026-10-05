// resources\js\pages\personnel-schedule\pdf-render\table-header.tsx

import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { LBP_FORM_3_COLUMN_WIDTHS } from './cols';

const sumWidths = (indices: number[]): string => {
    const total = indices.reduce(
        (acc, i) => acc + parseFloat(LBP_FORM_3_COLUMN_WIDTHS[i]),
        0,
    );

    return `${total}%`;
};

const leftBorderStyle = {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000000',
};

const styles = StyleSheet.create({
    tableHeaderContainer: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderTopColor: '#000000',
        borderBottomColor: '#000000',
        minHeight: 30,
        alignItems: 'stretch',
    },
    singleCell: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
    },
    cellText: {
        fontSize: 5,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
    },
    groupContainer: {
        flexDirection: 'column',
    },
    groupHeader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
    },
    groupSubRow: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: '#000000',
        height: 14,
    },
    subCell: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 1,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
    },
    subText: {
        fontSize: 4,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
    },
});

interface SingleHeaderEntry {
    type: 'single';
    index: number;
    label: string;
}

interface GroupHeaderEntry {
    type: 'group';
    label: string;
    columns: { index: number; label: string }[];
}

const HEADER_STRUCTURE: (SingleHeaderEntry | GroupHeaderEntry)[] = [
    {
        type: 'group',
        label: 'ITEM NUMBER',
        columns: [
            { index: 0, label: 'OLD' },
            { index: 1, label: 'NEW' },
        ],
    },
    { type: 'single', index: 2, label: 'POSITION TITLE' },
    { type: 'single', index: 3, label: 'NAME OF INCUMBENT' },
    {
        type: 'group',
        label: 'CURRENT YEAR AUTHORIZED RATE/ANNUM',
        columns: [
            { index: 4, label: 'SALARY GRADE (SG)/STEP' },
            { index: 5, label: 'AMOUNT' },
        ],
    },
    {
        type: 'group',
        label: 'BUDGET YEAR PROPOSED RATE/ANNUM',
        columns: [
            { index: 6, label: 'SALARY GRADE (SG)/STEP' },
            { index: 7, label: 'AMOUNT' },
        ],
    },
    { type: 'single', index: 8, label: 'INCREASE/DECREASE' },
    { type: 'single', index: 9, label: 'EFFECTIVITY OF STEP INCREMENT' },
];

export default function TableHeader() {
    return (
        <View fixed style={styles.tableHeaderContainer}>
            {HEADER_STRUCTURE.map((item, idx) => {
                const isFirst = idx === 0;

                if (item.type === 'single') {
                    return (
                        <View
                            key={`single-${item.index}`}
                            style={[
                                styles.singleCell,
                                { width: LBP_FORM_3_COLUMN_WIDTHS[item.index] },
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
                                    LBP_FORM_3_COLUMN_WIDTHS[col.index],
                                );
                                const relativeWidth = `${(colWidthNumeric / parentWidthNumeric) * 100}%`;

                                return (
                                    <View
                                        key={`sub-${col.index}`}
                                        style={[
                                            styles.subCell,
                                            { width: relativeWidth },
                                        ]}
                                    >
                                        <Text style={styles.subText}>
                                            {col.label}
                                        </Text>
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
