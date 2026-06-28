import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type {
    FiscalYear,
    Office,
    Position,
    SalaryStandard,
} from '@/types/global';
import { Button } from '@/components/ui/button';
import columns from './columns/plantilla-position-cols';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PreviewPdfDialog from './pdf-preview-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Positions', href: '#' }];

interface PositionProps {
    positions: Position[];
    offices: Office[];
    currentStandards: SalaryStandard[];
    budgetStandards: SalaryStandard[];
    currentFiscalYear: FiscalYear | null;
    budgetFiscalYear: FiscalYear | null;
}

export default function Position({
    positions,
    offices,
    currentStandards,
    budgetStandards,
    currentFiscalYear,
    budgetFiscalYear,
}: PositionProps) {
    const { auth } = usePage<SharedData>().props;
    const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(
        auth.user.office_id ?? 0,
    );
    const [openPdfPreview, setOpenPdfPreview] = useState(false);

    const filteredPositions = selectedOfficeId
        ? positions.filter((p) => p.office_id === selectedOfficeId)
        : positions;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={filteredPositions}
                    withSearch={true}
                    withFooter={true}
                    negativeHeight={7}
                >
                    <div className="flex gap-2">
                        <Select
                            value={
                                selectedOfficeId
                                    ? String(selectedOfficeId)
                                    : 'all'
                            }
                            onValueChange={(value) =>
                                setSelectedOfficeId(
                                    value !== 'all' ? Number(value) : null,
                                )
                            }
                        >
                            <SelectTrigger className="w-full max-w-48">
                                <SelectValue placeholder="All Offices" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Offices</SelectLabel>
                                    <SelectItem value="all">
                                        All Offices
                                    </SelectItem>
                                    {offices.map((office) => (
                                        <SelectItem
                                            key={office.id}
                                            value={String(office.id)}
                                        >
                                            {office.acronym ?? office.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="secondary"
                            onClick={() => setOpenPdfPreview(true)}
                        >
                            Generate LBP Form No. 3
                        </Button>
                    </div>
                </DataTable>
            </div>
            <PreviewPdfDialog
                open={openPdfPreview}
                onOpenChange={setOpenPdfPreview}
                positions={filteredPositions}
                currentStandards={currentStandards}
                budgetStandards={budgetStandards}
                currentFiscalYear={currentFiscalYear}
                budgetFiscalYear={budgetFiscalYear}
            />
        </AppLayout>
    );
}
