import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface DeleteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading: boolean;
}

export function DeleteDialog({
    isOpen,
    onOpenChange,
    title = 'Are you absolutely sure?',
    description,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading,
}: DeleteDialogProps) {
    // console.log(isOpen);
    // console.log(onOpenChange);
    // console.log(title);
    // console.log(description);
    // console.log(onConfirm);
    // console.log(onCancel);
    // console.log(confirmText);
    // console.log(cancelText);
    // console.log(isLoading);

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>

                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-1">
                                <Spinner /> <span>Deleting</span>
                            </span>
                        ) : (
                            <>{confirmText}</>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
