import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import type { Office, Sector, LguLevel, OfficeType } from '@/types/global';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Offices', href: '#' }];

interface OfficesPageProps {
    offices: Office[];
    sectors: Sector[];
    lguLevels: LguLevel[];
    officeTypes: OfficeType[];
}

export default function OfficesPage({
    offices,
    sectors,
    lguLevels,
    officeTypes,
}: OfficesPageProps) {
    console.log(offices);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedOffice);

    const handleCreate = () => {
        setSelectedOffice(null);
        setIsDialogOpen(true);
    };

    function handleDialogOpenChange(isOpen: boolean) {
        setIsDialogOpen(isOpen);
        if (!isOpen) setSelectedOffice(null);
    }

    function handleEdit(value: Office) {
        setSelectedOffice(value);
        setIsDialogOpen(true);
    }

    function handleDeleteDialogOpen(office: Office) {
        setSelectedOffice(office);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/offices/${selectedOffice?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedOffice(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full px-4 pt-4 pb-4">
                <DataTable
                    columns={columns}
                    data={offices}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <Button onClick={handleCreate}>Add Office</Button>
                </DataTable>
            </div>

            <FormDialog
                open={isDialogOpen}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedOffice}
                sectors={sectors}
                lguLevels={lguLevels}
                officeTypes={officeTypes}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Office?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedOffice?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedOffice(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
