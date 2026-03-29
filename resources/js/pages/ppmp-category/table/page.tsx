import type { ReactElement } from 'react';
import { columns } from './columns';
import DataTable from './data-table';
import type { PpmpCategory } from '@/types/global';

interface PpmpCategoryTablePageProps {
    data: PpmpCategory[];
    onEdit: (record: PpmpCategory) => void;
    onDelete: (record: PpmpCategory) => void;
    children: ReactElement;
}

export default function PpmpCategoryTablePage({
    data,
    onEdit,
    onDelete,
    children,
}: PpmpCategoryTablePageProps) {
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
