'use client';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from 'reactflow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '../ui/button';
import { Bolt, CheckCircle, Copy, GitFork, MoveRight, Plus, Timer, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type AddableNodeType = 'Action' | 'Choice' | 'Pass' | 'Succeed' | 'Fail' | 'Wait';

export function AddNodeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: any) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const [isOpen, setOpen] = useState(false);

  if (!data?.onNodeAdd) {
    return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />;
  }

  const handleAdd = (nodeType: AddableNodeType) => {
    if (data?.onNodeAdd) {
      data.onNodeAdd(data.source, data.target, nodeType);
    }
    setOpen(false);
  };

  const handlePaste = () => {
    if (data?.onNodePaste) {
      data.onNodePaste(data.source);
    }
    setOpen(false);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className='nodrag nopan'>
          <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className={cn(
                  'h-6 w-6 rounded-full border-2 bg-background transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground',
                  isOpen
                    ? 'scale-110 border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/50 text-muted-foreground/80',
                )}>
                <Plus className='h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-1'>
              <div className='flex flex-col gap-1'>
                {data?.copiedNodeState && (
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
      </EdgeLabelRenderer>
    </>
  );
}
