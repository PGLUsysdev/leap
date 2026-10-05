// resources\js\pages\aip\pdf-render\lbp-form-2\lbp-form-2-preview-dialog.tsx

import { useEffect, useMemo, useState } from 'react';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PdfPreviewPane } from '@/lib/pdf/pdf-preview-pane';
import { usePdfPreview } from '@/lib/pdf/use-pdf-preview';
import type { FiscalYear } from '@/types';
import type { LbpForm2Signatories } from './document';
import { emptySections } from './document';

export interface LbpForm2Data {
    fiscalYear: string;
    officeName: string;
    psRows: { path: string; title: string; amount: number }[];
    psTotal: number;
    mooeRows: { path: string; title: string; amount: number }[];
    mooeTotal: number;
    feRows: { path: string; title: string; amount: number }[];
    feTotal: number;
    coRows: { path: string; title: string; amount: number }[];
    coTotal: number;
    grandTotal: number;
}

interface LbpForm2PreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fiscalYear: FiscalYear | null;
    data: LbpForm2Data | null;
    isReloading?: boolean;
}

const emptySignatory = { name: '', position: '' };

const emptySignatories: LbpForm2Signatories = {
    prepared: { ...emptySignatory },
    reviewed: { ...emptySignatory },
    approved: { ...emptySignatory },
};

function SignatoryFields({
    title,
    prefix,
    name,
    position,
    onNameChange,
    onPositionChange,
    defaultPosition,
}: {
    title: string;
    prefix: string;
    name: string;
    position: string;
    onNameChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    defaultPosition: string;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`sig-${prefix}-name`}>Name</FieldLabel>
                    <Input
                        id={`sig-${prefix}-name`}
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={`sig-${prefix}-position`}>
                        Title / Position
                    </FieldLabel>
                    <Input
                        id={`sig-${prefix}-position`}
                        placeholder={defaultPosition}
                        value={position}
                        onChange={(e) => onPositionChange(e.target.value)}
                    />
                </Field>
            </FieldGroup>
        </div>
    );
}

export default function LbpForm2PreviewDialog({
    open,
    onOpenChange,
    fiscalYear,
    data,
    isReloading = false,
}: LbpForm2PreviewDialogProps) {
    const [preparedName, setPreparedName] = useState('');
    const [preparedPosition, setPreparedPosition] = useState('');
    const [reviewedName, setReviewedName] = useState('');
    const [reviewedPosition, setReviewedPosition] = useState('');
    const [approvedName, setApprovedName] = useState('');
    const [approvedPosition, setApprovedPosition] = useState('');

    const [debouncedSignatories, setDebouncedSignatories] =
        useState<LbpForm2Signatories>(emptySignatories);

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedSignatories({
                prepared: {
                    name: preparedName,
                    position: preparedPosition,
                },
                reviewed: {
                    name: reviewedName,
                    position: reviewedPosition,
                },
                approved: {
                    name: approvedName,
                    position: approvedPosition,
                },
            });
        }, 300);

        return () => clearTimeout(id);
    }, [
        preparedName,
        preparedPosition,
        reviewedName,
        reviewedPosition,
        approvedName,
        approvedPosition,
    ]);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setPreparedName('');
            setPreparedPosition('');
            setReviewedName('');
            setReviewedPosition('');
            setApprovedName('');
            setApprovedPosition('');
            setDebouncedSignatories(emptySignatories);
        }

        onOpenChange(nextOpen);
    }

    const payload = useMemo(
        () =>
            fiscalYear && data
                ? {
                      fiscalYear: data.fiscalYear || fiscalYear.year,
                      officeName: data.officeName,
                      signatories: debouncedSignatories,
                      sections: {
                          ps: { rows: data.psRows, total: data.psTotal },
                          mooe: {
                              rows: data.mooeRows ?? [],
                              total: data.mooeTotal,
                          },
                          fe: { rows: data.feRows ?? [], total: data.feTotal },
                          co: { rows: data.coRows ?? [], total: data.coTotal },
                      },
                  }
                : fiscalYear
                  ? {
                        fiscalYear: fiscalYear.year,
                        officeName: '',
                        signatories: debouncedSignatories,
                        sections: emptySections(),
                    }
                  : null,
        [fiscalYear, data, debouncedSignatories],
    );

    const { url, status } = usePdfPreview('lbp-form-2', payload);

    if (!open || !fiscalYear) {
        return null;
    }

    const busy = isReloading || status === 'generating';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>
                        LBP Form No. 2 Preview - {fiscalYear.year}
                    </DialogTitle>

                    <DialogDescription className="sr-only" />
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex w-[340px] shrink-0 flex-col gap-4 overflow-auto border-r p-4">
                        <SignatoryFields
                            title="Prepared by"
                            prefix="prepared"
                            name={preparedName}
                            position={preparedPosition}
                            onNameChange={setPreparedName}
                            onPositionChange={setPreparedPosition}
                            defaultPosition="Department Head"
                        />

                        <Separator />

                        <SignatoryFields
                            title="Reviewed by"
                            prefix="reviewed"
                            name={reviewedName}
                            position={reviewedPosition}
                            onNameChange={setReviewedName}
                            onPositionChange={setReviewedPosition}
                            defaultPosition="Local Budget Officer"
                        />

                        <Separator />

                        <SignatoryFields
                            title="Approved by"
                            prefix="approved"
                            name={approvedName}
                            position={approvedPosition}
                            onNameChange={setApprovedName}
                            onPositionChange={setApprovedPosition}
                            defaultPosition="Local Chief Executive"
                        />
                    </div>

                    <div className="relative flex-1">
                        <PdfPreviewPane
                            url={url}
                            status={status}
                            busy={busy}
                            title={`LBP Form No. 2 Preview ${fiscalYear.year}`}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
