import { useState } from 'react';
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

import LbpForm3Dialog from './lbp-form-3-dialog';

import columns from './data-table/columns';
import type { PersonnelScheduleItem } from './data-table/columns';

interface PersonnelScheduleProps {
    items?: PersonnelScheduleItem[];
}

export default function PersonnelSchedulePage({
    items = [],
}: PersonnelScheduleProps) {
    const [isLbpForm3Open, setIsLbpForm3Open] = useState(false);

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable columns={columns} data={items}>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="outline" size="icon" />
                            }
                        >
                            <FileText />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    Generate
                                </DropdownMenuLabel>
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
            />
        </>
    );
}

PersonnelSchedulePage.layout = () => {
    const items = [{ title: 'Personnel Schedule', href: index().url }];

    return { breadcrumbs: items };
};