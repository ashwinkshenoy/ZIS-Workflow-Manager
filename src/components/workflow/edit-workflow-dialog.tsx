'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { GripVertical, Loader2, Zap, Pencil, SquareArrowOutUpRight, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import ZDClient from '@/lib/ZDClient';
import { createNewWorkflow, getJobSpecDetails } from '@/lib/workflow-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIntegration } from '@/context/integration-context';
import { WebhookDetails } from './webhook-details';
import type { Workflow as WorkFlowTypes } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EVENT_TYPES } from '@/lib/event-types';

export type EditWorkflowData = {
  name: string;
  description: string;
  jobspecName: string;
  eventSource: string;
  eventType: string;
};

type EditWorkflowDialogProps = {
  isOpen: boolean;
  workflow: WorkFlowTypes | null;
  onClose: () => void;
  onWorkflowUpdate: (workflow: WorkFlowTypes) => void;
  availableFlows: string[];
  selectedFlow: string | null;
};

export function EditWorkflowDialog({
  isOpen,
  workflow,
  onClose,
  onWorkflowUpdate,
  availableFlows,
  selectedFlow,
}: EditWorkflowDialogProps) {
  const { selectedIntegration } = useIntegration();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobspecName, setJobspecName] = useState('');
  const [eventSource, setEventSource] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventCategory, setEventCategory] = useState<
    'ticket' | 'user' | 'organization' | 'customobject' | 'activity' | 'custom' | ''
  >('');
  const [loadingIntegration, setLoadingIntegration] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      init();
    }
  }, [isOpen]);

  const init = () => {
    if (selectedIntegration && selectedFlow && workflow) {
      const jobspecDetails = getJobSpecDetails(workflow, selectedFlow || '');

      if (jobspecDetails) {
        setName(workflow.name || '');
        setDescription(workflow.description || '');
        setJobspecName(jobspecDetails.jobspecName);
        setEventSource(jobspecDetails.event_source);
        setEventType(jobspecDetails.event_type);

        // Determine event category from event type
        const eventTypeValue = jobspecDetails.event_type;
        if (eventTypeValue) {
          const category = eventTypeValue.split('.')[0];
          if (
            category === 'ticket' ||
            category === 'user' ||
            category === 'organization' ||
            category === 'customobject' ||
            category === 'activity'
          ) {
            setEventCategory(category as 'ticket' | 'user' | 'organization' | 'customobject' | 'activity');
          } else {
            setEventCategory('custom');
          }
        }
      }
    }
  };

  /**
   * Handle on form submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingIntegration(true);

    try {
      // Perform save operation here
      if (workflow) {
        const existingJobspec = workflow.resources[jobspecName];
        const updatedWorkflow: WorkFlowTypes = {
          ...workflow,
          resources: {
            ...workflow.resources,
            [jobspecName]: {
              type: 'ZIS::JobSpec',
              properties: {
                name: jobspecName,
                event_source: eventSource,
                event_type: eventType,
                flow_name: existingJobspec.type === 'ZIS::JobSpec' ? existingJobspec.properties.flow_name : '',
              },
            },
          },
        };

        // Call the update callback
        onWorkflowUpdate(updatedWorkflow);
      }

      toast({
        title: 'Workflow updated successfully',
      });
      closeDialog();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to save workflow',
          description: error.message,
        });
      }
    } finally {
      setLoadingIntegration(false);
    }
  };

  /**
   * Closes the dialog and resets state
   */
  const closeDialog = () => {
    onClose();
  };

  /**
   * Installs the bundle associated with the workflow
   */
  const installBundle = async () => {
    if (!workflow || !selectedIntegration) return;
    setIsInstalling(true);

    try {
      await ZDClient.installBundle(selectedIntegration, jobspecName);
      toast({
        title: 'Installed',
        description: `Successfully installed ZIS: "${selectedIntegration}".`,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to install bundle',
          description: error.message,
        });
      }
    } finally {
      setIsInstalling(false);
    }
  };

  /**
   * Uninstalls the bundle associated with the workflow
   */
  const uninstallBundle = async () => {
    if (!workflow || !selectedIntegration) return;
    setIsUninstalling(true);

    try {
      await ZDClient.uninstallBundle(selectedIntegration, jobspecName);
      toast({
        title: 'Uninstalled',
        description: `Successfully uninstalled ZIS: "${selectedIntegration}".`,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to uninstall bundle',
          description: error.message,
        });
      }
    } finally {
      setIsUninstalling(false);
    }
  };

  /**
   * Renders form for creating workflow
   */
  const renderWorkflowForm = () => (
    <>
      <SheetHeader className='pr-8'>
        <SheetTitle className='flex items-center gap-3'>
          <Pencil className='h-6 w-6' />
          Modify ZIS Settings
        </SheetTitle>
        <SheetDescription>Update the workflow details and jobspec information.</SheetDescription>
      </SheetHeader>
      <Separator />
      <ScrollArea className='flex-1 -mx-6 px-6'>
        {/* Install/ Uninstall Integration */}
        <div className='space-y-2 mb-5'>
          <div className='rounded-md border border-red-300 p-4'>
            <h4 className='font-bold text-foreground'>Danger Zone</h4>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage the installation status of ZIS Integration Flow:&nbsp;
              <span className='font-semibold text-foreground'>{selectedFlow}</span>.
              <br />
              Uninstall will stop the integration from this zendesk instance.
            </p>
            <div className='text-right mt-3'>
              <Button className='mr-2' onClick={installBundle} disabled={isInstalling}>
                {isInstalling ? <Loader2 className='h-4 w-4 animate-spin' /> : <Power className='h-4 w-4' />}
                Install
              </Button>
              <Button variant='outline' onClick={uninstallBundle} disabled={isUninstalling}>
                {isUninstalling ? <Loader2 className='h-4 w-4 animate-spin' /> : <PowerOff className='h-4 w-4' />}
                Uninstall
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='space-y-6 pb-6 mt-3'>
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>JobSpec Details</h4>
              <div className='space-y-4 rounded-md border p-4 bg-muted/30'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='jobspec-name'>JobSpec Name</Label>
                  <Input
                    id='jobspec-name'
                    value={jobspecName}
                    onChange={(e) => setJobspecName(e.target.value)}
                    placeholder='e.g., my_jobspec_name'
                    disabled={true}
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-category'>Event Category</Label>
                  <Select
                    value={eventCategory}
                    onValueChange={(
                      value: 'ticket' | 'user' | 'organization' | 'customobject' | 'activity' | 'custom',
                    ) => {
                      setEventCategory(value);
                      setEventType(''); // Reset event type when category changes
                      if (value !== 'custom') {
                        setEventSource('support'); // Set default event source for non-custom categories
                      }
                    }}>
                    <SelectTrigger id='event-category'>
                      <SelectValue placeholder='Select event category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ticket'>Ticket</SelectItem>
                      <SelectItem value='user'>User</SelectItem>
                      <SelectItem value='organization'>Organization</SelectItem>
                      <SelectItem value='customobject'>Custom Objects</SelectItem>
                      <SelectItem value='activity'>Activity</SelectItem>
                      <SelectItem value='custom'>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {eventCategory === 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-source'>Event Source</Label>
                    <Input
                      id='event-source'
                      value={eventSource}
                      onChange={(e) => setEventSource(e.target.value)}
                      placeholder='e.g., support'
                    />
                  </div>
                )}
                {eventCategory && eventCategory !== 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-type'>Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id='event-type'>
                        <SelectValue placeholder='Select an event type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>
                            <u>
                              {eventCategory === 'ticket'
                                ? 'Ticket Events'
                                : eventCategory === 'user'
                                  ? 'User Events'
                                  : eventCategory === 'organization'
                                    ? 'Organization Events'
                                    : eventCategory === 'customobject'
                                      ? 'Custom Object Events'
                                      : 'Activity Events'}
                            </u>
                          </SelectLabel>
                          {EVENT_TYPES[eventCategory].map((event) => (
                            <SelectItem key={event.value} value={event.value}>
                              {event.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {eventCategory === 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-type'>Event Type</Label>
                    <Input
                      id='event-type'
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder='e.g., ticket.CustomEvent'
                    />
                    <p className='text-xs text-muted-foreground'>
                      Enter a custom event type. Format: category.EventName (e.g., ticket.CustomEvent)
                    </p>
                  </div>
                )}
                <p className='text-xs text-muted-foreground !mt-2'>
                  Need help finding event types?{' '}
                  <a
                    href='https://developer.zendesk.com/api-reference/integration-services/trigger-events/ticket-events/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'>
                    View documentation
                    <SquareArrowOutUpRight className='h-3 w-3 ml-1 inline-block' />
                  </a>
                </p>

                {/* Webhook Details */}
                <WebhookDetails
                  selectedIntegration={selectedIntegration}
                  workflow={workflow}
                  eventSource={eventSource}
                  eventType={eventType}
                />
              </div>
            </div>
          </div>
          <div className='px-2 py-4 flex justify-end space-x-2 flex-wrap gap-2'>
            <div className='flex space-x-2'>
              <Button type='button' variant='link' onClick={closeDialog} disabled={loadingIntegration}>
                Cancel
              </Button>
              <Button type='submit' disabled={loadingIntegration}>
                {loadingIntegration && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </ScrollArea>
    </>
  );

  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent className='flex flex-col group' style={{ width: `${width}px`, maxWidth: '80vw' }}>
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 h-full w-2.5 cursor-col-resize flex items-center justify-center transition-colors z-10',
            'group-hover:bg-border/50',
            isResizing.current && 'bg-border/80',
          )}>
          <GripVertical
            className={cn(
              'h-6 w-4 text-muted-foreground/50 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              isResizing.current && 'opacity-100',
            )}
          />
        </div>
        {renderWorkflowForm()}
      </SheetContent>
    </Sheet>
  );
}
