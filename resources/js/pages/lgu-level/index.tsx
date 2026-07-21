import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
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

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={lguLevels}
                    meta={{
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                        canEdit: can?.edit ?? false,
                        canDelete: can?.delete ?? false,
                    }}
                >
                    {can?.add && <Button onClick={handleAdd}>Add LGU Level</Button>}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={handleDialogOpenChange}
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
