import type { ReactElement } from 'react';
import { columns } from './columns';
import DataTable from './data-table';
import type { Ppmp } from '@/types/global';

interface PpmpTablePageProps {
    data: Ppmp[];
    // onEdit: (record: Ppmp) => void;
    onDelete: (record: Ppmp) => void;
    children: ReactElement;
    // text: ReactElement;
}

export default function PpmpTablePage({
    data,
    // onEdit,
    onDelete,
    children,
    // text,
}: PpmpTablePageProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            // onEdit={onEdit}
            onDelete={onDelete}
            // text={text}
        >
            {children}
        </DataTable>
    );
}
