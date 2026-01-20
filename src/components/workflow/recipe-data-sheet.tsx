'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Copy, Check, ChevronUp, Sparkles, Cog } from 'lucide-react';
import type { Node } from 'reactflow';
import type { ZISState, Workflow, ZISFlow, ZISChoice } from '@/lib/types';
import { getIconForNodeType } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useIntegration } from '@/context/integration-context';

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
  currentNode: Node<ZISState> | null;
  workflow: Workflow | null;
  selectedFlowName: string | null;
};

export function RecipeDataSheet({
  nodes,
  isOpen,
  sidebarWidth,
  currentNode,
  workflow,
  selectedFlowName,
}: RecipeDataSheetProps) {
  const [recipeData, setRecipeData] = useState<RecipeDataItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const { integrationConfig } = useIntegration();

  useEffect(() => {
    if (nodes && nodes.length > 0 && currentNode && workflow && selectedFlowName) {
      const flowResource = workflow.resources[selectedFlowName] as ZISFlow | undefined;
      if (!flowResource) {
        setRecipeData([]);
        return;
      }

      const { States: states, StartAt: startAt } = flowResource.properties.definition;

      // Build execution order by traversing all possible paths using BFS
      const executionOrder: string[] = [];
      const visited = new Set<string>();
      const queue: string[] = [startAt];

      while (queue.length > 0) {
        const currentStateId = queue.shift();
        if (!currentStateId) continue;

        // Stop if we've reached the current node
        if (currentStateId === currentNode.id) break;

        // Skip if already visited
        if (visited.has(currentStateId)) continue;

        visited.add(currentStateId);
        executionOrder.push(currentStateId);

        const state = states[currentStateId];
        if (!state) continue;

        // Handle different state types
        if (state.Type === 'Choice') {
          // For Choice states, add all possible next states
          if (state.Choices && Array.isArray(state.Choices)) {
            state.Choices.forEach((choice: ZISChoice) => {
              if (choice.Next && !visited.has(choice.Next)) {
                queue.push(choice.Next);
              }
            });
          }
          // Add default path if present
          if (state.Default && !visited.has(state.Default)) {
            queue.push(state.Default);
          }
        } else if (state.Next && !visited.has(state.Next)) {
          // For other states, follow the Next property
          queue.push(state.Next);
        }
      }

      // Create data items for nodes in execution order that have ResultPath
      const dataItems: RecipeDataItem[] = executionOrder
        .map((stateId, index) => {
          const node = nodes.find((n) => n.id === stateId);
          if (!node || !node.data.ResultPath) return null;

          const stepNumberMatch = stateId.match(/^(\d+)\./);
          const stepNumber = stepNumberMatch ? parseInt(stepNumberMatch[1], 10) : index + 1;

          return {
            stepId: stateId,
            stepName: stateId,
            resultPath: node.data.ResultPath as string,
            stepNumber,
            type: String(node.data.Type),
          };
        })
        .filter((item) => item !== null) as RecipeDataItem[];

      setRecipeData(dataItems);
    } else {
      setRecipeData([]);
    }
  }, [nodes, currentNode, workflow, selectedFlowName]);

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
        'fixed bottom-0 bg-background border-r border-b rounded-tl-lg shadow-lg z-40',
        'transition-all duration-300 ease-in-out',
        isPanelExpanded ? 'max-h-[500px] w-[380px] p-4 flex flex-col' : 'w-auto p-2',
      )}
      style={{ right: `${sidebarWidth}px` }}>
      {isPanelExpanded ? (
        <>
          <div className='flex items-center justify-between mb-4'>
            <div className='space-y-2 flex-1'>
              <div className='flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-primary' />
                <h2 className='text-base font-semibold'>Suggestions</h2>
              </div>
              <div className='text-xs text-muted-foreground'>Data variables available for this workflow execution.</div>
            </div>
            <button
              onClick={() => setIsPanelExpanded(false)}
              className='ml-2 p-1.5 rounded hover:bg-accent transition-colors flex-shrink-0'
              title='Minimize suggestions'>
              <ChevronUp className='w-4 h-4 text-muted-foreground' />
            </button>
          </div>

          <ScrollArea className='flex-1 overflow-y-auto'>
            <div className='pr-1 space-y-1'>
              {/* Configuration Section */}
              {integrationConfig && Object.keys(integrationConfig).length > 0 && (
                <div className='border rounded-md overflow-hidden mb-2'>
                  <div
                    onClick={() => handleItemClick('config')}
                    className='flex items-center justify-between p-2.5 bg-card hover:bg-accent/50 transition-colors cursor-pointer group'>
                    <div className='flex items-center gap-2.5 flex-1 min-w-0'>
                      <div className='w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0'>
                        <Cog className='w-5 h-5 text-primary' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-xs truncate'>Configuration</div>
                      </div>
                    </div>
                    {expandedItem === 'config' ? (
                      <ChevronUp className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
                    ) : (
                      <ChevronDown className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
                    )}
                  </div>

                  {expandedItem === 'config' && (
                    <div className='p-2.5 bg-muted/30 border-t space-y-2'>
                      {Object.entries(integrationConfig).map(([key, value]) => {
                        const configPath = `$.config.${key}`;
                        const isCopied = copiedItem === `config-${key}`;
                        return (
                          <div key={key} className='flex items-center justify-between gap-2'>
                            <div className='flex-1 min-w-0'>
                              <Badge
                                variant='secondary'
                                className='font-mono text-xs px-2 py-1 max-w-fit cursor-pointer hover:bg-secondary/80'
                                onClick={(e) => handleCopyToClipboard(configPath, `config-${key}`, e)}>
                                {configPath}
                              </Badge>
                            </div>
                            <button
                              onClick={(e) => handleCopyToClipboard(configPath, `config-${key}`, e)}
                              className='p-1.5 rounded hover:bg-background transition-colors'
                              title='Copy to clipboard'>
                              {isCopied ? (
                                <Check className='w-3.5 h-3.5 text-green-600' />
                              ) : (
                                <Copy className='w-3.5 h-3.5 text-muted-foreground' />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {recipeData.length === 0 ? (
                <div className='text-center text-muted-foreground text-sm'>No steps with output data found</div>
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
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0' />
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
        </>
      ) : (
        <button
          onClick={() => setIsPanelExpanded(true)}
          className='flex items-center gap-2 hover:bg-accent rounded p-2 transition-colors'
          title='Expand suggestions'>
          <Sparkles className='w-4 h-4 text-primary' />
          <span className='text-sm font-semibold whitespace-nowrap'>Suggestions</span>
          <ChevronDown className='w-4 h-4 text-muted-foreground' />
        </button>
      )}
    </div>
  );
}
