import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { SharedData, User } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import FormDialog from './form-dialog';
import { usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '#' }];

interface UsersIndexProps {
    users: User[] | null;
}

export default function UsersIndex({ users }: UsersIndexProps) {
    const { auth } = usePage<SharedData>().props;

    // console.log(users);
    console.log(auth);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);

    // console.log(selectedUser);

    function handleOpenFormDialog(data: User) {
        // console.log(data);

        setSelectedUser(data);
        setOpenFormDialog(true);
    }

    const cols = columns(auth.can?.manage_users ?? false);

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
                open={openFormDialog}
                onOpenChange={setOpenFormDialog}
                data={selectedUser}
            />
        </AppLayout>
    );
}
