import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { index as aipIndex, summary } from '@/routes/aip';
import type { ChartOfAccount } from '@/types';
import getFeBreakdownCols, { formatAmount } from './columns/fe-breakdown-cols';

interface FeBreakdownProps {
    aipEntryId: number;
    amounts: Record<string, string>;
    chartOfAccounts: ChartOfAccount[];
    fiscalYear: { id: number; year: number };
    fundingSource: {
        id: number;
        code: string | null;
        title: string | null;
    } | null;
    can: { edit: boolean };
}

const parseAmount = (value: string | number | undefined): number => {
    const num = parseFloat(String(value ?? '').replace(/,/g, ''));

    return Number.isNaN(num) ? 0 : num;
};

export default function FeBreakdown({
    aipEntryId,
    amounts,
    chartOfAccounts,
    fiscalYear,
    fundingSource,
    can,
}: FeBreakdownProps) {
    // Counter so editing multiple cells at once keeps the indicator on
    const [savingCount, setSavingCount] = useState(0);
    const isSaving = savingCount > 0;

    const total = useMemo(
        () =>
            chartOfAccounts.reduce(
                (sum, coa) => sum + parseAmount(amounts?.[coa.id]),
                0,
            ),
        [chartOfAccounts, amounts],
    );

    const columns = useMemo(
        () =>
            getFeBreakdownCols({
                amounts: amounts ?? {},
                total: formatAmount(total),
                fiscalYearId: fiscalYear.id,
                aipEntryId,
                ppaFundingSourceId: fundingSource?.id ?? null,
                canEdit: can.edit,
                onSavingChange: (saving) =>
                    setSavingCount((count) =>
                        Math.max(0, count + (saving ? 1 : -1)),
                    ),
            }),
        [
            amounts,
            total,
            fiscalYear.id,
            aipEntryId,
            fundingSource?.id,
            can.edit,
        ],
    );

    return (
        <ScrollArea className="h-[calc(100vh-3rem)] w-full">
            <DataTable
                data={chartOfAccounts}
                columns={columns}
                showFooter={true}
            >
                {chartOfAccounts.length === 0 ? (
                    <div className="text-muted-foreground text-sm">
                        No accounts are classified as Financial Expenses yet.
                        Link them on the Expense Class Codes screen.
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {isSaving ? (
                            <Badge variant="secondary">
                                <Spinner />
                                Saving…
                            </Badge>
                        ) : (
                            <Badge variant="ghost">
                                <Check />
                                Saved
                            </Badge>
                        )}
                    </div>
                )}
            </DataTable>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

FeBreakdown.layout = ({ fiscalYear }: FeBreakdownProps) => ({
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: aipIndex() },
        {
            title: `AIP Summary FY ${fiscalYear.year}`,
            href: summary({ fiscalYear: fiscalYear.id }),
        },
        { title: 'Financial Expenses Breakdown', href: '#' },
    ],
});
