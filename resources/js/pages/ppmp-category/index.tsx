import { router } from '@inertiajs/react';
import { useState } from 'react';
// import { DataTable } from '@/components/data-table';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import type { PpmpCategory } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog-base';

interface PpmpCategoryPageProps {
    ppmpCategories: PpmpCategory[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function PpmpCategoryPage({
    ppmpCategories,
    can,
}: PpmpCategoryPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<PpmpCategory | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] =
        useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedCategory(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);

        if (!isOpen) {
            setSelectedCategory(null);
        }
    }

    function handleEdit(category: PpmpCategory) {
        setSelectedCategory(category);
        setOpen(true);
    }

    function handleDeleteDialogOpen(category: PpmpCategory) {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/ppmp-categories/${selectedCategory?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedCategory(null);
            },
            onError: (errors) => {
                if (errors.force_delete) {
                    setIsDeleteDialogOpen(false);
                    setIsForceDeleteDialogOpen(true);
                }
            },
            onFinish: () => setIsLoading(false),
        });
    }

    function handleForceDelete() {
        router.delete(`/ppmp-categories/${selectedCategory?.id}?force=1`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsForceDeleteDialogOpen(false);
                setSelectedCategory(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                {/* additional content here */}

                <DataTable
                    columns={columns}
                    data={ppmpCategories}
                    meta={{
                        canEdit: can?.edit ?? false,
                        canDelete: can?.delete ?? false,
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                    }}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>
                                Add PPMP Category
                            </Button>
                        </div>
                    )}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedCategory}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete PPMP Category?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="text-foreground font-bold">
                            "{selectedCategory?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedCategory(null);
                }}
                isLoading={isLoading}
            />

            <DeleteDialog
                isOpen={isForceDeleteDialogOpen}
                onOpenChange={setIsForceDeleteDialogOpen}
                title="Delete PPMP Category?"
                description={
                    <>
                        This category has dependent PPMP price list items.
                        Continuing will delete all price list items associated
                        with this category. This action cannot be undone.
                    </>
                }
                confirmText="Continue"
                onConfirm={handleForceDelete}
                onCancel={() => {
                    setIsForceDeleteDialogOpen(false);
                    setSelectedCategory(null);
                }}
                isLoading={isLoading}
            />
        </>
    );
}

PpmpCategoryPage.layout = {
    breadcrumbs: [{ title: 'PPMP Category', href: '#' }],
};
