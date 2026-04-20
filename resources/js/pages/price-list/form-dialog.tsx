import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldLabel,
    FieldContent,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ChartOfAccount, PpmpCategory, PriceList } from '@/types/global';
import { router } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    selectedPriceList: PriceList | null;
}

const formSchema = z
    .object({
        expenseAccount: z
            .number()
            .refine((val) => val !== undefined && val !== null && val !== 0, {
                message: 'Expense account is required',
            }),
        category: z.number().optional(),
        customCategory: z.string().optional(),
        description: z.string().min(1, 'Description is required.'),
        unitOfMeasurement: z
            .string()
            .min(1, 'Unit of measurement is required.'),
        price: z.string().min(1, 'Price is required.'),
        isCustomCategory: z.boolean().optional(),
    })
    .refine(
        (data) => {
            if (data.isCustomCategory) {
                return (
                    !!data.customCategory &&
                    data.customCategory.trim().length > 0
                );
            } else {
                return !!data.category && data.category !== 0;
            }
        },
        {
            message: 'Category is required',
            path: ['category'],
        },
    );

export default function FormDialog({
    open,
    onOpenChange,
    chartOfAccounts,
    ppmpCategories,
    selectedPriceList,
}: FormDialogProps) {
    const [openExpenseCommand, setOpenExpenseCommand] = useState(false);
    const [openCategoryCommand, setOpenCategoryCommand] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            expenseAccount: undefined,
            category: undefined,
            customCategory: '',
            description: '',
            unitOfMeasurement: '',
            price: '',
            isCustomCategory: false,
        },
    });

    const isCustomCategory = form.watch('isCustomCategory');

    useEffect(() => {
        form.setValue('category', undefined);
        form.setValue('customCategory', '');
    }, [isCustomCategory, form]);

    useEffect(() => {
        if (selectedPriceList) {
            form.reset({
                expenseAccount: selectedPriceList.chart_of_account?.id,
                customCategory: undefined,
                category: selectedPriceList.category?.id,
                description: selectedPriceList.description,
                unitOfMeasurement: selectedPriceList.unit_of_measurement,
                price: selectedPriceList.price,
            });
        } else {
            form.reset({
                expenseAccount: 0,
                customCategory: undefined,
                category: undefined,
                description: '',
                unitOfMeasurement: '',
                price: undefined,
            });
        }
    }, [selectedPriceList, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (selectedPriceList) {
            router.patch(`/price-lists/${selectedPriceList.id}`, data, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(', ') ||
                        'An unknown error occurred';
                    console.error('Patch Validation Errors:', errors);
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                // onInvalid: (response) => {
                //     console.error('Patch Server Error:', response);
                // },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/price-lists', data, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(', ') ||
                        'An unknown error occurred';
                    console.error('Post Validation Errors:', errors);
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                // onInvalid: (response) => {
                //     console.error('Post Server Error:', response);
                // },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    const { watch, setValue } = form;
    const selectedExpenseAccount = watch('expenseAccount');
    const selectedCategory = watch('category');

    const categoryId = ppmpCategories.filter((cat) => {
        return cat.id === selectedCategory;
    })[0]?.chart_of_account_id;

    const filteredExpenseAccounts = selectedCategory
        ? chartOfAccounts.filter((coa) => {
              return coa.id === categoryId;
          })
        : chartOfAccounts;

    const filteredCategories = selectedExpenseAccount
        ? ppmpCategories.filter((pc) => {
              return pc.chart_of_account_id === selectedExpenseAccount;
          })
        : ppmpCategories;

    function handleExpenseAccountChange(id: number) {
        const categoryExpenseAccount = id
            ? ppmpCategories.filter((cat) => {
                  return cat.id === id;
              })[0]?.chart_of_account_id
            : 0;

        setValue('expenseAccount', categoryExpenseAccount, {
            shouldValidate: true,
            // shouldDirty: true,
            // shouldTouch: true
        });
    }

    function handleReset() {
        form.reset({
            expenseAccount: 0,
            customCategory: undefined,
            category: undefined,
            description: '',
            unitOfMeasurement: '',
            price: '',
        });
    }

    useEffect(() => {
        if (!open) {
            form.reset({
                expenseAccount: undefined,
                category: undefined,
                customCategory: '',
                description: '',
                unitOfMeasurement: '',
                price: '',
                isCustomCategory: false,
            });
        }
    }, [open, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {selectedPriceList ? 'Edit PPMP Item' : 'Add PPMP Item'}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedPriceList
                            ? 'Editing the item to the PPMP list'
                            : 'Add a new item to the PPMP list'}
                    </DialogDescription>
                </DialogHeader>

                <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Controller
                                name="expenseAccount"
                                control={form.control}
                                render={({ field, fieldState }) => {
                                    const selectedAccount =
                                        chartOfAccounts.find(
                                            (acc) => acc.id === field.value,
                                        );

                                    return (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Expense Account
                                                </FieldLabel>
                                                <>
                                                    <Button
                                                        id={field.name}
                                                        type="button"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={
                                                            openExpenseCommand
                                                        }
                                                        className={cn(
                                                            'w-full justify-between px-3 text-left font-normal',
                                                            !field.value &&
                                                                'text-muted-foreground',
                                                            fieldState.invalid &&
                                                                'border-destructive ring-destructive',
                                                        )}
                                                        onClick={() =>
                                                            setOpenExpenseCommand(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        {selectedAccount ? (
                                                            <span className="truncate">
                                                                <code className="mr-2 rounded bg-muted p-0.5 text-xs">
                                                                    {
                                                                        selectedAccount.account_number
                                                                    }
                                                                </code>
                                                                {
                                                                    selectedAccount.account_title
                                                                }
                                                            </span>
                                                        ) : (
                                                            'Select expense account'
                                                        )}

                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>

                                                    <CommandDialog
                                                        open={
                                                            openExpenseCommand
                                                        }
                                                        onOpenChange={
                                                            setOpenExpenseCommand
                                                        }
                                                        className="sm:max-w-[600px]"
                                                    >
                                                        <Command>
                                                            <CommandInput placeholder="Search account number or title..." />

                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    No account
                                                                    found.
                                                                </CommandEmpty>

                                                                <CommandGroup heading="Chart of Accounts">
                                                                    {filteredExpenseAccounts.map(
                                                                        (
                                                                            account,
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    account.id
                                                                                }
                                                                                value={`${account.account_number} ${account.account_title}`}
                                                                                onSelect={() => {
                                                                                    field.onChange(
                                                                                        account.id,
                                                                                    );

                                                                                    setOpenExpenseCommand(
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <div className="flex w-full items-center justify-between">
                                                                                    <div>
                                                                                        <code className="mr-2 rounded bg-muted p-1 text-xs">
                                                                                            {
                                                                                                account.account_number
                                                                                            }
                                                                                        </code>
                                                                                        {
                                                                                            account.account_title
                                                                                        }
                                                                                    </div>

                                                                                    {field.value ===
                                                                                        account.id && (
                                                                                        <Check className="ml-2 h-4 w-4 opacity-100" />
                                                                                    )}
                                                                                </div>
                                                                            </CommandItem>
                                                                        ),
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </CommandDialog>
                                                </>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    );
                                }}
                            />
                        </div>

                        <Field className="md:col-span-2">
                            <FieldContent>
                                <FieldLabel htmlFor="category-select">
                                    Category
                                </FieldLabel>

                                {isCustomCategory ? (
                                    <Controller
                                        name="customCategory"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter custom category"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </>
                                        )}
                                    />
                                ) : (
                                    <Controller
                                        name="category"
                                        control={form.control}
                                        render={({ field, fieldState }) => {
                                            const selectedCat =
                                                ppmpCategories.find(
                                                    (c) => c.id === field.value,
                                                );

                                            return (
                                                <>
                                                    <>
                                                        <Button
                                                            // id={form.control}
                                                            type="button"
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={
                                                                openCategoryCommand
                                                            }
                                                            className={cn(
                                                                'w-full justify-between px-3 text-left font-normal',
                                                                !field.value &&
                                                                    'text-muted-foreground',
                                                                fieldState.invalid &&
                                                                    'border-destructive ring-destructive',
                                                            )}
                                                            onClick={() =>
                                                                setOpenCategoryCommand(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            {selectedCat
                                                                ? selectedCat.name
                                                                : 'Select category'}

                                                            <ChevronsUpDown className="ml-2 opacity-50" />
                                                        </Button>

                                                        <CommandDialog
                                                            open={
                                                                openCategoryCommand
                                                            }
                                                            onOpenChange={
                                                                setOpenCategoryCommand
                                                            }
                                                            className="sm:max-w-[600px]"
                                                        >
                                                            <Command>
                                                                <CommandInput placeholder="Search category..." />

                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        No
                                                                        category
                                                                        found.
                                                                    </CommandEmpty>

                                                                    <CommandGroup heading="Categories">
                                                                        {filteredCategories.map(
                                                                            (
                                                                                category,
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        category.id
                                                                                    }
                                                                                    value={
                                                                                        category.name
                                                                                    }
                                                                                    onSelect={() => {
                                                                                        field.onChange(
                                                                                            category.id,
                                                                                        );
                                                                                        setOpenCategoryCommand(
                                                                                            false,
                                                                                        );
                                                                                        handleExpenseAccountChange(
                                                                                            category.id,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <div className="flex w-full items-center justify-between">
                                                                                        {
                                                                                            category.name
                                                                                        }

                                                                                        {field.value ===
                                                                                            category.id && (
                                                                                            <Check className="ml-2 h-4 w-4 opacity-100" />
                                                                                        )}
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ),
                                                                        )}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </CommandDialog>
                                                    </>

                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </>
                                            );
                                        }}
                                    />
                                )}
                            </FieldContent>
                        </Field>

                        <div className="md:col-span-2">
                            <Controller
                                name="description"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Procurement Item
                                            </FieldLabel>

                                            <InputGroup>
                                                <InputGroupTextarea
                                                    {...field}
                                                    id={field.name}
                                                    placeholder="Enter item description"
                                                    rows={3}
                                                    className="min-h-24 resize-none"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                />
                                            </InputGroup>

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <Controller
                                name="unitOfMeasurement"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Unit of Measurement
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Enter unit of measurement"
                                                autoComplete="off"
                                            />

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <Controller
                                name="price"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Price
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                type="number"
                                                step="0.01"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="0.00"
                                                autoComplete="off"
                                            />

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleReset()}>
                        Reset
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="form-rhf-demo"
                        disabled={isLoading}
                    >
                        {selectedPriceList ? (
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
                                Adding Item
                            </span>
                        ) : (
                            'Add Item'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>

            <AlertErrorDialog
                open={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
                error={error}
            />
        </Dialog>
    );
}
