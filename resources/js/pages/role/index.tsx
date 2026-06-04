import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Role } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import FormDialog from './form-dialog';
import PermissionDialog from './permission-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles', href: '#' }];

interface RolePageProps {
    roles: Role[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        managePermissions: boolean;
    };
}

export default function RolePage({ roles, can }: RolePageProps) {
    const [openForm, setOpenForm] = useState(false);
    const [openPerms, setOpenPerms] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedRole(null);
        setOpenForm(true);
    }

    function handleEdit(data: Role) {
        setSelectedRole(data);
        setOpenForm(true);
    }

    function handleEditPerms(data: Role) {
        setSelectedRole(data);
        setOpenPerms(true);
    }

    function handleDeleteDialogOpen(data: Role) {
        setSelectedRole(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/roles/${selectedRole?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedRole(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    const cols = columns(can?.edit ?? false, can?.delete ?? false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="py-4">
                <DataTable
                    columns={cols}
                    data={roles ?? []}
                    withSearch={true}
                    onEdit={handleEdit}
                    onEditPerms={handleEditPerms}
                    onDelete={handleDeleteDialogOpen}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Role</Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={openForm}
                onOpenChange={setOpenForm}
                data={selectedRole}
            />

            <PermissionDialog
                open={openPerms}
                onOpenChange={setOpenPerms}
                role={selectedRole}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Role?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedRole?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedRole(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
