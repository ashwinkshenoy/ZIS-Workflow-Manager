'use client';

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

type DeleteFlowDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  flowId: string | null;
};

export function DeleteFlowDialog({ isOpen, onClose, onConfirm, flowId }: DeleteFlowDialogProps) {
  if (!flowId) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this flow?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete the flow <span className='font-semibold text-foreground'>{flowId}</span>{' '}
            and its associated JobSpec. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className='bg-red-500 hover:bg-red-500/90 text-white'>
            Yes, delete flow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
