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
import { useToast } from '@/hooks/use-toast';

export type NewFlowData = {
  flowResourceKey: string;
  jobspecName: string;
  eventSource: string;
  eventType: string;
};

type NewFlowDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: NewFlowData) => void;
  existingResourceIds: string[];
};

export function NewFlowDialog({ isOpen, onClose, onCreate, existingResourceIds }: NewFlowDialogProps) {
  const [jobspecName, setJobspecName] = useState('');
  const [eventSource, setEventSource] = useState('');
  const [eventType, setEventType] = useState('');

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const flowResourceKey = `${jobspecName}_flow`;

    if (!jobspecName.trim() || !eventSource.trim() || !eventType.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: 'Please fill out all fields to create a new flow.',
      });
      return;
    }

    if (existingResourceIds.includes(jobspecName) || existingResourceIds.includes(flowResourceKey)) {
      toast({
        variant: 'destructive',
        title: 'Resource key already exists',
        description: `The name "${jobspecName}" or "${flowResourceKey}" is already in use. Please choose a unique JobSpec name.`,
        duration: 7000,
      });
      return;
    }

    onCreate({
      jobspecName,
      eventSource,
      eventType,
      flowResourceKey,
    });

    // Reset form
    setJobspecName('');
    setEventSource('');
    setEventType('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add New Flow</DialogTitle>
          <DialogDescription>Define a new flow and its triggering JobSpec for this integration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>New JobSpec & Flow Details</h4>
              <div className='space-y-4 rounded-md border p-4'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='jobspec-name'>JobSpec Name</Label>
                  <Input
                    id='jobspec-name'
                    value={jobspecName}
                    onChange={(e) => setJobspecName(e.target.value)}
                    placeholder='e.g., my_new_jobspec'
                    autoFocus
                  />
                  <p className='text-xs text-muted-foreground'>
                    This will also be used to generate the flow name:{' '}
                    <span className='font-mono'>{jobspecName}_flow</span>
                  </p>
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-source'>Event Source</Label>
                  <Input
                    id='event-source'
                    value={eventSource}
                    onChange={(e) => setEventSource(e.target.value)}
                    placeholder='e.g., support'
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-type'>Event Type</Label>
                  <Input
                    id='event-type'
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder='e.g., ticket.CustomTicketField*Changed'
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Add Flow</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
