import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch, useFormState } from 'react-hook-form';
import * as z from 'zod';
import DataTable from '@/components/base-ui-components/data-table';
import { DatePicker } from '@/components/base-ui-components/date-picker';
import {
    TableSelect,
    TableSelectButton,
    useTableSelect,
} from '@/components/base-ui-components/table-select';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import { Card, CardContent } from '@/components/base-ui-components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/base-ui-components/ui/dialog';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { Separator } from '@/components/base-ui-components/ui/separator';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import { Textarea } from '@/components/base-ui-components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { index } from '@/routes/aip/summary/ppmp';
import { store, destroy } from '@/routes/aip-entries/ppa-funding-sources';
import { update } from '@/routes/aip-entry';
import type { AipEntry, FundingSource, Office } from '@/types';
import fundingSourceColumns from './columns/funding-source-columns';
import officeColumns from './columns/office-columns';
import ppaFundingSourceColumns from './columns/ppa-funding-source-columns';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: AipEntry;
    offices?: Office[];
    fundingSources?: FundingSource[];
    fiscalYearId: number;
}

interface PageProps {
    newAipEntries?: AipEntry[];
}

const formSchema = z.object({
    officeId: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    expectedOutput: z.string().trim(),
});

function toDate(isoDate: string | null | undefined) {
    return isoDate ? new Date(isoDate) : undefined;
}

