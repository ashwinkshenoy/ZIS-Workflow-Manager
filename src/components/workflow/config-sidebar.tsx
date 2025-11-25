

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Node } from 'reactflow';
import type { ZISChoice, ZISResource, ZISState } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { getIconForNodeType } from '@/lib/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ChoiceForm } from './choice-form';
import { Separator } from '../ui/separator';
import { GenericForm } from './generic-form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionNodeForm } from './action-node-form';
import { PassNodeForm } from './pass-node-form';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

type ConfigSidebarProps = {
  node: Node<ZISState> | null;
  actions: Record<string, ZISResource>;
  isOpen: boolean;
  onClose: () => void;
  onNodeChange: (
    nodeId: string,
    updatedData: Partial<ZISState>
  ) => void;
  onNodeIdUpdate: (oldId: string, newId: string) => void;
};

export function ConfigSidebar({
  node,
  actions,
  isOpen,
  onClose,
  onNodeChange,
  onNodeIdUpdate,
}: ConfigSidebarProps) {
  const [nodeId, setNodeId] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [width, setWidth] = useState(540);
  const isResizing = useRef(false);
  const [formData, setFormData] = useState<ZISState | null>(null);

  const debouncedOnNodeChange = useDebouncedCallback(onNodeChange, 300);

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
    if (node) {
      setNodeId(node.id);
      setFormData(node.data);
      setRawJson(JSON.stringify(node.data, null, 2));
      setIsJsonValid(true);
    } else {
      setFormData(null);
    }
  }, [node]);
  
  if (!node || !formData) {
    return null;
  }

  const Icon = getIconForNodeType(formData.Type);

  const handleNodeIdBlur = () => {
    if (node && nodeId !== node.id) {
        onNodeIdUpdate(node.id, nodeId);
    }
  };

  const handleFormChange = (updatedFormData: Partial<ZISState>) => {
    const newData = { ...formData, ...updatedFormData };
    setFormData(newData);
    debouncedOnNodeChange(node.id, updatedFormData);
  };
  
  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     handleFormChange({ Default: e.target.value });
  };

  const handleChoiceChange = (index: number, updatedChoice: ZISChoice) => {
    const newChoices = [...(formData.Choices || [])];
    newChoices[index] = updatedChoice;
    handleFormChange({ Choices: newChoices });
  };

  const handleAddChoice = () => {
    const newChoice: ZISChoice = {
      Next: '',
      Variable: '$.',
      StringEquals: '',
    };
    const newChoices = [...(formData.Choices || []), newChoice];
    handleFormChange({ Choices: newChoices });
  }

  const handleRemoveChoice = (index: number) => {
    const newChoices = [...(formData.Choices || [])];
    newChoices.splice(index, 1);
    handleFormChange({ Choices: newChoices });
  }

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJson = e.target.value;
    setRawJson(newJson);
    try {
      const parsed = JSON.parse(newJson);
      setFormData(parsed);
      onNodeChange(node.id, parsed);
      setIsJsonValid(true);
    } catch (error) {
      setIsJsonValid(false);
    }
  };

  const isChoiceNode = formData.Type === 'Choice';
  const isActionNode = formData.Type === 'Action';
  const isPassNode = formData.Type === 'Pass';
  const hasNext = 'Next' in formData;
  const hasResultPath = 'ResultPath' in formData;

  const shouldRenderGenericResultPath = hasResultPath && !isPassNode && !isActionNode;

  return (
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
          <GripVertical className={cn(
            'h-6 w-4 text-muted-foreground/50 transition-opacity',
            'opacity-0 group-hover:opacity-100',
             isResizing.current && 'opacity-100'
            )} />
        </div>
        <SheetHeader className="pr-8 space-y-4">
           <SheetTitle className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-accent-foreground flex-shrink-0" />
              <Input
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  onBlur={handleNodeIdBlur}
                  className="text-lg font-semibold tracking-tight p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 truncate bg-transparent"
              />
            </SheetTitle>
          <SheetDescription>
            Configure the properties of this workflow step.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="node-type">Type</Label>
              <Badge id="node-type" variant="outline" className="w-fit">
                {formData.Type}
              </Badge>
            </div>
            
            <GenericForm 
              data={formData}
              onChange={handleFormChange}
            />

            {isActionNode && (
                <ActionNodeForm
                    data={formData}
                    actions={actions}
                    onChange={handleFormChange}
                />
            )}
            
            {isPassNode && (
              <PassNodeForm
                data={formData}
                onChange={handleFormChange}
              />
            )}

            {shouldRenderGenericResultPath && (
                 <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="result-path">ResultPath</Label>
                    <Input
                        id="result-path"
                        value={formData.ResultPath || ''}
                        onChange={(e) => handleFormChange({ ResultPath: e.target.value })}
                        placeholder="e.g., $.result_output"
                    />
                </div>
            )}

            {hasNext && (
                 <div className="grid w-full items-center gap-1.5 pt-4">
                    <Label htmlFor="next-step">Next Step</Label>
                    <Input
                        id="next-step"
                        value={formData.Next || ''}
                        onChange={(e) => handleFormChange({ Next: e.target.value })}
                        placeholder="e.g., 002.Next.Step"
                    />
                </div>
            )}

            {isChoiceNode && (
               <>
                <Separator />
                <Accordion type="multiple" className="w-full" defaultValue={[`item-0`]}>
                  {formData.Choices?.map((choice: ZISChoice, index: number) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <div className="flex w-full items-center">
                         <AccordionTrigger className="flex-1">
                            <span>Choice {index + 1}</span>
                        </AccordionTrigger>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleRemoveChoice(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <AccordionContent>
                        <ChoiceForm 
                          choice={choice}
                          onChange={(updatedChoice) => handleChoiceChange(index, updatedChoice)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button variant="outline" size="sm" onClick={handleAddChoice} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Choice Rule
                </Button>
                <div className="grid w-full items-center gap-1.5 pt-4">
                    <Label htmlFor="default-next">Default Next Step</Label>
                    <Input
                        id="default-next"
                        value={formData.Default || ''}
                        onChange={handleDefaultChange}
                        placeholder="e.g., 010.EndFlow.Default"
                    />
                </div>
              </>
            )}

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
          </div>
        </ScrollArea>

        <SheetFooter>
          <Button onClick={onClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
