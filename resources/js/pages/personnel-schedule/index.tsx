import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { FileText } from 'lucide-react';

import DataTable from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { index } from '@/routes/personnel-schedule';
import type { FiscalYear, SharedData } from '@/types';

import LbpForm3Dialog from './lbp-form-3-dialog';

import columns from './data-table/columns';
import type { PersonnelScheduleItem } from './data-table/columns';

interface PersonnelScheduleProps {
    items?: PersonnelScheduleItem[];
}

// Stable reference so the LBP Form 3 PDF payload keeps a stable identity when
// there is no data yet, instead of regenerating on every parent render.
const NO_ITEMS: PersonnelScheduleItem[] = [];

export default function PersonnelSchedulePage({
    items = NO_ITEMS,
}: PersonnelScheduleProps) {
    const [isLbpForm3Open, setIsLbpForm3Open] = useState(false);

    const activeFiscalYear = usePage<SharedData>().props
        .activeFiscalYear as FiscalYear | null;

    const fiscalYear = activeFiscalYear?.year ?? '';

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable columns={columns} data={items}>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button variant="outline" size="icon" />}
                        >
                            <FileText />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Generate</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => setIsLbpForm3Open(true)}
                                >
                                    <FileText /> LBP Form 3
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <LbpForm3Dialog
                open={isLbpForm3Open}
                onOpenChange={setIsLbpForm3Open}
                items={items}
                fiscalYear={fiscalYear}
            />
        </>
    );
}

PersonnelSchedulePage.layout = () => {
    const items = [{ title: 'Personnel Schedule', href: index().url }];

    return { breadcrumbs: items };
};
