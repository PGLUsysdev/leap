import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { ChevronsUpDown, Delete } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { TableSelect } from '@/components/base-ui-components/table-select';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/base-ui-components/ui/button-group';
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
    store,
    update,
} from '@/routes/price-lists';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    ChartOfAccountPpmpCategory,
} from '@/types';
import categoryCols from './columns/category-cols-base';
import coaCols from './columns/coa-cols-base';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPriceList: PriceList | null;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    coaCategoryPairs: ChartOfAccountPpmpCategory[];
}

const formSchema = z.object({
    coa_id: z.string().min(1),
    category_id: z.string().min(1),
    item_name: z.string().min(1),
    uom: z.string().min(1),
    price: z
        .string()
        .min(1, 'Price is required')
        .regex(/^\d*\.?\d+$/, 'Price must be a positive decimal number'),
});

export default function FormDialog({
    open,
    onOpenChange,
    selectedPriceList,
    chartOfAccounts,
    ppmpCategories,
    coaCategoryPairs,
}: FormDialogProps) {
    const [openCoaTableSelect, setOpenCoaTableSelect] = useState(false);
    const [openCategoryTableSelect, setOpenCategoryTableSelect] =
        useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            coa_id: '',
            category_id: '',
            item_name: '',
            uom: '',
            price: '',
        },
    });

    const watchCoaId = useWatch({ control: form.control, name: 'coa_id' });
    const watchCategoryId = useWatch({
        control: form.control,
        name: 'category_id',
    });

    useEffect(() => {
        if (selectedPriceList) {
            form.reset({
                coa_id: String(
                    selectedPriceList.chart_of_account_ppmp_category
                        ?.chart_of_account_id ?? '',
                ),
                category_id: String(
                    selectedPriceList.chart_of_account_ppmp_category
                        ?.ppmp_category_id ?? '',
                ),
                item_name: selectedPriceList.description,
                uom: selectedPriceList.unit_of_measurement,
                price: selectedPriceList.price,
            });
        } else {
            form.reset({
                coa_id: '',
                category_id: '',
                item_name: '',
                uom: '',
                price: '',
            });
        }
    }, [selectedPriceList, form]);

    function handleDialogOpenChange(isOpen: boolean) {
        onOpenChange(isOpen);

        if (!isOpen) {
            form.reset();
        }
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
        const payload = {
            coaId: data.coa_id,
            categoryId: data.category_id,
            itemDescription: data.item_name,
            uom: data.uom,
            price: data.price,
        };

        if (selectedPriceList) {
            router.visit(
                update({ ppmpPriceList: selectedPriceList.id }).url,
                {
                    method: 'patch',
                    data: payload,
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        onOpenChange(false);
                        form.reset();
                    },
                },
            );
        } else {
            router.visit(store().url, {
                method: 'post',
                data: payload,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        }
    }

    function filterChartOfAccounts() {
        if (!watchCategoryId) {
            return chartOfAccounts;
        }

        const allowedCoaIds = coaCategoryPairs
            .filter(
                (pair) => String(pair.ppmp_category_id) === watchCategoryId,
            )
            .map((pair) => String(pair.chart_of_account_id));

        return chartOfAccounts.filter((coa) =>
            allowedCoaIds.includes(String(coa.id)),
        );
    }

    function filterPpmpCategories() {
        if (!watchCoaId) {
            return ppmpCategories;
        }

        const allowedCategoryIds = coaCategoryPairs
            .filter(
                (pair) => String(pair.chart_of_account_id) === watchCoaId,
            )
            .map((pair) => String(pair.ppmp_category_id));

        return ppmpCategories.filter((cat) =>
            allowedCategoryIds.includes(String(cat.id)),
        );
    }

    const selectedCoa = chartOfAccounts.find(
        (c) => String(c.id) === watchCoaId,
    );

    const selectedCategory = ppmpCategories.find(
        (cat) => String(cat.id) === watchCategoryId,
    );

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={handleDialogOpenChange}
            >
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
                    <DialogHeader className="flex-none">
                        <DialogTitle>
                            {selectedPriceList
                                ? 'Edit Price List'
                                : 'Create Price List'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPriceList
                                ? 'Update the details for this price list item.'
                                : 'Fill in the details to add a new price list item.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="form-price-list"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <Controller
                                    name="coa_id"
                                    control={form.control}
                                    render={({ fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="form-price-list-coa-id">
                                                Chart of Accounts
                                            </FieldLabel>

                                            <ButtonGroup className="w-full">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="min-w-0 flex-1 justify-between text-left font-normal hover:text-current"
                                                    onClick={() => {
                                                        setOpenCoaTableSelect(
                                                            true,
                                                        );
                                                    }}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <span className="truncate">
                                                        {selectedCoa?.account_title ??
                                                            'Select Chart of Account'}
                                                    </span>
                                                    <ChevronsUpDown />
                                                </Button>
                                                <ButtonGroupSeparator />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    aria-label="clear selection"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    onClick={() =>
                                                        form.resetField(
                                                            'coa_id',
                                                            {
                                                                defaultValue:
                                                                    '',
                                                            },
                                                        )
                                                    }
                                                >
                                                    <Delete />
                                                </Button>
                                            </ButtonGroup>
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
                                <Controller
                                    name="category_id"
                                    control={form.control}
                                    render={({ fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="form-price-list-category-id">
                                                Catgory
                                            </FieldLabel>
                                            <ButtonGroup className="w-full">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="min-w-0 flex-1 justify-between text-left font-normal hover:text-current"
                                                    onClick={() => {
                                                        setOpenCategoryTableSelect(
                                                            true,
                                                        );
                                                    }}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <span className="truncate">
                                                        {selectedCategory?.name ??
                                                            'Select Category'}
                                                    </span>
                                                    <ChevronsUpDown />
                                                </Button>
                                                <ButtonGroupSeparator />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    aria-label="clear selection"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    onClick={() =>
                                                        form.resetField(
                                                            'category_id',
                                                            {
                                                                defaultValue:
                                                                    '',
                                                            },
                                                        )
                                                    }
                                                >
                                                    <Delete />
                                                </Button>
                                            </ButtonGroup>
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
                                <Controller
                                    name="item_name"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="form-price-list-item-name">
                                                Item Name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="form-price-list-item-name"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Login button not working on mobile"
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
                                <Controller
                                    name="uom"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="form-price-list-uom">
                                                Unit of Measurement
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="form-price-list-uom"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Login button not working on mobile"
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
                                <Controller
                                    name="price"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="form-price-list-price">
                                                Price
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="form-price-list-price"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Login button not working on mobile"
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
                            </form>

                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (selectedPriceList) {
                                    form.reset({
                                        coa_id: String(
                                            selectedPriceList
                                                .chart_of_account_ppmp_category
                                                ?.chart_of_account_id ?? '',
                                        ),
                                        category_id: String(
                                            selectedPriceList
                                                .chart_of_account_ppmp_category
                                                ?.ppmp_category_id ?? '',
                                        ),
                                        item_name:
                                            selectedPriceList.description,
                                        uom:
                                            selectedPriceList.unit_of_measurement,
                                        price: selectedPriceList.price,
                                    });
                                } else {
                                    form.reset();
                                }
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                            }}
                        >
                            Close
                        </Button>
                        <Button type="submit" form="form-price-list">Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TableSelect
                columns={coaCols}
                data={filterChartOfAccounts()}
                open={openCoaTableSelect}
                onOpenChange={setOpenCoaTableSelect}
                onRowSelect={(row) => {
                    form.setValue('coa_id', String(row.id), {
                        shouldValidate: true,
                    });
                }}
                value={watchCoaId}
                valueKey="id"
                className="sm:max-w-175"
                title="Select Chart of Account"
                description="Choose the chart of account for this price list item."
            />

            <TableSelect
                columns={categoryCols}
                data={filterPpmpCategories()}
                open={openCategoryTableSelect}
                onOpenChange={setOpenCategoryTableSelect}
                onRowSelect={(row) => {
                    form.setValue('category_id', String(row.id), {
                        shouldValidate: true,
                    });
                }}
                value={watchCategoryId}
                valueKey="id"
                title="Select Category"
                description="Choose the category for this price list item."
            />
        </>
    );
}
