import { router } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
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
import { Button } from '@/components/ui/button';
import type { Ios, PaginatedResponse, SalaryStandard } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

interface IosPageProps {
    ios: PaginatedResponse<Ios>;
    salaryGrades: SalaryStandard[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function IosPage({ ios, salaryGrades, can }: IosPageProps) {
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
        if (!selectedData) {
            return;
        }

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
        <>
            <div className="pt-4">
                <DataTable
                    columns={columns({
                        onEdit: can?.edit ? handleEdit : undefined,
                        onDelete: can?.delete ? handleDelete : undefined,
                    })}
                    data={ios.data}
                    paginationObj={ios}
                    withSearch={true}
                    negativeHeight={10.8}
                >
                    {can?.add && (
                        <Button
                            onClick={() => {
                                setSelectedData(null);
                                setOpenForm(true);
                            }}
                        >
                            Add IOS
                        </Button>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={openForm}
                onOpenChange={(open) => {
                    setOpenForm(open);

                    if (!open) {
                        setSelectedData(null);
                    }
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
        </>
    );
}

IosPage.layout = {
    breadcrumbs: [{ title: 'Index of Occupational Services', href: '#' }],
};
