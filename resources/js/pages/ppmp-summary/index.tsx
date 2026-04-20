import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DataTable } from '@/components/data-table';
import { getPriceListColumns } from './table/columns';
import { useMemo } from 'react';
import { index } from '@/routes/aip';

interface PpmpSummaryPageProps {
    priceLists: any[];
    fiscalYear: any;
}

export default function PpmpSummaryPage({
    priceLists,
    fiscalYear: _fiscalYear,
}: PpmpSummaryPageProps) {
    // console.log(priceLists);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: index().url },
        { title: `PPMP Summary for ${_fiscalYear?.year}`, href: '#' },
    ];

    const columns = useMemo(
        () => getPriceListColumns(priceLists),
        [priceLists],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={priceLists}
                    withSearch={true}
                    withFooter={true}
                />
            </div>
        </AppLayout>
    );
}
