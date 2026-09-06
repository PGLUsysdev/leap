import { router } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';
import PermissionDialog from './permission-dialog';

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

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={roles ?? []}
                    meta={{
                        canEdit: can?.edit ?? false,
                        canEditPerms: can?.managePermissions ?? false,
                        canDelete: can?.delete ?? false,
                        onEdit: handleEdit,
                        onEditPerms: handleEditPerms,
                        onDelete: handleDeleteDialogOpen,
                    }}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Role</Button>
                        </div>
                    )}
                </DataTable>
                <ScrollBar orientation="vertical" />
            </ScrollArea>

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
                        <span className="text-foreground font-bold">
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
        </>
    );
}

RolePage.layout = { breadcrumbs: [{ title: 'Roles', href: '#' }] };
