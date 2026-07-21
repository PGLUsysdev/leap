import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import type { Office, Position, Role, User } from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';

interface UsersIndexProps {
    users: User[] | null;
    roles: Role[];
    offices: Office[];
    positions: Position[];
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

export default function UsersIndex({
    users,
    roles,
    offices,
    positions,
    can,
}: UsersIndexProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);

    function handleOpenFormDialog(data: User) {
        setSelectedUser(data);
        setOpenFormDialog(true);
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={users ?? []}
                    meta={{
                        onEdit: handleOpenFormDialog,
                        editAll: can?.editAll ?? false,
                        editOwn: can?.editOwn ?? false,
                        userOfficeId: can?.userOfficeId ?? null,
                    }}
                />

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                roles={roles}
                offices={offices}
                positions={positions}
                editOfficeAll={can?.editOfficeAll ?? false}
                editOfficeOwn={can?.editOfficeOwn ?? false}
                editRoleAll={can?.editRoleAll ?? false}
                editRoleOwn={can?.editRoleOwn ?? false}
                userOfficeId={can?.userOfficeId ?? null}
                open={openFormDialog}
                onOpenChange={setOpenFormDialog}
                data={selectedUser}
            />
        </>
    );
}

UsersIndex.layout = { breadcrumbs: [{ title: 'Users', href: '#' }] };
