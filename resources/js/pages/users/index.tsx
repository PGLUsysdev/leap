import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { User } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import FormDialog from './form-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '#' }];

interface UsersIndexProps {
    users: User[] | null;
}

export default function UsersIndex({ users }: UsersIndexProps) {
    console.log(users);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);

    console.log(selectedUser);

    function handleOpenFormDialog(data: User) {
        console.log(data);

        setSelectedUser(data);
        setOpenFormDialog(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
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
