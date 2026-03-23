import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Ppmp } from '@/types/global';
import { Decimal } from 'decimal.js';
import { Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface EditableCellProps {
    getValue: () => any;
    row: any;
    column: any;
}

export const formatNumber = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) || num === null
        ? '0.00'
        : num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
};

const EditableCell: React.FC<EditableCellProps> = ({
    getValue,
    row,
    column,
}) => {
    const initialValue = getValue();
    const [value, setValue] = useState(formatNumber(initialValue));
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setValue(formatNumber(initialValue));
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleBlur = () => {
        // 1. Always strip commas to get the raw numbers for comparison
        const cleanValue = value.replace(/,/g, '');
        const cleanInitial = String(initialValue || '').replace(/,/g, '');

        // 2. If the value is actually different, update the server
        if (cleanValue !== cleanInitial && !isUpdating) {
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
                    only: ['ppmpItems'],
                    onFinish: () => {
                        setIsUpdating(false);
                        // Format the new value after server sync
                        setValue(formatNumber(cleanValue));
                    },
                    onError: () => {
                        setValue(formatNumber(initialValue));
                        setIsUpdating(false);
                    },
                },
            );
        } else {
            // 3. If nothing changed or we are already updating,
            // just re-format the local state to put the commas back.
            setValue(formatNumber(cleanValue));
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Remove commas on focus for easier editing
        setValue(value.replace(/,/g, ''));
        e.target.select();
    };

    return (
        <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            className="w-full rounded border bg-transparent px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
    );
};

const columnHelper = createColumnHelper<Ppmp>();

export const columns = [
    columnHelper.accessor('funding_source.code', {
        header: 'Funding Source',
        cell: (info) => <span className="text-wrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('ppmp_price_list.chart_of_account.expense_class', {
        header: 'Expense Class',
        cell: (info) => <span className="text-wrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('ppmp_price_list.chart_of_account.account_title', {
        header: 'Expense Account',
        size: 300,
        cell: (info) => <span className="text-wrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('ppmp_price_list.item_number', {
        header: 'Item No.',
        // size: 300,
    }),
    columnHelper.accessor('ppmp_price_list.description', {
        header: 'Description',
        size: 300,
        cell: (info) => <span className="text-wrap">{info.getValue()}</span>,
    }),
    columnHelper.accessor('ppmp_price_list.unit_of_measurement', {
        header: 'Unit of Measurement',
        // size: 300,
    }),
    columnHelper.accessor('ppmp_price_list.price', {
        header: () => <div className="w-full text-right">PRICELIST</div>,
        // size: 300,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    }),
    columnHelper.display({
        id: 'cy_qty',
        header: () => <div className="w-full text-right">CY 2026-QTY</div>,
        // size: 300,
        cell: ({ row }) => {
            const ppmp = row.original;
            const totalQty = new Decimal(ppmp.jan_qty || 0)
                .plus(ppmp.feb_qty || 0)
                .plus(ppmp.mar_qty || 0)
                .plus(ppmp.apr_qty || 0)
                .plus(ppmp.may_qty || 0)
                .plus(ppmp.jun_qty || 0)
                .plus(ppmp.jul_qty || 0)
                .plus(ppmp.aug_qty || 0)
                .plus(ppmp.sep_qty || 0)
                .plus(ppmp.oct_qty || 0)
                .plus(ppmp.nov_qty || 0)
                .plus(ppmp.dec_qty || 0);

            return (
                <span className="block text-right">
                    {formatNumber(totalQty.toString())}
                </span>
            );
        },
    }),
    columnHelper.accessor(
        (row) => {
            // 1. We use an accessor function to calculate the "Total" value for the row
            return new Decimal(row.jan_amount || 0)
                .plus(row.feb_amount || 0)
                .plus(row.mar_amount || 0)
                .plus(row.apr_amount || 0)
                .plus(row.may_amount || 0)
                .plus(row.jun_amount || 0)
                .plus(row.jul_amount || 0)
                .plus(row.aug_amount || 0)
                .plus(row.sep_amount || 0)
                .plus(row.oct_amount || 0)
                .plus(row.nov_amount || 0)
                .plus(row.dec_amount || 0)
                .toNumber(); // Accessors usually prefer primitives for sorting/filtering
        },
        {
            id: 'total_amount',
            header: () => <div className="w-full text-right">TOTAL</div>,
            cell: ({ getValue }) => (
                <span className="block text-right font-bold">
                    {formatNumber(String(getValue()))}
                </span>
            ),
            footer: ({ table }) => {
                // 2. Sum up the calculated 'total_amount' across all filtered rows
                const sum = table
                    .getFilteredRowModel()
                    .rows.reduce((acc, row) => {
                        const val = row.getValue<number>('total_amount');
                        return acc.plus(val || 0);
                    }, new Decimal(0));

                return (
                    <span className="block text-right font-bold">
                        {formatNumber(sum.toString())}
                    </span>
                );
            },
        },
    ),

    // JANUARY
    columnHelper.accessor('jan_qty', {
        header: () => <div className="text-right">JAN-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jan_amount', {
        header: () => <div className="text-right">JAN</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // FEBRUARY
    columnHelper.accessor('feb_qty', {
        header: () => <div className="text-right">FEB-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('feb_amount', {
        header: () => <div className="text-right">FEB</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // MARCH
    columnHelper.accessor('mar_qty', {
        header: () => <div className="text-right">MAR-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('mar_amount', {
        header: () => <div className="text-right">MAR</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // APRIL
    columnHelper.accessor('apr_qty', {
        header: () => <div className="text-right">APR-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('apr_amount', {
        header: () => <div className="text-right">APR</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // MAY
    columnHelper.accessor('may_qty', {
        header: () => <div className="text-right">MAY-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('may_amount', {
        header: () => <div className="text-right">MAY</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // JUNE
    columnHelper.accessor('jun_qty', {
        header: () => <div className="text-right">JUN-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jun_amount', {
        header: () => <div className="text-right">JUNE</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // JULY
    columnHelper.accessor('jul_qty', {
        header: () => <div className="text-right">JUL-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('jul_amount', {
        header: () => <div className="text-right">JULY</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // AUGUST
    columnHelper.accessor('aug_qty', {
        header: () => <div className="text-right">AUG-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('aug_amount', {
        header: () => <div className="text-right">AUG</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // SEPTEMBER
    columnHelper.accessor('sep_qty', {
        header: () => <div className="text-right">SEP-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('sep_amount', {
        header: () => <div className="text-right">SEP</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // OCTOBER
    columnHelper.accessor('oct_qty', {
        header: () => <div className="text-right">OCT-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('oct_amount', {
        header: () => <div className="text-right">OCT</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // NOVEMBER
    columnHelper.accessor('nov_qty', {
        header: () => <div className="text-right">NOV-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('nov_amount', {
        header: () => <div className="text-right">NOV</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    // DECEMBER
    columnHelper.accessor('dec_qty', {
        header: () => <div className="text-right">DEC-QTY</div>,
        cell: EditableCell,
    }),
    columnHelper.accessor('dec_amount', {
        header: () => <div className="text-right">DEC</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue() ?? 0))}
            </span>
        ),
    }),

    columnHelper.display({
        id: 'action',
        size: 52,
        cell: ({ row, table }) => (
            <div className="flex justify-center">
                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() =>
                        (table.options.meta as any)?.onDelete(row.original)
                    }
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        ),
    }),
];
