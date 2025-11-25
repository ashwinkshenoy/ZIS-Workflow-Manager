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
import { AlertTriangle } from 'lucide-react';

type DeleteNodeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nodeId: string | null;
};

export function DeleteNodeDialog({
  isOpen,
  onClose,
  onConfirm,
  nodeId,
}: DeleteNodeDialogProps) {
  if (!nodeId) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this state?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete the state{' '}
            <span className="font-semibold text-foreground">{nodeId}</span>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Warning: Potential Breakage</p>
                <p>
                 Deleting this state will automatically attempt to re-wire the workflow. Please review the connections afterwards to ensure correctness.
                </p>
              </div>
            </div>
          </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Yes, delete state
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
