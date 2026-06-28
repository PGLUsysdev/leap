import { useState } from 'react';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Ios, PaginatedResponse, SalaryStandard } from '@/types/global';
import { Button } from '@/components/ui/button';
import columns from './columns/columns';
import FormDialog from './form-dialog';
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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'IOS', href: '#' }];

interface IosPageProps {
    ios: PaginatedResponse<Ios>;
    salaryGrades: SalaryStandard[];
}

export default function IosPage({ ios, salaryGrades }: IosPageProps) {
    const [selectedData, setSelectedData] = useState<Ios | null>(null);
    const [openForm, setOpenForm] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    function handleEdit(data: Ios) {
        setSelectedData(data);
        setOpenForm(true);
    }

    function handleDelete(data: Ios) {
        setSelectedData(data);
        setOpenDelete(true);
    }

    function confirmDelete() {
        if (!selectedData) return;
        router.delete(`/ios/${selectedData.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpenDelete(false);
                setSelectedData(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                    })}
                    data={ios.data}
                    paginationObj={ios}
                    withSearch={true}
                    negativeHeight={10.8}
                >
                    <Button
                        onClick={() => {
                            setSelectedData(null);
                            setOpenForm(true);
                        }}
                    >
                        Add IOS
                    </Button>
                </DataTable>
            </div>

            <FormDialog
                open={openForm}
                onOpenChange={(open) => {
                    setOpenForm(open);
                    if (!open) setSelectedData(null);
                }}
                data={selectedData}
                salaryGrades={salaryGrades}
            />

            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete IOS</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this IOS record?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
