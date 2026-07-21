import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import type { Sector } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

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

        if (!isOpen) {
            setSelectedSector(null);
        }
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
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={sectors}
                    meta={{
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                        canEdit: can?.edit ?? false,
                        canDelete: can?.delete ?? false,
                    }}
                >
                    {can?.add && <Button onClick={handleAdd}>Add Sector</Button>}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={handleDialogOpenChange}
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
        </>
    );
}

SectorPage.layout = { breadcrumbs: [{ title: 'Sectors', href: '#' }] };
