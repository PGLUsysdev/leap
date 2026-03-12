import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';
import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import OfficeFormDialog from '@/pages/offices/office-form-dialog';
import OfficeTablePage from './table/page';
import { Office, Sector, LguLevel, OfficeType } from '@/pages/types/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Offices', href: '/office' }];

interface OfficesPageProps {
    offices: Office[];
    sectors: Sector[];
    lguLevels: LguLevel[];
    officeTypes: OfficeType[];
}

export default function OfficesPage({
    offices,
    sectors,
    lguLevels,
    officeTypes,
}: OfficesPageProps) {
    console.log(offices);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedOffice, setSelectedOffice] = React.useState<Office | null>(
        null,
    );

    const handleCreate = () => {
        setSelectedOffice(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (office: Office) => {
        setSelectedOffice(office);
        setIsDialogOpen(true);
    };

    const columns: ColumnDef<Office>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'full_code',
            header: 'Office Account Code',
            cell: ({ row }) => {
                const office = row.original;
                const sector = office.sector?.code ?? '0000';
                const subsector = '000';
                const lgu = office.lgu_level?.code ?? '0';
                const type = office.office_type?.code ?? '00';
                const officeCode = office.code ?? '000';
                return (
                    <code className="font-mono text-xs">{`${sector}-${subsector}-${lgu}-${type}-${officeCode}`}</code>
                );
            },
        },
        {
            accessorKey: 'name',
            header: 'Office Name',
        },
        {
            accessorKey: 'is_lee',
            header: 'LEE',
            cell: ({ row }) => (
                <span
                    className={`rounded-full px-2 py-1 text-xs ${row.getValue('is_lee') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                    {row.getValue('is_lee') ? 'Yes' : 'No'}
                </span>
            ),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => handleEdit(row.original)}
                        >
                            Edit Office
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                                if (
                                    confirm(
                                        'Are you sure you want to delete this office?',
                                    )
                                ) {
                                    router.delete(`/office/${row.original.id}`);
                                }
                            }}
                        >
                            Delete Office
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: offices,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    function handleNewEdit() {
        console.log('edit');
    }

    function handleDelete() {
        console.log('delete');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full px-4 pb-4">
                <OfficeTablePage
                    data={offices}
                    onEdit={handleNewEdit}
                    onDelete={handleDelete}
                >
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filter offices..."
                            value={
                                (table
                                    .getColumn('name')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                table
                                    .getColumn('name')
                                    ?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />

                        <div className="ml-auto flex items-center space-x-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        Columns{' '}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id.replace('_', ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={handleCreate}>Add Office</Button>
                        </div>
                    </div>
                </OfficeTablePage>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>

                <OfficeFormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    office={selectedOffice}
                    sectors={sectors}
                    lguLevels={lguLevels}
                    officeTypes={officeTypes}
                />
            </div>
        </AppLayout>
    );
}
