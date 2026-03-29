import { useState } from 'react';
import TablePage from './table/page';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import type { LguLevel } from '@/types/global';

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

    function handleAdd() {
        setSelectedLguLevel(null);
        setOpen(true);
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
            <div className="flex flex-col gap-4 p-4">
                <TablePage
                    data={lguLevels}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>Add LGU Level</Button>
                    </div>
                </TablePage>
            </div>

            <FormDialog
                open={open}
                setOpen={setOpen}
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
