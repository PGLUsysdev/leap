// resources\js\pages\aip\pdf-render\table-header.tsx

import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { APP_COLUMN_WIDTHS, formatAppNumber } from './cols';

const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica' },
    tableHeaderCell: {
        margin: 2,
        fontSize: 6,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    headerGroup: { flexDirection: 'column', padding: 0 },
    borderRight: { borderRightWidth: 0.5 },
    borderBottom: { borderBottomWidth: 0.5 },
    borderLeft: { borderLeftWidth: 0.5 },
    borderTop: { borderTopWidth: 0.5 },
    row: { flexDirection: 'row' },
    centered: { justifyContent: 'center', alignItems: 'center' },
});

interface AppTableHeaderProps {
    officeLabel: string;
    plannedAmount: number;
}

export default function AppTableHeader({
    officeLabel,
    plannedAmount,
}: AppTableHeaderProps) {
    const width = (index: number) => APP_COLUMN_WIDTHS[index];
    const spanWidth = (from: number, to: number) =>
        `${APP_COLUMN_WIDTHS.slice(from, to).reduce((a, b) => a + parseFloat(b), 0)}%`;

    return (
        <View fixed>
            {/* Info tier: province / plan control / department + amounts */}
            <View
                style={[
                    styles.row,
                    styles.borderTop,
                    styles.borderBottom,
                    { height: 36 },
                ]}
            >
                <View
                    style={{
                        width: spanWidth(0, 5),
                        borderLeftWidth: 0.5,
                        borderRightWidth: 0.5,
                        justifyContent: 'flex-end',
                    }}
                >
                    <Text
                        style={[
                            styles.tableHeaderCell,
                            { textTransform: 'none', textAlign: 'left' },
                        ]}
                    >
                        Province, City or Municipality: La Union
                    </Text>
                    <Text
                        style={[
                            styles.tableHeaderCell,
                            { textTransform: 'none', textAlign: 'left' },
                        ]}
                    >
                        Plan Control No.
                    </Text>
                    <Text
                        style={[
                            styles.tableHeaderCell,
                            { textTransform: 'none', textAlign: 'left' },
                        ]}
                    >
                        Department / Office: {officeLabel}
                    </Text>
                </View>

                <View
                    style={[
                        styles.headerGroup,
                        {
                            width: width(5),
                            borderRightWidth: 0.5,
                        },
                    ]}
                >
                    <View
                        style={{
                            borderBottomWidth: 0.5,
                            flex: 2,
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Text
                            style={[
                                styles.tableHeaderCell,
                                { textAlign: 'left', textTransform: 'none' },
                            ]}
                        >
                            Planned Amount
                        </Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <Text
                            style={[
                                styles.tableHeaderCell,
                                { textAlign: 'left', textTransform: 'none' },
                            ]}
                        >
                            Regular
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.headerGroup,
                        {
                            width: spanWidth(6, 10),
                            borderRightWidth: 0.5,
                        },
                    ]}
                >
                    <View
                        style={{
                            borderBottomWidth: 0.5,
                            flex: 2,
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Text
                            style={[
                                styles.tableHeaderCell,
                                { textAlign: 'left', textTransform: 'none' },
                            ]}
                        >
                            {`P ${formatAppNumber(plannedAmount)}`}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <View
                            style={{
                                width: '50%',
                                borderRightWidth: 0.5,
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    {
                                        textAlign: 'left',
                                        textTransform: 'none',
                                    },
                                ]}
                            >
                                Contingency
                            </Text>
                        </View>
                        <View
                            style={{
                                width: '50%',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    {
                                        textAlign: 'left',
                                        textTransform: 'none',
                                    },
                                ]}
                            >
                                Total
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        width: spanWidth(10, 14),
                        borderRightWidth: 0.5,
                        justifyContent: 'flex-end',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    <Text
                        style={[
                            styles.tableHeaderCell,
                            {
                                textAlign: 'left',
                                marginLeft: 5,
                                textTransform: 'none',
                            },
                        ]}
                    >
                        Date Submitted:
                    </Text>
                </View>
            </View>

            {/* Column labels tier */}
            <View style={[styles.row, styles.borderBottom, { height: 40 }]}>
                <View
                    style={[
                        { width: width(0) },
                        styles.borderLeft,
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>Item No.</Text>
                </View>
                <View
                    style={[
                        { width: width(1) },
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>Description</Text>
                </View>
                <View
                    style={[
                        { width: width(2) },
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>UNIT</Text>
                </View>
                <View
                    style={[
                        { width: width(3) },
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>UNIT COST</Text>
                </View>
                <View
                    style={[
                        { width: width(4) },
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>QTY.</Text>
                </View>
                <View
                    style={[
                        { width: width(5) },
                        styles.borderRight,
                        styles.centered,
                    ]}
                >
                    <Text style={styles.tableHeaderCell}>TOTAL COST</Text>
                </View>

                <View style={[styles.headerGroup, { width: spanWidth(6, 16) }]}>
                    <View
                        style={{
                            borderBottomWidth: 0.5,
                            borderRightWidth: 0.5,
                            justifyContent: 'center',
                            flex: 0.5,
                        }}
                    >
                        <Text style={styles.tableHeaderCell}>DISTRIBUTION</Text>
                    </View>

                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        {[
                            '1ST QUARTER',
                            '2ND QUARTER',
                            '3RD QUARTER',
                            '4TH QUARTER',
                        ].map((quarter, idx) => {
                            const startIdx = 6 + idx * 2;
                            const groupWidth =
                                parseFloat(APP_COLUMN_WIDTHS[startIdx]) +
                                parseFloat(APP_COLUMN_WIDTHS[startIdx + 1]);
                            const parentWidth = APP_COLUMN_WIDTHS.slice(
                                6,
                                14,
                            ).reduce((a, b) => a + parseFloat(b), 0);

                            return (
                                <View
                                    key={quarter}
                                    style={{
                                        width: `${(groupWidth / parentWidth) * 100}%`,
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.borderBottom,
                                            styles.borderRight,
                                            styles.centered,
                                            { flex: 1 },
                                        ]}
                                    >
                                        <Text style={styles.tableHeaderCell}>
                                            {quarter}
                                        </Text>
                                    </View>

                                    <View style={[styles.row, { flex: 1 }]}>
                                        <View
                                            style={[
                                                {
                                                    width: `${(parseFloat(APP_COLUMN_WIDTHS[startIdx]) / groupWidth) * 100}%`,
                                                },
                                                styles.borderRight,
                                                styles.centered,
                                            ]}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
                                            >
                                                Qty.
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                {
                                                    width: `${(parseFloat(APP_COLUMN_WIDTHS[startIdx + 1]) / groupWidth) * 100}%`,
                                                },
                                                styles.borderRight,
                                                styles.centered,
                                            ]}
                                        >
                                            <Text
                                                style={styles.tableHeaderCell}
                                            >
                                                Amount
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
}

export { styles as appTableHeaderStyles };
