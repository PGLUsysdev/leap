import { ReactElement } from 'react';
import { columns } from '@/pages/price-list/table/columns';
import DataTable from '@/pages/price-list/table/data-table';
import { PriceList } from '@/pages/types/types';

interface PriceListTablePageProps {
    data: PriceList[];
    children: ReactElement;
}

export default function PriceListTablePage({
    data,
    children,
}: PriceListTablePageProps) {
    return <DataTable columns={columns} data={data} children={children} />;
}
