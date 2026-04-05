import type { ReactElement } from 'react';
import { columns } from './columns';
// import { PpaDataTable } from './data-table';
import { DataTable } from '@/components/data-table';
import type { Ppa } from '@/types/global';

interface PpaTablePageProps {
    data: Ppa[];
    onAdd: (parent: Ppa, childType: Ppa['type']) => void;
    onEdit: (ppa: Ppa) => void;
    onDelete: (ppa: Ppa) => void;
    children: ReactElement;
}

export default function PpaTablePage({
    data,
    onAdd,
    onEdit,
    onDelete,
    children,
}: PpaTablePageProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            getSubRows={(row) => row.children}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            withSearch={true}
        >
            {children}
        </DataTable>
    );
}
