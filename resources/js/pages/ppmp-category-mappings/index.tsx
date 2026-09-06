import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import type {
    ChartOfAccount,
    ChartOfAccountPpmpCategory,
    PpmpCategory,
} from '@/types';
import columns from './columns/mapping-cols';
import FormDialog from './form-dialog';

interface MappingPageProps {
    mappings: ChartOfAccountPpmpCategory[];
    categories: PpmpCategory[];
    chartOfAccounts: ChartOfAccount[];
    can?: {
        add: boolean;
        delete: boolean;
    };
}

export default function MappingPage({
    mappings,
    categories,
    chartOfAccounts,
    can,
}: MappingPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedMapping, setSelectedMapping] =
        useState<ChartOfAccountPpmpCategory | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] =
        useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setOpen(true);
    }

    function handleDeleteDialogOpen(mapping: ChartOfAccountPpmpCategory) {
        setSelectedMapping(mapping);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        if (!selectedMapping) return;
        router.delete(`/ppmp-category-mappings/${selectedMapping.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedMapping(null);
            },
            onError: (errors) => {
                if ((errors as Record<string, string>).force_delete) {
                    setIsDeleteDialogOpen(false);
                    setIsForceDeleteDialogOpen(true);
                }
            },
            onFinish: () => setIsLoading(false),
        });
    }

    function handleForceDelete() {
        if (!selectedMapping) return;
        router.delete(`/ppmp-category-mappings/${selectedMapping.id}?force=1`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsForceDeleteDialogOpen(false);
                setSelectedMapping(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={mappings}
                    meta={{
                        canDelete: can?.delete ?? false,
                        onDelete: handleDeleteDialogOpen,
                    }}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Mapping</Button>
                        </div>
                    )}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={setOpen}
                categories={categories}
                chartOfAccounts={chartOfAccounts}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove Mapping?"
                description={
                    <>
                        Are you sure you want to remove the link between{' '}
                        <span className="text-foreground font-bold">
                            "{selectedMapping?.ppmp_category?.name}"
                        </span>{' '}
                        and{' '}
                        <span className="text-foreground font-bold">
                            "{selectedMapping?.chart_of_account?.account_title}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedMapping(null);
                }}
                isLoading={isLoading}
            />

            <DeleteDialog
                isOpen={isForceDeleteDialogOpen}
                onOpenChange={setIsForceDeleteDialogOpen}
                title="Dependent Price Lists Will Be Deleted"
                description={
                    <>
                        This mapping is used by{' '}
                        <span className="text-foreground font-bold">
                            {(
                                selectedMapping as unknown as {
                                    ppmp_price_lists_count?: number;
                                }
                            )?.ppmp_price_lists_count ?? 'one or more'}
                        </span>{' '}
                        PPMP price list item(s). Continuing will{' '}
                        <span className="text-destructive font-bold">
                            permanently delete
                        </span>{' '}
                        all associated price list items. This action cannot be
                        undone.
                    </>
                }
                confirmText="Continue & Delete Price Lists"
                onConfirm={handleForceDelete}
                onCancel={() => {
                    setIsForceDeleteDialogOpen(false);
                    setSelectedMapping(null);
                }}
                isLoading={isLoading}
            />
        </>
    );
}

MappingPage.layout = {
    breadcrumbs: [
        { title: 'PPMP Category Mappings', href: '#' },
        { title: 'Mappings', href: '/ppmp-category-mappings' },
    ],
};
