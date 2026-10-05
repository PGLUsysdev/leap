import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import DataTable from '@/components/data-table';

import { index } from '@/routes/personnel-schedule';

import columns from './data-table/columns';
import type { PersonnelScheduleItem } from './data-table/columns';

interface PersonnelScheduleProps {
    items?: PersonnelScheduleItem[];
}

export default function PersonnelSchedulePage({
    items = [],
}: PersonnelScheduleProps) {
    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable columns={columns} data={items} />

                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </>
    );
}

PersonnelSchedulePage.layout = () => {
    const items = [{ title: 'Personnel Schedule', href: index().url }];

    return { breadcrumbs: items };
};