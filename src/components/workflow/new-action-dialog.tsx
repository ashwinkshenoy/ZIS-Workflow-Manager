'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type NewActionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onActionAdd: (actionId: string, actionType: 'ZIS::Action::Http') => void;
  existingActionIds: string[];
};

const availableActionTypes = ['ZIS::Action::Http'] as const;

export function NewActionDialog({ isOpen, onClose, onActionAdd, existingActionIds }: NewActionDialogProps) {
  const [actionId, setActionId] = useState('');
  const [actionType, setActionType] = useState<'ZIS::Action::Http'>('ZIS::Action::Http');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!actionId) {
      toast({
        variant: 'destructive',
        title: 'Action ID is required',
        description: 'Please provide a unique ID for the new action.',
      });
      return;
    }

    if (existingActionIds.includes(actionId)) {
      toast({
        variant: 'destructive',
        title: 'Action ID already exists',
        description: 'Please choose a unique ID for the new action.',
      });
      return;
    }

    onActionAdd(actionId, actionType);
    setActionId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Create New Action</DialogTitle>
          <DialogDescription>Define a new reusable action for your workflow.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid w-full items-center gap-1.5'>
              <Label htmlFor='action-id'>Action ID</Label>
              <Input
                id='action-id'
                value={actionId}
                onChange={(e) => setActionId(e.target.value)}
                placeholder='e.g., my.custom.action'
                autoFocus
              />
            </div>
            <div className='grid w-full items-center gap-1.5'>
              <Label htmlFor='action-type'>Action Type</Label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as 'ZIS::Action::Http')}>
                <SelectTrigger id='action-type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableActionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Create Action</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
