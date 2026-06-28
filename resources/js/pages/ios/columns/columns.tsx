import { createColumnHelper } from '@tanstack/react-table';
import type { Ios } from '@/types/global';

const columnHelper = createColumnHelper<Ios>();

const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        size: 100,
        cell: (info) => info.getValue(),
    }),
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
];

export default columns;
