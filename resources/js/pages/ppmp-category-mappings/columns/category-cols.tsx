import { createColumnHelper } from "@tanstack/react-table";
import type { PpmpCategory } from "@/types";

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor("name", {
        header: () => <div className="px-1">Category Name</div>,
        size: 260,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("is_non_procurement", {
        header: () => <div className="px-1">Procurement Type</div>,
        size: 160,
        cell: (info) => (
            <div className="px-1 text-wrap">{info.getValue() ? "Non-Procurement" : "Procurement"}</div>
        ),
    }),
];

export default columns;
