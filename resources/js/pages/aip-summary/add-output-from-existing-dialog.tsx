import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { AipEntry } from '@/types';

interface SiblingOutput {
    id: number;
    expected_output: string | null;
    start_date: string | null;
    end_date: string | null;
    funding_sources_count: number;
    document: { id: number; kind: string; name: string } | null;
    already_carried: boolean;
}

interface AddOutputFromExistingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: AipEntry | null;
}

export default function AddOutputFromExistingDialog({
    open,
    onOpenChange,
    entry,
}: AddOutputFromExistingDialogProps) {
    const [loading, setLoading] = useState(false);
    const [carryingId, setCarryingId] = useState<number | null>(null);
    const [rows, setRows] = useState<SiblingOutput[]>([]);

    useEffect(() => {
        if (!open || !entry) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetch(`/aip-entries/${entry.id}/sibling-outputs`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data: SiblingOutput[]) => {
                if (!cancelled) {
                    setRows(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setRows([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, entry]);

    function handleCarry(sourceOutputId: number) {
        if (!entry?.aip_document_id) {
            return;
        }

        setCarryingId(sourceOutputId);
        router.post(
            `/aip-outputs/${sourceOutputId}/carry-to-supplemental`,
            { aip_document_id: entry.aip_document_id },
            {
                preserveScroll: true,
                only: ['newAipEntries'],
                onSuccess: () =>
                    setRows((prev) =>
                        prev.map((r) =>
                            r.id === sourceOutputId
                                ? { ...r, already_carried: true }
                                : r,
                        ),
                    ),
                onFinish: () => setCarryingId(null),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[50rem]">
                <DialogHeader>
                    <DialogTitle>
                        Add output from same PPA in other documents
                    </DialogTitle>
                    <DialogDescription>
                        Pick an existing expected output for this PPA from
                        Regular or earlier supplementals. Carrying creates a
                        linked delta output here (lineage preserved, amounts
                        summed in Cumulative). Already-carried rows are
                        disabled.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center gap-2 py-8 text-sm">
                        <Spinner /> Loading outputs…
                    </div>
                ) : rows.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        No outputs for this PPA in other documents yet. Create
                        a new blank output instead.
                    </p>
                ) : (
                    <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
                        {rows.map((row) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">
                                        {row.expected_output?.trim() ||
                                            `Output #${row.id}`}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {row.document?.name ?? 'Unknown doc'} ·{' '}
                                        {row.funding_sources_count} funding
                                        source(s)
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                        row.already_carried ||
                                        carryingId === row.id
                                    }
                                    title={
                                        row.already_carried
                                            ? 'Already carried into this entry'
                                            : 'Carry into this entry'
                                    }
                                    onClick={() => handleCarry(row.id)}
                                >
                                    {carryingId === row.id
                                        ? 'Carrying…'
                                        : row.already_carried
                                          ? 'Carried'
                                          : 'Add'}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
