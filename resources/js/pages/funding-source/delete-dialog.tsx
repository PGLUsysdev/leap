import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FundingSource } from '@/pages/types/types';
import { router } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

    const [isLoading, setIsLoading] = useState(false);

    function handleDelete() {
        router.visit(`/funding-sources/${initialData?.id}`, {
            method: 'delete',
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete{' '}
                        <span className="font-bold">
                            "{initialData?.title}"
                        </span>
                        .
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        onClick={handleDelete}
                        variant={'destructive'}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-1">
                                <Spinner /> Deleting
                            </span>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
