import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Ppmp } from '@/pages/types/types';
import { Decimal } from 'decimal.js';
import { Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export const formatNumber = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) || num === null
        ? '0.00'
        : num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
};

interface EditableCellProps {
    getValue: () => any;
    row: any;
    column: any;
}

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

export const columns: ColumnDef<Ppmp>[] = [
    {
        accessorKey: 'ppmp_price_list.chart_of_account_id',
        header: 'Expense Account',
        size: 300,
        cell: ({ cell }) => {
            const accountTitle =
                cell.row.original.ppmp_price_list?.chart_of_account
                    ?.account_title;

            console.log(accountTitle);

            return accountTitle;
        },
    },
    {
        accessorKey: 'ppmp_price_list.item_number',
        header: 'Item No.',
    },
    {
        accessorKey: 'ppmp_price_list.description',
        header: 'Description',
        size: 350,
    },
    {
        accessorKey: 'ppmp_price_list.unit_of_measurement',
        header: 'Unit of Measurement',
    },
    {
        accessorKey: 'ppmp_price_list.price',
        header: () => <div className="w-full text-right">PRICELIST</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    {
        id: 'cy_2026_qty',
        header: () => <div className="w-full text-right">CY 2026-QTY</div>,
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
    },
    {
        id: 'total_amount',
        accessorKey: 'total_amount',
        header: () => <div className="w-full text-right">TOTAL</div>,
        accessorFn: (row) => {
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
                .plus(row.dec_amount || 0);
        },
        cell: ({ getValue }) => (
            <span className="block text-right font-bold">
                {formatNumber(String(getValue()))}
            </span>
        ),
        footer: (props) => {
            const rows = props.table.getFilteredRowModel().rows;
            const sum = rows.reduce((acc, row) => {
                const val = row.getValue('total_amount');
                return acc.plus(Number(val || 0));
            }, new Decimal(0));

            return (
                <span className="block text-right font-bold">
                    {formatNumber(sum.toString())}
                </span>
            );
        },
    },
    // JANUARY
    {
        accessorKey: 'jan_qty',
        header: () => <div className="text-right">JAN-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'jan_amount',
        header: () => <div className="text-right">JAN</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">
                {formatNumber(String(getValue()))}
            </span>
        ),
    },
    // FEBRUARY
    {
        accessorKey: 'feb_qty',
        header: () => <div className="text-right">FEB-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'feb_amount',
        header: () => <div className="text-right">FEB</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // MARCH
    {
        accessorKey: 'mar_qty',
        header: () => <div className="text-right">MAR-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'mar_amount',
        header: () => <div className="text-right">MAR</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // APRIL
    {
        accessorKey: 'apr_qty',
        header: () => <div className="text-right">APR-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'apr_amount',
        header: () => <div className="text-right">APR</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // MAY
    {
        accessorKey: 'may_qty',
        header: () => <div className="text-right">MAY-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'may_amount',
        header: () => <div className="text-right">MAY</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // JUNE
    {
        accessorKey: 'jun_qty',
        header: () => <div className="text-right">JUN-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'jun_amount',
        header: () => <div className="text-right">JUNE</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // JULY
    {
        accessorKey: 'jul_qty',
        header: () => <div className="text-right">JUL-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'jul_amount',
        header: () => <div className="text-right">JULY</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // AUGUST
    {
        accessorKey: 'aug_qty',
        header: () => <div className="text-right">AUG-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'aug_amount',
        header: () => <div className="text-right">AUG</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // SEPTEMBER
    {
        accessorKey: 'sep_qty',
        header: () => <div className="text-right">SEP-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'sep_amount',
        header: () => <div className="text-right">SEP</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // OCTOBER
    {
        accessorKey: 'oct_qty',
        header: () => <div className="text-right">OCT-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'oct_amount',
        header: () => <div className="text-right">OCT</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // NOVEMBER
    {
        accessorKey: 'nov_qty',
        header: () => <div className="text-right">NOV-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'nov_amount',
        header: () => <div className="text-right">NOV</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    // DECEMBER
    {
        accessorKey: 'dec_qty',
        header: () => <div className="text-right">DEC-QTY</div>,
        cell: EditableCell,
    },
    {
        accessorKey: 'dec_amount',
        header: () => <div className="text-right">DEC</div>,
        cell: ({ getValue }) => (
            <span className="block text-right">{formatNumber(getValue())}</span>
        ),
    },
    {
        id: 'actions',
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
    },
];
