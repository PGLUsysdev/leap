// resources\js\pages\aip-summary\export-to-pdf-dialog.tsx

import { useEffect, useMemo, useState } from 'react';
import {
    Field,
    FieldGroup,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
import { Separator } from '@/components/base-ui-components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PdfPreviewPane } from '@/lib/pdf/pdf-preview-pane';
import { usePdfPreview } from '@/lib/pdf/use-pdf-preview';
import type { AipEntry, FiscalYear } from '@/types';

interface ExportToPdfDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    aipEntries: AipEntry[];
    fiscalYear: FiscalYear;
    officeName: string;
    currentScope?: { scope: string; supplemental_aip_id: number | null };
}

export default function ExportToPdfDialog({
    open,
    onOpenChange,
    aipEntries,
    fiscalYear,
    officeName,
    currentScope,
}: ExportToPdfDialogProps) {
    const scopeKey = currentScope?.scope;
    const scopeSupplementalId = currentScope?.supplemental_aip_id;

    const defaultConformePosition = '-';

    const [preparedName, setPreparedName] = useState('');
    const [preparedPosition, setPreparedPosition] = useState(
        "Provincial Planning & Dev't Coordinator",
    );
    const [reviewedName, setReviewedName] = useState('');
    const [reviewedPosition, setReviewedPosition] = useState(
        'OIC-Provincial Budget Officer',
    );
    const [approvedName, setApprovedName] = useState('');
    const [approvedPosition, setApprovedPosition] = useState(
        'Provincial Governor',
    );
    const [conformeName, setConformeName] = useState('');
    const [conformePosition, setConformePosition] = useState(
        defaultConformePosition,
    );

    const [debouncedSignatories, setDebouncedSignatories] = useState({
        preparedName: '',
        preparedPosition: "Provincial Planning & Dev't Coordinator",
        reviewedName: '',
        reviewedPosition: 'OIC-Provincial Budget Officer',
        approvedName: '',
        approvedPosition: 'Provincial Governor',
        conformeName: '',
        conformePosition: defaultConformePosition,
    });

    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedSignatories({
                preparedName,
                preparedPosition,
                reviewedName,
                reviewedPosition,
                approvedName,
                approvedPosition,
                conformeName,
                conformePosition,
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
        conformeName,
        conformePosition,
    ]);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setPreparedName('');
            setPreparedPosition("Provincial Planning & Dev't Coordinator");
            setReviewedName('');
            setReviewedPosition('OIC-Provincial Budget Officer');
            setApprovedName('');
            setApprovedPosition('Provincial Governor');
            setConformeName('');
            setConformePosition(defaultConformePosition);
            setDebouncedSignatories({
                preparedName: '',
                preparedPosition: "Provincial Planning & Dev't Coordinator",
                reviewedName: '',
                reviewedPosition: 'OIC-Provincial Budget Officer',
                approvedName: '',
                approvedPosition: 'Provincial Governor',
                conformeName: '',
                conformePosition: defaultConformePosition,
            });
        }

        onOpenChange(nextOpen);
    }

    // Built from primitive-stable dependencies so an unstable parent-side
    // object identity cannot trigger needless worker regenerations.
    const payload = useMemo(
        () =>
            open
                ? {
                      aipEntries,
                      fiscalYear,
                      officeName,
                      currentScope:
                          scopeKey === undefined
                              ? undefined
                              : {
                                    scope: scopeKey,
                                    supplemental_aip_id:
                                        scopeSupplementalId ?? null,
                                },
                      signatories: debouncedSignatories,
                  }
                : null,
        [
            open,
            aipEntries,
            fiscalYear,
            officeName,
            scopeKey,
            scopeSupplementalId,
            debouncedSignatories,
        ],
    );
    const { url, status } = usePdfPreview('aip-summary', payload);

    if (!open) {
        return null;
    }

    const busy = status === 'generating';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>
                        PDF Preview - AIP Summary {fiscalYear.year}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        AIP Summary Report Preview
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    <div className="bg-background flex w-[360px] shrink-0 flex-col gap-4 overflow-auto border-r p-4">
                        <FieldGroup>
                            <div className="text-sm font-semibold">
                                Prepared by
                            </div>
                            <Field>
                                <FieldLabel htmlFor="sig-prepared-name">
                                    Name
                                </FieldLabel>
                                <Input
                                    id="sig-prepared-name"
                                    placeholder="Enter name"
                                    value={preparedName}
                                    onChange={(e) =>
                                        setPreparedName(e.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-prepared-position">
                                    Position
                                </FieldLabel>
                                <Input
                                    id="sig-prepared-position"
                                    placeholder="Provincial Planning & Dev't Coordinator"
                                    value={preparedPosition}
                                    onChange={(e) =>
                                        setPreparedPosition(e.target.value)
                                    }
                                />
                            </Field>

                            <Separator className="my-1" />

                            <div className="text-sm font-semibold">
                                Reviewed by
                            </div>
                            <Field>
                                <FieldLabel htmlFor="sig-reviewed-name">
                                    Name
                                </FieldLabel>
                                <Input
                                    id="sig-reviewed-name"
                                    placeholder="Enter name"
                                    value={reviewedName}
                                    onChange={(e) =>
                                        setReviewedName(e.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-reviewed-position">
                                    Position
                                </FieldLabel>
                                <Input
                                    id="sig-reviewed-position"
                                    placeholder="OIC-Provincial Budget Officer"
                                    value={reviewedPosition}
                                    onChange={(e) =>
                                        setReviewedPosition(e.target.value)
                                    }
                                />
                            </Field>

                            <Separator className="my-1" />

                            <div className="text-sm font-semibold">
                                Approved by
                            </div>
                            <Field>
                                <FieldLabel htmlFor="sig-approved-name">
                                    Name
                                </FieldLabel>
                                <Input
                                    id="sig-approved-name"
                                    placeholder="Enter name"
                                    value={approvedName}
                                    onChange={(e) =>
                                        setApprovedName(e.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-approved-position">
                                    Position
                                </FieldLabel>
                                <Input
                                    id="sig-approved-position"
                                    placeholder="Provincial Governor"
                                    value={approvedPosition}
                                    onChange={(e) =>
                                        setApprovedPosition(e.target.value)
                                    }
                                />
                            </Field>

                            <Separator className="my-1" />

                            <div className="text-sm font-semibold">
                                Conforme
                            </div>
                            <Field>
                                <FieldLabel htmlFor="sig-conforme-name">
                                    Name
                                </FieldLabel>
                                <Input
                                    id="sig-conforme-name"
                                    placeholder="Enter name"
                                    value={conformeName}
                                    onChange={(e) =>
                                        setConformeName(e.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-conforme-position">
                                    Position
                                </FieldLabel>
                                <Input
                                    id="sig-conforme-position"
                                    placeholder="-"
                                    value={conformePosition}
                                    onChange={(e) =>
                                        setConformePosition(e.target.value)
                                    }
                                />
                            </Field>
                        </FieldGroup>
                    </div>

                    <div className="relative flex-1 bg-[#3c3c3c]">
                        <PdfPreviewPane
                            url={url}
                            status={status}
                            busy={busy}
                            title="AIP Summary Report"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
