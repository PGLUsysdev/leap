import { router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/fe-breakdown';
import type { ChartOfAccount } from '@/types';

export const formatAmount = (value: string | number | undefined): string => {
    const num =
        typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

    if (num === undefined || Number.isNaN(num)) {
        return '';
    }

    return num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const parseAmount = (value: string | number | undefined): number => {
    const num = parseFloat(String(value ?? '').replace(/,/g, ''));

    return Number.isNaN(num) ? 0 : num;
};

interface FeBreakdownColumnOptions {
    amounts: Record<string, string>;
    total: string;
    fiscalYearId: number;
    aipEntryId: number;
    ppaFundingSourceId: number | null;
    canEdit: boolean;
    onSavingChange: (saving: boolean) => void;
}

const columnHelper = createColumnHelper<ChartOfAccount>();

/**
 * Amount input for a single FE account. Draft text lives in the cell; it is
 * committed 300ms after the last keystroke and on blur, the same way the PPMP
 * quantity grid commits, with the saved total applied optimistically.
 */
function FeAmountCell({
    chartOfAccountId,
    serverAmount,
    fiscalYearId,
    aipEntryId,
    ppaFundingSourceId,
    canEdit,
    onSavingChange,
}: {
    chartOfAccountId: number;
    serverAmount: string | undefined;
} & Omit<FeBreakdownColumnOptions, 'amounts' | 'total'>) {
    const [localValue, setLocalValue] = useState<string>(() =>
        serverAmount == null || parseAmount(serverAmount) === 0
            ? ''
            : formatAmount(serverAmount),
    );

    const localValueRef = useRef<string>(localValue);
    useEffect(() => {
        localValueRef.current = localValue;
    }, [localValue]);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const commitChanges = useCallback(
        (amount: number) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (amount === parseAmount(serverAmount)) {
                setLocalValue(amount === 0 ? '' : formatAmount(amount));

                return;
            }

            router
                .optimistic((props: { amounts: Record<string, string> }) => ({
                    amounts: {
                        ...props.amounts,
                        [chartOfAccountId]: amount.toFixed(2),
                    },
                }))
                .put(
                    update({
                        fiscalYear: fiscalYearId,
                        aipEntry: aipEntryId,
                        chartOfAccount: chartOfAccountId,
                    }).url,
                    {
                        ppa_funding_source_id: ppaFundingSourceId,
                        amount,
                    },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onStart: () => onSavingChange(true),
                        onFinish: () => onSavingChange(false),
                        onError: () => {
                            setLocalValue(
                                parseAmount(serverAmount) === 0
                                    ? ''
                                    : formatAmount(serverAmount),
                            );
                        },
                    },
                );

            setLocalValue(amount === 0 ? '' : formatAmount(amount));
        },
        [
            chartOfAccountId,
            serverAmount,
            fiscalYearId,
            aipEntryId,
            ppaFundingSourceId,
            onSavingChange,
        ],
    );

    const scheduleDebouncedCommit = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            commitChanges(parseAmount(localValueRef.current));
        }, 300);
    }, [commitChanges]);

    return (
        <Input
            type="text"
            inputMode="decimal"
            className="text-right tabular-nums"
            value={localValue}
            onChange={(e) => {
                setLocalValue(e.target.value.replace(/[^0-9.,\- ]/g, ''));
                scheduleDebouncedCommit();
            }}
            onBlur={() => commitChanges(parseAmount(localValue))}
            onDragStart={(e) => e.preventDefault()}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            disabled={!canEdit || ppaFundingSourceId === null}
            title={
                canEdit
                    ? undefined
                    : 'You do not have permission to edit funding sources'
            }
            autoComplete="off"
            placeholder="0.00"
        />
    );
}

export default function getFeBreakdownCols(options: FeBreakdownColumnOptions) {
    const { amounts, total, ...cellProps } = options;

    return [
        columnHelper.accessor('path', {
            size: 140,
            header: () => (
                <div className="text-center text-wrap">Account Code</div>
            ),
            cell: (info) => (
                <div className="text-center font-mono text-wrap">
                    {info.getValue()}
                </div>
            ),
        }),
        columnHelper.accessor('account_title', {
            size: 300,
            header: () => <div className="text-center text-wrap">Account</div>,
            cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.display({
            id: 'amount',
            size: 200,
            header: () => <div className="text-center text-wrap">Amount</div>,
            cell: ({ row }) => (
                <FeAmountCell
                    chartOfAccountId={row.original.id}
                    serverAmount={amounts[row.original.id]}
                    {...cellProps}
                />
            ),
            footer: () => (
                <div className="px-1 text-right font-semibold">{total}</div>
            ),
        }),
    ];
}
