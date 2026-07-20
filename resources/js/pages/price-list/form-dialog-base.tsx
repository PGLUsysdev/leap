import { ChevronsUpDown, Delete } from 'lucide-react';
import { Controller } from 'react-hook-form';
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

interface FormDialogProps {}

export default function FormDialog({}: FormDialogProps) {
    return (
        <Dialog open={openFormDialog} onOpenChange={handleDialogOpenChange}>
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
                                                    form.resetField('coa_id', {
                                                        defaultValue: '',
                                                    })
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
                                render={({ fieldState }) => (
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
                                                            defaultValue: '',
                                                        },
                                                    )
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
                                    item_name: selectedPriceList.description,
                                    uom: selectedPriceList.unit_of_measurement,
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
                            setOpenFormDialog(false);
                        }}
                    >
                        Close
                    </Button>
                    <Button form="form-price-list">Submit</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
