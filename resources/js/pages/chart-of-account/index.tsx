import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { ChartOfAccount } from '@/types/global';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/chart-of-account/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Chart of Accounts', href: '#' },
];

interface ChartOfAccountPageProps {
    chartOfAccounts: ChartOfAccount[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function ChartOfAccountPage({
    chartOfAccounts,
    can,
}: ChartOfAccountPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] =
        useState<ChartOfAccount | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedAccount);

    function handleAdd() {
        setSelectedAccount(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) setSelectedAccount(null);
    }

    function handleEdit(account: ChartOfAccount) {
        const newAccount = {
            ...account,
            is_postable: account.is_postable ? true : false,
            is_active: account.is_active ? true : false,
        };

        setSelectedAccount(newAccount);
        setOpen(true);
    }

    function handleDeleteDialogOpen(account: ChartOfAccount) {
        setSelectedAccount(account);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/chart-of-accounts/${selectedAccount?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedAccount(null);
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
                    data={chartOfAccounts}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>
                                Add Chart of Account
                            </Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
                initialData={selectedAccount}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Chart of Account?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedAccount?.account_title}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedAccount(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