function toIsoDate(date: Date | undefined) {
    return date ? date.toISOString().slice(0, 10) : null;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    fundingSources,
    fiscalYearId,
}: FormDialogProps) {
    // # TODO
    // - [ ] there's still no indicator for the onError state

    console.log({
        // open,
        // onOpenChange,
        // data,
        fiscalYearId,
    });

    const [openAlertDelete, setOpenAlertDelete] = useState(false);
    const [selectedFsId, setSelectedFsId] = useState<number | null>(null);
    const [loadingState, setLoadingState] = useState<
        'idle' | 'saving' | 'saved'
    >('idle');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            officeId: '',
            startDate: undefined,
            endDate: undefined,
            expectedOutput: '',
        },
    });

    const { isDirty } = useFormState({ control: form.control });

    const watchOfficeId = useWatch({ control: form.control, name: 'officeId' });

    const officeHook = useTableSelect({
        data: offices ?? [],
        value: watchOfficeId ? String(watchOfficeId) : undefined,
    });

    const fundingSourceHook = useTableSelect({
        data: fundingSources ?? [],
        value: undefined,
    });

    useEffect(() => {
        if (!open) return;

        form.reset({
            officeId:
                data?.ppa?.office_id != null ? String(data.ppa.office_id) : '',
            startDate: toDate(data?.start_date) ?? undefined,
            endDate: toDate(data?.end_date) ?? undefined,
            expectedOutput: data?.expected_output ?? '',
        });
    }, [open, form, data]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (data?.id == null) return;

        const payload = {
            ...values,
            office: values.officeId === '' ? null : Number(values.officeId),
            startDate: toIsoDate(values.startDate),
            endDate: toIsoDate(values.endDate),
        };

        console.log(payload);

        router.visit(update(data?.id).url, {
            data: payload,
            method: 'patch',
            preserveState: true,
            preserveScroll: true,
            onStart: () => {
                setLoadingState('saving');
            },
            onSuccess: () => {
                setLoadingState('saved');
            },
            onError: (errors) => {
                setLoadingState('idle');
                console.error(errors);
            },
        });
    }

    function availableFundingSources() {
        const existingIds = new Set(
            data?.ppa_funding_sources?.map((fs) => fs.funding_source_id) ?? [],
        );

        return (fundingSources ?? []).filter((fs) => !existingIds.has(fs.id));
    }

    function handleAddFundingSource(fs: FundingSource) {
        const entryId = data?.id;

        if (!entryId) {
            console.warn('no id');

            return;
        }

        const tempRow = {
            id: Date.now(),
            funding_source_id: fs.id,
            ps_amount: '0.00',
            mooe_amount: '0.00',
            fe_amount: '0.00',
            co_amount: '0.00',
            ccet_adaptation: '0.00',
            ccet_mitigation: '0.00',
            cc_typology_id: null,
            funding_source: {
                // id: fs.id,
                code: fs.code,
            },
            isOptimistic: true,
        } as any;

        router
            .optimistic((props: PageProps) => {
                const entries: AipEntry[] = props.newAipEntries || [];

                const updatedEntries = entries.map((entry) => {
                    if (entry.id === entryId) {
                        return {
                            ...entry,
                            ppa_funding_sources: [
                                ...(entry.ppa_funding_sources || []),
                                tempRow,
                            ],
                        };
                    }

                    return entry;
                });

                return { newAipEntries: updatedEntries };
            })
            .post(
                store(entryId).url,
                {
                    funding_source_id: fs.id, // - [ ] make this required in db
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onStart: () => {
                        setLoadingState('saving');
                    },
                    onSuccess: () => {
                        setLoadingState('saved');
                    },
                    onError: (errors) => {
                        setLoadingState('idle');
                        console.error(errors);
                    },
                },
            );
    }

    function onDeleteFundingSource(sourceId: number) {
        setSelectedFsId(sourceId);
        setOpenAlertDelete(true);
    }

    function handleDeleteFundingSource(sourceId: number | null) {
        const entryId = data?.id;

        if (!entryId || sourceId === null) {
            console.warn('error');

            return;
        }

        router
            .optimistic((props: PageProps) => {
                const entries = props.newAipEntries || [];

                const updatedEntries = entries.map((entry) => {
                    if (entry.id === entryId) {
                        return {
                            ...entry,
                            ppa_funding_sources:
                                entry.ppa_funding_sources?.filter(
                                    (fs: any) => fs.id !== sourceId,
                                ),
                        };
                    }

                    return entry;
                });

                return { newAipEntries: updatedEntries };
            })
            .delete(destroy([entryId, sourceId]).url, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    setLoadingState('saving');
                },
                onSuccess: () => {
                    setLoadingState('saved');
                },
                onError: (errors) => {
                    setLoadingState('idle');
                    console.error(errors);
                },
            });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden px-0 sm:max-w-[80rem]">
                    <DialogHeader className="flex-none px-4 pb-2">
                        <DialogTitle>Edit AIP Entry</DialogTitle>
                        <DialogDescription>
                            Update the office, implementation period, and
                            expected output for this entry. Add or remove
                            funding sources with their amounts below.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(100vh-240px)]">
                        <form
                            id="form-dialog"
                            onSubmit={form.handleSubmit(onSubmit)}
                            // className="px-4"
                            className="flex-none px-4"
                        >
                            <div className="flex flex-col gap-5">
                                <div className="pt-2">
                                    <Card>
                                        <CardContent>
                                            <div className="slashed-zero tabular-nums">
                                                aip reference code
                                            </div>
                                            <div className="text-base font-bold">
                                                {data?.ppa?.name}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <Controller
                                        name="expectedOutput"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="form-dialog-expected-output">
                                                    Expected Output
                                                </FieldLabel>

                                                <Textarea
                                                    {...field}
                                                    id="form-dialog-expected-output"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="expected output"
                                                    className="min-h-[190px] w-full"
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

                                    <div className="flex flex-col gap-5">
                                        <Controller
                                            name="officeId"
                                            control={form.control}
                                            render={({
                                                // field,
                                                fieldState,
                                            }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel htmlFor="form-dialog-office">
                                                        Implementing Office /
                                                        Department / Location
                                                    </FieldLabel>

                                                    <TableSelectButton
                                                        invalid={
                                                            fieldState.invalid
                                                        }
                                                        hook={officeHook}
                                                        displayValue={(item) =>
                                                            item?.acronym ??
                                                            undefined
                                                        }
                                                        placeholder="Select office"
                                                        onClear={() =>
                                                            form.setValue(
                                                                'officeId',
                                                                '',
                                                                {
                                                                    shouldDirty:
                                                                        watchOfficeId !==
                                                                        '',
                                                                },
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
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="startDate"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel htmlFor="form-dialog-starting-date">
                                                        Starting Date
                                                    </FieldLabel>

                                                    <div className="w-full [&>button]:w-full">
                                                        <DatePicker
                                                            year={new Date().getFullYear()}
                                                            value={
                                                                field.value ||
                                                                undefined
                                                            }
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            invalid={
                                                                fieldState.invalid
                                                            }
                                                        />
                                                    </div>

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
                                            name="endDate"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel htmlFor="form-dialog-starting-date">
                                                        Completion Date
                                                    </FieldLabel>

                                                    <div className="w-full [&>button]:w-full">
                                                        <DatePicker
                                                            year={new Date().getFullYear()}
                                                            value={
                                                                field.value ||
                                                                undefined
                                                            }
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            invalid={
                                                                fieldState.invalid
                                                            }
                                                        />
                                                    </div>

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
                                    </div>
                                </div>
                            </div>
                        </form>

                        <Separator className="mt-4" />

                        <DataTable
                            columns={ppaFundingSourceColumns}
                            data={data?.ppa_funding_sources ?? []}
                            className="pr-2"
                            meta={{
                                onDelete: onDeleteFundingSource,
                                disabled: isDirty,
                                onOpenPpmp: (fsId: number) => {
                                    const entryId = data?.id;

                                    if (!entryId) return;

                                    router.visit(
                                        index([fiscalYearId, entryId, fsId])
                                            .url,
                                        {
                                            method: 'get',
                                        },
                                    );
                                },
                            }}
                        >
                            <div className="flex gap-1">
                                <Button
                                    onClick={() =>
                                        fundingSourceHook.setOpen(true)
                                    }
                                    disabled={isDirty}
                                >
                                    Add Funding Source
                                </Button>
                                <Button>LBP Form 2</Button>
                            </div>
                        </DataTable>

                        <ScrollBar orientation="vertical" />
                    </ScrollArea>

                    <DialogFooter className="mx-0 items-center sm:justify-between">
                        <Badge
                            variant={
                                loadingState === 'saving'
                                    ? 'secondary'
                                    : isDirty
                                      ? 'destructive'
                                      : 'ghost'
                            }
                        >
                            {loadingState === 'saving' && (
                                <>
                                    <Spinner /> Saving…
                                </>
                            )}
                            {loadingState !== 'saving' && isDirty && (
                                <>
                                    {/*<CircleX /> Unsaved changes*/}
                                    <X /> Unsaved changes
                                </>
                            )}
                            {loadingState !== 'saving' && !isDirty && (
                                <>
                                    {/*<CircleCheck /> Saved*/}
                                    <Check /> Saved
                                </>
                            )}
                        </Badge>

                        <div className="flex gap-1">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => {
                                    form.reset({
                                        officeId:
                                            data?.ppa?.office_id != null
                                                ? String(data.ppa.office_id)
                                                : '',
                                        startDate:
                                            toDate(data?.start_date) ??
                                            undefined,
                                        endDate:
                                            toDate(data?.end_date) ?? undefined,
                                        expectedOutput:
                                            data?.expected_output ?? '',
                                    });
                                }}
                                disabled={!isDirty || loadingState === 'saving'}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={loadingState === 'saving'}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="form-dialog"
                                disabled={!isDirty || loadingState === 'saving'}
                            >
                                Save
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TableSelect<Office>
                data={offices ?? []}
                columns={officeColumns}
                open={officeHook.open}
                onOpenChange={officeHook.setOpen}
                onRowSelect={(row) => {
                    form.setValue('officeId', String(row.id), {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }}
                value={officeHook.value}
                valueKey="id"
                className="sm:max-w-[30rem]"
            />

            <TableSelect<FundingSource>
                data={availableFundingSources() ?? []}
                // data={fundingSources ?? []}
                columns={fundingSourceColumns}
                open={fundingSourceHook.open}
                onOpenChange={fundingSourceHook.setOpen}
                onRowSelect={(row) => {
                    fundingSourceHook.setOpen(false);
                    handleAddFundingSource(row);
                }}
                value={fundingSourceHook.value}
                valueKey="id"
                className="sm:max-w-[40rem]"
            />

            <AlertDialog
                open={openAlertDelete}
                onOpenChange={setOpenAlertDelete}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete funding source{' '}
                            {data?.ppa_funding_sources?.find(
                                (fs) => fs.id === selectedFsId,
                            )?.funding_source?.code ?? ''}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The following data
                            will be permanently deleted:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>
                            This funding source allocation (PS, MOOE, FE, CO ,
                            CCET amounts)
                        </li>
                        <li>
                            All PPMP line items assigned to this funding source
                        </li>
                        <li>
                            All PS breakdown entries for this funding source
                        </li>
                    </ul>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() =>
                                handleDeleteFundingSource(selectedFsId)
                            }
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
