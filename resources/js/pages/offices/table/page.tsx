import { ReactElement } from 'react';
import { columns } from './columns';
import DataTable from './data-table';
import { Office } from '@/pages/types/types';

interface OfficeTablePageProps {
    data: Office[];
    onEdit: (record: Office) => void;
    onDelete: (record: Office) => void;
    children: ReactElement;
}

export default function OfficeTablePage({
    data,
    onEdit,
    onDelete,
    children,
}: OfficeTablePageProps) {
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
