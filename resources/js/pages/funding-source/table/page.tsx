import type { ReactElement } from 'react';
import { columns } from './columns';
import DataTable from './data-table';
import type { FundingSource } from '@/types/global';

interface FundingSourceTablePageProps {
    data: FundingSource[];
    onEdit: (record: FundingSource) => void;
    onDelete: (record: FundingSource) => void;
    children: ReactElement;
}

export default function FundingSourceTablePage({
    data,
    onEdit,
    onDelete,
    children,
}: FundingSourceTablePageProps) {
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
