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
import { FundingSource } from '@/pages/types/types';
import { router } from '@inertiajs/react';

interface DeleteDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: FundingSource | null;
}

export default function DeleteDialog({
    open,
    setOpen,
    initialData,
}: DeleteDialogProps) {
    console.log(initialData);

    function handleDelete() {
        console.log('delete data');

        router.visit(`/funding-sources/${initialData?.id}`, {
            method: 'delete',
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete {initialData?.title}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
