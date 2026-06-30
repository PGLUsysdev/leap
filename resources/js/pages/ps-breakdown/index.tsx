import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ChartOfAccount, Position, PsBreakdownItem } from '@/types/global';
import getPsBreakdownCols from './columns/ps-breakdown-cols';
import PreviewPdfDialog from './pdf-preview-dialog';

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
    can?: {
        export?: boolean;
    };
}

export default function PsBreakdown({
    chartOfAccounts,
    breakdownItems,
    positions,
    ppaFundingSourceId,
    rates,
    fiscalYear,
    annualRateMap,
    can,
}: PsBreakdownProps) {
    const [openPdfPreview, setOpenPdfPreview] = useState(false);

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

    // Build sections for the PDF preview — PS is computed from raw data;
    // MOOE/FE/CO have no data in this context.
    const pdfSections = useMemo(
        () => ({
            ps: { total: '0.00', coas: [] },
            mooe: { total: '0.00', coas: [] },
            fe: { total: '0.00', coas: [] },
            co: { total: '0.00', coas: [] },
        }),
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    data={positions}
                    columns={psBreakdownCols}
                    withFooter={true}
                    withSearch={true}
                    negativeHeight={7}
                >
                    <div>
                        {can?.export && (
                            <Button
                                variant="secondary"
                                onClick={() => setOpenPdfPreview(true)}
                            >
                                Preview LBP Form No. 2
                            </Button>
                        )}
                    </div>
                </DataTable>
            </div>

            <PreviewPdfDialog
                open={openPdfPreview}
                onOpenChange={setOpenPdfPreview}
                sections={pdfSections}
                psComputationData={{
                    positions,
                    chartOfAccounts,
                    rates,
                    annualRateMap,
                }}
            />
        </AppLayout>
    );
}
