import { useEffect, useState } from 'react';
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
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: PpmpCategory | null;
    chartOfAccounts: ChartOfAccount[];
}

const formSchema = z.object({
    name: z.string().trim().min(1, { message: 'Name is required' }),
    chart_of_account_id: z.number().int().positive(),
    is_non_procurement: z.boolean(),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
    chartOfAccounts,
}: FormDialogProps) {
    const [openExpenseClassCommandDialog, setOpenExpenseClassCommandDialog] =
        useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            chart_of_account_id: undefined,
            is_non_procurement: false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData ?? {
                    name: '',
                    chart_of_account_id: undefined,
                    is_non_procurement: false,
                },
            );
        }
    }, [initialData, open, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        // console.log(data);

        if (isEditing) {
            router.patch(`/ppmp-categories/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="flex max-h-[90vh] flex-col gap-0 overflow-hidden"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
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

                <div className="flex min-h-0 flex-1 pt-2">
                    <ScrollArea className="w-full flex-1 pr-3">
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
                                            data-invalid={fieldState.invalid}
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
                                    name="chart_of_account_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Expense Account
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <>
                                                    {/* final button for command dialog */}
                                                    <Button
                                                        id={field.name}
                                                        type="button"
                                                        variant="outline"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        className={cn(
                                                            'justify-between',
                                                            !field.value &&
                                                                'text-muted-foreground',
                                                        )}
                                                        onClick={() =>
                                                            setOpenExpenseClassCommandDialog(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        {field.value ? (
                                                            <span className="truncate">
                                                                {
                                                                    chartOfAccounts.find(
                                                                        (coa) =>
                                                                            coa.id ===
                                                                            field.value,
                                                                    )
                                                                        ?.account_title
                                                                }
                                                            </span>
                                                        ) : (
                                                            'Select implementing office...'
                                                        )}

                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>

                                                    {/* final command dialog */}
                                                    <CommandDialog
                                                        open={
                                                            openExpenseClassCommandDialog
                                                        }
                                                        onOpenChange={
                                                            setOpenExpenseClassCommandDialog
                                                        }
                                                        className="flex max-h-[90vh] flex-col"
                                                    >
                                                        <Command>
                                                            <CommandInput placeholder="Search office name..." />

                                                            <CommandList className="max-h-none flex-1">
                                                                <CommandEmpty>
                                                                    No office
                                                                    found.
                                                                </CommandEmpty>

                                                                <CommandGroup heading="Offices">
                                                                    {chartOfAccounts.map(
                                                                        (
                                                                            coa,
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    coa.id
                                                                                }
                                                                                value={`${coa.account_number} ${coa.account_title}`}
                                                                                data-checked={
                                                                                    field.value ===
                                                                                    coa.id
                                                                                }
                                                                                onSelect={() => {
                                                                                    console.log(
                                                                                        coa,
                                                                                    );
                                                                                    // form.setValue(
                                                                                    //     'office_id',
                                                                                    //     office.id.toString(),
                                                                                    // );
                                                                                    field.onChange(
                                                                                        coa.id,
                                                                                    );
                                                                                    setOpenExpenseClassCommandDialog(
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                                className="items-start gap-4 py-2"
                                                                            >
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
                                                                id={field.name}
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
    );
}
