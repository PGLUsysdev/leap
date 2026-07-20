import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { TableSelect } from '@/components/base-ui-components/table-select';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/base-ui-components/ui/dialog';
import {
    Field,
    FieldError,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/base-ui-components/ui/toggle-group';
import type { ChartOfAccount, PpmpCategory } from '@/types';
import coaCols from './columns/coa-cols';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: PpmpCategory | null;
    chartOfAccounts: ChartOfAccount[];
}

const formSchema = z.object({
    name: z.string().trim().min(1, { message: 'Name is required' }),
    is_non_procurement: z.boolean(),
    chart_of_accounts: z
        .array(z.number())
        .min(1, { message: 'Select at least one chart of account' }),
});

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
    chartOfAccounts,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [openCoaTableSelect, setOpenCoaTableSelect] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const { errors } = usePage().props;
    const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(
        !!(errors as Record<string, string> | undefined)?.force_delete,
    );

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
                          name: initialData.name,
                          is_non_procurement: initialData.is_non_procurement,
                          chart_of_accounts:
                              initialData.chart_of_account_ppmp_categories?.map(
                                  (pivot) => pivot.chart_of_account_id,
                              ) || [],
                      }
                    : {
                          name: '',
                          chart_of_accounts: [],
                          is_non_procurement: false,
                      },
            );
        }
    }, [initialData, open, form]);

    const watchedCoaIds = useWatch({
        control: form.control,
        name: 'chart_of_accounts',
    });
    const initialChartOfAccounts = useMemo(
        () =>
            initialData?.chart_of_account_ppmp_categories?.map(
                (pivot) => pivot.chart_of_account_id,
            ) || [],
        [initialData],
    );

    const hasUnsavedChanges = useMemo(() => {
        const current = watchedCoaIds || [];

        return (
            JSON.stringify([...current].sort((a, b) => a - b)) !==
            JSON.stringify([...initialChartOfAccounts].sort((a, b) => a - b))
        );
    }, [watchedCoaIds, initialChartOfAccounts]);

    function handleOpenChange(isOpen: boolean) {
        if (!isOpen && hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            onOpenChange(isOpen);
        }
    }

    function handleUnsavedConfirm() {
        setShowUnsavedDialog(false);
        onOpenChange(false);
    }

    function handleUnsavedCancel() {
        setShowUnsavedDialog(false);
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (isEditing) {
            router.patch(`/ppmp-categories/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (submitErrors) => {
                    if (
                        submitErrors &&
                        typeof submitErrors === 'object' &&
                        'force_delete' in submitErrors
                    ) {
                        setShowForceDeleteDialog(true);
                    }
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/ppmp-categories', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsLoading(false),
            });
        }
    }

    function handleForceSave() {
        if (!initialData) {
            return;
        }

        const data = form.getValues();
        router.patch(`/ppmp-categories/${initialData.id}?force=1`, data, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setShowForceDeleteDialog(false);
                onOpenChange(false);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-3xl">
                    <DialogHeader className="flex-none">
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

                    <div className="flex min-h-0 flex-1">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="ppmp-category-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <Controller
                                            name="name"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Name
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
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <Controller
                                            name="is_non_procurement"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="font-normal"
                                                    >
                                                        Procurement Type
                                                    </FieldLabel>

                                                    <ToggleGroup
                                                        value={[
                                                            field.value
                                                                ? 'non_procurement'
                                                                : 'procurement',
                                                        ]}
                                                        onValueChange={(
                                                            value,
                                                        ) => {
                                                            if (
                                                                value.length > 0
                                                            ) {
                                                                field.onChange(
                                                                    value[0] ===
                                                                        'non_procurement',
                                                                );
                                                            }
                                                        }}
                                                        orientation="horizontal"
                                                    >
                                                        <ToggleGroupItem
                                                            value="procurement"
                                                            aria-label="Procurement"
                                                            className="flex-1 border"
                                                        >
                                                            Procurement
                                                        </ToggleGroupItem>

                                                        <ToggleGroupItem
                                                            value="non_procurement"
                                                            aria-label="Non-Procurement"
                                                            className="flex-1 border"
                                                        >
                                                            Non-Procurement
                                                        </ToggleGroupItem>
                                                    </ToggleGroup>
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Controller
                                    name="chart_of_accounts"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Chart of Accounts
                                            </FieldLabel>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setOpenCoaTableSelect(true)
                                                }
                                                className="w-full justify-start"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    {field.value.length > 0
                                                        ? `${field.value.length} selected`
                                                        : 'Select chart of accounts'}

                                                    <ChevronsUpDown />
                                                </div>
                                            </Button>

                                            {field.value.length > 0 && (
                                                <ul className="mt-2 space-y-1">
                                                    {[...new Set(field.value)]
                                                        .map((id) =>
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
                                                                Boolean(coa),
                                                        )
                                                        .map((coa) => (
                                                            <li
                                                                key={coa.id}
                                                                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                                            >
                                                                <span>
                                                                    <code className="mr-2 rounded bg-muted px-1 py-0.5 text-xs">
                                                                        {
                                                                            coa.account_number
                                                                        }
                                                                    </code>
                                                                    {
                                                                        coa.account_title
                                                                    }
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="xs"
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
                                            )}

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                {/*<Controller
                                    name="is_non_procurement"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="font-normal"
                                            >
                                                Non-Procurement
                                            </FieldLabel>
                                        </div>
                                    )}
                                />*/}
                            </form>

                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (initialData) {
                                    form.reset({
                                        name: initialData.name,
                                        is_non_procurement:
                                            initialData.is_non_procurement,
                                        chart_of_accounts:
                                            initialData.chart_of_account_ppmp_categories?.map(
                                                (pivot) =>
                                                    pivot.chart_of_account_id,
                                            ) || [],
                                    });
                                } else {
                                    form.reset({
                                        name: '',
                                        chart_of_accounts: [],
                                        is_non_procurement: false,
                                    });
                                }
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Close
                        </Button>
                        <Button type="submit" form="ppmp-category-form">
                            {isEditing ? 'Save Changes' : 'Create Category'}
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

            <Dialog
                open={showForceDeleteDialog}
                onOpenChange={setShowForceDeleteDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Chart of Accounts?</DialogTitle>
                        <DialogDescription>
                            Some of the chart of accounts you removed have
                            dependent PPMP price list items. Continuing will
                            delete those price list items as well. This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowForceDeleteDialog(false);
                                onOpenChange(false);
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleForceSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Continue'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TableSelect
                columns={coaCols}
                data={chartOfAccounts.filter(
                    (coa) =>
                        !watchedCoaIds?.includes(coa.id),
                )}
                open={openCoaTableSelect}
                onOpenChange={setOpenCoaTableSelect}
                onRowSelect={(row) => {
                    const current = form.getValues('chart_of_accounts') || [];
                    form.setValue('chart_of_accounts', [...new Set([...current, row.id])], {
                        shouldDirty: true,
                        shouldValidate: true,
                    });
                    setOpenCoaTableSelect(false);
                }}
                className="sm:max-w-175"
                title="Select Chart of Account"
                description="Choose a chart of account to add to this category."
            />
        </>
    );
}
