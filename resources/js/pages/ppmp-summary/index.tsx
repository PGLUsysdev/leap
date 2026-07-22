// import { type BreadcrumbItem } from '@/types';
import { useMemo } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
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
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={priceLists}
                    // withSearch={true}
                    showFooter={true}
                    // negativeHeight={7}
                />

                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </>
    );
}

PpmpSummaryPage.layout = {
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: aipIndex() },
        { title: `PPMP Summary`, href: '#' },
    ],
};
