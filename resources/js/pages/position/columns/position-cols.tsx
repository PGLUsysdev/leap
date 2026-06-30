import { createColumnHelper } from '@tanstack/react-table';
import type { Position } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

const columnHelper = createColumnHelper<Position>();

interface ColumnsOptions {
    onEdit?: (data: Position) => void;
    onDelete?: (data: Position) => void;
}

const columns = ({ onEdit, onDelete }: ColumnsOptions) => [
    columnHelper.accessor('item_number', {
        header: 'Item No.',
        size: 100,
    }),
    columnHelper.accessor('office_id', {
        header: 'Office',
        size: 100,
        cell: (info) => {
            const row = info.row.original;
            const office = row.office;
            return office?.acronym ?? office?.name ?? info.getValue();
        },
    }),
    columnHelper.accessor('ios_id', {
        header: 'Class',
        size: 200,
        cell: (info) => {
            const row = info.row.original;
            return row.ios?.class ?? info.getValue();
        },
    }),
    columnHelper.accessor('ios_id', {
        id: 'salary_grade',
        header: 'Salary Grade',
        size: 100,
        cell: (info) => {
            const row = info.row.original;
            return row.ios?.salary_grade ?? info.getValue();
        },
    }),
    columnHelper.accessor('employment_type', {
        header: 'Employment Type',
        size: 150,
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    columnHelper.accessor('is_funded', {
        header: 'Funded',
        size: 100,
        cell: (info) => <span>{info.getValue() ? 'Yes' : 'No'}</span>,
    }),
    // columnHelper.accessor('user', {
    //     header: 'Assigned User',
    //     size: 200,
    //     cell: (info) => {
    //         const user = info.getValue();
    //         return user ? user.name : '-';
    //     },
    // }),
    columnHelper.accessor('status', {
        header: 'Status',
        size: 100,
        cell: (info) => {
            const status = info.getValue();
            return <span className="capitalize">{status}</span>;
        },
    }),
    ...(onEdit || onDelete
        ? [
              columnHelper.display({
                  id: 'action',
                  size: 84,
                  cell: ({ row }) => (
                      <div className="flex items-center gap-1">
                          {onEdit && (
                              <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => onEdit(row.original)}
                              >
                                  <Pencil />
                              </Button>
                          )}
                          {onDelete && (
                              <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => onDelete(row.original)}
                              >
                                  <Trash2 />
                              </Button>
                          )}
                      </div>
                  ),
              }),
          ]
        : []),
];

export default columns;
