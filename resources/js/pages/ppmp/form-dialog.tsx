import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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

import type { ChartOfAccount, PpmpCategory, PriceList } from '@/types';

import categoryColumns from './columns/category-columns';
import coaColumns from './columns/coa-columns';
import priceListColumns from './columns/price-list-columns';

const ppmpFormSchema = z.object({
    price_list_id: z.number().nullable().optional(),
    coa_id: z.number().nullable().optional(),
    category_id: z.number().nullable().optional(),
});

type PpmpFormValues = z.infer<typeof ppmpFormSchema>;

interface PpmpFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chartOfAccounts: ChartOfAccount[];
    priceLists: PriceList[];
    categories: PpmpCategory[];
    onSubmit?: (values: PpmpFormValues) => void;
}

export default function PpmpFormDialog({
    open,
    onOpenChange,
    chartOfAccounts = [],
    categories = [],
    priceLists = [],
    onSubmit,
}: PpmpFormDialogProps) {
    const form = useForm<PpmpFormValues>({
        resolver: zodResolver(ppmpFormSchema),
        defaultValues: {
            price_list_id: null,
            coa_id: null,
            category_id: null,
        },
    });

    const { watch, setValue, reset, handleSubmit, control } = form;
    const watchedPriceListId = watch('price_list_id');
    const watchedCoaId = watch('coa_id');
    const watchedCategoryId = watch('category_id');

    const isLocked =
        watchedPriceListId !== null && watchedPriceListId !== undefined;

    const selectedPriceList = useMemo(
        () => priceLists.find((pl) => pl.id === watchedPriceListId) ?? null,
        [priceLists, watchedPriceListId],
    );

    useEffect(() => {
        if (selectedPriceList) {
            const coaId =
                selectedPriceList.chart_of_account_ppmp_category
                    ?.chart_of_account_id ?? null;
            const catId =
                selectedPriceList.chart_of_account_ppmp_category
                    ?.ppmp_category_id ?? null;

            setValue('coa_id', coaId, { shouldValidate: false });
            setValue('category_id', catId, { shouldValidate: false });
        }
    }, [selectedPriceList, setValue]);

    const filteredPriceLists = useMemo(() => {
        if (watchedCoaId && watchedCategoryId) {
            return priceLists.filter(
                (pl) =>
                    pl.chart_of_account_ppmp_category?.chart_of_account_id ===
                        watchedCoaId &&
                    pl.chart_of_account_ppmp_category?.ppmp_category_id ===
                        watchedCategoryId,
            );
        }

        if (watchedCoaId) {
            return priceLists.filter(
                (pl) =>
                    pl.chart_of_account_ppmp_category?.chart_of_account_id ===
                    watchedCoaId,
            );
        }

        if (watchedCategoryId) {
            return priceLists.filter(
                (pl) =>
                    pl.chart_of_account_ppmp_category?.ppmp_category_id ===
                    watchedCategoryId,
            );
        }

        return priceLists;
    }, [priceLists, watchedCoaId, watchedCategoryId]);

    const filteredCoas = useMemo(() => {
        if (isLocked) {
            const lockedCoaId =
                selectedPriceList?.chart_of_account_ppmp_category
                    ?.chart_of_account_id;

            return lockedCoaId
                ? chartOfAccounts.filter((coa) => coa.id === lockedCoaId)
                : [];
        }

        if (watchedCategoryId) {
            const allowedCoaIds = new Set(
                priceLists
                    .filter(
                        (pl) =>
                            pl.chart_of_account_ppmp_category
                                ?.ppmp_category_id === watchedCategoryId,
                    )
                    .map(
                        (pl) =>
                            pl.chart_of_account_ppmp_category
                                ?.chart_of_account_id,
                    ),
            );

            return chartOfAccounts.filter((coa) => allowedCoaIds.has(coa.id));
        }

        return chartOfAccounts;
    }, [
        chartOfAccounts,
        priceLists,
        watchedCategoryId,
        isLocked,
        selectedPriceList,
    ]);

    const filteredCategories = useMemo(() => {
        if (isLocked) {
            const lockedCatId =
                selectedPriceList?.chart_of_account_ppmp_category
                    ?.ppmp_category_id;

            return lockedCatId
                ? categories.filter((cat) => cat.id === lockedCatId)
                : [];
        }

        if (watchedCoaId) {
            const allowedCatIds = new Set(
                priceLists
                    .filter(
                        (pl) =>
                            pl.chart_of_account_ppmp_category
                                ?.chart_of_account_id === watchedCoaId,
                    )
                    .map(
                        (pl) =>
                            pl.chart_of_account_ppmp_category?.ppmp_category_id,
                    ),
            );

            return categories.filter((cat) => allowedCatIds.has(cat.id));
        }

        return categories;
    }, [categories, priceLists, watchedCoaId, isLocked, selectedPriceList]);

    useEffect(() => {
        if (
            watchedPriceListId &&
            !filteredPriceLists.find((pl) => pl.id === watchedPriceListId)
        ) {
            setValue('price_list_id', null);
        }
    }, [filteredPriceLists, watchedPriceListId, setValue]);

    useEffect(() => {
        if (
            watchedCoaId &&
            !filteredCoas.find((coa) => coa.id === watchedCoaId)
        ) {
            setValue('coa_id', null);
        }
    }, [filteredCoas, watchedCoaId, setValue]);

    useEffect(() => {
        if (
            watchedCategoryId &&
            !filteredCategories.find((cat) => cat.id === watchedCategoryId)
        ) {
            setValue('category_id', null);
        }
    }, [filteredCategories, watchedCategoryId, setValue]);

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const priceListSelect = useTableSelect<PriceList>({
        data: filteredPriceLists,
        value: watchedPriceListId?.toString() ?? undefined,
        valueKey: 'id',
    });

    const coaSelect = useTableSelect<ChartOfAccount>({
        data: filteredCoas,
        value: watchedCoaId?.toString() ?? undefined,
        valueKey: 'id',
    });

    const categorySelect = useTableSelect<PpmpCategory>({
        data: filteredCategories,
        value: watchedCategoryId?.toString() ?? undefined,
        valueKey: 'id',
    });

    const handlePriceListSelect = (row: PriceList) => {
        setValue('price_list_id', row.id, { shouldValidate: true });
        priceListSelect.setOpen(false);
    };

    const handleCoaSelect = (row: ChartOfAccount) => {
        if (isLocked) return;

        if (watchedPriceListId) {
            setValue('price_list_id', null);
        }

        setValue('coa_id', row.id, { shouldValidate: true });
        coaSelect.setOpen(false);
    };

    const handleCategorySelect = (row: PpmpCategory) => {
        if (isLocked) return;

        if (watchedPriceListId) {
            setValue('price_list_id', null);
        }

        setValue('category_id', row.id, { shouldValidate: true });
        categorySelect.setOpen(false);
    };

    const handleFormSubmit = (data: PpmpFormValues) => {
        console.log('Form values:', data);
        onSubmit?.(data);
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
                        <Controller
                            name="price_list_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Price List</FieldLabel>
                                    <TableSelectButton
                                        hook={priceListSelect}
                                        displayValue={(item) =>
                                            item?.description ?? undefined
                                        }
                                        placeholder="Select price list..."
                                        onClear={() =>
                                            setValue('price_list_id', null)
                                        }
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="coa_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Chart of Account</FieldLabel>
                                    <TableSelectButton
                                        hook={coaSelect}
                                        displayValue={(item) =>
                                            item?.account_title ?? undefined
                                        }
                                        placeholder="Select COA..."
                                        disabled={isLocked}
                                        onClear={() => {
                                            if (!isLocked) {
                                                setValue('coa_id', null);
                                            }
                                        }}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="category_id"
                            control={control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>PPMP Category</FieldLabel>
                                    <TableSelectButton
                                        hook={categorySelect}
                                        displayValue={(item) =>
                                            item?.name ?? undefined
                                        }
                                        placeholder="Select category..."
                                        disabled={isLocked}
                                        onClear={() => {
                                            if (!isLocked) {
                                                setValue('category_id', null);
                                            }
                                        }}
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
                            <Button type="submit">Add Item</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <TableSelect
                data={filteredPriceLists}
                columns={priceListColumns}
                open={priceListSelect.open}
                onOpenChange={priceListSelect.setOpen}
                onRowSelect={handlePriceListSelect}
                title="Select Price List"
                description="Choose an existing price list item."
            />

            <TableSelect
                data={filteredCoas}
                columns={coaColumns}
                open={coaSelect.open}
                onOpenChange={coaSelect.setOpen}
                onRowSelect={handleCoaSelect}
                title="Select Chart of Account"
                description="Choose a COA (MOOE or CO)."
            />

            <TableSelect
                data={filteredCategories}
                columns={categoryColumns}
                open={categorySelect.open}
                onOpenChange={categorySelect.setOpen}
                onRowSelect={handleCategorySelect}
                title="Select Category"
                description="Choose a PPMP category."
            />
        </>
    );
}
