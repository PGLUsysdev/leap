import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
import { destroy, store, update } from '@/routes/aip-outputs';
import type { AipEntry, AipOutput, FundingSource, Office } from '@/types';
import officeColumns from './columns/office-columns';
import outputColumns from './columns/output-columns';
import OutputFundingSourcesDialog from './output-funding-sources-dialog';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: AipEntry;
    offices?: Office[];
    fundingSources?: FundingSource[];
    fiscalYearId: number;
}

const outputFormSchema = z.object({
    officeId: z.string().min(1),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    expectedOutput: z.string(),
});

type OutputFormValues = z.infer<typeof outputFormSchema>;

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
    const [loadingState, setLoadingState] = useState<
        'idle' | 'saving' | 'saved'
    >('idle');

    // Inline add/edit panel state
    const [isAdding, setIsAdding] = useState(false);
    const [editingOutputId, setEditingOutputId] = useState<number | null>(null);

    // Delete-output confirmation state
    const [deleteOutputId, setDeleteOutputId] = useState<number | null>(null);
    const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

    // Per-output funding sources dialog state
    const [selectedOutput, setSelectedOutput] = useState<AipOutput | null>(
        null,
    );
    const [openFundingDialog, setOpenFundingDialog] = useState(false);

    const form = useForm<OutputFormValues>({
        resolver: zodResolver(outputFormSchema),
        defaultValues: {
            officeId: '',
            startDate: undefined,
            endDate: undefined,
            expectedOutput: '',
        },
    });

    const watchOfficeId = useWatch({ control: form.control, name: 'officeId' });

    const officeHook = useTableSelect({
        data: offices ?? [],
        value: watchOfficeId ? String(watchOfficeId) : undefined,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        if (editingOutputId !== null) {
            const output = data?.outputs?.find((o) => o.id === editingOutputId);

            if (output) {
                form.reset({
                    officeId:
                        output.office_id != null
                            ? String(output.office_id)
                            : '',
                    startDate: toDate(output.start_date),
                    endDate: toDate(output.end_date),
                    expectedOutput: output.expected_output ?? '',
                });

                return;
            }
        }

        form.reset({
            officeId:
                data?.ppa?.office_id != null ? String(data.ppa.office_id) : '',
            startDate: undefined,
            endDate: undefined,
            expectedOutput: '',
        });
    }, [open, form, data, editingOutputId]);

    function cancelEdit() {
        setIsAdding(false);
        setEditingOutputId(null);
    }

    function handleAddOutput() {
        setIsAdding(true);
        setEditingOutputId(null);

        form.reset({
            officeId:
                data?.ppa?.office_id != null ? String(data.ppa.office_id) : '',
            startDate: undefined,
            endDate: undefined,
            expectedOutput: '',
        });
    }

    function handleEditOutput(output: AipOutput) {
        setIsAdding(false);
        setEditingOutputId(output.id);
    }

    function handleDeleteOutput(output: AipOutput) {
        setDeleteOutputId(output.id);
        setOpenDeleteAlert(true);
    }

    function onSubmitOutput(values: OutputFormValues) {
        if (!data) {
            return;
        }

        const payload = {
            office_id: Number(values.officeId),
            start_date: toIsoDate(values.startDate),
            end_date: toIsoDate(values.endDate),
            expected_output: values.expectedOutput.trim() || null,
        };

        const isEditing = editingOutputId !== null;

        setLoadingState('saving');

        router.visit(
            isEditing
                ? update({ aipOutput: editingOutputId }).url
                : store({ aipEntry: data.id }).url,
            {
                method: isEditing ? 'patch' : 'post',
                data: payload,
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingState('saved');
                    cancelEdit();
                },
                onError: (errors) => {
                    setLoadingState('idle');
                    console.error(errors);
                },
            },
        );
    }

    function confirmDeleteOutput() {
        if (deleteOutputId === null) {
            return;
        }

        setLoadingState('saving');

        router.delete(destroy({ aipOutput: deleteOutputId }).url, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLoadingState('saved');
                setOpenDeleteAlert(false);
                setDeleteOutputId(null);
            },
            onError: (errors) => {
                setLoadingState('idle');
                setOpenDeleteAlert(false);
                console.error(errors);
            },
        });
    }

    // Derive the live output so server refreshes keep the dialog current.
    const liveSelectedOutput =
        selectedOutput != null
            ? (data?.outputs?.find((o) => o.id === selectedOutput.id) ?? null)
            : null;

    const outputs: AipOutput[] = data?.outputs ?? [];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden px-0 sm:max-w-[80rem]">
                    <DialogHeader className="flex-none px-4 pb-2">
                        <DialogTitle>Manage Expected Outputs</DialogTitle>
                        <DialogDescription>
                            Add, edit, or remove the expected outputs for this
                            entry. Each output has its own implementing office,
                            schedule, and funding sources.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(100vh-240px)]">
                        <div className="px-4">
                            <div className="pt-2">
                                <Card>
                                    <CardContent>
                                        <div className="slashed-zero tabular-nums">
                                            aip reference code
                                        </div>
                                        <div className="text-base font-bold">
                                            {data?.ppa?.full_code}
                                        </div>
                                        <div>{data?.ppa?.name}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {(isAdding || editingOutputId !== null) && (
                                <>
                                    <Separator className="my-4" />

                                    <form
                                        id="output-form"
                                        onSubmit={form.handleSubmit(
                                            onSubmitOutput,
                                        )}
                                        className="rounded-md border p-4"
                                    >
                                        <h4 className="mb-3 font-semibold">
                                            {editingOutputId !== null
                                                ? 'Edit Output'
                                                : 'New Output'}
                                        </h4>

                                        <div className="flex flex-col gap-5">
                                            <Controller
                                                name="expectedOutput"
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
                                                        <FieldLabel htmlFor="output-form-expected-output">
                                                            Expected Output
                                                        </FieldLabel>

                                                        <Textarea
                                                            {...field}
                                                            id="output-form-expected-output"
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            placeholder="expected output"
                                                            className="min-h-[100px] w-full"
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

                                            <div className="grid grid-cols-3 gap-5">
                                                <Controller
                                                    name="officeId"
                                                    control={form.control}
                                                    render={({
                                                        fieldState,
                                                    }) => (
                                                        <Field
                                                            data-invalid={
                                                                fieldState.invalid
                                                            }
                                                        >
                                                            <FieldLabel htmlFor="output-form-office">
                                                                Implementing
                                                                Office /
                                                                Department /
                                                                Location
                                                            </FieldLabel>

                                                            <TableSelectButton
                                                                invalid={
                                                                    fieldState.invalid
                                                                }
                                                                hook={
                                                                    officeHook
                                                                }
                                                                displayValue={(
                                                                    item,
                                                                ) =>
                                                                    item?.acronym ??
                                                                    undefined
                                                                }
                                                                placeholder="Select office"
                                                                onClear={() =>
                                                                    form.setValue(
                                                                        'officeId',
                                                                        '',
                                                                        {
                                                                            shouldValidate: true,
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

                                            <div className="flex gap-1">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        loadingState ===
                                                        'saving'
                                                    }
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    disabled={
                                                        loadingState ===
                                                        'saving'
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            )}

                            <Separator className="my-4" />

                            <DataTable
                                columns={outputColumns}
                                data={outputs}
                                className="pr-2"
                                showFooter={false}
                                withRowSpan={false}
                                meta={{
                                    disabled: loadingState === 'saving',
                                    onEditOutput: handleEditOutput,
                                    onDeleteOutput: handleDeleteOutput,
                                    onEditFundingSources: (o: AipOutput) => {
                                        setSelectedOutput(o);
                                        setOpenFundingDialog(true);
                                    },
                                }}
                            >
                                <Button
                                    onClick={handleAddOutput}
                                    disabled={
                                        isAdding ||
                                        editingOutputId !== null ||
                                        loadingState === 'saving'
                                    }
                                >
                                    <Plus className="mr-1 h-4 w-4" /> Add Output
                                </Button>
                            </DataTable>

                            <ScrollBar orientation="vertical" />
                        </div>
                    </ScrollArea>

                    <DialogFooter className="mx-0 items-center sm:justify-between">
                        <Badge
                            variant={
                                loadingState === 'saving'
                                    ? 'secondary'
                                    : 'ghost'
                            }
                        >
                            {loadingState === 'saving' && (
                                <>
                                    <Spinner /> Saving…
                                </>
                            )}
                            {loadingState !== 'saving' && (
                                <>
                                    <Check /> Saved
                                </>
                            )}
                        </Badge>

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loadingState === 'saving'}
                        >
                            Close
                        </Button>
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
                    });
                }}
                value={officeHook.value}
                valueKey="id"
                className="sm:max-w-[30rem]"
            />

            <AlertDialog
                open={openDeleteAlert}
                onOpenChange={setOpenDeleteAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete output?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The following data
                            will be permanently deleted:
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>This expected output</li>
                        <li>All of its funding source allocations</li>
                        <li>
                            All PPMP line items and PS breakdown entries under
                            those allocations
                        </li>
                    </ul>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteOutput}
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <OutputFundingSourcesDialog
                open={openFundingDialog}
                onOpenChange={setOpenFundingDialog}
                output={liveSelectedOutput}
                fundingSources={fundingSources}
                fiscalYearId={fiscalYearId}
            />
        </>
    );
}
