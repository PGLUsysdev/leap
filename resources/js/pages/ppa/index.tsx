import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { Ppa } from '@/types/global';
import PpaTablePage from '@/pages/ppa/ppa-masterlist-table/page';
import PpaFormDialog from '@/pages/ppa/form';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'PPA Master Library', href: '#' },
];

export default function PpaPage({
    ppaTree,
    offices,
}: {
    ppaTree: Ppa[];
    offices: any[];
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [targetType, setTargetType] = useState<Ppa['type']>('Program');
    const [activePpa, setActivePpa] = useState<Ppa | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(activePpa);

    function handleAdd(parent, childType: string) {
        console.log(parent);
        console.log(childType);

        setDialogMode('add');
        setActivePpa(parent);
        setTargetType(childType);
        setIsDialogOpen(true);
    }

    function handleEdit(data: Ppa) {
        setDialogMode('edit');
        setActivePpa(data);
        setTargetType(data.type);
        setIsDialogOpen(true);
    }

    function handleDeleteDialogOpen(data: Ppa) {
        console.log('delete');

        setActivePpa(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/ppas/${activePpa?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setActivePpa(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <PpaTablePage
                    data={ppaTree}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <Button
                        onClick={() => {
                            setDialogMode('add');
                            setActivePpa(null);
                            setTargetType('Program');
                            setIsDialogOpen(true);
                        }}
                    >
                        New Program
                    </Button>
                </PpaTablePage>
            </div>

            <PpaFormDialog
                mode={dialogMode}
                data={activePpa}
                type={targetType}
                onSuccess={() => setIsDialogOpen(false)}
                offices={offices}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                dialogMode={dialogMode}
                targetType={targetType}
                activePpa={activePpa}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete PPA?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{activePpa?.title}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setActivePpa(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
