import { router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
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

    const cols = columns(can?.edit ?? false, can?.delete ?? false);

    return (
        <>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={officeTypes}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Office Type</Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
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
