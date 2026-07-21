import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import type { LguLevel, Office, OfficeType, Sector } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

interface OfficesPageProps {
    offices: Office[];
    sectors: Sector[];
    lguLevels: LguLevel[];
    officeTypes: OfficeType[];
    can?: {
        addOffice: boolean;
        showAllOffices: boolean;
    };
}

export default function OfficesPage({
    offices,
    sectors,
    lguLevels,
    officeTypes,
    can,
}: OfficesPageProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [selectedParentOffice, setSelectedParentOffice] =
        useState<Office | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleCreate() {
        setSelectedOffice(null);
        setSelectedParentOffice(null);
        setIsDialogOpen(true);
    }

    function handleCreateChild(data: Office) {
        setSelectedOffice(null);
        setSelectedParentOffice(data);
        setIsDialogOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            setSelectedOffice(null);
            setSelectedParentOffice(null);
        }
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

    const cols = columns();

    return (
        <>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={offices}
                    meta={{
                        onAdd: handleCreateChild,
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                    }}
                    getSubRows={(row) => row.children}
                >
                    {can?.addOffice && (
                        <Button onClick={handleCreate}>Add Office</Button>
                    )}
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
                title={
                    selectedOffice?.parent_id
                        ? 'Delete Sub Unit?'
                        : 'Delete Office?'
                }
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
                                    this{' '}
                                    {selectedOffice?.parent_id
                                        ? 'sub unit'
                                        : 'office'}
                                    .
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
        </>
    );
}

OfficesPage.layout = {
    breadcrumbs: [
        {
            title: 'Offices',
            href: '#',
        },
    ],
};
