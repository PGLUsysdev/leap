import { useState, useEffect } from 'react';
import {
    Field,
    FieldError,
    FieldLabel,
    FieldContent,
} from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
    ChartOfAccount,
    FundingSource,
    AipEntry,
    Ppmp,
} from '@/types/global';
import { router } from '@inertiajs/react';
import { formSchema, type FormSchemaType } from './form-dialog-schema';
import { FormDialogShell } from '@/components/form-dialog-shell';
import { CommandSelect } from '@/components/command-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PpmpFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chartOfAccounts: ChartOfAccount[];
    priceLists: any[];
    ppmpCategories: any[];
    selectedEntry: AipEntry | null;
    fundingSources: FundingSource[];
    selectedExpenseClass: string;
    selectedFundingSourceId: number;
    // The ID of the bridge record linking the Activity and the Fund
    ppaFundingSourceId: number | undefined;
    // Quick-add mode: adds month selector and quantity field
    mode?: 'default' | 'quick-add';
    defaultMonth?: string;
    defaultQuantity?: number;
    onItemAdded?: () => void;
    // Existing PPMP records for this funding source (for pre-filling in quick-add mode)
    existingPpmps?: Ppmp[];
}

export default function PpmpFormDialog({
    open,
    onOpenChange,
    chartOfAccounts,
    priceLists,
    ppmpCategories,
    selectedEntry = null,
    fundingSources,
    selectedExpenseClass,
    selectedFundingSourceId,
    ppaFundingSourceId,
    mode = 'default',
    defaultMonth,
    defaultQuantity,
    onItemAdded,
    existingPpmps,
}: PpmpFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ppa_funding_source_id: ppaFundingSourceId || null,
            ppmp_price_list_id: null,
            expenseAccount: null,
            category: null,
            itemNo: null,
            description: null,
            unitOfMeasurement: null,
            price: null,
            fundingSource: selectedFundingSourceId || null,
            month: defaultMonth || null,
            quantity: defaultQuantity ?? null,
        },
    });

    const selectedExpenseAccount = form.watch('expenseAccount');
    const selectedCategory = form.watch('category');

    useEffect(() => {
        if (open) {
            form.setValue('ppa_funding_source_id', ppaFundingSourceId || null);
            form.setValue('fundingSource', selectedFundingSourceId || null);
        }
    }, [open, ppaFundingSourceId, selectedFundingSourceId, form]);

    useEffect(() => {
        if (!open) {
            form.reset({
                ppa_funding_source_id: null,
                ppmp_price_list_id: null,
                expenseAccount: null,
                category: null,
                itemNo: null,
                description: null,
                unitOfMeasurement: null,
                price: null,
                fundingSource: null,
                month: null,
                quantity: null,
            });
        }
    }, [open, form]);

    const selectedPriceListId = form.watch('ppmp_price_list_id');

    const MONTHS = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
    ] as const;

    useEffect(() => {
        if (
            mode !== 'quick-add' ||
            !selectedPriceListId ||
            !existingPpmps?.length
        )
            return;

        const match = (existingPpmps as any[]).find(
            (p) =>
                Number(p.ppa_funding_source_id) ===
                    Number(ppaFundingSourceId) &&
                Number(p.ppmp_price_list_id) === Number(selectedPriceListId),
        );
        if (!match) return;

        const firstMonth = MONTHS.find(
            (m) => (Number(match[`${m}_qty`]) || 0) > 0,
        );
        if (firstMonth) {
            form.setValue('month', firstMonth);
            form.setValue('quantity', Number(match[`${firstMonth}_qty`]));
        }
    }, [selectedPriceListId, mode, existingPpmps, ppaFundingSourceId, form]);

    const selectedCategoryData = ppmpCategories.find(
        (cat) => cat.id === selectedCategory,
    );
    const categoryExpenseAccountIds =
        selectedCategoryData?.chart_of_account_ppmp_categories
            ?.map((cac: any) => cac.chart_of_account?.id)
            .filter((id: any): id is number => id != null) || [];

    const filteredChartOfAccounts = chartOfAccounts.filter((coa) => {
        const matchesCategory = selectedCategory
            ? categoryExpenseAccountIds.includes(coa.id)
            : true;
        const matchesExpenseClass = coa.expense_class === selectedExpenseClass;
        return matchesCategory && matchesExpenseClass;
    });

    const filteredPpmpCategories = selectedExpenseAccount
        ? ppmpCategories.filter((pc) =>
              pc.chart_of_account_ppmp_categories?.some(
                  (cac: any) =>
                      cac.chart_of_account?.id === selectedExpenseAccount,
              ),
          )
        : ppmpCategories;

    const allPriceLists = priceLists.map((priceList) => {
        const pivot = priceList.chart_of_account_ppmp_category;
        return {
            ...priceList,
            chart_of_account_id: pivot?.chart_of_account_id,
            ppmp_category_id: pivot?.ppmp_category_id,
            account_title: pivot?.chart_of_account?.account_title,
            account_number: pivot?.chart_of_account?.account_number,
            expense_class: pivot?.chart_of_account?.expense_class,
        };
    });

    const filteredPriceLists = allPriceLists.filter((priceList) => {
        // ✅ Only keep price lists with the correct expense class
        if (priceList.expense_class !== selectedExpenseClass) return false;

        const matchesAccount = selectedExpenseAccount
            ? priceList.chart_of_account_id === selectedExpenseAccount
            : true;
        const matchesCategory = selectedCategory
            ? priceList.ppmp_category_id === selectedCategory
            : true;
        return matchesAccount && matchesCategory;
    });

    const handleReset = () => {
        form.reset();
        form.setValue('ppa_funding_source_id', ppaFundingSourceId || null);
        form.setValue('fundingSource', selectedFundingSourceId);
    };

    function onSubmit(data: FormSchemaType) {
        // Build payload with the foreign keys required by the 'ppmps' table
        const payload: Record<string, any> = {
            ppa_funding_source_id: data.ppa_funding_source_id,
            ppmp_price_list_id: data.ppmp_price_list_id,
        };

        // Include month and quantity in quick-add mode
        if (mode === 'quick-add') {
            payload.month = data.month;
            payload.quantity = data.quantity;
        }

        router.post('/ppmp', payload, {
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                onItemAdded?.();
            },
            preserveState: true,
        });
    }

    const clearDependencies = () => {
        form.setValue('ppmp_price_list_id', null);
        form.setValue('description', null);
        form.setValue('itemNo', null);
        form.setValue('price', null);
        form.setValue('unitOfMeasurement', null);
    };

    return (
        <FormDialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={
                mode === 'quick-add' ? 'Quick Add PPMP Item' : 'Add PPMP Item'
            }
            description={
                mode === 'quick-add'
                    ? 'Select a procurement item and set the monthly quantity'
                    : 'Add a new item to the PPMP list'
            }
            isLoading={isLoading}
            formId="form-rhf-demo"
            onReset={handleReset}
            onCancel={() => onOpenChange(false)}
            submitLabel={
                mode === 'quick-add' ? 'Add & Set Quantity' : 'Add Item'
            }
            submittingLabel={
                mode === 'quick-add' ? 'Adding Item...' : 'Adding Item'
            }
            className="sm:max-w-2xl"
        >
            <div className="flex min-h-0">
                <ScrollArea className="w-full">
                    <div className="grid gap-6">
                        <form
                            id="form-rhf-demo"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <div className="grid gap-6">
                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            className="overflow-hidden"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Procurement Item
                                                </FieldLabel>

                                                <CommandSelect
                                                    value={field.value}
                                                    onChange={(
                                                        val,
                                                        priceList,
                                                    ) => {
                                                        field.onChange(val);

                                                        const pivot =
                                                            priceList.chart_of_account_ppmp_category;

                                                        form.setValue(
                                                            'ppmp_price_list_id',
                                                            priceList.id,
                                                        );

                                                        form.setValue(
                                                            'expenseAccount',
                                                            pivot?.chart_of_account_id,
                                                            {
                                                                // was priceList.chart_of_account_id
                                                                shouldValidate: true,
                                                            },
                                                        );

                                                        form.setValue(
                                                            'category',
                                                            pivot?.ppmp_category_id ||
                                                                null,
                                                            {
                                                                // was priceList.ppmp_category_id
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
                                                    }}
                                                    options={filteredPriceLists}
                                                    getOptionValue={(pl) =>
                                                        pl.id
                                                    }
                                                    getOptionSearchText={(pl) =>
                                                        `${pl.item_number} ${pl.description} ${pl.unit_of_measurement} ${pl.price}`
                                                    }
                                                    placeholder="Select procurement item"
                                                    searchPlaceholder="Search procurement items..."
                                                    heading="Procurement Items"
                                                    dialogClassName="flex max-h-[90vh] flex-col sm:max-w-[600px]"
                                                    onClear={() => {
                                                        field.onChange(null);
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
                                                    }}
                                                    renderTrigger={(pl) => (
                                                        <span className="truncate">
                                                            {pl.description}
                                                        </span>
                                                    )}
                                                    renderOption={(pl) => (
                                                        <div className="grid w-full grid-cols-10 items-start gap-6 py-1">
                                                            <span>
                                                                {pl.item_number}
                                                            </span>
                                                            <span className="col-span-6">
                                                                {pl.description}
                                                            </span>
                                                            <span>
                                                                {
                                                                    pl.unit_of_measurement
                                                                }
                                                            </span>
                                                            <span>
                                                                {pl.price}
                                                            </span>
                                                        </div>
                                                    )}
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

                                <div className="grid grid-cols-7 gap-6">
                                    <div className="col-span-1">
                                        <Controller
                                            name="itemNo"
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
                                                            readOnly
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
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
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
                                                            readOnly
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    val === ''
                                                                ) {
                                                                    field.onChange(
                                                                        null,
                                                                    );
                                                                } else {
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
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
                                                        >
                                                            Unit of Measurement
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
                                                            readOnly
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
                                    name="expenseAccount"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            // className="overflow-hidden"
                                            data-invalid={fieldState.invalid}
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

                                                <CommandSelect
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        if (
                                                            field.value !== val
                                                        ) {
                                                            field.onChange(val);
                                                            clearDependencies();
                                                        }
                                                    }}
                                                    options={
                                                        filteredChartOfAccounts
                                                    }
                                                    getOptionValue={(acc) =>
                                                        acc.id
                                                    }
                                                    getOptionSearchText={(
                                                        acc,
                                                    ) =>
                                                        `${acc.account_number} ${acc.account_title}`
                                                    }
                                                    placeholder="Select expense account"
                                                    searchPlaceholder="Search account number or title..."
                                                    heading="Chart of Accounts"
                                                    onClear={() => {
                                                        field.onChange(null);
                                                        form.setValue(
                                                            'category',
                                                            null,
                                                        );
                                                        clearDependencies();
                                                    }}
                                                    renderTrigger={(acc) => (
                                                        <span className="truncate">
                                                            <code className="mr-2 rounded bg-muted p-0.5 text-xs">
                                                                {
                                                                    acc.account_number
                                                                }
                                                            </code>
                                                            {acc.account_title}
                                                        </span>
                                                    )}
                                                    renderOption={(acc) => (
                                                        <div>
                                                            <code className="mr-2 rounded bg-muted p-1 text-xs">
                                                                {
                                                                    acc.account_number
                                                                }
                                                            </code>
                                                            {acc.account_title}
                                                        </div>
                                                    )}
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
                                    name="category"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            // className="overflow-hidden"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Category
                                                </FieldLabel>

                                                <CommandSelect
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        if (
                                                            field.value !== val
                                                        ) {
                                                            field.onChange(val);
                                                            clearDependencies();
                                                        }
                                                    }}
                                                    options={
                                                        filteredPpmpCategories
                                                    }
                                                    getOptionValue={(cat) =>
                                                        cat.id
                                                    }
                                                    getOptionSearchText={(
                                                        cat,
                                                    ) => cat.name}
                                                    placeholder="Select category"
                                                    searchPlaceholder="Search category..."
                                                    heading="Categories"
                                                    onClear={() => {
                                                        field.onChange(null);
                                                        clearDependencies();
                                                    }}
                                                    renderTrigger={(cat) => (
                                                        <span className="truncate">
                                                            {cat.name}
                                                        </span>
                                                    )}
                                                    renderOption={(cat) =>
                                                        cat.name
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

                                {mode === 'quick-add' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Controller
                                            name="month"
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
                                                        >
                                                            Month
                                                        </FieldLabel>

                                                        <Select
                                                            value={
                                                                field.value ??
                                                                undefined
                                                            }
                                                            onValueChange={(
                                                                val,
                                                            ) =>
                                                                field.onChange(
                                                                    val,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id={field.name}
                                                                className="h-9"
                                                            >
                                                                <SelectValue placeholder="Select month" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[
                                                                    {
                                                                        value: 'jan',
                                                                        label: 'January',
                                                                    },
                                                                    {
                                                                        value: 'feb',
                                                                        label: 'February',
                                                                    },
                                                                    {
                                                                        value: 'mar',
                                                                        label: 'March',
                                                                    },
                                                                    {
                                                                        value: 'apr',
                                                                        label: 'April',
                                                                    },
                                                                    {
                                                                        value: 'may',
                                                                        label: 'May',
                                                                    },
                                                                    {
                                                                        value: 'jun',
                                                                        label: 'June',
                                                                    },
                                                                    {
                                                                        value: 'jul',
                                                                        label: 'July',
                                                                    },
                                                                    {
                                                                        value: 'aug',
                                                                        label: 'August',
                                                                    },
                                                                    {
                                                                        value: 'sep',
                                                                        label: 'September',
                                                                    },
                                                                    {
                                                                        value: 'oct',
                                                                        label: 'October',
                                                                    },
                                                                    {
                                                                        value: 'nov',
                                                                        label: 'November',
                                                                    },
                                                                    {
                                                                        value: 'dec',
                                                                        label: 'December',
                                                                    },
                                                                ].map((m) => (
                                                                    <SelectItem
                                                                        key={
                                                                            m.value
                                                                        }
                                                                        value={
                                                                            m.value
                                                                        }
                                                                    >
                                                                        {
                                                                            m.label
                                                                        }
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

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
                                            name="quantity"
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
                                                        >
                                                            Quantity
                                                        </FieldLabel>

                                                        <Input
                                                            id={field.name}
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            className="h-9"
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                            onChange={(e) => {
                                                                const val =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    val === ''
                                                                ) {
                                                                    field.onChange(
                                                                        null,
                                                                    );
                                                                } else {
                                                                    field.onChange(
                                                                        val,
                                                                    );
                                                                }
                                                            }}
                                                            placeholder="Enter quantity"
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
                                )}

                                <Controller
                                    name="fundingSource"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            // className="overflow-hidden"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Funding Source
                                                </FieldLabel>

                                                <CommandSelect
                                                    value={field.value}
                                                    onChange={(val) =>
                                                        field.onChange(val)
                                                    }
                                                    options={fundingSources}
                                                    getOptionValue={(fs) =>
                                                        fs.id
                                                    }
                                                    getOptionSearchText={(fs) =>
                                                        `${fs.fund_type} ${fs.code} ${fs.title}`
                                                    }
                                                    placeholder="Select funding source"
                                                    searchPlaceholder="Search funding source..."
                                                    heading="Funding Sources"
                                                    disabled // Passed directly through
                                                    showClear={false} // Disabled clear since original had it disabled
                                                    onClear={() =>
                                                        field.onChange(null)
                                                    }
                                                    renderTrigger={(fs) => (
                                                        <span className="truncate">
                                                            <code className="mr-2 rounded bg-muted p-0.5 text-xs">
                                                                {fs.code}
                                                            </code>
                                                            {fs.title}
                                                        </span>
                                                    )}
                                                    renderOption={(fs) => (
                                                        <div>
                                                            {fs.fund_type}
                                                            <code className="mr-2 rounded bg-muted p-1 text-xs">
                                                                {fs.code}
                                                            </code>
                                                            {fs.title}
                                                        </div>
                                                    )}
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
                        </form>
                    </div>
                </ScrollArea>
            </div>
        </FormDialogShell>
    );
}
