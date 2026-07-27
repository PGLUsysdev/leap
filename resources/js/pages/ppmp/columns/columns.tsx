import { router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Decimal } from 'decimal.js';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/base-ui-components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Ppmp } from '@/types';

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
    const [localValue, setLocalValue] = useState<string>(() =>
        formatInteger(getValue()),
    );

    const [isUpdating, setIsUpdating] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setLocalValue(String(getValue() ?? ''));
        setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        const cleanValue = localValue.replace(/,/g, '');
        const cleanInitial = String(getValue() || '0').replace(/,/g, '');

        if (cleanValue === cleanInitial) {
            setLocalValue(formatInteger(cleanValue));

            return;
        }

        setIsUpdating(true);

        router.put(
            `/ppmp/${row.original.id}/update-monthly-quantity`,
            {
                month: column.id,
                quantity: cleanValue,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['ppmps'],
                onSuccess: () => setLocalValue(formatInteger(cleanValue)),
                onError: () => setLocalValue(formatInteger(getValue())),
                onFinish: () => setIsUpdating(false),
            },
        );
    };

    const isReadOnly = table.options.meta?.readOnly || !row.original.can?.edit;

    return (
        <div className="px-1">
            <Input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                disabled={isUpdating || isReadOnly}
                className="w-full rounded border bg-transparent px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            />
        </div>
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

const columnHelper = createColumnHelper<Ppmp>();

const columns = [
    columnHelper.accessor('ppmp_price_list.item_number', {
        size: 100,
        header: () => <div className="px-1">Item No.</div>,
        cell: ({ getValue }) => (
            <div className="px-1 text-wrap">{getValue()}</div>
        ),
    }),
    columnHelper.accessor('ppmp_price_list.description', {
        size: 400,
        enableGlobalFilter: true,
        header: () => <div className="px-1">Description</div>,
        cell: ({ row, getValue }) => {
            const ppmp = row.original;

            return (
                <span className="px-1 align-middle">
                    <span className="font-medium text-wrap">{getValue()}</span>{' '}
                    {ppmp.isCombined ? (
                        <Badge
                            variant="outline"
                            className="inline-flex h-4 border-indigo-300 bg-indigo-50/50 px-1.5 py-0 align-middle text-[9px] font-semibold tracking-wider text-indigo-700 uppercase dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400"
                        >
                            Combined
                        </Badge>
                    ) : ppmp.ppa_funding_source?.supplemental_aip_id ? (
                        <Badge
                            variant="outline"
                            className="inline-flex h-4 border-sky-300 bg-sky-50/50 px-1.5 py-0 align-middle text-[9px] font-semibold tracking-wider text-sky-700 uppercase dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-400"
                        >
                            Supplemental
                        </Badge>
                    ) : (
                        <Badge
                            variant="secondary"
                            className="inline-flex h-4 px-1.5 py-0 align-middle text-[9px] font-semibold tracking-wider uppercase"
                        >
                            Original
                        </Badge>
                    )}
                </span>
            );
        },
    }),
    columnHelper.accessor('ppmp_price_list.unit_of_measurement', {
        size: 200,
        header: () => <div className="px-1">Unit of Measurement</div>,
        cell: ({ getValue }) => (
            <div className="px-1 text-wrap">{getValue()}</div>
        ),
    }),
    columnHelper.accessor('ppmp_price_list.price', {
        size: 150,
        header: () => <div className="px-1 text-right">PRICELIST</div>,
        cell: ({ getValue }) => (
            <div className="px-1 text-right text-wrap">
                {formatNumber(Number(getValue()) || 0)}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'cy_qty',
        size: 120,
        header: () => <div className="px-1 text-right">CY 2026-QTY</div>,
        cell: ({ row }) => {
            const ppmp = row.original;
            const totalQty = MONTHS.reduce(
                (sum, month) => sum + (Number(ppmp[month.qtyKey]) || 0),
                0,
            );

            return (
                <div className="px-1 text-right text-wrap">
                    {formatInteger(totalQty.toString())}
                </div>
            );
        },
    }),
    columnHelper.accessor(
        (row) =>
            MONTHS.reduce(
                (acc, m) => acc.plus(new Decimal(row[m.amountKey] || 0)),
                new Decimal(0),
            ).toNumber(),
        {
            id: 'total_amount',
            size: 150,
            header: () => <div className="px-1 text-right">TOTAL</div>,
            cell: ({ getValue }) => (
                <div className="px-1 text-right text-wrap">
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
                    <div className="px-1 text-right">
                        {formatNumber(sum.toString())}
                    </div>
                );
            },
        },
    ),

    ...MONTHS.flatMap((month) => [
        columnHelper.accessor(month.qtyKey, {
            size: 100,
            header: () => (
                <div className="px-1 text-right">{month.qtyHeader}</div>
            ),
            cell: EditableCell,
        }),
        columnHelper.accessor(month.amountKey, {
            size: 150,
            header: () => (
                <div className="px-1 text-right">{month.amountHeader}</div>
            ),
            cell: ({ getValue }) => (
                <div className="px-1 text-right text-wrap">
                    {formatNumber(String(getValue() ?? 0))}
                </div>
            ),
            footer: ({ table }) => {
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, row) => {
                        return acc.plus(
                            new Decimal(row.getValue(month.amountKey) || 0),
                        );
                    }, new Decimal(0));

                return (
                    <div className="px-1 text-right">
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
