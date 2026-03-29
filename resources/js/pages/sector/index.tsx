import { useState } from 'react';
import TablePage from './table/page';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { Sector } from '@/types/global';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sectors', href: '#' }];

interface SectorPageProps {
    sectors: Sector[];
}

export default function SectorPage({ sectors }: SectorPageProps) {
    console.log(sectors);

    const [open, setOpen] = useState(false);
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedSector(null);
        setOpen(true);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <TablePage
                    data={sectors}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Add Sector</Button>
                    </div>
                </TablePage>
            </div>

            <FormDialog
                open={open}
                setOpen={setOpen}
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
