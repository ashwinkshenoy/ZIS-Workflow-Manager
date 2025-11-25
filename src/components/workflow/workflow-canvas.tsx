'use client';

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import type { ZISState } from '@/lib/types';

type WorkflowCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeTypes: any;
  edgeTypes: any;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onWorkflowCreate: () => void;
  startAt: string | null;
};

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes,
  onNodeClick,
  onPaneClick,
  onWorkflowCreate,
  startAt,
}: WorkflowCanvasProps) {
  const onConnect: OnConnect = useCallback((params) => {
    // This is disabled for now, as connections are derived from the workflow definition
    console.log('Connect attempt:', params);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    // TODO: could open a custom context menu here
  }, []);

  if (!nodes || nodes.length === 0) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-background'>
        <div className='text-center space-y-4'>
          <p className='text-muted-foreground'>Your canvas is empty.</p>
          <Button onClick={onWorkflowCreate}>
            <Plus className='mr-2 h-4 w-4' />
            Create Workflow
          </Button>
          <p className='text-muted-foreground text-sm'>or import an existing workflow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full w-full'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeContextMenu={onEdgeContextMenu}
        fitView
        className='bg-background'
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}>
        <Controls />
        {/* <MiniMap nodeStrokeWidth={3} zoomable pannable /> */}
        <Background gap={16} variant='dots' />
      </ReactFlow>
    </div>
  );
}
