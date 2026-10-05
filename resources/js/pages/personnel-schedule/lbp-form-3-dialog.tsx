import { useState } from 'react';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface LbpForm3DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const INITIAL_SIGNATORIES = {
    preparedName: '',
    preparedPosition: '',
    reviewedName: '',
    reviewedPosition: '',
    approvedName: '',
    approvedPosition: '',
};

export default function LbpForm3Dialog({
    open,
    onOpenChange,
}: LbpForm3DialogProps) {
    const [signatories, setSignatories] = useState(INITIAL_SIGNATORIES);

    function updateSignatory(key: keyof typeof signatories, value: string) {
        setSignatories((current) => ({ ...current, [key]: value }));
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setSignatories(INITIAL_SIGNATORIES);
        }

        onOpenChange(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[100vh] flex-col gap-0 rounded-none p-0 sm:max-w-[100vw]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
                    <DialogTitle>LBP Form 3</DialogTitle>
                    <DialogDescription className="sr-only">
                        Personnel Schedule signatories
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex w-[360px] shrink-0 flex-col gap-4 overflow-auto border-r p-4">
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
                                    value={signatories.preparedName}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'preparedName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-prepared-position">
                                    Position / Title
                                </FieldLabel>
                                <Input
                                    id="sig-prepared-position"
                                    placeholder="Enter position or title"
                                    value={signatories.preparedPosition}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'preparedPosition',
                                            e.target.value,
                                        )
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
                                    value={signatories.reviewedName}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'reviewedName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-reviewed-position">
                                    Position / Title
                                </FieldLabel>
                                <Input
                                    id="sig-reviewed-position"
                                    placeholder="Enter position or title"
                                    value={signatories.reviewedPosition}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'reviewedPosition',
                                            e.target.value,
                                        )
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
                                    value={signatories.approvedName}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'approvedName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="sig-approved-position">
                                    Position / Title
                                </FieldLabel>
                                <Input
                                    id="sig-approved-position"
                                    placeholder="Enter position or title"
                                    value={signatories.approvedPosition}
                                    onChange={(e) =>
                                        updateSignatory(
                                            'approvedPosition',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </FieldGroup>
                    </div>

                    <div className="bg-[#3c3c3c] flex-1" />
                </div>
            </DialogContent>
        </Dialog>
    );
}