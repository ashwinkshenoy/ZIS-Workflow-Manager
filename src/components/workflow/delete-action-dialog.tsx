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

type DeleteActionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionId: string | null;
  usageCount: number;
};

export function DeleteActionDialog({
  isOpen,
  onClose,
  onConfirm,
  actionId,
  usageCount,
}: DeleteActionDialogProps) {
  if (!actionId) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this action?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete the action{' '}
            <span className="font-semibold text-foreground">{actionId}</span>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {usageCount > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Warning: Action in Use</p>
                <p>
                  This action is currently used in{' '}
                  <span className="font-bold">{usageCount}</span> step(s) in your
                  workflow. Deleting it will cause errors in those steps.
                </p>
              </div>
            </div>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Yes, delete action
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
