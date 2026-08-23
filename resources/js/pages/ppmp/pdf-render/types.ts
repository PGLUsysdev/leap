// resources\js\pages\ppmp\pdf-render\types.ts

export interface ColumnDef<T> {
    id: string;
    header?: React.ReactNode;
    width: string;
    cell: (item: T) => React.ReactNode;
}

export type TableRowType = "banner" | "item" | "subtotal" | "grand-total" | "spacer";

export interface TableRow {
    id: string;
    type: TableRowType;
    label?: string;
    item?: any;
    totals?: Record<string, number>;
    isLastInPpaGroup?: boolean;
}
