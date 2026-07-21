import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import type { OfficeType } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

interface OfficeTypePageProps {
    officeTypes: OfficeType[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function OfficeTypePage({
    officeTypes,
    can,
}: OfficeTypePageProps) {
    const [open, setOpen] = useState(false);
    const [selectedOfficeType, setSelectedOfficeType] =
        useState<OfficeType | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedOfficeType(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);

        if (!isOpen) {
            setSelectedOfficeType(null);
        }
    }

    function handleEdit(data: OfficeType) {
        setSelectedOfficeType(data);
        setOpen(true);
    }

    function handleDeleteDialogOpen(data: OfficeType) {
        setSelectedOfficeType(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/office-types/${selectedOfficeType?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedOfficeType(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={officeTypes}
                    meta={{
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                        canEdit: can?.edit ?? false,
                        canDelete: can?.delete ?? false,
                    }}
                >
                    {can?.add && (
                        <Button onClick={handleAdd}>Add Office Type</Button>
                    )}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedOfficeType}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Office Type?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedOfficeType?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedOfficeType(null);
                }}
                isLoading={isLoading}
            />
        </>
    );
}

OfficeTypePage.layout = { breadcrumbs: [{ title: 'Office Types', href: '#' }] };
