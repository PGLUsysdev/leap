import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';

import {
    TableSelect,
    useTableSelect,
    TableSelectButton,
} from '@/components/base-ui-components/table-select';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/base-ui-components/ui/dialog';
import {
    Field,
    FieldLabel,
    FieldError,
} from '@/components/base-ui-components/ui/field';

import type {
    ChartOfAccount,
    PaginatedResponse,
    PpmpCategory,
    PriceList,
} from '@/types';

import categoryColumns from './columns/category-columns';
import coaColumns from './columns/coa-columns';
import priceListColumns from './columns/price-list-columns';

const ppmpFormSchema = z.object({
    ppmp_price_list_id: z.number().nullable().optional(),
    coa_id: z.number().nullable().optional(),
    category_id: z.number().nullable().optional(),
});

type PpmpFormValues = z.infer<typeof ppmpFormSchema>;

interface PpmpFormDialogProps {
    categories: PaginatedResponse<PpmpCategory>;
    chartOfAccounts: PaginatedResponse<ChartOfAccount>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    priceLists: PaginatedResponse<PriceList>;
    ppaFundingSourceId: number;
    onSuccess?: () => void;
    onSubmit?: (values: PpmpFormValues) => void;
}

const formatPrice = (value: number | string | undefined) => {
    const num = Number(value || 0);

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function PpmpFormDialog({
    open,
    onOpenChange,
    chartOfAccounts,
    categories,
    priceLists,
    ppaFundingSourceId,
    onSuccess,
}: PpmpFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<PpmpFormValues>({
        resolver: zodResolver(ppmpFormSchema),
        defaultValues: {
            ppmp_price_list_id: null,
            coa_id: null,
            category_id: null,
        },
    });

    const { setValue, reset, handleSubmit, control } = form;

    // Use useWatch to subscribe to specific fields
    const watchedPriceListId = useWatch({
        control,
        name: 'ppmp_price_list_id',
    });
    const watchedCoaId = useWatch({ control, name: 'coa_id' });
    const watchedCategoryId = useWatch({ control, name: 'category_id' });

    const isLocked =
        watchedPriceListId !== null && watchedPriceListId !== undefined;

    // ---- Selected objects (persist across pagination/filter changes) ----
    const [selectedPriceListObj, setSelectedPriceListObj] =
        useState<PriceList | null>(null);
    const [selectedCoaObj, setSelectedCoaObj] = useState<ChartOfAccount | null>(
        null,
    );
    const [selectedCategoryObj, setSelectedCategoryObj] =
        useState<PpmpCategory | null>(null);

    // ---- Trigger partial reload when a price list is selected ----
    useEffect(() => {
        if (selectedPriceListObj) {
            const coaId =
                selectedPriceListObj.chart_of_account_ppmp_category
                    ?.chart_of_account_id;
            const catId =
                selectedPriceListObj.chart_of_account_ppmp_category
                    ?.ppmp_category_id;

            router.reload({
                only: ['priceLists', 'chartOfAccounts', 'categories'],
                data: {
                    coa_id: coaId ?? undefined,
                    category_id: catId ?? undefined,
                    price_list_page: 1,
                    coa_page: 1,
                    category_page: 1,
                },
                replace: true,
            });
        }
    }, [selectedPriceListObj]);

    // ---- Automatically set COA/Category form values and objects from selected price list ----
    useEffect(() => {
        if (selectedPriceListObj) {
            const coa =
                selectedPriceListObj.chart_of_account_ppmp_category
                    ?.chart_of_account ?? null;
            const cat =
                selectedPriceListObj.chart_of_account_ppmp_category
                    ?.ppmp_category ?? null;

            if (coa) setSelectedCoaObj(coa);

            if (cat) setSelectedCategoryObj(cat);

            setValue('coa_id', coa?.id ?? null, { shouldValidate: false });
            setValue('category_id', cat?.id ?? null, { shouldValidate: false });
        }
    }, [selectedPriceListObj, setValue]);

    // ---- Trigger partial reload when manual filters change (and not locked) ----
    const prevFilters = useRef<{
        coaId: number | null | undefined;
        categoryId: number | null | undefined;
    }>({
        coaId: watchedCoaId,
        categoryId: watchedCategoryId,
    });

    useEffect(() => {
        if (!open || isLocked) return;

        const filtersChanged =
            prevFilters.current.coaId !== watchedCoaId ||
            prevFilters.current.categoryId !== watchedCategoryId;

        if (!filtersChanged) return;

        prevFilters.current = {
            coaId: watchedCoaId,
            categoryId: watchedCategoryId,
        };

        router.reload({
            only: ['priceLists', 'chartOfAccounts', 'categories'],
            data: {
                coa_id: watchedCoaId ?? undefined,
                category_id: watchedCategoryId ?? undefined,
                price_list_page: 1,
                coa_page: 1,
                category_page: 1,
            },
            replace: true,
        });
    }, [watchedCoaId, watchedCategoryId, open, isLocked]);

    // ---- Reset form and selected objects when dialog closes ----
    useEffect(() => {
        if (!open) {
            reset();
            setSelectedPriceListObj(null);
            setSelectedCoaObj(null);
            setSelectedCategoryObj(null);

            router.reload({
                only: ['priceLists', 'chartOfAccounts', 'categories'],
                data: {
                    coa_id: undefined,
                    category_id: undefined,
                    price_list_page: 1,
                    coa_page: 1,
                    category_page: 1,
                },
                replace: true,
            });
        }
    }, [open, reset]);

    // ---- Extract data and pagination meta for each list ----
    const { data: priceListData, ...priceListPagination } = priceLists;
    const { data: coaData, ...coaPagination } = chartOfAccounts;
    const { data: categoryData, ...categoryPagination } = categories;

    // ---- Table select hooks ----
    const priceListSelect = useTableSelect<PriceList>({
        data: priceListData,
        value: watchedPriceListId?.toString() ?? undefined,
        valueKey: 'id',
    });

    const coaSelect = useTableSelect<ChartOfAccount>({
        data: coaData,
        value: watchedCoaId?.toString() ?? undefined,
        valueKey: 'id',
    });

    const categorySelect = useTableSelect<PpmpCategory>({
        data: categoryData,
        value: watchedCategoryId?.toString() ?? undefined,
        valueKey: 'id',
    });

    // ---- Handlers ----
    const handlePriceListSelect = (row: PriceList) => {
        setSelectedPriceListObj(row);
        setValue('ppmp_price_list_id', row.id, { shouldValidate: true });
        priceListSelect.setOpen(false);
    };

    const handleCoaSelect = (row: ChartOfAccount) => {
        if (isLocked) return;

        setSelectedCoaObj(row);

        if (watchedPriceListId) {
            setSelectedPriceListObj(null);
            setValue('ppmp_price_list_id', null);
        }

        setValue('coa_id', row.id, { shouldValidate: true });
        coaSelect.setOpen(false);
    };

    const handleCategorySelect = (row: PpmpCategory) => {
        if (isLocked) return;

        setSelectedCategoryObj(row);

        if (watchedPriceListId) {
            setSelectedPriceListObj(null);
            setValue('ppmp_price_list_id', null);
        }

        setValue('category_id', row.id, { shouldValidate: true });
        categorySelect.setOpen(false);
    };

    const handleClearPriceList = () => {
        setSelectedPriceListObj(null);
        setValue('ppmp_price_list_id', null);
    };

    const handleClearCoa = () => {
        if (!isLocked) {
            setSelectedCoaObj(null);
            setValue('coa_id', null);
        }
    };

    const handleClearCategory = () => {
        if (!isLocked) {
            setSelectedCategoryObj(null);
            setValue('category_id', null);
        }
    };

    const handleReset = () => {
        reset();
        setSelectedPriceListObj(null);
        setSelectedCoaObj(null);
        setSelectedCategoryObj(null);

        router.reload({
            only: ['priceLists', 'chartOfAccounts', 'categories'],
            data: {
                coa_id: undefined,
                category_id: undefined,
                price_list_page: 1,
                coa_page: 1,
                category_page: 1,
            },
            replace: true,
        });
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const handleFormSubmit = (data: PpmpFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);

        router.post(
            '/ppmp', // adjust to your store route
            {
                ppa_funding_source_id: ppaFundingSourceId,
                ppmp_price_list_id: data.ppmp_price_list_id,
                coa_id: data.coa_id,
                category_id: data.category_id,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setSubmitError(errors?.message || 'Failed to add item.');
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add PPMP Item</DialogTitle>
                        <DialogDescription>
                            Select a price list or manually choose a COA and
                            category.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="flex flex-col gap-4"
                    >
                        {/* Price List */}
                        <Controller
                            name="ppmp_price_list_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Price List</FieldLabel>
                                    <TableSelectButton
                                        hook={priceListSelect}
                                        displayValue={() =>
                                            selectedPriceListObj?.description
                                        }
                                        placeholder="Select price list..."
                                        onClear={handleClearPriceList}
                                        wrapText={true}
                                    />

                                    {selectedPriceListObj && (
                                        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                                            <div>
                                                <span className="font-medium">
                                                    Unit of Measurement:
                                                </span>{' '}
                                                {
                                                    selectedPriceListObj.unit_of_measurement
                                                }
                                            </div>
                                            <div>
                                                <span className="font-medium">
                                                    Price:
                                                </span>{' '}
                                                {formatPrice(
                                                    selectedPriceListObj.price,
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        {/* Category */}
                        <Controller
                            name="category_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>PPMP Category</FieldLabel>
                                    <TableSelectButton
                                        hook={categorySelect}
                                        displayValue={() =>
                                            selectedCategoryObj?.name
                                        }
                                        placeholder="Select category..."
                                        disabled={isLocked}
                                        onClear={handleClearCategory}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        {/* COA */}
                        <Controller
                            name="coa_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Chart of Account</FieldLabel>
                                    <TableSelectButton
                                        hook={coaSelect}
                                        displayValue={() =>
                                            selectedCoaObj?.account_title
                                        }
                                        placeholder="Select COA..."
                                        disabled={isLocked}
                                        onClear={handleClearCoa}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Add Item</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* TableSelect dialogs */}
            <TableSelect
                data={priceListData}
                columns={priceListColumns}
                open={priceListSelect.open}
                onOpenChange={priceListSelect.setOpen}
                onRowSelect={handlePriceListSelect}
                paginationData={priceListPagination}
                pageParamName="price_list_page"
                searchParamName="price_list_search"
                title="Select Price List"
                description="Choose an existing price list item."
                className="sm:w-300 sm:max-w-[calc(90%)]"
            />

            <TableSelect
                data={categoryData}
                columns={categoryColumns}
                open={categorySelect.open}
                onOpenChange={categorySelect.setOpen}
                onRowSelect={handleCategorySelect}
                paginationData={categoryPagination}
                pageParamName="category_page"
                searchParamName="category_search"
                title="Select Category"
                description="Choose a PPMP category."
            />

            <TableSelect
                data={coaData}
                columns={coaColumns}
                open={coaSelect.open}
                onOpenChange={coaSelect.setOpen}
                onRowSelect={handleCoaSelect}
                paginationData={coaPagination}
                pageParamName="coa_page"
                searchParamName="coa_search"
                title="Select Chart of Account"
                description="Choose a COA (MOOE or CO)."
                className="sm:w-200 sm:max-w-[calc(90%)]"
            />
        </>
    );
}
