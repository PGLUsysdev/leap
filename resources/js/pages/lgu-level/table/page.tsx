import { columns } from './columns';
import DataTable from './data-table';
import type { ReactElement } from 'react';
import type { LguLevel } from '@/types/global';

interface TablePageProps {
    data: LguLevel[];
    onEdit: (record: LguLevel) => void;
    onDelete: (record: LguLevel) => void;
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
