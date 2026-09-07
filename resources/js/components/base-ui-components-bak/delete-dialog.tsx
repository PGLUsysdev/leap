import type { ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/base-ui-components/ui/alert-dialog';
import { Spinner } from '@/components/base-ui-components/ui/spinner';

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    loading: boolean;
    handleDelete: () => void;
}

export default function DeleteDialog({
    open,
    onOpenChange,
    title,
    description,
    loading,
    handleDelete,
}: DeleteDialogProps) {
    function handleOpenChange(
        nextOpen: boolean,
        eventDetails: any, // Replace with proper type if available
    ) {
        if (!nextOpen && loading) {
            if (
                eventDetails.reason === 'escape-key' ||
                eventDetails.reason === 'outside-press'
            ) {
                eventDetails.cancel();

                return;
            }
        }

        onOpenChange(nextOpen);
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={loading}
                        onClick={handleDelete}
                    >
                        {loading && <Spinner />} Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
