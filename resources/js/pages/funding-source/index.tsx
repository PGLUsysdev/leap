import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { FundingSource } from '@/types/global';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/funding-source/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Funding Source', href: '#' }];

interface FundingSourcePageProps {
    fundingSources: FundingSource[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function FundingSourcePage({
    fundingSources,
    can,
}: FundingSourcePageProps) {
    const [open, setOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<FundingSource | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedSource);

    function handleAdd() {
        setSelectedSource(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) setSelectedSource(null);
    }

    function handleEdit(source: FundingSource) {
        const newSource = {
            ...source,
            allow_typhoon: source.allow_typhoon ? true : false,
        };

        setSelectedSource(newSource);
        setOpen(true);
    }

    function handleDeleteDialogOpen(source: FundingSource) {
        setSelectedSource(source);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/funding-sources/${selectedSource?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedSource(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    const cols = columns(can?.edit ?? false, can?.delete ?? false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={fundingSources}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>
                                Add Funding Source
                            </Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
                initialData={selectedSource}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Funding Source?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedSource?.title}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedSource(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
