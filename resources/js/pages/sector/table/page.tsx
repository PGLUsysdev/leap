import { columns } from './columns';
import DataTable from './data-table';
import type { ReactElement } from 'react';
import type { Sector } from '@/types/global';

interface TablePageProps {
    data: Sector[];
    onEdit: (record: Sector) => void;
    onDelete: (record: Sector) => void;
    children: ReactElement;
}

export default function TablePage({
    data,
    onEdit,
    onDelete,
    children,
}: TablePageProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            onEdit={onEdit}
            onDelete={onDelete}
        >
            {children}
        </DataTable>
    );
}
