import { router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Decimal } from 'decimal.js';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/base-ui-components/ui/button';
import { Input } from '@/components/base-ui-components/ui/input';
import { updateMonthlyQuantity } from '@/routes/ppmp';
import type { Ppmp } from '@/types';

interface PageProps {
    ppmpItems: Ppmp[];
}

interface EditableCellProps {
    getValue: () => any;
    row: any;
    column: any;
    table: any;
}

const formatNumber = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;

    return isNaN(num) || num === null
        ? '0.00'
        : num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
};

const formatInteger = (val: string | number) => {
    const num =
        typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;

    if (isNaN(num) || num === null) {
        return '0';
    }

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

const EditableCell: React.FC<EditableCellProps> = ({
    getValue,
    row,
    column,
    table,
}) => {
    const rowData = row.original;

    const [localValue, setLocalValue] = useState<string>(() =>
        String(getValue() ?? '').replace(/,/g, ''),
    );
    const [isFocused, setIsFocused] = useState(false);

    // Raw digits while editing, comma-grouped once blurred.
    // Deriving the display value keeps the commas even if the
    // server response re-renders this cell with the raw number.
    const displayValue = isFocused
        ? localValue
        : formatInteger(localValue || '0');

    // Enter commits the same way as blur, so the value is
    // formatted and saved exactly once.
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }

    function handleBlur() {
        setIsFocused(false);

        const quantity = parseInt(localValue, 10) || 0;
        const originalQuantity =
            parseInt(String(getValue() ?? '').replace(/,/g, ''), 10) || 0;

        // Nothing changed — just re-format the display, no API call.
        if (quantity === originalQuantity) {
            setLocalValue(String(quantity));

            return;
        }

        router
            .optimistic((props: PageProps) => {
                const ppmpItems = props.ppmpItems;

                const updatedItems = ppmpItems.map((item) => {
                    if (item.id === rowData.id) {
                        return {
                            ...item,
                            [column.id]: quantity,
                        };
                    }

                    return item;
                });

                return { ppmpItems: updatedItems };
            })
            .put(
                updateMonthlyQuantity(rowData.id).url,
                {
                    month: column.id,
                    quantity: quantity,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onStart: () => table.options.meta?.onSavingChange?.(true),
                    onFinish: () => table.options.meta?.onSavingChange?.(false),
                    onError: () => setLocalValue(String(getValue())),
                },
            );

        setLocalValue(String(quantity));
    }

    return (
        <Input
            className="text-right slashed-zero tabular-nums"
            inputMode="numeric"
            onBeforeInput={(e) => {
                if (e.data && e.data.length === 1 && !/[0-9]/.test(e.data)) {
                    e.preventDefault();
                }
            }}
            onBlur={handleBlur}
            onChange={(e) =>
                setLocalValue(e.target.value.replace(/[^0-9]/g, ''))
            }
            onDragStart={(e) => e.preventDefault()}
            onFocus={(e) => {
                e.currentTarget.select();
            }}
            onKeyDown={handleKeyDown}
            pattern="[0-9,]*"
            type="text"
            value={displayValue}
            autoComplete="off"
        />
    );
};

// Define keys to safely access dynamic month properties on the object
type MonthKey =
    | 'jan'
    | 'feb'
    | 'mar'
    | 'apr'
    | 'may'
    | 'jun'
    | 'jul'
    | 'aug'
    | 'sep'
    | 'oct'
    | 'nov'
    | 'dec';

interface MonthConfig {
    qtyKey: `${MonthKey}_qty`;
    amountKey: `${MonthKey}_amount`;
    qtyHeader: string;
    amountHeader: string;
}

// 12 Months Configuration Array
const MONTHS: MonthConfig[] = [
    {
        qtyKey: 'jan_qty',
        amountKey: 'jan_amount',
        qtyHeader: 'JAN-QTY',
        amountHeader: 'JAN',
    },
    {
        qtyKey: 'feb_qty',
        amountKey: 'feb_amount',
        qtyHeader: 'FEB-QTY',
        amountHeader: 'FEB',
    },
    {
        qtyKey: 'mar_qty',
        amountKey: 'mar_amount',
        qtyHeader: 'MAR-QTY',
        amountHeader: 'MAR',
    },
    {
        qtyKey: 'apr_qty',
        amountKey: 'apr_amount',
        qtyHeader: 'APR-QTY',
        amountHeader: 'APR',
    },
    {
        qtyKey: 'may_qty',
        amountKey: 'may_amount',
        qtyHeader: 'MAY-QTY',
        amountHeader: 'MAY',
    },
    {
        qtyKey: 'jun_qty',
        amountKey: 'jun_amount',
        qtyHeader: 'JUN-QTY',
        amountHeader: 'JUNE',
    },
    {
        qtyKey: 'jul_qty',
        amountKey: 'jul_amount',
        qtyHeader: 'JUL-QTY',
        amountHeader: 'JULY',
    },
    {
        qtyKey: 'aug_qty',
        amountKey: 'aug_amount',
        qtyHeader: 'AUG-QTY',
        amountHeader: 'AUG',
    },
    {
        qtyKey: 'sep_qty',
        amountKey: 'sep_amount',
        qtyHeader: 'SEP-QTY',
        amountHeader: 'SEP',
    },
    {
        qtyKey: 'oct_qty',
        amountKey: 'oct_amount',
        qtyHeader: 'OCT-QTY',
        amountHeader: 'OCT',
    },
    {
        qtyKey: 'nov_qty',
        amountKey: 'nov_amount',
        qtyHeader: 'NOV-QTY',
        amountHeader: 'NOV',
    },
    {
        qtyKey: 'dec_qty',
        amountKey: 'dec_amount',
        qtyHeader: 'DEC-QTY',
        amountHeader: 'DEC',
    },
];

