import { useState } from "react";

interface UseTableSelectArgs<TData> {
    data: TData[];
    value?: string;
    valueKey?: keyof TData;
}

export function useTableSelect<TData>({
    data,
    value,
    valueKey = "id" as keyof TData,
}: UseTableSelectArgs<TData>) {
    const [open, setOpen] = useState(false);

    const selectedItem = value ? data.find((item) => String(item[valueKey]) === value) : undefined;

    return {
        open,
        setOpen,
        selectedItem,
        openDialog: () => setOpen(true),
        closeDialog: () => setOpen(false),
    };
}
