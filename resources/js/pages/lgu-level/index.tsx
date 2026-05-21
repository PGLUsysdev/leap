import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { LguLevel } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'LGU Levels', href: '#' }];

interface LguLevelPageProps {
    lguLevels: LguLevel[];
}

export default function LguLevelPage({ lguLevels }: LguLevelPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedLguLevel, setSelectedLguLevel] = useState<LguLevel | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedLguLevel);

    function handleAdd() {
        setSelectedLguLevel(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) setSelectedLguLevel(null);
    }

    function handleEdit(data: LguLevel) {
        setSelectedLguLevel(data);
        setOpen(true);
    }

    function handleDeleteDialogOpen(data: LguLevel) {
        setSelectedLguLevel(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/lgu-levels/${selectedLguLevel?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedLguLevel(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="py-4">
                <DataTable
                    columns={columns}
                    data={lguLevels}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Add LGU Level</Button>
                    </div>
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
                initialData={selectedLguLevel}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete LGU Level?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedLguLevel?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedLguLevel(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
