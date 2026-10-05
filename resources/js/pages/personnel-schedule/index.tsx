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
import type { LbpFormNo } from './lbp-form-3-dialog';

import columns from './data-table/columns';
import type { PersonnelScheduleItem } from './data-table/columns';

interface PersonnelScheduleProps {
    items?: PersonnelScheduleItem[];
}

// Placeholder rows until the controller supplies real data. Module-level so the
// identity stays stable and the LBP Form 3 PDF payload is not rebuilt on every
// parent render.
const MOCK_ITEMS: PersonnelScheduleItem[] = [
    {
        id: 1,
        item_number: '1',
        old: '1',
        new: '1',
        position_title: 'ADMINISTRATIVE AIDE III (VACANT)',
        incumbent_name: '-',
        current_year_sg_step: 'SG-2 / 3',
        current_year_amount: '29187.00',
        proposed_sg_step: 'SG-3 / 1',
        proposed_amount: '31339.00',
        increase_decrease: '2152.00',
        step_increment_effectivity: '01/01/2026',
    },
    {
        id: 2,
        item_number: '2',
        old: '2',
        new: '2',
        position_title: 'ADMINISTRATIVE OFFICER I',
        incumbent_name: 'Dela Cruz, Juan A.',
        current_year_sg_step: 'SG-14 / 1',
        current_year_amount: '33461.00',
        proposed_sg_step: 'SG-14 / 2',
        proposed_amount: '35253.00',
        increase_decrease: '1792.00',
        step_increment_effectivity: '01/01/2026',
    },
    {
        id: 3,
        item_number: '3',
        old: '3',
        new: '3',
        position_title: 'LOCAL DEVELOPMENT OFFICER I',
        incumbent_name: 'Santos, Maria L.',
        current_year_sg_step: 'SG-18 / 1',
        current_year_amount: '51219.00',
        proposed_sg_step: 'SG-18 / 2',
        proposed_amount: '53967.00',
        increase_decrease: '2748.00',
        step_increment_effectivity: '01/01/2026',
    },
];

export default function PersonnelSchedulePage({
    items = MOCK_ITEMS,
}: PersonnelScheduleProps) {
    const [isLbpForm3Open, setIsLbpForm3Open] = useState(false);
    const [formNo, setFormNo] = useState<LbpFormNo>('3');

    function handleFormOpen(selected: LbpFormNo) {
        setFormNo(selected);
        setIsLbpForm3Open(true);
    }

    const activeFiscalYear = usePage<SharedData>().props
        .activeFiscalYear as FiscalYear | null;

    const fiscalYear = activeFiscalYear?.year ?? '';

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable columns={columns} data={items} showFooter={true}>
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
                                    onClick={() => handleFormOpen('3')}
                                >
                                    <FileText /> LBP Form 3
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleFormOpen('3A')}
                                >
                                    <FileText /> LBP Form 3A
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
                formNo={formNo}
            />
        </>
    );
}

PersonnelSchedulePage.layout = () => {
    const items = [{ title: 'Personnel Schedule', href: index().url }];

    return { breadcrumbs: items };
};
