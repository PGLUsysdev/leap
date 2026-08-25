import { createColumnHelper } from "@tanstack/react-table";
import type { CcTypology } from "@/types";

const columnHelper = createColumnHelper<CcTypology>();

const columns = [
    columnHelper.accessor("code", {
        size: 100,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => <div className="text-center text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
        size: 200,
        header: () => <div className="text-center text-wrap">Description</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

export default columns;
