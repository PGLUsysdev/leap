import { useState, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
import type {
    ChartOfAccount,
    PpmpCategory,
    PpaFundingSource,
} from '@/types/global';
import { router } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { formSchema, type FormSchemaType } from './form-dialog-schema';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/ui/button-group';

interface PpmpFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    selectedEntry: { id: number } | null;
    fundingSources: PpaFundingSource[];
    selectedExpenseClass: string;
}

export default function PpmpFormDialog({
    open,
    onOpenChange,
    chartOfAccounts,
    ppmpCategories,
    selectedEntry = null,
    fundingSources,
    selectedExpenseClass,
}: PpmpFormDialogProps) {
    const [openExpenseCommand, setOpenExpenseCommand] = useState(false);
    const [openFundingSourceCommand, setOpenFundingSourceCommand] =
        useState(false);
    const [openCategoryCommand, setOpenCategoryCommand] = useState(false);
    const [openDescriptionCommand, setOpenDescriptionCommand] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            aip_entry_id: selectedEntry?.id || null,
            ppmp_price_list_id: null,
            expenseAccount: null,
            category: null,
            itemNo: null,
            description: null,
            unitOfMeasurement: null,
            price: null,
            fundingSource: null,
            isCustomItem: false,
        },
    });

    const isCustomItem = form.watch('isCustomItem');
    const selectedExpenseAccount = form.watch('expenseAccount');
    const selectedCategory = form.watch('category');

    const filteredChartOfAccounts = !isCustomItem
        ? selectedCategory
            ? chartOfAccounts.filter((account) =>
                  account.ppmp_price_lists?.some(
                      (priceList) =>
                          priceList.category?.id === selectedCategory,
                  ),
              )
            : chartOfAccounts
        : chartOfAccounts;

    const filteredPpmpCategories = !isCustomItem
        ? selectedExpenseAccount
            ? ppmpCategories.filter((cat) =>
                  chartOfAccounts
                      .find((acc) => acc.id === selectedExpenseAccount)
                      ?.ppmp_price_lists?.some(
                          (priceList) => priceList.category?.id === cat.id,
                      ),
              )
            : ppmpCategories
        : ppmpCategories;

    // refactor pricelist this later ? maybe
    const allPriceLists = chartOfAccounts.flatMap(
        (account) =>
            account.ppmp_price_lists?.map((priceList) => ({
                ...priceList,
                account_title: account.account_title,
                account_number: account.account_number,
            })) || [],
    );

    const filteredPriceLists = !isCustomItem
        ? allPriceLists.filter((priceList) => {
              const matchesAccount = selectedExpenseAccount
                  ? priceList.chart_of_account_id === selectedExpenseAccount
                  : true;

              const matchesCategory = selectedCategory
                  ? priceList.category?.id === selectedCategory
                  : true;

              return matchesAccount && matchesCategory;
          })
        : allPriceLists;

    // const isExpenseAccountChangingFromDescription = useRef(false);

    // useEffect(() => {
    //     if (isFirstRender.current) {
    //         isFirstRender.current = false;
    //         return;
    //     }

    //     if (!isExpenseAccountChangingFromDescription.current && !isCustomItem) {
    //         // Clearing the fields
    //         form.setValue('description', null);
    //         form.setValue('itemNo', 0);
    //         form.setValue('unitOfMeasurement', '');
    //         form.setValue('price', '0');
    //         form.setValue('ppmp_price_list_id', 1);
    //     }

    //     isExpenseAccountChangingFromDescription.current = false;
    // }, [selectedExpenseAccount, selectedCategory, form, isCustomItem]);

    // useEffect(() => {
    //     form.setValue('description', null);
    //     form.setValue('itemNo', 0);
    //     form.setValue('unitOfMeasurement', '');
    //     form.setValue('price', '0');
    //     form.setValue('ppmp_price_list_id', 1);
    //     form.setValue('category', null);
    // }, [isCustomItem, form]);

    function handleReset(bool: boolean) {
        form.reset({
            aip_entry_id: selectedEntry?.id || null,
            ppmp_price_list_id: null,
            expenseAccount: null,
            category: null,
            itemNo: null,
            description: null,
            unitOfMeasurement: null,
            price: null,
            fundingSource: null,
            isCustomItem: bool,
        });
    }

    function onSubmit(data: FormSchemaType) {
        if (isCustomItem) {
            // console.log('custom item', data);
            // router.post('/ppmp/custom', data, {
            //     onStart: () => setIsLoading(true),
            //     onFinish: () => setIsLoading(false),
            //     onSuccess: () => onOpenChange(false),
            //     onError: (errors) =>
            //         console.error('Error creating custom PPMP item:', errors),
            //     preserveState: false,
            // });
        } else {
            console.log(data);

            router.post('/ppmp', data, {
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => onOpenChange(false),
                onError: (errors) =>
                    console.error('Error creating PPMP item:', errors),
                preserveState: false,
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Increased width to max-w-2xl for better side-by-side layout */}
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Add PPMP Item</DialogTitle>
                    <DialogDescription>
                        Add a new item to the PPMP list
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0">
                    <ScrollArea className="pr-4">
                        <div className="grid gap-6">
                            <form
                                id="form-rhf-demo"
                                onSubmit={form.handleSubmit(onSubmit)}
                            >
                                <div className="grid gap-6">
                                    <Controller
                                        name="expenseAccount"
                                        control={form.control}
                                        render={({ field, fieldState }) => {
                                            const selectedAccount =
                                                chartOfAccounts.find(
                                                    (acc) =>
                                                        acc.id === field.value,
                                                );

                                            return (
                                                <Field
                                                    // className="overflow-hidden"
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
                                                        >
                                                            Expense Account{' '}
                                                            {selectedExpenseClass ===
                                                            'MOOE'
                                                                ? '(MOOE)'
                                                                : '(CO)'}
                                                        </FieldLabel>

                                                        <>
                                                            <ButtonGroup className="flex w-full">
                                                                <Button
                                                                    id={
                                                                        field.name
                                                                    }
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 items-center justify-between"
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
                                                                    <ChevronsUpDown />
                                                                </Button>

                                                                <ButtonGroupSeparator />

                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="secondary"
                                                                    className="w-20 shrink-0"
                                                                    onClick={() => {
                                                                        form.setValue(
                                                                            'expenseAccount',
                                                                            null,
                                                                        );
                                                                        if (
                                                                            !isCustomItem
                                                                        ) {
                                                                            form.setValue(
                                                                                'category',
                                                                                null,
                                                                            );
                                                                            form.setValue(
                                                                                'description',
                                                                                null,
                                                                            );
                                                                            form.setValue(
                                                                                'itemNo',
                                                                                null,
                                                                            );
                                                                            form.setValue(
                                                                                'price',
                                                                                null,
                                                                            );
                                                                            form.setValue(
                                                                                'unitOfMeasurement',
                                                                                null,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    Clear
                                                                </Button>
                                                            </ButtonGroup>

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
                                                                            No
                                                                            account
                                                                            found.
                                                                        </CommandEmpty>
                                                                        <CommandGroup heading="Chart of Accounts">
                                                                            {filteredChartOfAccounts.map(
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
                                                                                            if (
                                                                                                !isCustomItem
                                                                                            ) {
                                                                                                form.setValue(
                                                                                                    'category',
                                                                                                    null,
                                                                                                );
                                                                                                form.setValue(
                                                                                                    'description',
                                                                                                    null,
                                                                                                );
                                                                                            }
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

                                    <Controller
                                        name="category"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                // className="overflow-hidden"
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Category
                                                    </FieldLabel>

                                                    <>
                                                        <ButtonGroup className="flex w-full">
                                                            <Button
                                                                id={field.name}
                                                                type="button"
                                                                onClick={() =>
                                                                    setOpenCategoryCommand(
                                                                        true,
                                                                    )
                                                                }
                                                                variant="outline"
                                                                className="flex-1 items-center justify-between"
                                                            >
                                                                {ppmpCategories.find(
                                                                    (cat) =>
                                                                        cat.id ===
                                                                        field.value,
                                                                )?.name ||
                                                                    'Select category'}
                                                                <ChevronsUpDown />
                                                            </Button>

                                                            <ButtonGroupSeparator />

                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="secondary"
                                                                className="w-20 shrink-0"
                                                                onClick={() => {
                                                                    form.setValue(
                                                                        'category',
                                                                        null,
                                                                    );
                                                                    if (
                                                                        !isCustomItem
                                                                    ) {
                                                                        form.setValue(
                                                                            'description',
                                                                            null,
                                                                        );
                                                                        form.setValue(
                                                                            'itemNo',
                                                                            null,
                                                                        );
                                                                        form.setValue(
                                                                            'price',
                                                                            null,
                                                                        );
                                                                        form.setValue(
                                                                            'unitOfMeasurement',
                                                                            null,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </ButtonGroup>

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
                                                                <CommandInput
                                                                    placeholder="Search category..."
                                                                    aria-invalid={
                                                                        fieldState.invalid
                                                                    }
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        No
                                                                        category
                                                                        found.
                                                                    </CommandEmpty>

                                                                    <CommandGroup heading="Categories">
                                                                        {filteredPpmpCategories.map(
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
                                                                                        if (
                                                                                            !isCustomItem
                                                                                        ) {
                                                                                            form.setValue(
                                                                                                'description',
                                                                                                null,
                                                                                            );
                                                                                        }
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
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="description"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                className="overflow-hidden"
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Procurement Item
                                                    </FieldLabel>

                                                    <>
                                                        <ButtonGroup className="flex w-full items-center">
                                                            <Button
                                                                id={field.name}
                                                                type="button"
                                                                onClick={() =>
                                                                    setOpenDescriptionCommand(
                                                                        true,
                                                                    )
                                                                }
                                                                variant="outline"
                                                                className="flex-1 items-center justify-between overflow-hidden"
                                                            >
                                                                <span className="truncate">
                                                                    {filteredPriceLists.find(
                                                                        (
                                                                            priceList,
                                                                        ) =>
                                                                            priceList.id ===
                                                                            field.value,
                                                                    )
                                                                        ?.description ||
                                                                        'Select procurement item'}
                                                                </span>
                                                                <ChevronsUpDown />
                                                            </Button>

                                                            {/* <ButtonGroupSeparator /> */}

                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="secondary"
                                                                className="w-20 shrink-0"
                                                                onClick={() => {
                                                                    form.setValue(
                                                                        'description',
                                                                        null,
                                                                    );
                                                                    if (
                                                                        !isCustomItem
                                                                    ) {
                                                                        form.setValue(
                                                                            'itemNo',
                                                                            null,
                                                                        );
                                                                        form.setValue(
                                                                            'price',
                                                                            null,
                                                                        );
                                                                        form.setValue(
                                                                            'unitOfMeasurement',
                                                                            null,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </ButtonGroup>

                                                        <CommandDialog
                                                            open={
                                                                openDescriptionCommand
                                                            }
                                                            onOpenChange={
                                                                setOpenDescriptionCommand
                                                            }
                                                            className="flex max-h-[90vh] flex-col sm:max-w-[600px]"
                                                        >
                                                            <Command>
                                                                <CommandInput placeholder="Search procurement items..." />
                                                                <CommandList className="max-h-none flex-1">
                                                                    <CommandEmpty>
                                                                        No items
                                                                        found.
                                                                    </CommandEmpty>
                                                                    <CommandGroup heading="Procurement Items">
                                                                        {filteredPriceLists.map(
                                                                            (
                                                                                priceList,
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        priceList.id
                                                                                    }
                                                                                    value={`${priceList.item_number} ${priceList.description} ${priceList.unit_of_measurement} ${priceList.price}`}
                                                                                    onSelect={() => {
                                                                                        field.onChange(
                                                                                            priceList.id,
                                                                                        );

                                                                                        form.setValue(
                                                                                            'ppmp_price_list_id',
                                                                                            priceList.id,
                                                                                        );
                                                                                        if (
                                                                                            !isCustomItem
                                                                                        ) {
                                                                                            form.setValue(
                                                                                                'expenseAccount',
                                                                                                priceList.chart_of_account_id,
                                                                                                {
                                                                                                    shouldValidate: true,
                                                                                                },
                                                                                            );
                                                                                            form.setValue(
                                                                                                'category',
                                                                                                priceList
                                                                                                    .category
                                                                                                    ?.id ||
                                                                                                    null,
                                                                                                {
                                                                                                    shouldValidate: true,
                                                                                                },
                                                                                            );
                                                                                            form.setValue(
                                                                                                'itemNo',
                                                                                                priceList.item_number,
                                                                                                {
                                                                                                    shouldValidate: true,
                                                                                                },
                                                                                            );
                                                                                            form.setValue(
                                                                                                'price',
                                                                                                priceList.price,
                                                                                                {
                                                                                                    shouldValidate: true,
                                                                                                },
                                                                                            );
                                                                                            form.setValue(
                                                                                                'unitOfMeasurement',
                                                                                                priceList.unit_of_measurement,
                                                                                                {
                                                                                                    shouldValidate: true,
                                                                                                },
                                                                                            );
                                                                                        }

                                                                                        setOpenDescriptionCommand(
                                                                                            false,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <div className="grid w-full grid-cols-10 items-start gap-6 py-1">
                                                                                        <span>
                                                                                            {
                                                                                                priceList.item_number
                                                                                            }
                                                                                        </span>

                                                                                        <span className="col-span-6">
                                                                                            {
                                                                                                priceList.description
                                                                                            }
                                                                                        </span>

                                                                                        <span>
                                                                                            {
                                                                                                priceList.unit_of_measurement
                                                                                            }
                                                                                        </span>

                                                                                        <span>
                                                                                            {
                                                                                                priceList.price
                                                                                            }
                                                                                        </span>

                                                                                        <div className="flex justify-end">
                                                                                            {field.value ===
                                                                                                priceList.id && (
                                                                                                <Check />
                                                                                            )}
                                                                                        </div>
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
                                        )}
                                    />

                                    <div className="grid grid-cols-7 gap-6">
                                        <div className="col-span-1">
                                            <Controller
                                                name="itemNo"
                                                control={form.control}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <Field
                                                        data-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <FieldContent>
                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
                                                            >
                                                                Item No.
                                                            </FieldLabel>

                                                            <Input
                                                                {...field}
                                                                id={field.name}
                                                                aria-invalid={
                                                                    fieldState.invalid
                                                                }
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                readOnly={
                                                                    !isCustomItem
                                                                }
                                                                // disabled={
                                                                //     !isCustomItem
                                                                // }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value ===
                                                                            ''
                                                                            ? null
                                                                            : parseInt(
                                                                                  e
                                                                                      .target
                                                                                      .value,
                                                                                  10,
                                                                              ),
                                                                    )
                                                                }
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
                                        </div>

                                        <div className="col-span-4">
                                            <Controller
                                                name="price"
                                                control={form.control}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <Field
                                                        data-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <FieldContent>
                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
                                                            >
                                                                Price
                                                            </FieldLabel>

                                                            <Input
                                                                {...field}
                                                                id={field.name}
                                                                aria-invalid={
                                                                    fieldState.invalid
                                                                }
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                readOnly={
                                                                    !isCustomItem
                                                                }
                                                                // disabled={
                                                                //     !isCustomItem
                                                                // }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const val =
                                                                        e.target
                                                                            .value;
                                                                    if (
                                                                        val ===
                                                                        ''
                                                                    ) {
                                                                        field.onChange(
                                                                            null,
                                                                        );
                                                                    } else {
                                                                        // Remove leading zeros unless the number is just "0" or "0."
                                                                        const cleaned =
                                                                            val.replace(
                                                                                /^0+(?=\d)/,
                                                                                '',
                                                                            );
                                                                        field.onChange(
                                                                            cleaned,
                                                                        );
                                                                    }
                                                                }}
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
                                        </div>

                                        <div className="col-span-2">
                                            <Controller
                                                name="unitOfMeasurement"
                                                control={form.control}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <Field
                                                        data-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <FieldContent>
                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
                                                            >
                                                                Unit of
                                                                Measurement
                                                            </FieldLabel>

                                                            <Input
                                                                {...field}
                                                                id={field.name}
                                                                aria-invalid={
                                                                    fieldState.invalid
                                                                }
                                                                value={
                                                                    field.value ??
                                                                    ''
                                                                }
                                                                readOnly={
                                                                    !isCustomItem
                                                                }
                                                                // disabled={
                                                                //     !isCustomItem
                                                                // }
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
                                        </div>
                                    </div>

                                    <Controller
                                        name="fundingSource"
                                        control={form.control}
                                        render={({ field, fieldState }) => {
                                            const selectedFundingSource =
                                                fundingSources.find(
                                                    (fundingSource) =>
                                                        fundingSource
                                                            .funding_source
                                                            ?.id ===
                                                        field.value,
                                                );

                                            return (
                                                <Field
                                                    // className="overflow-hidden"
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
                                                        >
                                                            Funding Source
                                                        </FieldLabel>

                                                        <>
                                                            <ButtonGroup className="flex w-full">
                                                                <Button
                                                                    id={
                                                                        field.name
                                                                    }
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="flex-1 items-center justify-between"
                                                                    onClick={() =>
                                                                        setOpenFundingSourceCommand(
                                                                            true,
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedFundingSource ? (
                                                                        <span className="truncate">
                                                                            <code className="mr-2 rounded bg-muted p-0.5 text-xs">
                                                                                {
                                                                                    selectedFundingSource
                                                                                        .funding_source
                                                                                        ?.code
                                                                                }
                                                                            </code>
                                                                            {
                                                                                selectedFundingSource
                                                                                    .funding_source
                                                                                    ?.title
                                                                            }
                                                                        </span>
                                                                    ) : (
                                                                        'Select funding source'
                                                                    )}
                                                                    <ChevronsUpDown />
                                                                </Button>

                                                                {/* <ButtonGroupSeparator /> */}

                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="secondary"
                                                                    className="w-20 shrink-0"
                                                                    onClick={() => {
                                                                        form.setValue(
                                                                            'fundingSource',
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    Clear
                                                                </Button>
                                                            </ButtonGroup>

                                                            <CommandDialog
                                                                open={
                                                                    openFundingSourceCommand
                                                                }
                                                                onOpenChange={
                                                                    setOpenFundingSourceCommand
                                                                }
                                                                className="sm:max-w-[600px]"
                                                            >
                                                                <Command>
                                                                    <CommandInput placeholder="Search funding source..." />

                                                                    <CommandList>
                                                                        <CommandEmpty>
                                                                            No
                                                                            funding
                                                                            source
                                                                            found.
                                                                        </CommandEmpty>

                                                                        <CommandGroup heading="Chart of Accounts">
                                                                            {fundingSources.map(
                                                                                (
                                                                                    fundingSource,
                                                                                ) => (
                                                                                    <CommandItem
                                                                                        key={
                                                                                            fundingSource
                                                                                                .funding_source
                                                                                                ?.id
                                                                                        }
                                                                                        value={`${fundingSource.funding_source?.fund_type} ${fundingSource.funding_source?.code} ${fundingSource.funding_source?.title}`}
                                                                                        onSelect={() => {
                                                                                            field.onChange(
                                                                                                fundingSource
                                                                                                    .funding_source
                                                                                                    ?.id,
                                                                                            );
                                                                                            setOpenFundingSourceCommand(
                                                                                                false,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <div className="flex w-full items-center justify-between">
                                                                                            <div>
                                                                                                {
                                                                                                    fundingSource
                                                                                                        .funding_source
                                                                                                        ?.fund_type
                                                                                                }
                                                                                                <code className="mr-2 rounded bg-muted p-1 text-xs">
                                                                                                    {
                                                                                                        fundingSource
                                                                                                            .funding_source
                                                                                                            ?.code
                                                                                                    }
                                                                                                </code>
                                                                                                {
                                                                                                    fundingSource
                                                                                                        .funding_source
                                                                                                        ?.title
                                                                                                }
                                                                                            </div>
                                                                                            {field.value ===
                                                                                                fundingSource
                                                                                                    .funding_source
                                                                                                    ?.id && (
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
                            </form>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReset(false)}
                        disabled={isLoading}
                    >
                        Reset
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="form-rhf-demo"
                        disabled={isLoading}
                    >
                        Add Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
