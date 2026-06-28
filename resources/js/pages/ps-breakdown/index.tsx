import { useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ChartOfAccount, Position, PsBreakdownItem } from '@/types/global';
import coaCols from './columns/coa-cols';
import getPsBreakdownCols from './columns/ps-breakdown-cols';

interface PsBreakdownProps {
    chartOfAccounts: ChartOfAccount[];
    breakdownItems: PsBreakdownItem[];
    autoValues: Record<string, number>;
    rates: Record<string, number>;
    ppaFundingSourceId: number | null;
    fiscalYear: { id: number; year: string };
    positions: Position[];
    annualRateMap: Record<number, { current: number; budget: number }>;
    officeId: number | null;
    offices: never[];
    fiscalYears: never[];
}

export default function PsBreakdown({
    chartOfAccounts,
    breakdownItems,
    positions,
    ppaFundingSourceId,
    rates,
    fiscalYear,
    annualRateMap,
}: PsBreakdownProps) {
    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Annual Investment Programs', href: '/aip' },
            {
                title: `AIP Summary FY ${fiscalYear.year}`,
                href: `/aip/${fiscalYear.id}/summary`,
            },
            { title: 'Personnel Services Breakdown', href: '#' },
        ],
        [fiscalYear],
    );

    const psBreakdownCols = useMemo(
        () =>
            getPsBreakdownCols(
                chartOfAccounts,
                breakdownItems,
                ppaFundingSourceId,
                rates,
                annualRateMap,
            ),
        [
            chartOfAccounts,
            breakdownItems,
            ppaFundingSourceId,
            rates,
            annualRateMap,
        ],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-4 border-r pt-4">
                    <DataTable
                        columns={coaCols}
                        data={chartOfAccounts}
                        withSearch={true}
                        withFooter={true}
                        negativeHeight={7}
                    />
                </div>
                <div className="col-span-2 space-y-4 pt-4">
                    <DataTable
                        data={positions}
                        columns={psBreakdownCols}
                        withFooter={true}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
