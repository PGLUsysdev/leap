import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Office, Role, User } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import FormDialog from './form-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '#' }];

interface UsersIndexProps {
    users: User[] | null;
    roles: Role[];
    offices: Office[];
    can?: {
        editAll: boolean;
        editOwn: boolean;
        editOfficeAll: boolean;
        editOfficeOwn: boolean;
        editRoleAll: boolean;
        editRoleOwn: boolean;
        userOfficeId: number | null;
    };
}

export default function UsersIndex({ users, roles, offices, can }: UsersIndexProps) {
    console.log({ users, can });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);

    function handleOpenFormDialog(data: User) {
        setSelectedUser(data);
        setOpenFormDialog(true);
    }

    const cols = columns({
        editAll: can?.editAll ?? false,
        editOwn: can?.editOwn ?? false,
        userOfficeId: can?.userOfficeId ?? null,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={cols}
                    data={users ?? []}
                    withSearch={true}
                    onEdit={handleOpenFormDialog}
                />
            </div>

            <FormDialog
                roles={roles}
                offices={offices}
                editOfficeAll={can?.editOfficeAll ?? false}
                editOfficeOwn={can?.editOfficeOwn ?? false}
                editRoleAll={can?.editRoleAll ?? false}
                editRoleOwn={can?.editRoleOwn ?? false}
                userOfficeId={can?.userOfficeId ?? null}
                open={openFormDialog}
                onOpenChange={setOpenFormDialog}
                data={selectedUser}
            />
        </AppLayout>
    );
}
