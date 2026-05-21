import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { OfficeType } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Office Types', href: '#' }];

interface OfficeTypePageProps {
    officeTypes: OfficeType[];
}

export default function SectorPage({ officeTypes }: OfficeTypePageProps) {
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
        if (!isOpen) setSelectedOfficeType(null);
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="py-4">
                <DataTable
                    columns={columns}
                    data={officeTypes}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Add Office Type</Button>
                    </div>
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
        </AppLayout>
    );
}
