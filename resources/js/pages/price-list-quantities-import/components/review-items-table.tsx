// resources/js/pages/price-list-quantities-import/components/review-items-table.tsx

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { QUANTITY_MONTHS } from '@/lib/ppmp/quantities-extract';
import type { UniqueQuantityItem } from '@/lib/ppmp/quantities-extract';

export function ReviewItemsTable({ items }: { items: UniqueQuantityItem[] }) {
    const monthSums = QUANTITY_MONTHS.map((_, i) =>
        items.reduce((sum, item) => sum + (item.qtys[i] ?? 0), 0),
    );
    const grandTotal = monthSums.reduce((sum, q) => sum + q, 0);
    const fmtQty = (q: number): number | '' => (q === 0 ? '' : q);

    return (
        <ScrollArea className="w-full rounded-lg border">
            <Table className="[&_td]:border-l [&_td:first-child]:border-l-0 [&_th]:border-l [&_th:first-child]:border-l-0">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">Row</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Unit</TableHead>
                        {QUANTITY_MONTHS.map((m) => (
                            <TableHead
                                key={m}
                                className="text-right capitalize"
                            >
                                {m}
                            </TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.key}>
                            <TableCell className="text-right tabular-nums">
                                {item.rows.join(', ')}
                            </TableCell>
                            <TableCell className="max-w-80 break-words whitespace-normal">
                                {item.description}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            {item.qtys.map((q, i) => (
                                <TableCell
                                    key={QUANTITY_MONTHS[i]}
                                    className="text-right"
                                >
                                    {fmtQty(q)}
                                </TableCell>
                            ))}
                            <TableCell className="text-right font-medium">
                                {fmtQty(item.monthTotal)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell
                            colSpan={3}
                            className="text-right font-medium"
                        >
                            Total
                        </TableCell>
                        {monthSums.map((sum, i) => (
                            <TableCell
                                key={QUANTITY_MONTHS[i]}
                                className="text-right font-medium"
                            >
                                {fmtQty(sum)}
                            </TableCell>
                        ))}
                        <TableCell className="text-right font-medium">
                            {fmtQty(grandTotal)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
