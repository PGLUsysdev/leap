import type { Auth } from "@/types/auth";
import type { FiscalYear } from ".";

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module "@inertiajs/core" {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

declare module "@tanstack/react-table" {
    // Generic params must match TanStack's ColumnMeta exactly for merging,
    // even though they are not referenced here.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        /** Opt-in: merge this column's cells vertically across grouped rows. */
        rowSpan?: boolean;
        /**
         * Row field used to group rows for spanning when `rowSpan` is set.
         * Defaults to `'id'`.
         */
        spanKey?: string;
    }

    interface TableMeta<TData extends RowData> {
        onEdit?: ((id: number) => void) | ((data: TData) => void);
        onDelete?: ((id: number) => void) | ((data: TData) => void);
        onDeletePpmpItem?: (item: Ppmp) => void;
        onOpenPpmp?: (id: number) => void;
        disabled?: boolean;
        year?: FiscalYear;

        onUpdate?: (data: TData) => void;
        onAdd?: (data: TData, type?: string) => void;
        onUpdateStatus?: (data: TData, status: "draft" | "open" | "locked" | "archived") => void;
        onOpen?: (data: TData) => void;
        onGeneratePdf?: (data: TData) => void;
        onOpenPpmpSummary?: (data: TData) => void;
        onReorder?: (activeId: string, overId: string) => void;
        onShowChildren?: (data: TData) => void;
        onMove?: (data: TData) => void;
        onSelect?: (data: TData, boolean: boolean) => void;
        onEditPerms?: (data: TData) => void;
        onToggle?: (data: TData) => void;
        onToggleAll?: (data: TData[], isChecked: boolean) => void;
        selectedIds?: Set<number>;
        existingIds?: Set<number>;
        ppaTypes?: string[];
        ppaToMove?: any;
        can?: {
            add?: boolean;
            edit?: boolean;
            delete?: boolean;
        };
        meta?: {
            priceLists?: PriceList[];
            chartOfAccounts?: ChartOfAccount[];
            fundingSources?: FundingSource[];
        };
        selectedItemToMove?: TData;

        canEdit?: boolean;
        canDelete?: boolean;
        canEditPerms?: boolean;
        canUpdateStatus?: boolean;
        canOpenAip?: boolean;
        canGenerateApp?: boolean;
        canOpenPpmpSummary?: boolean;
        canSetPsPool?: boolean;
        readOnly?: boolean;
        onSavingChange?: (saving: boolean) => void;
        disableOpenAip?: boolean;
        psPoolPpaId?: number | null;
        onSetAsPsPool?: (data: TData) => void;

        // AIP outputs management
        onEditOutput?: (data: TData) => void;
        onDeleteOutput?: (data: TData) => void;
        onEditFundingSources?: (data: TData) => void;
    }
}
