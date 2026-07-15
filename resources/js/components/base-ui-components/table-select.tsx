import type { ColumnDef } from '@tanstack/react-table';
import NewTable from '@/components/base-ui-components/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';

interface TableSelectProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRowSelect: (row: TData) => void;
    value?: string;
    valueKey?: keyof TData;
}

export function TableSelect<TData>({
    data,
    columns,
    open,
    onOpenChange,
    onRowSelect,
    value,
    valueKey,
}: TableSelectProps<TData>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-96">
                <DialogHeader className="flex-none">
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>desc...</DialogDescription>
                </DialogHeader>

                {/*<div className="h-[calc(100vh-3rem)] w-full">*/}
                <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                    <NewTable
                        // className="min-h-0 flex-1"
                        className="h-1000"
                        data={data}
                        columns={columns}
                        variant="select"
                        onRowClick={(row) => {
                            onRowSelect(row);
                            onOpenChange(false);
                        }}
                        selectedValue={value}
                        selectedKey={valueKey}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
