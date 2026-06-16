import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { Sector } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sectors', href: '#' }];

interface SectorPageProps {
    sectors: Sector[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function SectorPage({ sectors, can }: SectorPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedSector(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) setSelectedSector(null);
    }

    function handleEdit(data: Sector) {
        setSelectedSector(data);
        setOpen(true);
    }

    function handleDeleteDialogOpen(data: Sector) {
        setSelectedSector(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/sectors/${selectedSector?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedSector(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    const cols = columns(can?.edit ?? false, can?.delete ?? false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={sectors}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Sector</Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
                initialData={selectedSector}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Sector?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedSector?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedSector(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
