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
import { cn } from '@/lib/utils';

interface TableSelectProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRowSelect: (row: TData) => void;
    value?: string;
    valueKey?: keyof TData;
    className?: string;
    title?: string;
    description?: string;
}

export function TableSelect<TData>({
    data,
    columns,
    open,
    onOpenChange,
    onRowSelect,
    value,
    valueKey,
    className,
    title,
    description,
}: TableSelectProps<TData>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'flex max-h-[calc(100dvh-2rem)] flex-col p-0 sm:max-w-96',
                    className,
                )}
            >
                <DialogHeader className="flex-none px-4 pt-4">
                    <DialogTitle>{title ?? 'Title'}</DialogTitle>
                    <DialogDescription>
                        {description ?? 'desc...'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-b-xl">
                    <NewTable
                        // className="min-h-0 flex-1"
                        className="h-150"
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
