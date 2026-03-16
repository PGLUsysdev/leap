import type { ReactElement } from 'react';
import { columns } from './columns';
import DataTable from './data-table';
import type { PriceList } from '@/pages/types/types';

interface PriceListTablePageProps {
    data: PriceList[];
    onEdit: (record: PriceList) => void;
    onDelete: (record: PriceList) => void;
    children: ReactElement;
}

export default function PriceListTablePage({
    data,
    onEdit,
    onDelete,
    children,
}: PriceListTablePageProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            onEdit={onEdit}
            onDelete={onDelete}
            children={children}
        />
    );
}
