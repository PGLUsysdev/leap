import { router } from "@inertiajs/react";
import { useState } from "react";
// import { DataTable } from '@/components/data-table';
import DataTable from "@/components/base-ui-components/data-table";
import { Button } from "@/components/base-ui-components/ui/button";
import { Label } from "@/components/base-ui-components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import { Switch } from "@/components/base-ui-components/ui/switch";
import { DeleteDialog } from "@/components/delete-dialog";
import FormDialog from "@/pages/chart-of-account/form-dialog-base";
import type { ChartOfAccount } from "@/types";
import columns from "./columns/columns";

interface ChartOfAccountPageProps {
    chartOfAccounts: ChartOfAccount[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function ChartOfAccountPage({ chartOfAccounts, can }: ChartOfAccountPageProps) {
    const [open, setOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hideNonPostable, setHideNonPostable] = useState(false);

    const filteredData = hideNonPostable
        ? chartOfAccounts.filter((a) => a.is_postable)
        : chartOfAccounts;

    function handleAdd() {
        setSelectedAccount(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);

        if (!isOpen) {
            setSelectedAccount(null);
        }
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
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                {/*<DataTable
                    columns={columns}
                    data={chartOfAccounts}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}s
                >
                </DataTable>*/}

                <DataTable
                    columns={columns}
                    data={filteredData}
                    meta={{
                        canEdit: can?.edit ?? false,
                        canDelete: can?.delete ?? false,
                        onEdit: handleEdit,
                        onDelete: handleDeleteDialogOpen,
                    }}
                >
                    <div className="flex items-center gap-2 px-1 py-2">
                        <Switch
                            id="hide-non-postable"
                            checked={hideNonPostable}
                            onCheckedChange={setHideNonPostable}
                        />
                        <Label htmlFor="hide-non-postable">Hide non-postable</Label>
                    </div>

                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add Chart of Account</Button>
                        </div>
                    )}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={open}
                onOpenChange={handleDialogOpenChange}
                initialData={selectedAccount}
            />

            <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open);

                    if (!open) setSelectedAccount(null);
                }}
                title="Delete Chart of Account?"
                description={
                    <>
                        Are you sure you want to remove{" "}
                        <span className="font-bold text-foreground">
                            "{selectedAccount?.account_title}"
                        </span>
                        ?
                    </>
                }
                loading={isLoading}
                handleDelete={handleDelete}
            />
        </>
    );
}

ChartOfAccountPage.layout = {
    breadcrumbs: [{ title: "Chart of Accounts", href: "#" }],
};
