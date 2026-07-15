import type { ColumnDef } from '@tanstack/react-table';
import NewTable from '@/components/base-ui-components/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';

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
    columns,
    data,
    open,
    onOpenChange,
    onRowSelect,
    value,
    valueKey,
}: TableSelectProps<TData>) {
    // Find the currently selected object to display its label on the trigger button
    // const selectedItem = data.find(
    //     (item) => String(item[rowIdKey]) === String(value),
    // );
    // const buttonLabel = selectedItem
    //     ? getDisplayValue(selectedItem)
    //     : placeholder;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>desc...</DialogDescription>
                </DialogHeader>

                <div className="w-full overflow-hidden">
                    <NewTable
                        data={data}
                        columns={columns}
                        variant="select"
                        onRowClick={(row) => {
                            onRowSelect(row);
                            onOpenChange(false);
                        }}
                        selectedValue={value}
                        selectedKey={valueKey}
                        // selectedValue={value}
                        // selectedKey={rowIdKey}
                        // meta={{
                        //     onRowClick: (row: TData) => {
                        //         onValueChange(String(row[rowIdKey]));
                        //         setIsOpen(false);
                        //     },
                        // }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
