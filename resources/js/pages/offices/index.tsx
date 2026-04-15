import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormDialog from './form-dialog';
import type { Office, Sector, LguLevel, OfficeType } from '@/types/global';
import { DeleteDialog } from '@/components/delete-dialog';
import { router, usePage } from '@inertiajs/react';
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
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user.role as string;

    console.log(offices);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [selectedParentOffice, setSelectedParentOffice] =
        useState<Office | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log('office:', selectedOffice);
    console.log('parentOffice', selectedParentOffice);

    function handleCreate() {
        setSelectedOffice(null);
        setIsDialogOpen(true);
    }

    function handleCreateChild(data: Office) {
        setSelectedOffice(null);
        setSelectedParentOffice(data);
        setIsDialogOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setIsDialogOpen(isOpen);
        if (!isOpen) setSelectedOffice(null);
    }

    function handleEdit(value: Office) {
        setSelectedOffice(value);
        setSelectedParentOffice(null);
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
                    onAdd={handleCreateChild}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    {userRole === 'admin' ? (
                        <Button onClick={handleCreate}>Add Office</Button>
                    ) : undefined}
                </DataTable>
            </div>

            <FormDialog
                open={isDialogOpen}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedOffice}
                parentOffice={selectedParentOffice}
                sectors={sectors}
                lguLevels={lguLevels}
                officeTypes={officeTypes}
                offices={offices}
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
                        {selectedOffice?.children &&
                            selectedOffice.children.length > 0 && (
                                <>
                                    {' '}
                                    This will also delete all sub-units under
                                    this office.
                                </>
                            )}
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
