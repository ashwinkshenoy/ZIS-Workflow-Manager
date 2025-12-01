'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { GripVertical, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WebhookDetails } from './webhook-details';
import { useIntegration } from '@/context/integration-context';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedIntegration } = useIntegration();

  const [width, setWidth] = useState(640);
  const isResizing = useRef(false);
  const { toast } = useToast();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.cursor = 'auto';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 400 && newWidth < 1200) {
        setWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, handleMouseMove, handleMouseUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const flowResourceKey = `${jobspecName}_flow`;

    if (!jobspecName.trim() || !eventSource.trim() || !eventType.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: 'Please fill out all fields to create a new flow.',
      });
      setIsSubmitting(false);
      return;
    }

    if (existingResourceIds.includes(jobspecName) || existingResourceIds.includes(flowResourceKey)) {
      toast({
        variant: 'destructive',
        title: 'Resource key already exists',
        description: `The name "${jobspecName}" or "${flowResourceKey}" is already in use. Please choose a unique JobSpec name.`,
        duration: 7000,
      });
      setIsSubmitting(false);
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
    setIsSubmitting(false);
  };

  const closeDialog = () => {
    setJobspecName('');
    setEventSource('');
    setEventType('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent className='flex flex-col group' style={{ width: `${width}px`, maxWidth: '80vw' }}>
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 h-full w-2.5 cursor-col-resize flex items-center justify-center transition-colors z-10',
            'group-hover:bg-border/50',
            isResizing.current && 'bg-border/80'
          )}>
          <GripVertical
            className={cn(
              'h-6 w-4 text-muted-foreground/50 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              isResizing.current && 'opacity-100'
            )}
          />
        </div>
        <SheetHeader className='pr-8'>
          <SheetTitle className='flex items-center gap-3'>
            <Plus className='h-6 w-6' />
            Add New Flow
          </SheetTitle>
          <SheetDescription>Define a new flow and its triggering JobSpec for this integration.</SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className='flex-1 -mx-6 px-6'>
          <form onSubmit={handleSubmit}>
            <div className='space-y-6 pb-6'>
              <div className='space-y-2'>
                <h4 className='font-medium text-foreground'>New JobSpec & Flow Details</h4>
                <div className='space-y-4 rounded-md border p-4'>
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='jobspec-name'>JobSpec Name</Label>
                    <Input
                      id='jobspec-name'
                      value={jobspecName}
                      onChange={(e) => setJobspecName(e.target.value)}
                      placeholder='e.g: my_new_jobspec'
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
                      placeholder='e.g: support'
                    />
                  </div>
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-type'>Event Type</Label>
                    <Input
                      id='event-type'
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder='e.g: ticket.TagsChanged'
                    />
                  </div>

                  <WebhookDetails
                    selectedIntegration={selectedIntegration}
                    workflow={existingResourceIds}
                    eventSource={eventSource}
                    eventType={eventType}
                  />
                </div>
              </div>
            </div>
            <div className='px-2 py-4 flex justify-end space-x-2'>
              <Button type='button' variant='link' onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Add Flow
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
