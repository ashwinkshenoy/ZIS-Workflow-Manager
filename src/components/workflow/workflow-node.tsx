'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getIconForNodeType } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Network, Trash2, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { NodeProps, Handle, Position } from 'reactflow';
import type { ZISState } from '@/lib/types';

// Define the type for the node's data payload extended from ZISState
type WorkflowNodeData = ZISState & {
  onNodeDelete: (id: string) => void;
};

// Extend NodeProps to include the custom isStartNode prop
interface CustomNodeProps extends NodeProps<WorkflowNodeData> {
  isStartNode: boolean;
}

export function WorkflowNode({ data, selected, id, isStartNode }: CustomNodeProps) {
  const Icon = isStartNode ? Zap : getIconForNodeType(data.Type);
  const [open, setOpen] = React.useState(false);

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

  const hasCatch = data.Type === 'Action' && data.Catch && data.Catch.length > 0;

  return (
    <div
      data-wf-node='true'
      className='relative group'
      style={{
        width: 300,
      }}>
      {/* These handles are invisible connection points for react-flow */}
      <Handle type='target' position={Position.Top} className='!bg-transparent' />
      <Handle type='source' position={Position.Bottom} className='!bg-transparent' id='next-handle' />

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
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'absolute top-1/2 -right-8 -translate-y-1/2 h-7 w-7 transition-opacity',
              'opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100'
            )}
            onClick={handleMenuClick}>
            <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={handleMenuClick} align='end'>
          <DropdownMenuItem onClick={handleDelete} className='text-destructive focus:text-destructive'>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
