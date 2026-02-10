'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getIconForNodeType } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Network,
  Trash2,
  Copy,
  Plus,
  Bolt,
  GitFork,
  MoveRight,
  Timer,
  CheckCircle,
  XCircle,
  ArrowDown,
  Zap,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { NodeProps, Handle, Position } from 'reactflow';
import type { ZISState } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Define the type for the node's data payload extended from ZISState
type WorkflowNodeData = ZISState & {
  onNodeDelete: (id: string) => void;
  onNodeAddBelow: (sourceId: string, nodeType: 'Action' | 'Choice' | 'Pass' | 'Succeed' | 'Fail' | 'Wait') => void;
  onNodeCopy: (id: string, state: ZISState) => void;
  onNodePaste: (targetId: string) => void;
  copiedNodeState: ZISState | null;
};

// Extend NodeProps to include the custom isStartNode prop
interface CustomNodeProps extends NodeProps<WorkflowNodeData> {
  isStartNode: boolean;
}

export function WorkflowNode({ data, selected, id, isStartNode }: CustomNodeProps) {
  const Icon = isStartNode ? Zap : getIconForNodeType(data.Type);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);

  const getBadgeVariant = () => {
    switch (data.Type) {
      case 'Succeed':
        return 'success';
      case 'Fail':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onNodeDelete(id);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onNodeCopy(id, data);
    setMenuOpen(false);
  };

  const handlePaste = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onNodePaste(id);
    setMenuOpen(false);
  };

  const handleAdd = (nodeType: 'Action' | 'Choice' | 'Pass' | 'Succeed' | 'Fail' | 'Wait') => {
    data.onNodeAddBelow(id, nodeType);
    setAddMenuOpen(false);
  };

  const isTerminalNode = data.Type === 'Succeed' || data.Type === 'Fail';

  // A node has a successor if it has a 'Next' property with a value, or it's a Choice node with a 'Default'
  const hasSuccessor = !!data.Next || (data.Type === 'Choice' && !!data.Default);

  // Show the "add below" button only if the node is not terminal AND it doesn't already have a successor path.
  const showAddBelowButton = !isTerminalNode && !hasSuccessor;

  const hasCatch = data.Type === 'Action' && data.Catch && data.Catch.length > 0;

  return (
    <div
      data-wf-node='true'
      className='relative group'
      style={{
        width: 350,
      }}>
      {/* These handles are invisible connection points for react-flow */}
      <Handle type='target' position={Position.Top} className='!bg-transparent' />
      <Handle type='source' position={Position.Bottom} className='!bg-transparent' id='next-handle' />
      <Handle type='source' position={Position.Right} className='!bg-transparent' />

      {hasCatch && <Handle type='source' position={Position.Right} id='catch-handle' className='!bg-transparent' />}

      <Card
        className={cn(
          'cursor-pointer border-2 shadow-lg transition-all hover:shadow-xl hover:border-primary',
          selected ? 'border-primary shadow-primary/20' : 'border-border'
        )}>
        <CardHeader className='flex-row items-center gap-3 space-y-0 p-4'>
          <div className='flex h-10 w-10 items-center justify-center rounded-md border border-muted-foreground/20 bg-muted/40'>
            <Icon className='h-6 w-6 text-muted-foreground' />
          </div>
          <CardTitle className='truncate text-base'>{id}</CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0'>
          <div className='flex items-center justify-between'>
            <Badge variant={getBadgeVariant()}>{data.Type}</Badge>
            {isStartNode && <Badge variant='outline'>Start</Badge>}
          </div>
        </CardContent>
      </Card>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'absolute top-1/2 -right-8 -translate-y-1/2 h-7 w-7 transition-opacity',
              'data-[state=open]:bg-slate-200'
            )}
            onClick={handleMenuClick}>
            <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={handleMenuClick} align='end'>
          <DropdownMenuItem onClick={handleDelete} className='text-red-500 focus:text-red-500'>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className='mr-2 h-4 w-4' />
            Copy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showAddBelowButton && (
        <div
          className={cn(
            'absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
            addMenuOpen ? 'opacity-100' : 'opacity-50 group-hover:opacity-100 transition-opacity'
          )}>
          <ArrowDown className='h-4 w-4 text-muted-foreground/80' />
          <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                size='icon'
                className={cn(
                  'h-6 w-6 rounded-full border-2 bg-background transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground border-muted-foreground/50 text-muted-foreground/80',
                  addMenuOpen
                    ? 'scale-110 border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/50 text-muted-foreground/80'
                )}
                onClick={handleMenuClick}>
                <Plus className='h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-1' side='bottom' align='center' onClick={handleMenuClick}>
              <div className='flex flex-col gap-1'>
                {data.copiedNodeState && (
                  <Button variant='ghost' size='sm' className='justify-start' onClick={handlePaste}>
                    <Copy className='mr-2' />
                    Paste
                  </Button>
                )}
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Action')}>
                  <Bolt className='mr-2' />
                  Add Action
                </Button>
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Choice')}>
                  <GitFork className='mr-2' />
                  Add Choice
                </Button>
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Pass')}>
                  <MoveRight className='mr-2' />
                  Add Pass
                </Button>
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Wait')}>
                  <Timer className='mr-2' />
                  Add Wait
                </Button>
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Succeed')}>
                  <CheckCircle className='mr-2' />
                  Add Succeed
                </Button>
                <Button variant='ghost' size='sm' className='justify-start' onClick={() => handleAdd('Fail')}>
                  <XCircle className='mr-2' />
                  Add Fail
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
