import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { PpmpCategory, ChartOfAccount } from '@/types/global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';
import {
    Field,
    FieldContent,
    // FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    // FieldSeparator,
    FieldSet,
    // FieldTitle,
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: PpmpCategory | null;
    chartOfAccounts: ChartOfAccount[];
}

const formSchema = z.object({
    name: z.string().trim().min(1, { message: 'Name is required' }),
    is_non_procurement: z.boolean(),
    chart_of_accounts: z.array(z.number()),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
    chartOfAccounts,
}: FormDialogProps) {
    console.log(initialData);

    const [isLoading, setIsLoading] = useState(false);
    const [openCoaCommand, setOpenCoaCommand] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingClose, setPendingClose] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            chart_of_accounts: [],
            is_non_procurement: false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData
                    ? {
                          ...initialData,
                          chart_of_accounts:
                              initialData.chart_of_accounts?.map(
                                  (account) => account.id,
                              ) || [],
                      }
                    : {
                          name: '',
                          chart_of_accounts: [],
                          is_non_procurement: false,
                      },
            );
            setHasUnsavedChanges(false);
        }
    }, [initialData, open, form]);

    const formValues = form.watch();
    const initialChartOfAccounts = useMemo(
        () => initialData?.chart_of_accounts?.map((a) => a.id) || [],
        [initialData],
    );

    useEffect(() => {
        const currentChartOfAccounts = formValues.chart_of_accounts || [];
        const hasChanges =
            JSON.stringify(
                [...currentChartOfAccounts].sort((a, b) => a - b),
            ) !==
            JSON.stringify([...initialChartOfAccounts].sort((a, b) => a - b));
        setHasUnsavedChanges(hasChanges);
    }, [formValues.chart_of_accounts, initialChartOfAccounts]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        // console.log(data);

        if (isEditing) {
            router.patch(`/ppmp-categories/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    setHasUnsavedChanges(false);
                    setOpen(false);
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/ppmp-categories', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setIsLoading(false),
            });
        }
    }

    function handleOpenChange(isOpen: boolean) {
        if (!isOpen && hasUnsavedChanges) {
            setShowUnsavedDialog(true);
            setPendingClose(true);
        } else {
            setOpen(isOpen);
        }
    }

    function handleUnsavedConfirm() {
        setShowUnsavedDialog(false);
        setPendingClose(false);
        setHasUnsavedChanges(false);
        setOpen(false);
    }

    function handleUnsavedCancel() {
        setShowUnsavedDialog(false);
        setPendingClose(false);
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    className="flex max-h-[90vh] flex-col sm:max-w-2xl"
                    onPointerDownOutside={(e) => {
                        if (isLoading) e.preventDefault();
                        if (hasUnsavedChanges) {
                            e.preventDefault();
                            setShowUnsavedDialog(true);
                            setPendingClose(true);
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isLoading) e.preventDefault();
                        if (hasUnsavedChanges) {
                            e.preventDefault();
                            setShowUnsavedDialog(true);
                            setPendingClose(true);
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? 'Edit PPMP Category'
                                : 'Add New PPMP Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Modify the details of the existing PPMP category below.'
                                : 'Fill in the information to create a new PPMP category record.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full">
                            <form
                                id="ppmp-category-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                            >
                                <FieldGroup className="pb-4">
                                    <Controller
                                        name="name"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Name
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </FieldLabel>

                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        placeholder="Category name..."
                                                        autoComplete="off"
                                                    />

                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="chart_of_accounts"
                                        control={form.control}
                                        render={({ field, fieldState }) => {
                                            // console.log(field.value);
                                            return (
                                                <FieldSet>
                                                    <FieldContent>
                                                        <FieldLegend variant="label">
                                                            Chart of Accounts
                                                        </FieldLegend>

                                                        <Button
                                                            type="button"
                                                            onClick={() =>
                                                                setOpenCoaCommand(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Add Chart of Account
                                                        </Button>

                                                        <ul className="list-disc pl-5">
                                                            {field.value
                                                                ?.map((id) =>
                                                                    chartOfAccounts.find(
                                                                        (coa) =>
                                                                            coa.id ===
                                                                            id,
                                                                    ),
                                                                )
                                                                .filter(
                                                                    (
                                                                        coa,
                                                                    ): coa is ChartOfAccount =>
                                                                        Boolean(
                                                                            coa,
                                                                        ),
                                                                )
                                                                .map((coa) => (
                                                                    <li
                                                                        key={
                                                                            coa.id
                                                                        }
                                                                        className="flex items-center justify-between gap-2"
                                                                    >
                                                                        <span>
                                                                            {
                                                                                coa.account_title
                                                                            }
                                                                        </span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                const newValue =
                                                                                    field.value?.filter(
                                                                                        (
                                                                                            id,
                                                                                        ) =>
                                                                                            id !==
                                                                                            coa.id,
                                                                                    ) ||
                                                                                    [];
                                                                                field.onChange(
                                                                                    newValue,
                                                                                );
                                                                            }}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </li>
                                                                ))}
                                                        </ul>

                                                        <CommandDialog
                                                            open={
                                                                openCoaCommand
                                                            }
                                                            onOpenChange={
                                                                setOpenCoaCommand
                                                            }
                                                            className="flex max-h-[90vh] flex-col"
                                                        >
                                                            <Command>
                                                                <CommandInput placeholder="Search chart of account..." />
                                                                <CommandList className="max-h-none flex-1">
                                                                    <CommandEmpty>
                                                                        No chart
                                                                        of
                                                                        account
                                                                        found.
                                                                    </CommandEmpty>
                                                                    <CommandGroup heading="Chart of Accounts">
                                                                        {chartOfAccounts.map(
                                                                            (
                                                                                coa,
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        coa.id
                                                                                    }
                                                                                    value={`${coa.account_number} ${coa.account_title}`}
                                                                                    className="items-center gap-4"
                                                                                >
                                                                                    <Checkbox
                                                                                        checked={
                                                                                            field.value?.includes(
                                                                                                coa.id,
                                                                                            ) ||
                                                                                            false
                                                                                        }
                                                                                        onCheckedChange={(
                                                                                            checked,
                                                                                        ) => {
                                                                                            const newValue =
                                                                                                checked
                                                                                                    ? [
                                                                                                          ...(field.value ||
                                                                                                              []),
                                                                                                          coa.id,
                                                                                                      ]
                                                                                                    : field.value?.filter(
                                                                                                          (
                                                                                                              id,
                                                                                                          ) =>
                                                                                                              id !==
                                                                                                              coa.id,
                                                                                                      ) ||
                                                                                                      [];
                                                                                            field.onChange(
                                                                                                newValue,
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                    <div className="grid w-full grid-cols-6 gap-4">
                                                                                        <span className="col-span-2">
                                                                                            {coa.account_number ??
                                                                                                '-'}
                                                                                        </span>
                                                                                        <span className="col-span-4 whitespace-normal">
                                                                                            {
                                                                                                coa.account_title
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ),
                                                                        )}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                            <div className="border-t p-4">
                                                                <Button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setOpenCoaCommand(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="w-full"
                                                                >
                                                                    Save
                                                                    Selected
                                                                </Button>
                                                            </div>
                                                        </CommandDialog>

                                                        {fieldState.invalid && (
                                                            <FieldError
                                                                errors={[
                                                                    fieldState.error,
                                                                ]}
                                                            />
                                                        )}
                                                    </FieldContent>
                                                </FieldSet>
                                            );
                                        }}
                                    />

                                    <Controller
                                        name="is_non_procurement"
                                        control={form.control}
                                        render={({ field, fieldState }) => {
                                            console.log(field.value);

                                            return (
                                                <FieldSet>
                                                    <FieldContent>
                                                        <FieldLegend variant="label">
                                                            Procurement Type
                                                        </FieldLegend>

                                                        <FieldGroup>
                                                            <Field
                                                                orientation="horizontal"
                                                                data-invalid={
                                                                    fieldState.invalid
                                                                }
                                                            >
                                                                <Checkbox
                                                                    id={
                                                                        field.name
                                                                    }
                                                                    aria-invalid={
                                                                        fieldState.invalid
                                                                    }
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onCheckedChange={
                                                                        field.onChange
                                                                    }
                                                                />

                                                                <FieldLabel
                                                                    htmlFor={
                                                                        field.name
                                                                    }
                                                                    className="font-normal"
                                                                >
                                                                    Non-Procurement
                                                                </FieldLabel>
                                                            </Field>
                                                        </FieldGroup>

                                                        {fieldState.invalid && (
                                                            <FieldError
                                                                errors={[
                                                                    fieldState.error,
                                                                ]}
                                                            />
                                                        )}
                                                    </FieldContent>
                                                </FieldSet>
                                            );
                                        }}
                                    />
                                </FieldGroup>
                            </form>
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="ppmp-category-form"
                            disabled={isLoading}
                        >
                            {isEditing ? (
                                isLoading ? (
                                    <span className="flex items-center gap-1">
                                        <Spinner />
                                        Saving Changes
                                    </span>
                                ) : (
                                    'Save Changes'
                                )
                            ) : isLoading ? (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Creating Category
                                </span>
                            ) : (
                                'Create Category'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showUnsavedDialog}
                onOpenChange={setShowUnsavedDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes to the chart of accounts.
                            Do you want to discard these changes?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleUnsavedCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleUnsavedConfirm}
                        >
                            Discard Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
