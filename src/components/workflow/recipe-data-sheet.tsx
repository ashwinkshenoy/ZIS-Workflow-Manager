'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import type { Node } from 'reactflow';
import type { ZISState } from '@/lib/types';
import { getIconForNodeType } from '@/lib/icons';
import { cn } from '@/lib/utils';

type RecipeDataItem = {
  stepId: string;
  stepName: string;
  resultPath: string;
  stepNumber: number;
  type: string;
};

type RecipeDataSheetProps = {
  nodes: Node<ZISState>[];
  isOpen: boolean;
  sidebarWidth: number;
};

export function RecipeDataSheet({ nodes, isOpen, sidebarWidth }: RecipeDataSheetProps) {
  const [recipeData, setRecipeData] = useState<RecipeDataItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      // Extract all nodes with ResultPath
      const dataItems: RecipeDataItem[] = nodes
        .filter((node) => node.data.ResultPath)
        .map((node, index) => {
          // Extract step number from node ID (e.g., "001.Step.Name" -> 1)
          const stepNumberMatch = node.id.match(/^(\d+)\./);
          const stepNumber = stepNumberMatch ? parseInt(stepNumberMatch[1], 10) : index + 1;

          return {
            stepId: node.id,
            stepName: node.data.Comment || node.id,
            resultPath: node.data.ResultPath as string,
            stepNumber,
            type: node.data.Type,
          };
        })
        .sort((a, b) => a.stepNumber - b.stepNumber);

      setRecipeData(dataItems);
    }
  }, [nodes]);

  const handleItemClick = (stepId: string) => {
    setExpandedItem(expandedItem === stepId ? null : stepId);
  };

  const handleCopyToClipboard = async (resultPath: string, stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(resultPath);
      setCopiedItem(stepId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 max-h-[500px] w-[380px] bg-background border-r border-b rounded-br-lg flex flex-col p-4 shadow-lg z-40',
        'transition-all duration-300 ease-in-out'
      )}
      style={{ right: `${sidebarWidth}px` }}>
      <div className='space-y-2 mb-4'>
        <h2 className='text-base font-semibold'>Recipe data</h2>
        <div className='text-xs text-muted-foreground'>
          To use data from a previous step, drag its{' '}
          <Badge variant='secondary' className='mx-1 font-mono text-xs px-1.5 py-0.5'>
            datapill
          </Badge>
          into a field
        </div>
      </div>

      <ScrollArea className='flex-1 overflow-y-auto'>
        <div className='space-y-1.5 pr-4'>
          {recipeData.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground text-sm'>No steps with output data found</div>
          ) : (
            recipeData.map((item) => {
              const Icon = getIconForNodeType(item.type);
              const isExpanded = expandedItem === item.stepId;
              const isCopied = copiedItem === item.stepId;

              return (
                <div key={item.stepId} className='border rounded-md overflow-hidden'>
                  <div
                    onClick={() => handleItemClick(item.stepId)}
                    className='flex items-center justify-between p-2.5 bg-card hover:bg-accent/50 transition-colors cursor-pointer group'>
                    <div className='flex items-center gap-2.5 flex-1 min-w-0'>
                      <div className='w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0'>
                        {Icon && <Icon className='w-5 h-5 text-primary' />}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-xs truncate'>{item.stepName}</div>
                        <div className='text-[11px] text-muted-foreground'>(Step {item.stepNumber} output)</div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
                    ) : (
                      <ChevronRight className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
                    )}
                  </div>

                  {isExpanded && (
                    <div className='p-2.5 bg-muted/30 border-t'>
                      <div className='flex items-center justify-between gap-2'>
                        <Badge
                          variant='secondary'
                          className='font-mono text-xs px-2 py-1 max-w-fit cursor-pointer hover:bg-secondary/80'
                          onClick={(e) => handleCopyToClipboard(item.resultPath, item.stepId, e)}>
                          {item.resultPath}
                        </Badge>
                        <button
                          onClick={(e) => handleCopyToClipboard(item.resultPath, item.stepId, e)}
                          className='p-1.5 rounded hover:bg-background transition-colors'
                          title='Copy to clipboard'>
                          {isCopied ? (
                            <Check className='w-3.5 h-3.5 text-green-600' />
                          ) : (
                            <Copy className='w-3.5 h-3.5 text-muted-foreground' />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
