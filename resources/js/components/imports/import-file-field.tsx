import type { ChangeEvent, ReactNode } from 'react';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const XLSX_ACCEPT =
    '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface ImportFileFieldProps {
    id: string;
    label?: string;
    description?: ReactNode;
    error?: string | null;
    loading?: boolean;
    accept?: string;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ImportFileField({
    id,
    label = 'Excel File (.xlsx only)',
    description = 'Select an .xlsx file. Only .xlsx is accepted (ExcelJS).',
    error,
    loading = false,
    accept = XLSX_ACCEPT,
    onFileChange,
}: ImportFileFieldProps) {
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
                id={id}
                type="file"
                accept={accept}
                onChange={onFileChange}
                disabled={loading}
            />
            <FieldDescription>{description}</FieldDescription>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {loading && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Spinner /> Parsing workbook...
                </div>
            )}
        </Field>
    );
}
