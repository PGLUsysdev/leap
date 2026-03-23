import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { ChartOfAccount } from '@/types/global';
import ChartOfAccountTablePage from '@/pages/chart-of-account/table/page';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/chart-of-account/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Chart of Accounts', href: '#' },
];

interface ChartOfAccountPageProps {
    chartOfAccounts: ChartOfAccount[];
}

export default function ChartOfAccountPage({
    chartOfAccounts,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <ChartOfAccountTablePage
                    data={chartOfAccounts}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex justify-end">
                        <Button onClick={handleAdd}>
                            Add Chart of Account
                        </Button>
                    </div>
                </ChartOfAccountTablePage>
            </div>

            <FormDialog
                open={open}
                setOpen={setOpen}
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