// Monthly amounts are derived (qty × unit price) on the client so they
// update instantly when a quantity is edited, without a server refetch.
const getMonthlyAmount = (row: Ppmp, month: MonthConfig): Decimal =>
    new Decimal(row[month.qtyKey] || 0).times(
        new Decimal(row.ppmp_price_list?.price || 0),
    );

const columnHelper = createColumnHelper<Ppmp>();

const columns = [
    columnHelper.accessor('ppmp_price_list.item_number', {
        size: 100,
        header: () => <div className="text-center">Item No.</div>,
        cell: (info) => (
            <div className="text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('ppmp_price_list.description', {
        size: 400,
        enableGlobalFilter: true,
        header: () => <div className="text-center">Description</div>,
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('ppmp_price_list.unit_of_measurement', {
        size: 200,
        header: () => <div className="text-center">Unit of Measurement</div>,
        cell: (info) => (
            <div className="text-center text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('ppmp_price_list.price', {
        size: 150,
        header: () => <div className="text-center">PRICELIST</div>,
        cell: (info) => (
            <div className="text-right text-wrap slashed-zero tabular-nums">
                {formatNumber(Number(info.getValue()) || 0)}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'cy_qty',
        size: 120,
        header: (info) => {
            const meta = info.table.options.meta;

            return <div className="text-center">CY {meta?.year?.year}-QTY</div>;
        },
        cell: ({ row }) => {
            const ppmp = row.original;
            const totalQty = MONTHS.reduce(
                (sum, month) => sum + (Number(ppmp[month.qtyKey]) || 0),
                0,
            );

            return (
                <div className="text-right text-wrap slashed-zero tabular-nums">
                    {formatInteger(totalQty.toString())}
                </div>
            );
        },
        footer: ({ table }) => {
            const total = table
                .getFilteredRowModel()
                .rows.reduce((acc, row) => {
                    const ppmp = row.original;
                    const rowTotal = MONTHS.reduce(
                        (sum, month) => sum + (Number(ppmp[month.qtyKey]) || 0),
                        0,
                    );

                    return acc.plus(new Decimal(rowTotal));
                }, new Decimal(0));

            return (
                <div className="text-right font-medium slashed-zero tabular-nums">
                    {formatInteger(total.toString())}
                </div>
            );
        },
    }),
    columnHelper.accessor(
        (row) =>
            MONTHS.reduce(
                (acc, m) => acc.plus(getMonthlyAmount(row, m)),
                new Decimal(0),
            ).toNumber(),
        {
            id: 'total_amount',
            size: 150,
            header: () => <div className="text-center">TOTAL</div>,
            cell: ({ getValue }) => (
                <div className="text-right text-wrap slashed-zero tabular-nums">
                    {formatNumber(String(getValue()))}
                </div>
            ),
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, row) =>
                            acc.plus(row.getValue<number>('total_amount') || 0),
                        new Decimal(0),
                    );

                return (
                    <div className="text-right slashed-zero tabular-nums">
                        {formatNumber(sum.toString())}
                    </div>
                );
            },
        },
    ),
    ...MONTHS.flatMap((month) => [
        columnHelper.accessor(month.qtyKey, {
            size: 100,
            header: () => <div className="text-center">{month.qtyHeader}</div>,
            cell: EditableCell,
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, row) =>
                            acc.plus(
                                new Decimal(row.getValue(month.qtyKey) || 0),
                            ),
                        new Decimal(0),
                    );

                return (
                    <div className="text-right font-medium slashed-zero tabular-nums">
                        {formatInteger(sum.toString())}
                    </div>
                );
            },
        }),
        columnHelper.accessor(month.amountKey, {
            size: 150,
            header: () => (
                <div className="text-center">{month.amountHeader}</div>
            ),
            cell: ({ row }) => (
                <div className="text-right text-wrap">
                    {formatNumber(
                        getMonthlyAmount(row.original, month).toString(),
                    )}
                </div>
            ),
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce(
                        (acc, row) =>
                            acc.plus(getMonthlyAmount(row.original, month)),
                        new Decimal(0),
                    );

                return (
                    <div className="text-right slashed-zero tabular-nums">
                        {formatNumber(sum.toString())}
                    </div>
                );
            },
        }),
    ]),
    columnHelper.display({
        id: 'actions',
        size: 46,
        cell: ({ row, table }) => (
            <div className="flex justify-center">
                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                    disabled={!row.original.can?.delete}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
