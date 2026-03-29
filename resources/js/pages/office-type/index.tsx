import { useState } from 'react';
import TablePage from './table/page';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { OfficeType } from '@/types/global';

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
            <div className="flex flex-col gap-4 p-4">
                <TablePage
                    data={officeTypes}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Add Office Type</Button>
                    </div>
                </TablePage>
            </div>

            <FormDialog
                open={open}
                setOpen={setOpen}
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
