import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { ChevronsUpDown, Delete } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import NewTable from '@/components/base-ui-components/data-table';
import { TableSelect } from '@/components/base-ui-components/table-select';
import { Button as BaseButton } from '@/components/base-ui-components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/base-ui-components/ui/button-group';
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
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/price-list/form-dialog';
import { index, store, update, reorder } from '@/routes/price-lists';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    PaginatedResponse,
    Filter,
    ChartOfAccountPpmpCategory,
} from '@/types';
import columns from './columns/category-cols-base';
import categoryCols from './columns/category-cols-base';
import coaCols from './columns/coa-cols-base';
import columnsBase from './columns/columns-base';
import MoveDialog from './move-dialog';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';

interface PriceListPageProps {
    paginatedPriceList: PaginatedResponse<PriceList>;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    filters: Filter;
    paginatedDialogPriceList: PaginatedResponse<PriceList>;
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        move: boolean;
    };
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

export default function PriceListPage({
    paginatedPriceList,
    chartOfAccounts,
    ppmpCategories,
    filters,
    paginatedDialogPriceList,
    can,
    coaCategoryPairs,
}: PriceListPageProps) {
    // console.log('coaCategoryPairs', coaCategoryPairs);

    const [openEdit, setOpenEdit] = useState(false);
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PriceList | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openCoaTableSelect, setOpenCoaTableSelect] = useState(false);
    const [openCategoryTableSelect, setOpenCategoryTableSelect] =
        useState(false);

    const [openMoveDialog, setOpenMoveDialog] = useState(false);
    const [moveTarget, setMoveTarget] = useState<PriceList | null>(null);

    useEffect(() => {
        if (!openMoveDialog) setMoveTarget(null);
    }, [openMoveDialog]);

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

    // useEffect(() => {
    //     console.log(form.getValues('coa_id'));
    // }, [watchCoaId]);

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

    function onSubmit(data: z.infer<typeof formSchema>) {
        const payload = {
            coaId: data.coa_id,
            categoryId: data.category_id,
            itemDescription: data.item_name,
            uom: data.uom,
            price: data.price,
        };

        if (selectedPriceList) {
            router.visit(update({ ppmpPriceList: selectedPriceList.id }).url, {
                method: 'patch',
                data: payload,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setOpenFormDialog(false);
                    setSelectedPriceList(null);
                    form.reset();
                },
            });
        } else {
            router.visit(store().url, {
                method: 'post',
                data: payload,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setOpenFormDialog(false);
                    form.reset();
                },
            });
        }
    }

    function handleAdd() {
        setSelectedPriceList(null);

        setOpenEdit(true);
    }

    function handleEdit(data: PriceList) {
        setSelectedPriceList(data);
        setOpenFormDialog(true);
    }

    function handleMove() {
        setOpenMoveDialog(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpenFormDialog(isOpen);

        if (!isOpen) {
            setSelectedPriceList(null);
            form.reset();
        }
    }

    function handleDeleteDialogOpen(data: PriceList) {
        setSelectedPriceList(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/price-lists/${selectedPriceList?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                console.log('Success:', 'Record deleted');

                setIsDeleteDialogOpen(false);
                setSelectedPriceList(null);
            },
            onError: (errors) => {
                const errorMessage =
                    errors.database || 'An unknown error occurred';
                console.error('Delete Error:', errorMessage);
                setError(errorMessage);
                setIsErrorDialogOpen(true);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    // function handleReorder(activeId: string, overId: string) {
    //     router.post(
    //         '/price-lists/reorder',
    //         {
    //             active_id: activeId,
    //             over_id: overId,
    //         },
    //         {
    //             preserveState: false,
    //             preserveScroll: true,
    //             onSuccess: () => {
    //                 window.location.reload();
    //             },
    //         },
    //     );
    // }

    // function handleMove(data: PriceList) {
    //     router.visit(index(), {
    //         only: ['paginatedDialogPriceList'],
    //         preserveState: true,
    //         onSuccess: () => {
    //             setSelectedItem(data);
    //             setIsMoveDialogOpen(true);
    //         },
    //     });
    // }

    function handleCreate() {
        setOpenFormDialog(true);
    }

    function filterChartOfAccounts() {
        if (!watchCategoryId) {
            return chartOfAccounts;
        }

        // Find all COA IDs linked to the selected Category in the junction table
        const allowedCoaIds = coaCategoryPairs
            .filter((pair) => String(pair.ppmp_category_id) === watchCategoryId)
            .map((pair) => String(pair.chart_of_account_id));

        return chartOfAccounts.filter((coa) =>
            allowedCoaIds.includes(String(coa.id)),
        );
    }

    // 2. Filter Categories based on selected Chart of Account
    function filterPpmpCategories() {
        if (!watchCoaId) {
            return ppmpCategories;
        }

        // Find all Category IDs linked to the selected COA in the junction table
        const allowedCategoryIds = coaCategoryPairs
            .filter((pair) => String(pair.chart_of_account_id) === watchCoaId)
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

    function handleMoveItem(position: 'up' | 'down') {
        if (!selectedItem || !moveTarget) return;

        router.post(
            reorder().url,
            {
                active_id: selectedItem.id,
                over_id: moveTarget.id,
                position: position,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    setOpenMoveDialog(false);
                    setSelectedItem(null);
                    setMoveTarget(null);
                },
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(', ') ||
                        'An unknown error occurred';
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                onFinish: () => setIsLoading(false),
            },
        );
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)]">
                <div>Title</div>
                <div>Title</div>
                <div>Title</div>
                <div>Title</div>

                <NewTable
                    data={paginatedPriceList.data}
                    columns={columnsBase(
                        can?.edit ?? false,
                        can?.delete ?? false,
                        can?.move ?? false,
                    )}
                    meta={{
                        onMove: (data: PriceList) => {
                            setSelectedItem(data);
                            setOpenMoveDialog(true);
                        },
                        onUpdate: (data: PriceList) => handleEdit(data),
                        onDelete: (data: PriceList) =>
                            handleDeleteDialogOpen(data),
                    }}
                >
                    <BaseButton
                        onClick={() => {
                            console.log('create');
                            handleCreate();
                        }}
                    >
                        Create Item
                    </BaseButton>
                </NewTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <Dialog open={openFormDialog} onOpenChange={handleDialogOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently
                            delete your account and remove your data from our
                            servers.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        id="form-price-list"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <Controller
                            name="coa_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-price-list-coa-id">
                                        Chart of Accounts
                                    </FieldLabel>

                                    <ButtonGroup className="w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="min-w-0 flex-1 justify-between text-left font-normal hover:text-current"
                                            onClick={() => {
                                                setOpenCoaTableSelect(true);
                                            }}
                                            aria-invalid={fieldState.invalid}
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
                                            aria-invalid={fieldState.invalid}
                                            onClick={() =>
                                                form.resetField('coa_id')
                                            }
                                        >
                                            <Delete />
                                        </Button>
                                    </ButtonGroup>
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
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
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
                                            aria-invalid={fieldState.invalid}
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
                                            aria-invalid={fieldState.invalid}
                                            onClick={() =>
                                                form.resetField('category_id')
                                            }
                                        >
                                            <Delete />
                                        </Button>
                                    </ButtonGroup>
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="item_name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-price-list-item-name">
                                        Item Name
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="form-price-list-item-name"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Login button not working on mobile"
                                        autoComplete="off"
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
                            name="uom"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-price-list-uom">
                                        Unit of Measurement
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="form-price-list-uom"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Login button not working on mobile"
                                        autoComplete="off"
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
                            name="price"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-price-list-price">
                                        Price
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="form-price-list-price"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Login button not working on mobile"
                                        autoComplete="off"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                    </form>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                form.reset();
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenFormDialog(false);
                            }}
                        >
                            Close
                        </Button>
                        <Button form="form-price-list">Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* table select */}
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
            ></TableSelect>

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
            ></TableSelect>

            <Dialog open={openMoveDialog} onOpenChange={setOpenMoveDialog}>
                <DialogContent className="w-full max-w-3xl">
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                        <span className="text-muted-foreground">Moving: </span>
                        <span className="font-medium">
                            {selectedItem?.description}
                        </span>
                    </div>
                    <div className="w-full overflow-hidden">
                        <NewTable
                            columns={columnsBase(false, false, false)}
                            data={paginatedPriceList.data}
                            variant="select"
                            onRowClick={(row) => setMoveTarget(row)}
                            selectedValue={String(moveTarget?.id ?? '')}
                            selectedKey="id"
                        ></NewTable>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMoveTarget(null)}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setOpenMoveDialog(false)}
                        >
                            Close
                        </Button>
                        <Button
                            disabled={!moveTarget}
                            onClick={() => handleMoveItem('down')}
                        >
                            Move Down
                        </Button>
                        <Button
                            disabled={!moveTarget}
                            onClick={() => handleMoveItem('up')}
                        >
                            Move Up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* <MoveDialog
                open={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                paginatedDialogPriceList={paginatedDialogPriceList}
                filters={filters}
                selectedItemToMove={selectedItem}
            /> */}

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Price List?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedPriceList?.description}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedPriceList(null);
                }}
                isLoading={isLoading}
            />

            <AlertErrorDialog
                open={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
                error={error}
            />
        </>
    );
}

PriceListPage.layout = {
    breadcrumbs: [
        {
            title: 'Price Lists',
            href: '#',
        },
    ],
};
