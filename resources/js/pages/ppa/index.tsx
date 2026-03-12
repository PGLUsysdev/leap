import * as React from 'react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { columns, Ppa } from '@/pages/ppa/ppa-masterlist-table/columns';
import PpaTablePage from '@/pages/ppa/ppa-masterlist-table/page';
import PpaFormDialog from '@/pages/ppa/form';

export default function PpaPage({
    ppaTree,
    offices,
}: {
    ppaTree: Ppa[];
    offices: any[];
}) {
    console.log(ppaTree);
    // console.log(offices);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [activePpa, setActivePpa] = useState<Ppa | null>(null);
    const [targetType, setTargetType] = useState<Ppa['type']>('Program');
    const [ppaToDelete, setPpaToDelete] = useState<Ppa | null>(null);

    const confirmDelete = () => {
        if (!ppaToDelete) return;
        router.delete(`/ppas/${ppaToDelete.id}`, {
            onSuccess: () => setIsDeleteDialogOpen(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[{ title: 'PPA Master Library', href: '/offices' }]}
        >
            <div className="w-full px-4 pt-4">
                <PpaTablePage
                    data={ppaTree}
                    meta={{
                        onAdd: (parent: Ppa, childType: Ppa['type']) => {
                            setDialogMode('add');
                            setActivePpa(parent);
                            setTargetType(childType);
                            setIsDialogOpen(true);
                        },
                        onEdit: (ppa: Ppa) => {
                            setDialogMode('edit');
                            setActivePpa(ppa);
                            setTargetType(ppa.type);
                            setIsDialogOpen(true);
                        },
                        onDelete: (ppa: Ppa) => {
                            setPpaToDelete(ppa);
                            setIsDeleteDialogOpen(true);
                        },
                    }}
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

                <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete {ppaToDelete?.type}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove{' '}
                                <span className="font-semibold">
                                    {ppaToDelete?.title}
                                </span>
                                .
                                {ppaToDelete?.type !== 'Activity' && (
                                    <span className="mt-2 block text-xs font-medium text-destructive uppercase">
                                        Warning: All nested items will be
                                        deleted.
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Delete Permanently
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
