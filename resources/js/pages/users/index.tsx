import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { User } from '@/types/global';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import FormDialog from './form-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '#' }];

interface UsersIndexProps {
    users: User[] | null;
    can?: {
        edit: boolean;
    };
}

export default function UsersIndex({ users, can }: UsersIndexProps) {
    console.log({ users, can });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);

    function handleOpenFormDialog(data: User) {
        setSelectedUser(data);
        setOpenFormDialog(true);
    }

    const cols = columns(can?.edit ?? false);

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
