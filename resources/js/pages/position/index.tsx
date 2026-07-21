import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import type { SharedData } from '@/types';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
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
import type {
    FiscalYear,
    Ios,
    Office,
    Position,
    SalaryStandard,
} from '@/types';
import columns from './columns/position-cols';
import FormDialog from './form-dailog';
import PreviewPdfDialog from './pdf-preview-dialog';

interface PositionPageProps {
    positions: Position[];
    offices: Office[];
    iosList: Ios[];
    currentFiscalYear: FiscalYear | null;
    budgetFiscalYear: FiscalYear | null;
    currentStandards: SalaryStandard[];
    budgetStandards: SalaryStandard[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        export: boolean;
    };
}

export default function PositionPage({
    positions,
    offices,
    iosList,
    currentFiscalYear,
    budgetFiscalYear,
    currentStandards,
    budgetStandards,
    can,
}: PositionPageProps) {
    const { auth } = usePage<SharedData>().props;
    const userOfficeId = auth.user.office_id;

    const officePositions = userOfficeId
        ? positions.filter((p) => p.office_id === userOfficeId)
        : positions;

    const [selectedPosition, setSelectedPosition] = useState<Position | null>(
        null,
    );
    const [openForm, setOpenForm] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [pdfFormType, setPdfFormType] = useState<
        'permanent' | 'casual' | null
    >(null);
    const openPdfPreview = pdfFormType !== null;

    function handleEdit(data: Position) {
        setSelectedPosition(data);
        setOpenForm(true);
    }

    function handleDelete(data: Position) {
        setSelectedPosition(data);
        setOpenDelete(true);
    }

    function confirmDelete() {
        if (!selectedPosition) {
            return;
        }

        router.delete(`/position/${selectedPosition.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpenDelete(false);
                setSelectedPosition(null);
            },
        });
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpenForm(isOpen);

        if (!isOpen) {
            setSelectedPosition(null);
        }
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={officePositions}
                    meta={{
                        onEdit: can?.edit ? handleEdit : undefined,
                        onDelete: can?.delete ? handleDelete : undefined,
                    }}
                >
                    <div className="flex gap-1">
                        {can?.export && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setPdfFormType('permanent')}
                                >
                                    Generate LBP Form No. 3
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setPdfFormType('casual')}
                                >
                                    Generate LBP Form No. 3a
                                </Button>
                            </>
                        )}
                        {can?.add && (
                            <Button
                                onClick={() => {
                                    setSelectedPosition(null);
                                    setOpenForm(true);
                                }}
                            >
                                Add Position
                            </Button>
                        )}
                    </div>
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={openForm}
                onOpenChange={handleDialogOpenChange}
                data={selectedPosition}
                offices={offices}
                iosList={iosList}
                userOfficeId={userOfficeId}
            />

            <PreviewPdfDialog
                open={openPdfPreview}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPdfFormType(null);
                    }
                }}
                positions={officePositions.filter(
                    (p) => p.employment_type === pdfFormType,
                )}
                title={
                    pdfFormType === 'permanent'
                        ? 'LBP Form No. 3'
                        : 'LBP Form No. 3a'
                }
                currentStandards={currentStandards}
                budgetStandards={budgetStandards}
                currentFiscalYear={currentFiscalYear}
                budgetFiscalYear={budgetFiscalYear}
            />

            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Position</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedPosition?.user ? (
                                <>
                                    This position is currently assigned to{' '}
                                    <strong>
                                        {selectedPosition.user.name}
                                    </strong>
                                    . Continuing will unassign this user from
                                    the position. This action cannot be undone.
                                </>
                            ) : (
                                'Are you sure you want to delete this position? This action cannot be undone.'
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

PositionPage.layout = { breadcrumbs: [{ title: 'Positions', href: '#' }] };
