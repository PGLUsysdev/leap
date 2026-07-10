import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        onUpdate?: (data: TData) => void;
        onEdit?: (data: TData) => void;
        onDelete?: (data: TData) => void;

        onAdd?: (
            data: TData,
            type?: 'Program' | 'Project' | 'Activity' | 'Sub-Activity',
        ) => void;
        onUpdateStatus?: (
            data: TData,
            status: 'draft' | 'open' | 'locked' | 'archived',
        ) => void;
        onOpen?: (data: TData) => void;
        onGeneratePdf?: (data: TData) => void;
        onOpenPpmpSummary?: (data: TData) => void;
        onReorder?: (activeId: string, overId: string) => void;
        onShowChildren?: (data: TData) => void;
        onMove?: (data: TData) => void;
        onSelect?: (data: TData, boolean: boolean) => void;
        onEditPerms?: () => void;
        meta?: {
            priceLists?: PriceList[];
            chartOfAccounts?: ChartOfAccount[];
            fundingSources?: FundingSource[];
        };
        selectedItemToMove: TData;
    }
}
