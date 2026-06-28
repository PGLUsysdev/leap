import { createColumnHelper } from '@tanstack/react-table';
import type { Ios } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

const columnHelper = createColumnHelper<Ios>();

interface ColumnsOptions {
    onEdit: (data: Ios) => void;
    onDelete: (data: Ios) => void;
}

const columns = ({ onEdit, onDelete }: ColumnsOptions) => [
    columnHelper.accessor('occupational_service_code', {
        header: 'Occupational Service Code',
        size: 200,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('occupational_group_code', {
        header: 'Occupational Group Code',
        size: 200,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('class_id', {
        header: 'Class ID',
        size: 150,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('class', {
        header: 'Class',
        size: 300,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('salary_grade', {
        header: 'Salary Grade',
        size: 100,
        cell: (info) => info.getValue(),
    }),
    columnHelper.display({
        id: 'action',
        size: 83,
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(row.original)}
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(row.original)}
                >
                    <Trash2 />
                </Button>
            </div>
        ),
    }),
];

export default columns;
