import { columns } from './columns';
import DataTable from './data-table';
import type { ReactElement } from 'react';
import type { OfficeType } from '@/types/global';

interface TablePageProps {
    data: OfficeType[];
    onEdit: (record: OfficeType) => void;
    onDelete: (record: OfficeType) => void;
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
