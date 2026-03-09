import { columns } from './columns';
import { DataTable } from './data-table';
import { FundingSource } from '@/pages/types/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface FundingSourceTablePageProps {
    data: FundingSource[];
    onEdit: (record: FundingSource) => void;
    onDelete: (record: FundingSource) => void;
}

export default function FundingSourceTablePage({
    data,
    onEdit,
    onDelete,
}: FundingSourceTablePageProps) {
    return (
        <ScrollArea className="h-[calc(100vh-9rem)] rounded-md border">
            <DataTable
                columns={columns}
                data={data}
                onEdit={onEdit}
                onDelete={onDelete}
            />
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
