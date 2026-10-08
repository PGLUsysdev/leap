import { Head, router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MultiTableSelect } from '@/components/multi-table-select';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { destroy, store } from '@/routes/expense-class-codes';

interface ExpenseClassInfo {
    code: string;
    class: 'PS' | 'MOOE' | 'FE' | 'CO';
    name: string;
}

interface PostableCoa {
    id: number;
    path: string;
    account_title: string;
    expense_class: 'PS' | 'MOOE' | 'FE' | 'CO' | null;
}

interface ExpenseClassCodesProps {
    classes: ExpenseClassInfo[];
    chartOfAccounts: PostableCoa[];
    can?: {
        add: boolean;
        delete: boolean;
    };
}

const coaColumnHelper = createColumnHelper<PostableCoa>();

const coaColumns = [
    coaColumnHelper.accessor('path', {
        size: 120,
        header: () => <div className="text-center text-wrap">Code</div>,
        cell: (info) => (
            <div className="text-center font-mono text-wrap">
                {info.getValue()}
            </div>
        ),
    }),
    coaColumnHelper.accessor('account_title', {
        size: 220,
        header: () => <div className="text-center text-wrap">Account</div>,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    coaColumnHelper.accessor('expense_class', {
        size: 90,
        header: () => <div className="text-center text-wrap">Class</div>,
        cell: (info) => (
            <div className="text-center text-wrap">
                {info.getValue() ?? '—'}
            </div>
        ),
    }),
];

/** Fixed height applied to every class card so all cards align and
 *  their content areas are identical in size. */
const CARD_HEIGHT = 'h-[34rem]';

/** Classes with a card above; anything else falls into Unassigned. */
const LINKED_CLASSES: PostableCoa['expense_class'][] = [
    'PS',
    'MOOE',
    'FE',
    'CO',
];

function LinkPicker({
    accounts,
    expenseClass,
    className,
}: {
    accounts: PostableCoa[];
    expenseClass: string;
    className: string;
}) {
    const [open, setOpen] = useState(false);
    const [linking, setLinking] = useState(false);

    function handleConfirm(selected: PostableCoa[]) {
        if (selected.length === 0 || linking) {
            return;
        }

        setLinking(true);
        router.post(
            store().url,
            {
                chart_of_account_ids: selected.map((a) => a.id),
                expense_class: expenseClass,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setLinking(false);
                    setOpen(false);
                },
            },
        );
    }

    return (
        <Field className={className}>
            <FieldLabel>Link accounts</FieldLabel>
            <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 justify-between text-left font-normal"
                onClick={() => setOpen(true)}
            >
                <span className="text-muted-foreground">
                    Select accounts to link…
                </span>
                <ChevronsUpDown className="shrink-0" />
            </Button>
            <FieldDescription>
                Only leaf (postable) accounts can be linked. Linking an account
                that's already classified moves it here.
            </FieldDescription>
            <MultiTableSelect<PostableCoa>
                data={accounts}
                columns={coaColumns}
                open={open}
                onOpenChange={setOpen}
                valueKey="id"
                title="Link accounts"
                description="Select one or more postable accounts to link."
                className="sm:max-w-[36rem]"
                onConfirm={handleConfirm}
            />
        </Field>
    );
}

export default function ExpenseClassCodes({
    classes,
    chartOfAccounts,
    can,
}: ExpenseClassCodesProps) {
    const [unlinkingId, setUnlinkingId] = useState<number | null>(null);
    const [pendingUnlink, setPendingUnlink] = useState<{
        coa: PostableCoa;
        expenseClass: string;
    } | null>(null);

    const linkedByClass = useMemo(() => {
        const next: Record<string, PostableCoa[]> = {};

        for (const info of classes) {
            next[info.class] = chartOfAccounts.filter(
                (a) => a.expense_class === info.class,
            );
        }

        return next;
    }, [classes, chartOfAccounts]);

    const unassigned = useMemo(
        () =>
            chartOfAccounts.filter(
                (a) => !LINKED_CLASSES.includes(a.expense_class),
            ),
        [chartOfAccounts],
    );

    function handleUnlinkRequest(coa: PostableCoa, expenseClass: string) {
        if (unlinkingId !== null) {
            return;
        }

        setPendingUnlink({ coa, expenseClass });
    }

    function confirmUnlink() {
        if (pendingUnlink === null || unlinkingId !== null) {
            return;
        }

        const coaId = pendingUnlink.coa.id;
        setUnlinkingId(coaId);
        router.delete(destroy(coaId).url, {
            preserveScroll: true,
            onFinish: () => {
                setUnlinkingId(null);
                setPendingUnlink(null);
            },
        });
    }

    return (
        <>
            <Head title="Expense Class Codes" />
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <div className="flex flex-col gap-4 p-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Expense Class Codes
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Link leaf (postable) chart of accounts to an expense
                            class. Only linked accounts roll up into funding
                            source totals on import.
                        </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
                        {classes.map((info) => {
                            const linked = linkedByClass[info.class] ?? [];
                            const linkable = chartOfAccounts.filter(
                                (a) => a.expense_class !== info.class,
                            );

                            return (
                                <Card
                                    key={info.class}
                                    className={`flex flex-col ${CARD_HEIGHT}`}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Badge variant="default">
                                                {info.code}
                                            </Badge>
                                            {info.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {linked.length} account
                                            {linked.length === 1
                                                ? ''
                                                : 's'}{' '}
                                            linked
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                                        {can?.add && (
                                            <LinkPicker
                                                accounts={linkable}
                                                expenseClass={info.class}
                                                className="w-full shrink-0"
                                            />
                                        )}

                                        <div className="min-h-0 flex-1">
                                            {linked.length === 0 ? (
                                                <p className="text-muted-foreground text-sm">
                                                    No accounts linked yet.
                                                </p>
                                            ) : (
                                                <ScrollArea className="h-full">
                                                    <ul className="flex flex-col gap-1 pr-4">
                                                        {linked.map((coa) => (
                                                            <li
                                                                key={coa.id}
                                                                className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                                                            >
                                                                <span className="min-w-0 truncate">
                                                                    <span className="font-mono">
                                                                        {
                                                                            coa.path
                                                                        }
                                                                    </span>{' '}
                                                                    <span className="text-muted-foreground">
                                                                        —{' '}
                                                                        {
                                                                            coa.account_title
                                                                        }
                                                                    </span>
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={
                                                                        !can?.delete ||
                                                                        unlinkingId ===
                                                                            coa.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleUnlinkRequest(
                                                                            coa,
                                                                            info.class,
                                                                        )
                                                                    }
                                                                >
                                                                    Unlink
                                                                </Button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <ScrollBar orientation="vertical" />
                                                </ScrollArea>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className={`flex flex-col ${CARD_HEIGHT}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Unassigned
                                <Badge variant="outline">
                                    {unassigned.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Postable accounts with no PS / MOOE / FE / CO
                                link are ignored by the funding source totals
                                sync.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1">
                            {unassigned.length === 0 ? (
                                <p className="text-sm text-emerald-600">
                                    Every postable account is linked.
                                </p>
                            ) : (
                                <ScrollArea className="h-full">
                                    <ul className="flex flex-col gap-1 pr-4">
                                        {unassigned.map((coa) => (
                                            <li
                                                key={coa.id}
                                                className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                                            >
                                                <span className="min-w-0 truncate">
                                                    <span className="font-mono">
                                                        {coa.path}
                                                    </span>{' '}
                                                    <span className="text-muted-foreground">
                                                        — {coa.account_title}
                                                    </span>
                                                </span>
                                                {coa.expense_class && (
                                                    <Badge variant="outline">
                                                        {coa.expense_class}
                                                    </Badge>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <ScrollBar orientation="vertical" />
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <AlertDialog
                open={pendingUnlink !== null}
                onOpenChange={(open) => {
                    if (!open && unlinkingId === null) {
                        setPendingUnlink(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink account</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingUnlink !== null ? (
                                <>
                                    Unlink{' '}
                                    <span className="font-mono">
                                        {pendingUnlink.coa.path}
                                    </span>{' '}
                                    — {pendingUnlink.coa.account_title} from{' '}
                                    {pendingUnlink.expenseClass}? It will move
                                    back to Unassigned and be ignored by the
                                    funding source totals sync.
                                </>
                            ) : (
                                'Unlink this account?'
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={unlinkingId !== null}
                            onClick={confirmUnlink}
                        >
                            Unlink
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
