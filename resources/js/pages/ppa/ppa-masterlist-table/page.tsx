import type { ReactElement } from 'react';
import { columns } from './columns';
import { PpaDataTable } from './data-table';
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
        <PpaDataTable
            columns={columns}
            data={data}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
        >
            {children}
        </PpaDataTable>
    );
}
