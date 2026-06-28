import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from '@inertiajs/react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    Office,
    FiscalYear,
    PlantillaPosition,
    GovSalarySchedule,
} from '@/types/global';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
    office_id: z.string().min(1, 'Office is required'),
    fiscal_year_id: z.string().min(1, 'Fiscal year is required'),
    item_number: z.string().min(1, 'Item number is required'),
    position_title: z.string().min(1, 'Position title is required'),
    incumbent_name: z.string().nullable().optional(),
    position_type: z.enum(['permanent', 'casual', 'contractual', 'coterminous']),
    current_sg: z.string().min(1, 'Current SG is required'),
    current_step: z.string().min(1, 'Current step is required'),
    budget_sg: z.string().min(1, 'Budget SG is required'),
    budget_step: z.string().min(1, 'Budget step is required'),
    remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: PlantillaPosition | null;
    offices: Office[];
    fiscalYears: FiscalYear[];
    govSalarySchedules: GovSalarySchedule[];
}

const currency = (value: number | null) =>
    value != null
        ? value.toLocaleString('en-US', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 2,
          })
        : '—';

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    fiscalYears,
    govSalarySchedules,
}: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            office_id: '',
            fiscal_year_id: '',
            item_number: '',
            position_title: '',
            incumbent_name: null,
            position_type: 'permanent',
            current_sg: '',
            current_step: '',
            budget_sg: '',
            budget_step: '',
            remarks: '',
        },
    });

    const { watch } = form;
    const fiscalYearId = watch('fiscal_year_id');
    const currentSg = watch('current_sg');
    const currentStep = watch('current_step');
    const budgetSg = watch('budget_sg');
    const budgetStep = watch('budget_step');

    const currentAnnualRate = useMemo(() => {
        if (!fiscalYearId || !currentSg || !currentStep) return null;
        const match = govSalarySchedules.find(
            (s) =>
                s.fiscal_year_id === Number(fiscalYearId) &&
                s.salary_grade === Number(currentSg) &&
                s.step === Number(currentStep),
        );
        return match ? Number(match.annual_rate) : null;
    }, [fiscalYearId, currentSg, currentStep, govSalarySchedules]);

    const budgetAnnualRate = useMemo(() => {
        if (!fiscalYearId || !budgetSg || !budgetStep) return null;
        const match = govSalarySchedules.find(
            (s) =>
                s.fiscal_year_id === Number(fiscalYearId) &&
                s.salary_grade === Number(budgetSg) &&
                s.step === Number(budgetStep),
        );
        return match ? Number(match.annual_rate) : null;
    }, [fiscalYearId, budgetSg, budgetStep, govSalarySchedules]);

    const salaryGrades = useMemo(() => {
        const grades = new Set(govSalarySchedules.map((s) => s.salary_grade));
        return [...grades].sort((a, b) => a - b);
    }, [govSalarySchedules]);

    const steps = useMemo(() => {
        const st = new Set(govSalarySchedules.map((s) => s.step));
        return [...st].sort((a, b) => a - b);
    }, [govSalarySchedules]);

    useEffect(() => {
        if (data) {
            form.reset({
                office_id: String(data.office_id),
                fiscal_year_id: String(data.fiscal_year_id),
                item_number: data.item_number,
                position_title: data.position_title,
                incumbent_name: data.incumbent_name,
                position_type: data.position_type,
                current_sg: String(data.current_sg),
                current_step: String(data.current_step),
                budget_sg: String(data.budget_sg),
                budget_step: String(data.budget_step),
                remarks: data.remarks ?? '',
            });
        } else {
            form.reset({
                office_id: '',
                fiscal_year_id: '',
                item_number: '',
                position_title: '',
                incumbent_name: null,
                position_type: 'permanent',
                current_sg: '',
                current_step: '',
                budget_sg: '',
                budget_step: '',
                remarks: '',
            });
        }
    }, [data, form]);

    function handleSubmit(values: FormValues) {
        const payload = {
            office_id: Number(values.office_id),
            fiscal_year_id: Number(values.fiscal_year_id),
            item_number: values.item_number,
            position_title: values.position_title,
            incumbent_name: values.incumbent_name,
            position_type: values.position_type,
            current_sg: Number(values.current_sg),
            current_step: Number(values.current_step),
            current_annual_rate: currentAnnualRate ?? 0,
            budget_sg: Number(values.budget_sg),
            budget_step: Number(values.budget_step),
            budget_annual_rate: budgetAnnualRate ?? 0,
            remarks: values.remarks || null,
        };

        if (data) {
            router.patch(`/plantilla-position/${data.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        } else {
            router.post('/plantilla-position', payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        }
    }

    const onSubmit = form.handleSubmit(handleSubmit);
    const isEditing = !!data;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Position' : 'Add New Position'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? `Update details for ${data?.position_title}.`
                            : 'Fill in the details to add a new plantilla position.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        <form
                            id="plantilla-form"
                            onSubmit={onSubmit}
                            className="space-y-4"
                        >
                            <Controller
                                name="office_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Office
                                        </FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <SelectValue placeholder="Select office" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {offices.map((office) => (
                                                    <SelectItem
                                                        key={office.id}
                                                        value={String(
                                                            office.id,
                                                        )}
                                                    >
                                                        {office.acronym
                                                            ? `${office.acronym} — ${office.name}`
                                                            : office.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="fiscal_year_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Fiscal Year
                                        </FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <SelectValue placeholder="Select fiscal year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fiscalYears.map((fy) => (
                                                    <SelectItem
                                                        key={fy.id}
                                                        value={String(fy.id)}
                                                    >
                                                        {fy.year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="item_number"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Item Number
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            {...field}
                                            placeholder="e.g. 001"
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
                                name="position_title"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Position Title
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            {...field}
                                            placeholder="e.g. Administrative Aide I"
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
                                name="incumbent_name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Incumbent Name
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            {...field}
                                            placeholder="Type 'Vacant' if none"
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
                                name="position_type"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Position Type
                                        </FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="permanent">
                                                    Permanent
                                                </SelectItem>
                                                <SelectItem value="casual">
                                                    Casual
                                                </SelectItem>
                                                <SelectItem value="contractual">
                                                    Contractual
                                                </SelectItem>
                                                <SelectItem value="coterminous">
                                                    Coterminous
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />

                            <div className="rounded-lg border p-4">
                                <h4 className="mb-3 text-sm font-medium">
                                    Current Year
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="current_sg"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Salary Grade
                                                </FieldLabel>
                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue placeholder="SG" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {salaryGrades.map(
                                                            (sg) => (
                                                                <SelectItem
                                                                    key={sg}
                                                                    value={String(
                                                                        sg,
                                                                    )}
                                                                >
                                                                    SG {sg}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
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
                                        name="current_step"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Step
                                                </FieldLabel>
                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue placeholder="Step" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {steps.map((st) => (
                                                            <SelectItem
                                                                key={st}
                                                                value={String(
                                                                    st,
                                                                )}
                                                            >
                                                                Step {st}
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
                                            </Field>
                                        )}
                                    />
                                </div>
                                <div className="mt-3">
                                    <Field>
                                        <FieldLabel>Annual Rate</FieldLabel>
                                        <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm text-muted-foreground tabular-nums">
                                            {currency(currentAnnualRate)}
                                        </div>
                                    </Field>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h4 className="mb-3 text-sm font-medium">
                                    Budget Year
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="budget_sg"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Salary Grade
                                                </FieldLabel>
                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue placeholder="SG" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {salaryGrades.map(
                                                            (sg) => (
                                                                <SelectItem
                                                                    key={sg}
                                                                    value={String(
                                                                        sg,
                                                                    )}
                                                                >
                                                                    SG {sg}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
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
                                        name="budget_step"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Step
                                                </FieldLabel>
                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue placeholder="Step" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {steps.map((st) => (
                                                            <SelectItem
                                                                key={st}
                                                                value={String(
                                                                    st,
                                                                )}
                                                            >
                                                                Step {st}
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
                                            </Field>
                                        )}
                                    />
                                </div>
                                <div className="mt-3">
                                    <Field>
                                        <FieldLabel>Annual Rate</FieldLabel>
                                        <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm text-muted-foreground tabular-nums">
                                            {currency(budgetAnnualRate)}
                                        </div>
                                    </Field>
                                </div>
                            </div>

                            <Controller
                                name="remarks"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Remarks
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            {...field}
                                            placeholder="e.g. Promotion, New hire"
                                        />
                                    </Field>
                                )}
                            />
                        </form>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="plantilla-form"
                        disabled={form.formState.isSubmitting}
                    >
                        {isEditing ? 'Save Changes' : 'Add Position'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
