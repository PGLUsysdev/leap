// import { type BreadcrumbItem } from '@/types';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import { index as aipIndex } from '@/routes/aip';
import { getPriceListColumns } from './columns/columns';

interface PpmpSummaryPageProps {
    priceLists: any[];
    fiscalYear: any;
}

export default function PpmpSummaryPage({
    priceLists,
    fiscalYear: fiscalYear,
}: PpmpSummaryPageProps) {
    // console.log(priceLists);

    const columns = useMemo(
        () => getPriceListColumns(priceLists),
        [priceLists],
    );

    return (
        <>
            <div
                // className="flex flex-col gap-4 p-4"
                className="pt-4"
            >
                <DataTable
                    columns={columns}
                    data={priceLists}
                    withSearch={true}
                    withFooter={true}
                    negativeHeight={7}
                />
            </div>
        </>
    );
}

PpmpSummaryPage.layout = {
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: aipIndex() },
        { title: `PPMP Summary`, href: '#' },
    ],
};
