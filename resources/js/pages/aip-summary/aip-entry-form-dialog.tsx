import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Plus, Trash2, ListPlus, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

import type { FiscalYear, Ppa, FundingSource, Office } from '@/types/global';

const amountSchema = z.string();

const formSchema = z.object({
    office_id: z.string().min(1, 'Office is required'), // Added this
    expected_output: z.string().min(1, 'Required'),
    start_date: z.string().min(1, 'Required'),
    end_date: z.string().min(1, 'Required'),
    ppa_funding_sources: z.array(
        z.object({
            id: z.number().optional(),
            funding_source_id: z.string().min(1, 'Required'),
            ps_amount: amountSchema,
            mooe_amount: amountSchema,
            fe_amount: amountSchema,
            co_amount: amountSchema,
            ccet_adaptation: amountSchema,
            ccet_mitigation: amountSchema,
            cc_typology_code: z.string().optional().nullable(),
        }),
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Ppa | null;
    fiscalYear: FiscalYear;
    fundingSources: FundingSource[];
    offices: Office[]; // Added offices prop
}

export default function AipEntryFormDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
    fundingSources,
    offices,
}: Props) {
    console.log({
        open,
        onOpenChange,
        data,
        fiscalYear,
        fundingSources,
        offices,
    });

    const [openOfficeComamnd, setOpenOfficeComamnd] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            office_id: '',
            expected_output: '',
            start_date: '',
            end_date: '',
            ppa_funding_sources: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'ppa_funding_sources',
    });

    const watchedSources = useWatch({
        control: form.control,
        name: 'ppa_funding_sources',
    });

    const selectedSourceIds = useMemo(() => {
        return (watchedSources || [])
            .map((s) => s?.funding_source_id)
            .filter((id) => id !== '' && id !== undefined);
    }, [watchedSources]);

    // Check if any added row is missing a funding source ID
    const isFundingIncomplete = watchedSources?.some(
        (fs) => !fs.funding_source_id || fs.funding_source_id === '',
    );

    const calculateRowTotal = (row: any) => {
        return (
            parseFloat(row.ps_amount || '0') +
            parseFloat(row.mooe_amount || '0') +
            parseFloat(row.fe_amount || '0') +
            parseFloat(row.co_amount || '0')
        );
    };

    const handleGoToPpmp = (fundId: string, choice: 'MOOE' | 'CO') => {
        if (!isEdit || !entry) return;

        router.get(`/aip/${fiscalYear.id}/summary/${entry.id}/ppmp`, {
            choice: choice,
            fund: fundId,
        });
    };

    useEffect(() => {
        if (open && data) {
            const entry = data.aip_entries?.[0];
            form.reset({
                office_id: data.office_id?.toString() || '',
                expected_output: entry?.expected_output || '',
                start_date: entry?.start_date || '',
                end_date: entry?.end_date || '',
                ppa_funding_sources:
                    data.ppa_funding_sources?.map((fs) => ({
                        id: fs.id,
                        funding_source_id: fs.funding_source_id.toString(),
                        ps_amount: fs.ps_amount,
                        mooe_amount: fs.mooe_amount,
                        fe_amount: fs.fe_amount,
                        co_amount: fs.co_amount,
                        ccet_adaptation: fs.ccet_adaptation,
                        ccet_mitigation: fs.ccet_mitigation,
                        // cc_typology_code: fs.cc_typology_code || '',
                    })) || [],
            });
        }
    }, [data, open, form]);

    const entry = data?.aip_entries?.[0];
    const isEdit = !!entry;

    const onSubmit = (values: FormValues) => {
        const payload = {
            ...values,
            ppa_id: data?.id,
            fiscal_year_id: fiscalYear.id,
        };

        if (isEdit) {
            router.put(`/aip-entries/${entry.id}`, payload, {
                onStart: () => {
                    setIsLoading(true);
                    form.clearErrors();
                },
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onFinish: () => setIsLoading(false),
                preserveScroll: true,
            });
        } else {
            router.post(`/aip-entries`, payload, {
                onStart: () => {
                    setIsLoading(true);
                    form.clearErrors();
                },
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onFinish: () => setIsLoading(false),
                preserveScroll: true,
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => !isLoading && onOpenChange(val)}
        >
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[80%]"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit AIP Entry' : 'Add to AIP Summary'}
                    </DialogTitle>

                    <DialogDescription>
                        Manage implementation details and budget allocation for
                        <span className="mx-1 font-semibold text-foreground italic">
                            "{data?.name}"
                        </span>
                        for the Fiscal Year {fiscalYear.year}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <Form {...form}>
                            <form
                                id="aip-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-1 flex-col overflow-hidden"
                            >
                                <div className="space-y-4 p-4">
                                    {/* Top Metadata */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                                        <Field className="col-span-1">
                                            <FieldLabel>
                                                AIP Reference Code
                                            </FieldLabel>

                                            <Input
                                                value={data?.full_code}
                                                readOnly
                                                disabled
                                                placeholder="AUTO-GENERATED"
                                            />
                                        </Field>

                                        <Field className="col-span-2">
                                            <FieldLabel>PPA Title</FieldLabel>

                                            <Input
                                                value={data?.name || ''}
                                                readOnly
                                                disabled
                                            />
                                        </Field>

                                        <div className="col-span-2">
                                            <Controller
                                                name="office_id"
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
                                                        <FieldLabel>
                                                            Office
                                                        </FieldLabel>

                                                        <Button
                                                            type="button"
                                                            onClick={() =>
                                                                setOpenOfficeComamnd(
                                                                    true,
                                                                )
                                                            }
                                                            variant="outline"
                                                        >
                                                            {offices.find(
                                                                (office) =>
                                                                    office.id ===
                                                                    Number(
                                                                        field.value,
                                                                    ),
                                                            )?.name ||
                                                                'No office selected'}
                                                        </Button>

                                                        <CommandDialog
                                                            open={
                                                                openOfficeComamnd
                                                            }
                                                            onOpenChange={
                                                                setOpenOfficeComamnd
                                                            }
                                                        >
                                                            <Command>
                                                                <CommandInput placeholder="Type to search..." />
                                                                <CommandList>
                                                                    <CommandGroup>
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead className="text-xs opacity-50">
                                                                                        Acronym
                                                                                    </TableHead>
                                                                                    <TableHead className="text-xs opacity-50">
                                                                                        Office
                                                                                        Name
                                                                                    </TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>

                                                                            <TableBody>
                                                                                {offices.map(
                                                                                    (
                                                                                        office,
                                                                                    ) => (
                                                                                        <TableRow
                                                                                            key={
                                                                                                office.id
                                                                                            }
                                                                                            onClick={() => {
                                                                                                field.onChange(
                                                                                                    String(
                                                                                                        office.id,
                                                                                                    ),
                                                                                                );

                                                                                                setOpenOfficeComamnd(
                                                                                                    false,
                                                                                                );
                                                                                            }}
                                                                                            className="cursor-pointer"
                                                                                        >
                                                                                            <TableCell className="font-medium">
                                                                                                {office.acronym ||
                                                                                                    '-'}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                <div className="text-wrap">
                                                                                                    {office?.name ||
                                                                                                        '-'}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ),
                                                                                )}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </CommandDialog>

                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    </Field>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Implementation Details */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <Controller
                                                name="expected_output"
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
                                                        <FieldLabel>
                                                            Expected Output
                                                        </FieldLabel>
                                                        <Textarea
                                                            {...field}
                                                            className="min-h-25"
                                                        />
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    </Field>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            {['start_date', 'end_date'].map(
                                                (key) => (
                                                    <Controller
                                                        key={key}
                                                        name={key as any}
                                                        control={form.control}
                                                        render={({ field }) => (
                                                            <Field>
                                                                <FieldLabel className="capitalize">
                                                                    {key.replace(
                                                                        '_',
                                                                        ' ',
                                                                    )}
                                                                </FieldLabel>
                                                                <Popover>
                                                                    <PopoverTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full justify-start text-left"
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {field.value
                                                                                ? format(
                                                                                      parseISO(
                                                                                          field.value,
                                                                                      ),
                                                                                      'PPP',
                                                                                  )
                                                                                : 'Select date'}
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={
                                                                                field.value
                                                                                    ? parseISO(
                                                                                          field.value,
                                                                                      )
                                                                                    : undefined
                                                                            }
                                                                            onSelect={(
                                                                                d,
                                                                            ) =>
                                                                                field.onChange(
                                                                                    d
                                                                                        ? format(
                                                                                              d,
                                                                                              'yyyy-MM-dd',
                                                                                          )
                                                                                        : '',
                                                                                )
                                                                            }
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </Field>
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* Funding Table */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold">
                                                Funding Distribution
                                            </h3>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    append({
                                                        funding_source_id: '',
                                                        ps_amount: '0.00',
                                                        mooe_amount: '0.00',
                                                        fe_amount: '0.00',
                                                        co_amount: '0.00',
                                                        ccet_adaptation: '0.00',
                                                        ccet_mitigation: '0.00',
                                                        cc_typology_code: '',
                                                    })
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />{' '}
                                                Add Fund Source
                                            </Button>
                                        </div>

                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[180px]">
                                                            Funding Source
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            PS
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            MOOE
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            FE
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            CO
                                                        </TableHead>
                                                        <TableHead className="bg-muted/30 text-right font-bold">
                                                            Total
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Adaptation
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Mitigation
                                                        </TableHead>
                                                        <TableHead className="w-[150px] text-left">
                                                            CC Typology Code
                                                        </TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {fields.map(
                                                        (field, index) => (
                                                            <TableRow
                                                                key={field.id}
                                                            >
                                                                <TableCell>
                                                                    <Controller
                                                                        name={`ppa_funding_sources.${index}.funding_source_id`}
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        render={({
                                                                            field: ctrl,
                                                                        }) => (
                                                                            <Select
                                                                                onValueChange={
                                                                                    ctrl.onChange
                                                                                }
                                                                                value={
                                                                                    ctrl.value
                                                                                }
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Source" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {fundingSources.map(
                                                                                        (
                                                                                            fs,
                                                                                        ) => {
                                                                                            const fsIdStr =
                                                                                                fs.id.toString();

                                                                                            // 1. Is this source used in any row in the whole table?
                                                                                            const isAlreadySelected =
                                                                                                selectedSourceIds.includes(
                                                                                                    fsIdStr,
                                                                                                );

                                                                                            // 2. Is this source the one currently picked in THIS specific row?
                                                                                            // (We use 'ctrl.value' because that's the local alias for this field)
                                                                                            const isSelectedInThisRow =
                                                                                                ctrl.value ===
                                                                                                fsIdStr;

                                                                                            return (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        fs.id
                                                                                                    }
                                                                                                    value={
                                                                                                        fsIdStr
                                                                                                    }
                                                                                                    // Disable if picked elsewhere, but keep it enabled for this row
                                                                                                    disabled={
                                                                                                        isAlreadySelected &&
                                                                                                        !isSelectedInThisRow
                                                                                                    }
                                                                                                >
                                                                                                    <div className="flex flex-col">
                                                                                                        <span>
                                                                                                            {
                                                                                                                fs.code
                                                                                                            }
                                                                                                        </span>
                                                                                                        {isAlreadySelected &&
                                                                                                            !isSelectedInThisRow && (
                                                                                                                <span className="text-[10px] text-muted-foreground italic">
                                                                                                                    Already
                                                                                                                    added
                                                                                                                </span>
                                                                                                            )}
                                                                                                    </div>
                                                                                                </SelectItem>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    />
                                                                </TableCell>

                                                                {(
                                                                    [
                                                                        'ps_amount',
                                                                        'mooe_amount',
                                                                        'fe_amount',
                                                                        'co_amount',
                                                                    ] as const
                                                                ).map((amt) => (
                                                                    <TableCell
                                                                        key={
                                                                            amt
                                                                        }
                                                                    >
                                                                        <Input
                                                                            value={
                                                                                watchedSources?.[
                                                                                    index
                                                                                ]?.[
                                                                                    amt
                                                                                ] ||
                                                                                '0.00'
                                                                            }
                                                                            readOnly
                                                                            className="pointer-events-none border-none text-right shadow-none"
                                                                        />
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="bg-muted/30">
                                                                    <Input
                                                                        value={calculateRowTotal(
                                                                            watchedSources?.[
                                                                                index
                                                                            ] ||
                                                                                {},
                                                                        ).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                        readOnly
                                                                        className="border-none text-right font-bold shadow-none"
                                                                    />
                                                                </TableCell>
                                                                {(
                                                                    [
                                                                        'ccet_adaptation',
                                                                        'ccet_mitigation',
                                                                    ] as const
                                                                ).map((amt) => (
                                                                    <TableCell
                                                                        key={
                                                                            amt
                                                                        }
                                                                    >
                                                                        <Input
                                                                            value={
                                                                                watchedSources?.[
                                                                                    index
                                                                                ]?.[
                                                                                    amt
                                                                                ] ||
                                                                                '0.00'
                                                                            }
                                                                            readOnly
                                                                            className="border-none text-right shadow-none"
                                                                        />
                                                                    </TableCell>
                                                                ))}

                                                                <TableCell>
                                                                    <Controller
                                                                        name={`ppa_funding_sources.${index}.cc_typology_code`}
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        render={({
                                                                            field: ctrl,
                                                                        }) => (
                                                                            <Input
                                                                                {...ctrl}
                                                                                value={
                                                                                    ctrl.value ||
                                                                                    ''
                                                                                }
                                                                                readOnly
                                                                                placeholder="---"
                                                                                className="pointer-events-none min-w-[120px] border-none text-left shadow-none"
                                                                            />
                                                                        )}
                                                                    />
                                                                </TableCell>

                                                                <TableCell className="text-center">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                disabled={
                                                                                    !isEdit ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]
                                                                                        ?.funding_source_id
                                                                                }
                                                                                title="Manage PPMP Items"
                                                                            >
                                                                                <ListPlus className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>
                                                                                Project
                                                                                Procurement
                                                                            </DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleGoToPpmp(
                                                                                        watchedSources[
                                                                                            index
                                                                                        ]
                                                                                            .funding_source_id,
                                                                                        'MOOE',
                                                                                    )
                                                                                }
                                                                            >
                                                                                Manage
                                                                                MOOE
                                                                                Items
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleGoToPpmp(
                                                                                        watchedSources[
                                                                                            index
                                                                                        ]
                                                                                            .funding_source_id,
                                                                                        'CO',
                                                                                    )
                                                                                }
                                                                            >
                                                                                Manage
                                                                                Capital
                                                                                Outlay
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            remove(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>

                                            <ScrollBar orientation="horizontal" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="aip-form"
                        disabled={isLoading || isFundingIncomplete}
                        className="min-w-[120px]"
                    >
                        {isLoading ? (
                            <>
                                <Spinner />
                                Saving...
                            </>
                        ) : isEdit ? (
                            'Save Changes'
                        ) : (
                            'Add Entry'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
