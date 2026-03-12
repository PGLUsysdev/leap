import { ReactElement } from 'react';
import { columns, Ppa } from './columns';
import { PpaDataTable } from './data-table';

interface PpaTablePageProps {
    data: Ppa[];
    meta?: {
        onAdd: (parent: Ppa, childType: Ppa['type']) => void;
        onEdit: (ppa: Ppa) => void;
        onDelete: (ppa: Ppa) => void;
    };
    children: ReactElement;
}

export default function PpaTablePage({
    data,
    meta,
    children,
}: PpaTablePageProps) {
    return (
        <PpaDataTable
            columns={columns}
            data={data}
            meta={meta}
            children={children}
        />
    );
}
