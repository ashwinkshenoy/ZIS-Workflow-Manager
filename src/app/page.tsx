'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Workflow, ZISFlow, ZISResource, ZISState } from '@/lib/types';
import { parseWorkflow, getNextNodeId, createNewWorkflow, createFlowResource } from '@/lib/workflow-utils';
import { initialWorkflow } from '@/lib/sample-workflow';
import { AppHeader } from '@/components/layout/header';
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas';
import { ConfigSidebar } from '@/components/workflow/config-sidebar';
import { ActionsSidebar } from '@/components/workflow/actions-sidebar';
import { ConfigsSidebar } from '@/components/workflow/configs-sidebar';
import { useToast } from '@/hooks/use-toast';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from 'reactflow';
import { applyNodeChanges, applyEdgeChanges, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import { DeleteNodeDialog } from '@/components/workflow/delete-node-dialog';
import { NewWorkflowDialog, type NewWorkflowData } from '@/components/workflow/new-workflow-dialog';
import { NewFlowDialog, type NewFlowData } from '@/components/workflow/new-flow-dialog';
import { EditWorkflowDialog } from '@/components/workflow/edit-workflow-dialog';
import { WorkflowNode } from '@/components/workflow/workflow-node';
import { AddNodeEdge } from '@/components/workflow/add-node-edge';
import type { NodeProps } from 'reactflow';
import ZDClient from '@/lib/ZDClient';
import { useIntegration } from '@/context/integration-context';
import { DeleteFlowDialog } from '@/components/workflow/delete-flow-dialog';

export default function Home() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [availableFlows, setAvailableFlows] = useState<string[]>([]);
  const [selectedFlowName, setSelectedFlowName] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<ZISState> | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [isNewWorkflowDialogOpen, setNewWorkflowDialogOpen] = useState(false);
  const [isEditWorkflowDialogOpen, setEditWorkflowDialogOpen] = useState(false);
  const [isNewFlowDialogOpen, setNewFlowDialogOpen] = useState(false);
  const {
    selectedIntegration,
    setSelectedIntegration,
    isActionsSidebarOpen,
    setActionsSidebarOpen,
    isConfigsSidebarOpen,
    setConfigsSidebarOpen,
    setSelectedIntegrationObject,
    selectedActionForEdit,
    setSelectedActionForEdit,
  } = useIntegration();
  const [isDeleteFlowDialogOpen, setDeleteFlowDialogOpen] = useState(false);
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (workflow) {
      const flowNames = Object.entries(workflow.resources)
        .filter(([, resource]) => resource.type === 'ZIS::Flow')
        .map(([key]) => key);

      setAvailableFlows(flowNames);

      let flowToRender = selectedFlowName;
      // If the selected flow is no longer available, or none is selected, default to the first one
      if (!flowToRender || !flowNames.includes(flowToRender)) {
        flowToRender = flowNames[0] || null;
        setSelectedFlowName(flowToRender);
      }

      const { nodes: parsedNodes, edges: parsedEdges } = parseWorkflow(workflow, flowToRender);
      setNodes(parsedNodes.map((n) => ({ ...n, type: 'workflowNode' })));
      setEdges(
        parsedEdges.map((e: any) => ({
          ...e,
          type: 'add-node-edge',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(var(--border))',
          },
          style: {
            stroke: 'hsl(var(--border))',
            strokeWidth: 2,
          },
          data: {
            ...e.data,
            source: e.source,
            target: e.target,
            onNodeAdd: handleNodeAdd,
          },
        })),
      );

      if (selectedNode) {
        const updatedSelectedNode = parsedNodes.find((n) => n.id === selectedNode.id);
        if (updatedSelectedNode) {
          // Re-create the node object for selection to ensure it's a valid React Flow node
          setSelectedNode({
            ...updatedSelectedNode,
            type: 'workflowNode',
            data: updatedSelectedNode.data,
          });
        } else {
          setSelectedNode(null);
        }
      }
    } else {
      setNodes([]);
      setEdges([]);
      setAvailableFlows([]);
      setSelectedFlowName(null);
      setSelectedNode(null);
    }
  }, [workflow, selectedFlowName, setNodes, setEdges]);

  const handleNodeChange = useCallback(
    (nodeId: string, updatedData: Partial<ZISState>) => {
      setWorkflow((currentWorkflow: Workflow | null) => {
        if (!currentWorkflow || !selectedFlowName) return null;

        const newWorkflow = JSON.parse(JSON.stringify(currentWorkflow)) as Workflow;
        const flowResource = newWorkflow.resources[selectedFlowName] as ZISFlow | undefined;

        if (flowResource && flowResource.properties.definition.States[nodeId]) {
          const originalState = flowResource.properties.definition.States[nodeId];
          flowResource.properties.definition.States[nodeId] = { ...originalState, ...updatedData };
        }
        return newWorkflow;
      });
    },
    [setWorkflow, selectedFlowName],
  );

  const handleNodeAdd = useCallback(
    (sourceId: string, targetId: string, nodeType: 'Action' | 'Choice' | 'Pass' | 'Succeed' | 'Fail' | 'Wait') => {
      setWorkflow((currentWorkflow) => {
        if (!currentWorkflow || !selectedFlowName) return null;

        const newWorkflow = JSON.parse(JSON.stringify(currentWorkflow)) as Workflow;
        const flowResource = newWorkflow.resources[selectedFlowName] as ZISFlow | undefined;

        if (!flowResource) return newWorkflow;

        const states = flowResource.properties.definition.States;
        const sourceNode = states[sourceId];
        if (!sourceNode) return newWorkflow;

        const newNodeId = getNextNodeId(Object.keys(states));

        // Create the new node
        let newNode: ZISState;
        if (nodeType === 'Action') {
          newNode = {
            Comment: 'New Action Step',
            Type: 'Action' as const,
            ActionName: '',
            Parameters: {},
            Next: targetId,
          };
        } else if (nodeType === 'Choice') {
          newNode = {
            Comment: 'New Choice Step',
            Type: 'Choice' as const,
            Choices: [],
            Default: targetId,
          };
        } else if (nodeType === 'Succeed') {
          newNode = {
            Comment: 'New Success Step',
            Type: 'Succeed' as const,
            Message: 'Workflow finished successfully.',
          };
        } else if (nodeType === 'Fail') {
          newNode = {
            Comment: 'New Fail Step',
            Type: 'Fail' as const,
            Error: 'Workflow failed',
            Cause: 'An unexpected error occurred.',
          };
        } else if (nodeType === 'Wait') {
          newNode = {
            Comment: 'New Wait Step',
            Type: 'Wait',
            Seconds: 10,
            Next: targetId,
          };
        } else {
          // Pass
          newNode = {
            Comment: 'New Pass Step',
            Type: 'Pass' as const,
            Result: {},
            ResultPath: '$.',
            Next: targetId,
          };
        }
        states[newNodeId] = newNode;

        // Update the source node to point to the new node
        if ('Next' in sourceNode && sourceNode.Next === targetId) {
          sourceNode.Next = newNodeId;
        } else if (sourceNode.Type === 'Choice') {
          const choice = sourceNode.Choices?.find((c) => c.Next === targetId);
          if (choice) {
            choice.Next = newNodeId;
          } else if (sourceNode.Default === targetId) {
            sourceNode.Default = newNodeId;
          }
        }

        return newWorkflow;
      });
    },
    [setWorkflow, selectedFlowName],
  );

  const handleNodeAddBelow = useCallback(
    (sourceId: string, nodeType: 'Action' | 'Choice' | 'Pass' | 'Succeed' | 'Fail' | 'Wait') => {
      setWorkflow((currentWorkflow) => {
        if (!currentWorkflow || !selectedFlowName) return null;

        const newWorkflow = JSON.parse(JSON.stringify(currentWorkflow)) as Workflow;
        const currentFlow = newWorkflow.resources[selectedFlowName] as ZISFlow | undefined;
        if (!currentFlow) return newWorkflow;

        const currentStates = currentFlow.properties.definition.States;
        const currentSourceNode = currentStates[sourceId];

        if (!currentSourceNode) return newWorkflow;

        const currentTargetId = ('Next' in currentSourceNode && currentSourceNode.Next) || null;

        const newNodeId = getNextNodeId(Object.keys(currentStates));

        // Create the new node
        let newNode: ZISState;
        if (nodeType === 'Action') {
          newNode = {
            Comment: 'New Action Step',
            Type: 'Action',
            ActionName: '',
            Parameters: {},
            Next: currentTargetId || '',
          };
        } else if (nodeType === 'Choice') {
          newNode = { Comment: 'New Choice Step', Type: 'Choice', Choices: [], Default: currentTargetId || '' };
        } else if (nodeType === 'Succeed') {
          newNode = { Comment: 'New Success Step', Type: 'Succeed', Message: 'Workflow finished successfully.' };
        } else if (nodeType === 'Fail') {
          newNode = {
            Comment: 'New Fail Step',
            Type: 'Fail',
            Error: 'Workflow failed',
            Cause: 'An unexpected error occurred.',
          };
        } else if (nodeType === 'Wait') {
          newNode = { Comment: 'New Wait Step', Type: 'Wait', Seconds: 10, Next: currentTargetId || '' };
        } else {
          // Pass
          newNode = {
            Comment: 'New Pass Step',
            Type: 'Pass',
            Result: {},
            ResultPath: '$.',
            Next: currentTargetId || '',
          };
        }
        currentStates[newNodeId] = newNode;

        // Update the source node to point to the new node
        if ('Next' in currentSourceNode) {
          currentSourceNode.Next = newNodeId;
        } else if ('Default' in currentSourceNode && currentSourceNode.Type === 'Choice') {
          // This is tricky, we'd need to know which path was taken. For now, assume it's the `Next` path for non-choice nodes.
          // For now, let's just handle Next. If the button is on a choice node, it should maybe be disabled or smarter.
        } else {
          (currentSourceNode as any).Next = newNodeId;
        }

        return newWorkflow;
      });
    },
    [selectedFlowName, setWorkflow],
  );

  const requestNodeDelete = useCallback((nodeId: string) => {
    setNodeToDelete(nodeId);
  }, []);

  const { flowName, startAt } = useMemo(() => {
    if (!workflow || !selectedFlowName) return { flowName: null, startAt: null };
    const flowResource = workflow.resources[selectedFlowName] as ZISFlow | undefined;
    return {
      flowName: flowResource?.properties.name || null,
      startAt: flowResource?.properties.definition.StartAt || null,
    };
  }, [workflow, selectedFlowName]);

  const memoizedStartAt = useMemo(() => startAt, [startAt]);

  const nodeTypes = useMemo(
    () => ({
      workflowNode: (props: NodeProps<ZISState>) => (
        <WorkflowNode
          {...props}
          data={{
            ...props.data,
            onNodeDelete: requestNodeDelete,
            onNodeAddBelow: handleNodeAddBelow,
          }}
          isStartNode={props.id === memoizedStartAt}
        />
      ),
    }),
    [requestNodeDelete, handleNodeAddBelow, memoizedStartAt],
  );

  const edgeTypes = useMemo(() => ({ 'add-node-edge': AddNodeEdge }), []);

  const actions = useMemo(() => {
    if (!workflow) return {};
    return Object.entries(workflow.resources).reduce(
      (acc, [key, resource]) => {
        if (resource.type.startsWith('ZIS::Action')) {
          acc[key] = resource;
        }
        return acc;
      },
      {} as Record<string, ZISResource>,
    );
  }, [workflow]);

  const actionUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    if (!workflow || !selectedFlowName) return usage;

    const flowResource = workflow.resources[selectedFlowName] as ZISFlow | undefined;

    if (!flowResource) return usage;

    Object.values(flowResource.properties.definition.States).forEach((state) => {
      if (state.Type === 'Action' && state.ActionName) {
        const actionKey = state.ActionName.split(':').pop();
        if (actionKey && actionKey in actions) {
          usage[actionKey] = (usage[actionKey] || 0) + 1;
        }
      }
    });
    return usage;
  }, [workflow, actions, selectedFlowName]);

  const handleNodeSelect = (node: Node<ZISState> | null) => {
    setSelectedNode(node);
    if (node?.id) {
      setActionsSidebarOpen(false);
      setConfigsSidebarOpen(false);
    }
  };

  const handleManageActions = () => {
    setActionsSidebarOpen(true);
    setConfigsSidebarOpen(false);
    handleNodeSelect(null);
  };

  const handleManageConfigs = () => {
    setConfigsSidebarOpen(true);
    setActionsSidebarOpen(false);
    handleNodeSelect(null);
  };

  const handleWorkflowUpdate = (updatedWorkflow: Workflow) => {
    // setSelectedFlowName(null); // Reset selected flow on new workflow
    setWorkflow(updatedWorkflow);
    handleNodeSelect(null); // Deselect node on new import
  };

  /**
   * Handle creation of a new workflow based on data from NewWorkflowDialog
   * @param data
   */
  const handleWorkflowCreate = (data: NewWorkflowData) => {
    const { name, description, jobspecName, eventSource, eventType } = data;
    const integrationKey = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!integrationKey) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Workflow name cannot be empty.',
      });
      return;
    }

    const newWorkflow = createNewWorkflow(name, description, jobspecName, eventSource, eventType);

    setWorkflow(newWorkflow);
    setNewWorkflowDialogOpen(false);
    setSelectedIntegration(integrationKey);
    toast({
      title: 'Workflow Created',
      description: `A new workflow "${integrationKey}" has been created.`,
    });
  };

  /**
   * Handle creation of a new flow based on data from NewFlowDialog
   * @param data
   */
  const handleFlowCreate = (data: NewFlowData) => {
    if (!workflow) return;

    const { jobspecName, eventSource, eventType, flowResourceKey } = data;
    const fullFlowName = `zis:${workflow.name}:flow:${flowResourceKey}`;

    const newJobSpec: ZISResource = {
      type: 'ZIS::JobSpec',
      properties: {
        name: jobspecName,
        event_source: eventSource,
        event_type: eventType,
        flow_name: fullFlowName,
      },
    };

    const newFlow = createFlowResource(
      flowResourceKey,
      selectedIntegration || 'default',
      `${selectedIntegration}_settings`,
    );

    const newWorkflow: Workflow = {
      ...workflow,
      resources: {
        ...workflow.resources,
        [jobspecName]: newJobSpec,
        [flowResourceKey]: newFlow,
      },
    };

    setWorkflow(newWorkflow);
    setSelectedFlowName(flowResourceKey);
    setNewFlowDialogOpen(false);
    toast({
      title: 'Flow Created',
      description: `A new flow "${flowResourceKey}" has been added to the integration.`,
    });
  };

  /**
   * Confirm Flow delete
   */
  const confirmFlowDelete = () => {
    if (!workflow || !selectedFlowName) return;

    const newResources: Record<string, ZISResource> = {};
    let jobSpecToDelete: string | null = null;
    const fullFlowName = `zis:${workflow.name}:flow:${selectedFlowName}`;

    // Find the corresponding JobSpec and copy over all other resources
    for (const key in workflow.resources) {
      const resource = workflow.resources[key];
      if (resource.type === 'ZIS::JobSpec' && resource.properties.flow_name === fullFlowName) {
        jobSpecToDelete = key;
      } else if (key !== selectedFlowName) {
        newResources[key] = resource;
      }
    }

    // If a job spec was found and it's not the flow key, also exclude it
    if (jobSpecToDelete && jobSpecToDelete !== selectedFlowName) {
      // The JobSpec is already excluded, so no extra delete needed
    } else {
      // If the JobSpec key was the same as the flow key, we already excluded it.
      // If we didn't find a matching jobspec, that's fine too.
    }

    const newWorkflow: Workflow = {
      ...workflow,
      resources: newResources,
    };

    setWorkflow(newWorkflow);
    setSelectedFlowName(null); // This will cause useEffect to select the new first flow
    setDeleteFlowDialogOpen(false);

    toast({
      title: 'Flow Deleted',
      description: `The flow "${selectedFlowName}" and its associated JobSpec have been deleted.`,
    });
  };

  const handleWorkflowReset = () => {
    setWorkflow(null);
    handleNodeSelect(null);
    setActionsSidebarOpen(false);
    setSelectedFlowName(null);

    // toast({
    //   title: 'Canvas Cleared',
    //   description: 'You can now create a new workflow.',
    // });
  };

  const handleNodeIdUpdate = (oldId: string, newId: string) => {
    if (oldId === newId) return;

    setWorkflow((currentWorkflow) => {
      if (!currentWorkflow || !selectedFlowName) return null;

      const newWorkflow = JSON.parse(JSON.stringify(currentWorkflow)) as Workflow;
      const flowResource = newWorkflow.resources[selectedFlowName] as ZISFlow | undefined;

      if (!flowResource) return currentWorkflow;

      const { States, StartAt } = flowResource.properties.definition;

      if (States[newId]) {
        toast({
          variant: 'destructive',
          title: 'Rename Failed',
          description: `A state with the ID "${newId}" already exists.`,
        });
        handleNodeSelect(selectedNode);
        return currentWorkflow;
      }

      const nodeData = States[oldId];
      delete States[oldId];
      States[newId] = nodeData;

      if (StartAt === oldId) {
        flowResource.properties.definition.StartAt = newId;
      }

      for (const stateId in States) {
        const state = States[stateId];
        if (state.Next === oldId) state.Next = newId;
        if (state.Default === oldId) state.Default = newId;
        if (state.Type === 'Choice' && state.Choices) {
          state.Choices.forEach((choice) => {
            if (choice.Next === oldId) choice.Next = newId;
          });
        }
      }
      return newWorkflow;
    });

    toast({
      title: 'State Renamed',
      description: `"${oldId}" has been renamed to "${newId}".`,
    });
  };

  const handleActionUpdate = (actionId: string, updatedAction: ZISResource) => {
    if (!workflow) return;
    const newWorkflow: Workflow = {
      ...workflow,
      resources: {
        ...workflow.resources,
        [actionId]: updatedAction,
      },
    };
    setWorkflow(newWorkflow);
  };

  const handleActionAdd = (actionId: string, actionType: 'ZIS::Action::Http') => {
    if (!workflow) return;

    const newAction: ZISResource = {
      type: actionType,
      properties: {
        name: actionId,
        definition: {
          method: 'GET',
          path: '/api/v2/example',
          connectionName: 'example_connection',
          headers: [{ key: 'Content-Type', value: 'application/json' }],
        },
      },
    };

    const newWorkflow: Workflow = {
      ...workflow,
      resources: {
        ...workflow.resources,
        [actionId]: newAction,
      },
    };
    setWorkflow(newWorkflow);
  };

  const handleActionDelete = (actionId: string) => {
    if (!workflow) return;
    const newWorkflow = { ...workflow, resources: { ...workflow.resources } };
    delete newWorkflow.resources[actionId];
    setWorkflow(newWorkflow);
    if (selectedNode?.id === actionId) {
      handleNodeSelect(null);
    }
  };

  const confirmNodeDelete = () => {
    if (!workflow || !nodeToDelete || !selectedFlowName) return;
    const nodeId = nodeToDelete;

    const newWorkflow = JSON.parse(JSON.stringify(workflow)) as Workflow;
    const flowResource = newWorkflow.resources[selectedFlowName] as ZISFlow | undefined;

    if (!flowResource) return;

    const { States, StartAt } = flowResource.properties.definition;
    const nodeToDeleteData = States[nodeId];
    if (!nodeToDeleteData) return;

    let targetNodeId: string | undefined | null;

    if (nodeToDeleteData.Type === 'Choice') {
      targetNodeId = nodeToDeleteData.Default;
      if (!targetNodeId) {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: `Choice nodes must have a 'Default' path to be deleted automatically. Please set a Default path first.`,
          duration: 8000,
        });
        setNodeToDelete(null);
        return;
      }
    } else {
      targetNodeId = nodeToDeleteData.Next;
    }

    if (targetNodeId === undefined) {
      // This covers newly added nodes, Succeed, and Fail nodes.
      targetNodeId = null;
    }

    // Find all nodes that point to the node we are deleting
    const parentNodes = Object.entries(States).filter(([_, state]) => {
      if (state.Next === nodeId) return true;
      if (state.Default === nodeId) return true;
      if (state.Type === 'Choice' && state.Choices?.some((c) => c.Next === nodeId)) return true;
      return false;
    });

    if (StartAt === nodeId) {
      // If deleting the start node, update StartAt to point to the next node
      if (targetNodeId) {
        flowResource.properties.definition.StartAt = targetNodeId;
      }
    }

    // Re-wire parent nodes to point to the target node or to an empty string if it's the new end of a path
    parentNodes.forEach(([parentId, parentState]) => {
      if (States[parentId].Next === nodeId) {
        States[parentId].Next = targetNodeId ?? '';
      }
      if (States[parentId].Default === nodeId) {
        States[parentId].Default = targetNodeId ?? '';
      }
      if (States[parentId].Type === 'Choice' && States[parentId].Choices) {
        States[parentId].Choices.forEach((choice: any) => {
          if (choice.Next === nodeId) {
            choice.Next = targetNodeId ?? '';
          }
        });
      }
    });

    // Delete the node
    delete States[nodeId];

    setWorkflow(newWorkflow);
    handleNodeSelect(null); // Deselect after delete
    setNodeToDelete(null);
    toast({
      title: 'State Deleted',
      description: `"${nodeId}" has been removed from the workflow.`,
    });
  };

  return (
    <div className='flex h-screen w-screen flex-col bg-background'>
      <AppHeader
        workflow={workflow}
        onWorkflowUpdate={handleWorkflowUpdate}
        onWorkflowReset={handleWorkflowReset}
        onNewFlow={() => setNewFlowDialogOpen(true)}
        onDeleteFlow={() => setDeleteFlowDialogOpen(true)}
        flowName={flowName}
        onManageActions={handleManageActions}
        onManageConfigs={handleManageConfigs}
        onManageSettings={() => setEditWorkflowDialogOpen(true)}
        availableFlows={availableFlows}
        selectedFlow={selectedFlowName}
        onFlowChange={setSelectedFlowName}
      />
      <main className='flex-1 overflow-hidden'>
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => handleNodeSelect(node)}
          onPaneClick={() => handleNodeSelect(null)}
          onWorkflowCreate={() => setNewWorkflowDialogOpen(true)}
          startAt={startAt}
        />
      </main>
      <ConfigSidebar
        node={selectedNode}
        actions={actions}
        allNodes={nodes}
        workflow={workflow}
        selectedFlowName={selectedFlowName}
        isOpen={!!selectedNode}
        onClose={() => handleNodeSelect(null)}
        onNodeChange={handleNodeChange}
        onNodeIdUpdate={handleNodeIdUpdate}
      />
      <ActionsSidebar
        isOpen={isActionsSidebarOpen}
        onClose={() => setActionsSidebarOpen(false)}
        actions={actions}
        actionUsage={actionUsage}
        onActionUpdate={handleActionUpdate}
        onActionAdd={handleActionAdd}
        onActionDelete={handleActionDelete}
      />
      <ConfigsSidebar isOpen={isConfigsSidebarOpen} onClose={() => setConfigsSidebarOpen(false)} workflow={workflow} />
      <DeleteNodeDialog
        isOpen={!!nodeToDelete}
        onClose={() => setNodeToDelete(null)}
        onConfirm={confirmNodeDelete}
        nodeId={nodeToDelete}
      />
      <NewWorkflowDialog
        isOpen={isNewWorkflowDialogOpen}
        onClose={() => setNewWorkflowDialogOpen(false)}
        onCreate={handleWorkflowCreate}
      />
      <EditWorkflowDialog
        isOpen={isEditWorkflowDialogOpen}
        onClose={() => setEditWorkflowDialogOpen(false)}
        workflow={workflow}
        availableFlows={availableFlows}
        selectedFlow={selectedFlowName}
        onWorkflowUpdate={handleWorkflowUpdate}
      />
      <NewFlowDialog
        isOpen={isNewFlowDialogOpen}
        onClose={() => setNewFlowDialogOpen(false)}
        onCreate={handleFlowCreate}
        existingResourceIds={workflow ? Object.keys(workflow.resources) : []}
      />
      <DeleteFlowDialog
        isOpen={isDeleteFlowDialogOpen}
        onClose={() => setDeleteFlowDialogOpen(false)}
        onConfirm={confirmFlowDelete}
        flowId={selectedFlowName}
      />
    </div>
  );
}
