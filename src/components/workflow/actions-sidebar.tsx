
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ZISActionHttp, ZISResource, Workflow } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { GripVertical, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ActionHttpForm } from './action-http-form';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { NewActionDialog } from './new-action-dialog';
import { DeleteActionDialog } from './delete-action-dialog';

type ActionsSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  actions: Record<string, ZISResource>;
  actionUsage: Record<string, number>;
  onActionUpdate: (actionId: string, updatedAction: ZISResource) => void;
  onActionAdd: (actionId: string, actionType: 'ZIS::Action::Http') => void;
  onActionDelete: (actionId: string) => void;
};

export function ActionsSidebar({
  isOpen,
  onClose,
  actions,
  actionUsage,
  onActionUpdate,
  onActionAdd,
  onActionDelete,
}: ActionsSidebarProps) {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [width, setWidth] = useState(540);
  const [rawJson, setRawJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isNewActionDialogOpen, setNewActionDialogOpen] = useState(false);
  const [isDeleteActionDialogOpen, setDeleteActionDialogOpen] = useState(false);
  const isResizing = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedActionId(null);
    }
    // If the selected action is deleted from outside, deselect it
    if (selectedActionId && !actions[selectedActionId]) {
      const remainingActions = Object.keys(actions);
      setSelectedActionId(remainingActions.length > 0 ? remainingActions[0] : null);
    }
  }, [isOpen, actions, selectedActionId]);

  const selectedAction = selectedActionId ? actions[selectedActionId] : null;
  const selectedActionUsageCount = (selectedActionId && actionUsage[selectedActionId]) || 0;

  useEffect(() => {
    if (selectedAction) {
      setRawJson(JSON.stringify(selectedAction.properties, null, 2));
      setIsJsonValid(true);
    } else {
      setRawJson('');
    }
  }, [selectedAction]);

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


  const handleActionFormChange = (updatedProperties: any) => {
    if (!selectedActionId || !selectedAction) return;
    const updatedAction = {
      ...selectedAction,
      properties: updatedProperties,
    };
    onActionUpdate(selectedActionId, updatedAction);
    setRawJson(JSON.stringify(updatedProperties, null, 2));
  };
  
  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJson = e.target.value;
    setRawJson(newJson);
    try {
      const parsed = JSON.parse(newJson);
      handleActionFormChange(parsed);
      setIsJsonValid(true);
    } catch (error) {
      setIsJsonValid(false);
    }
  };

  const handleActionAdd = (actionId: string, actionType: 'ZIS::Action::Http') => {
    onActionAdd(actionId, actionType);
    setSelectedActionId(actionId);
    setNewActionDialogOpen(false);
  };

  const handleActionDeleteConfirm = () => {
    if (selectedActionId) {
      onActionDelete(selectedActionId);
    }
    setDeleteActionDialogOpen(false);
  };


  const renderActionForm = () => {
    if (!selectedAction) return null;

    switch (selectedAction.type) {
      case 'ZIS::Action::Http':
        return (
          <ActionHttpForm
            data={selectedAction.properties}
            onChange={handleActionFormChange}
          />
        );
      default:
        return <p className="text-sm text-muted-foreground">This action type is not yet editable via the form.</p>;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          className="flex flex-col group"
          style={{ width: `${width}px`, maxWidth: '80vw' }}
        >
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute left-0 top-0 h-full w-2.5 cursor-col-resize flex items-center justify-center transition-colors z-10',
              'group-hover:bg-border/50',
              isResizing.current && 'bg-border/80'
            )}
          >
            <GripVertical className={cn('h-6 w-4 text-muted-foreground/50 transition-opacity', 'opacity-0 group-hover:opacity-100', isResizing.current && 'opacity-100')} />
          </div>
          <SheetHeader className="pr-8">
            <SheetTitle className="flex items-center gap-3">
              <SlidersHorizontal className="h-6 w-6 text-accent-foreground" />
              Manage Actions
            </SheetTitle>
            <SheetDescription>
              View and edit the reusable actions defined in this workflow.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-6">
              <div className="grid w-full items-center gap-1.5">
                <div className='flex items-center justify-between'>
                  <Label htmlFor="action-select">Action</Label>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => setNewActionDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Action
                      </Button>
                      {selectedAction && (
                        <Button
                          variant="destructive-outline"
                          size="sm"
                          onClick={() => setDeleteActionDialogOpen(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      )}
                  </div>
                </div>
                <Select
                  value={selectedActionId || ''}
                  onValueChange={setSelectedActionId}
                >
                  <SelectTrigger id="action-select">
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(actions).map(actionId => (
                      <SelectItem key={actionId} value={actionId}>
                        {actionId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAction && (
                <>
                  <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="node-type">Type</Label>
                      <Badge id="node-type" variant="outline" className="w-fit">
                          {selectedAction.type}
                      </Badge>
                  </div>
                  {renderActionForm()}

                  <Separator />

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="raw-properties">
                      <AccordionTrigger>Raw Properties (JSON)</AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          value={rawJson}
                          onChange={handleRawJsonChange}
                          rows={15}
                          className={`font-mono text-xs ${!isJsonValid ? 'border-destructive ring-2 ring-destructive ring-offset-2' : ''}`}
                          placeholder="Enter valid JSON..."
                        />
                        {!isJsonValid && (
                            <p className="mt-2 text-sm text-destructive">Invalid JSON format.</p>
                          )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
              
              {Object.keys(actions).length === 0 && (
                  <div className="text-center py-10">
                      <p className="text-muted-foreground">No actions defined in this workflow.</p>
                       <Button variant="link" onClick={() => setNewActionDialogOpen(true)}>
                        Create one now
                      </Button>
                  </div>
              )}

            </div>
          </ScrollArea>

          <SheetFooter>
            <Button onClick={onClose}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <NewActionDialog
        isOpen={isNewActionDialogOpen}
        onClose={() => setNewActionDialogOpen(false)}
        onActionAdd={handleActionAdd}
        existingActionIds={Object.keys(actions)}
      />
      <DeleteActionDialog
        isOpen={isDeleteActionDialogOpen}
        onClose={() => setDeleteActionDialogOpen(false)}
        onConfirm={handleActionDeleteConfirm}
        actionId={selectedActionId}
        usageCount={selectedActionUsageCount}
      />
    </>
  );
}
