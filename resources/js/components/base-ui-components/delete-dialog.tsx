import type { AlertDialog as AlertDialogNamespace } from '@base-ui/react/alert-dialog';
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
    // AlertDialogTrigger,
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

export default function DelteDiaog({
    open,
    onOpenChange,
    title,
    description,
    loading,
    handleDelete,
}: DeleteDialogProps) {
    function handleOpenChange(
        nextOpen: boolean,
        eventDetails: AlertDialogNamespace.Root.ChangeEventDetails,
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
            {/*<AlertDialogTrigger render={<Button variant="outline" />}>
                Show Dialog
            </AlertDialogTrigger>*/}
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
