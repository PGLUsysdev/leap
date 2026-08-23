import { createColumnHelper } from "@tanstack/react-table";
import type { Office } from "@/types";

const columnHelper = createColumnHelper<Office>();

const columns = [
    columnHelper.accessor("acronym", {
        size: 100,
        header: () => <div className="text-center text-wrap">Acronym</div>,
        cell: (info) => <div className="text-center text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("name", {
        size: 200,
        header: () => <div className="text-center text-wrap">Name</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

export default columns;
