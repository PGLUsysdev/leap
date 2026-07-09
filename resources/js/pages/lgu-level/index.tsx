import { router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import type { LguLevel } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

interface LguLevelPageProps {
    lguLevels: LguLevel[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function LguLevelPage({ lguLevels, can }: LguLevelPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedLguLevel, setSelectedLguLevel] = useState<LguLevel | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedLguLevel(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);

        if (!isOpen) {
            setSelectedLguLevel(null);
        }
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

    const cols = columns(can?.edit ?? false, can?.delete ?? false);

    return (
        <>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={lguLevels}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add LGU Level</Button>
                        </div>
                    )}
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
        </>
    );
}

LguLevelPage.layout = { breadcrumbs: [{ title: 'LGU Levels', href: '#' }] };
