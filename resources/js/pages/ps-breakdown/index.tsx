import { useMemo } from 'react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { index as aipIndex, summary } from '@/routes/aip';
import type { ChartOfAccount, Position } from '@/types';
import getPsBreakdownCols from './columns/ps-breakdown-cols';

/**
 * Positions, salary rates and the annual rate map come from the server's
 * mock personnel dataset while the personnel API lands; the `ios`, `positions`
 * and `salary_standards` tables are deprecated and are no longer queried.
 */
interface PsBreakdownProps {
    chartOfAccounts: ChartOfAccount[];
    ppaFundingSourceId: number | null;
    fiscalYear: { id: number; year: string };
    officeId: number | null;
    positions: Position[];
    rates: Record<string, number>;
    annualRateMap: Record<number, { current: number; budget: number }>;
    monthsOfService?: Record<number, number>;
}

export default function PsBreakdown({
    chartOfAccounts,
    positions,
    rates,
    annualRateMap,
    monthsOfService,
}: PsBreakdownProps) {
    const psBreakdownCols = useMemo(
        () =>
            getPsBreakdownCols(
                chartOfAccounts,
                rates,
                annualRateMap,
                monthsOfService,
            ),
        [chartOfAccounts, rates, annualRateMap, monthsOfService],
    );

    return (
        <ScrollArea className="h-[calc(100vh-3rem)] w-full">
            <DataTable
                data={positions}
                columns={psBreakdownCols}
                showFooter={true}
            >
                <div>
                    <Badge variant="outline">Mock data — temporary</Badge>
                </div>
            </DataTable>

            <ScrollBar orientation="vertical" />
        </ScrollArea>
    );
}

PsBreakdown.layout = ({ fiscalYear }: PsBreakdownProps) => ({
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: aipIndex() },
        {
            title: `AIP Summary FY ${fiscalYear.year}`,
            href: summary({ fiscalYear: fiscalYear.id }),
        },
        { title: 'Personnel Services Breakdown', href: '#' },
    ],
});
