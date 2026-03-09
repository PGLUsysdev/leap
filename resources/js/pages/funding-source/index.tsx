import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { FundingSource } from '@/pages/types/types';
import FundingSourceTablePage from '@/pages/funding-source/table/page';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/funding-source/form-dialog';
import DeleteDialog from '@/pages/funding-source/delete-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Funding Source', href: '#' }];

interface FundingSourcePageProps {
    fundingSources: FundingSource[];
}

export default function FundingSourcePage({
    fundingSources,
}: FundingSourcePageProps) {
    console.log(fundingSources);

    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedSource, setSelectedSource] = useState<FundingSource | null>(
        null,
    );

    function handleAdd() {
        setSelectedSource(null);
        setOpen(true);
    }

    function handleEdit(source: FundingSource) {
        console.log(source);

        const newSource = {
            ...source,
            allow_typhoon: source.allow_typhoon ? true : false,
        };

        setSelectedSource(newSource);
        setOpen(true);
    }

    function handleDelete(source: FundingSource) {
        setSelectedSource(source);
        setOpenDelete(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex justify-end">
                    <Button onClick={handleAdd}>Add Funding Source</Button>
                </div>

                <FundingSourceTablePage
                    data={fundingSources}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            <FormDialog
                open={open}
                setOpen={setOpen}
                initialData={selectedSource}
            />

            <DeleteDialog
                open={openDelete}
                setOpen={setOpenDelete}
                initialData={selectedSource}
            />
        </AppLayout>
    );
}
