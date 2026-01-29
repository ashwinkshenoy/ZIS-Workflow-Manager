import type { ZISFlow, Workflow, ProcessedNode, Edge, ZISChoice, ZISCondition, ZISState } from '@/lib/types';

const X_SPACING = 600;
const Y_SPACING = 200;

export const conditionTypes: Record<string, string> = {
  StringEquals: 'String Equals',
  StringEqualsPath: 'String Equals Path',
  StringLessThan: 'String Less Than',
  StringGreaterThan: 'String Greater Than',
  StringLessThanEquals: 'String Less Than Equals',
  StringGreaterThanEquals: 'String Greater Than Equals',
  NumericEquals: 'Numeric Equals',
  NumericEqualsPath: 'Numeric Equals Path',
  NumericLessThan: 'Numeric Less Than',
  NumericLessThanPath: 'Numeric Less Than Path',
  NumericGreaterThan: 'Numeric Greater Than',
  NumericGreaterThanPath: 'Numeric Greater Than Path',
  NumericLessThanEquals: 'Numeric Less Than Equals',
  NumericLessThanEqualsPath: 'Numeric Less Than Equals Path',
  NumericGreaterThanEquals: 'Numeric Greater Than Equals',
  NumericGreaterThanEqualsPath: 'Numeric Greater Than Equals Path',
  BooleanEquals: 'Boolean Equals',
  BooleanEqualsPath: 'Boolean Equals Path',
  TimestampEquals: 'Timestamp Equals',
  TimestampLessThan: 'Timestamp Less Than',
  TimestampGreaterThan: 'Timestamp Greater Than',
  TimestampLessThanEquals: 'Timestamp Less Than Equals',
  TimestampGreaterThanEquals: 'Timestamp Greater Than Equals',
  IsPresent: 'Is Present',
  IsNull: 'Is Null',
};

export function getCondition(condition: ZISCondition): [string, any] {
  for (const type of Object.keys(conditionTypes)) {
    if (type in condition) {
      return [type, condition[type as keyof ZISCondition]];
    }
  }
  // Fallback if no condition type is found
  const key = Object.keys(condition).find((k) => k !== 'Variable' && k !== 'Next' && k !== 'And' && k !== 'Or');
  if (key) {
    return [key, condition[key]];
  }
  return [Object.keys(conditionTypes)[0], ''];
}

export function isSingleCondition(choice: ZISChoice): boolean {
  return !choice.And && !choice.Or;
}

function getSuccessors(nodeKey: string, states: Record<string, ZISState>): string[] {
  const nodeData = states[nodeKey];
  if (!nodeData) return [];

  const successors = new Set<string>();
  if (nodeData.Next) {
    successors.add(nodeData.Next);
  }
  if (nodeData.Type === 'Choice') {
    if (nodeData.Choices) {
      nodeData.Choices.forEach((c) => c.Next && successors.add(c.Next));
    }
    if (nodeData.Default) {
      successors.add(nodeData.Default);
    }
  }
  if (nodeData.Catch) {
    nodeData.Catch.forEach((c: any) => c.Next && successors.add(c.Next));
  }
  return Array.from(successors);
}

export function parseWorkflow(
  workflow: Workflow,
  flowName: string | null,
): {
  nodes: ProcessedNode[];
  edges: Edge[];
  flowName: string | null;
  startAt: string | null;
} {
  if (!flowName || !workflow.resources[flowName]) {
    return { nodes: [], edges: [], flowName: null, startAt: null };
  }
  const flowResource = workflow.resources[flowName] as ZISFlow | undefined;

  if (!flowResource) {
    return { nodes: [], edges: [], flowName: null, startAt: null };
  }

  const { States: states, StartAt: startAt } = flowResource.properties.definition;

  if (!startAt || !states[startAt]) {
    return {
      nodes: [],
      edges: [],
      flowName: flowResource.properties.name,
      startAt: null,
    };
  }

  const nodes: ProcessedNode[] = [];
  const edges: Edge[] = [];
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const occupiedPositions = new Set<string>(); // "x,y"

  function layoutNodes(nodeKey: string, x: number, y: number) {
    if (!states[nodeKey] || nodeKey in nodePositions) {
      return; // Already visited or invalid
    }

    let currentX = x;
    let currentY = y;

    // Avoid collisions
    while (occupiedPositions.has(`${currentX},${currentY}`)) {
      currentX += X_SPACING;
    }

    nodePositions[nodeKey] = { x: currentX, y: currentY };
    occupiedPositions.add(`${currentX},${currentY}`);

    const successors = getSuccessors(nodeKey, states);

    // Lay out the primary successor (Next or Default) directly below
    const primarySuccessor = states[nodeKey]?.Next || states[nodeKey]?.Default;
    if (primarySuccessor && successors.includes(primarySuccessor)) {
      layoutNodes(primarySuccessor, currentX, currentY + Y_SPACING);
    }

    // Lay out other successors (like from Choices) to the right
    let branchIndex = 1;
    successors.forEach((successor) => {
      if (successor !== primarySuccessor) {
        layoutNodes(successor, currentX + X_SPACING * branchIndex, currentY + Y_SPACING);
        branchIndex++;
      }
    });
  }

  layoutNodes(startAt, 0, 0);

  const allNodeKeys = Object.keys(states);
  let unvisitedIndex = 0;
  allNodeKeys.forEach((nodeKey) => {
    // Create node object if not already laid out (handles cycles and disconnected nodes)
    if (!nodePositions[nodeKey]) {
      let x = unvisitedIndex * X_SPACING;
      let y =
        Y_SPACING *
        (Object.keys(nodePositions).length > 0
          ? Math.max(...Object.values(nodePositions).map((p) => p.y / Y_SPACING)) + 1
          : 0);

      while (occupiedPositions.has(`${x},${y}`)) {
        x += X_SPACING;
      }
      nodePositions[nodeKey] = { x, y };
      occupiedPositions.add(`${x},${y}`);
      unvisitedIndex++;
    }

    nodes.push({
      id: nodeKey,
      data: states[nodeKey],
      position: nodePositions[nodeKey],
    });

    // Create edges
    const successors = getSuccessors(nodeKey, states);
    successors.forEach((successorKey) => {
      if (states[successorKey]) {
        const edgeId = `e-${nodeKey}-${successorKey}-${Math.random()}`;
        if (!edges.some((e) => e.source === nodeKey && e.target === successorKey)) {
          edges.push({
            id: edgeId,
            source: nodeKey,
            target: successorKey,
            label: getEdgeLabel(states[nodeKey], successorKey),
          });
        }
      }
    });
  });

  return {
    nodes,
    edges,
    flowName: flowResource.properties.name,
    startAt,
  };
}

function getEdgeLabel(nodeData: ZISState, targetKey: string): string | undefined {
  if (nodeData.Next === targetKey) {
    return undefined; // 'Next' is the most common, so we can leave it unlabeled
  } else if (nodeData.Default === targetKey) {
    return 'Default';
  } else if (nodeData.Choices?.some((c) => c.Next === targetKey)) {
    const choiceIndex = nodeData.Choices.findIndex((c) => c.Next === targetKey);
    return `Choice ${choiceIndex + 1}`;
  } else if (nodeData.Catch?.some((c: any) => c.Next === targetKey)) {
    return 'Catch';
  }
  return undefined;
}

export function getNextNodeId(existingIds: string[]): string {
  const prefixes = existingIds.map((id) => parseInt(id.split('.')[0], 10)).filter((num) => !isNaN(num));

  const maxPrefix = prefixes.length > 0 ? Math.max(...prefixes) : 0;

  const newPrefix = (maxPrefix + 1).toString().padStart(3, '0');

  return `${newPrefix}.New.Step`;
}

/**
 * Fetches JobSpec details from a workflow
 * @param workflow - The workflow object to extract JobSpec from
 * @returns An object containing jobspecName, event_source, and event_type, or null if not found
 */
export function getJobSpecDetails(
  workflow: Workflow,
  selectedFlowName: string,
): {
  jobspecName: string;
  event_source: string;
  event_type: string;
} | null {
  const jobspecEntry = Object.entries(workflow.resources).find(
    ([_, resource]) => resource.type === 'ZIS::JobSpec' && resource.properties.flow_name?.includes(selectedFlowName),
  );

  if (!jobspecEntry) {
    return null;
  }

  const [jobspecName, resource] = jobspecEntry;

  // Type guard to ensure we have a JobSpec
  if (resource.type !== 'ZIS::JobSpec') {
    return null;
  }

  const { event_source, event_type } = resource.properties;

  return {
    jobspecName,
    event_source,
    event_type,
  };
}

/**
 * Creates a flow resource with default states
 * @param flowResourceKey - The key for the flow resource
 * @param integrationKey - The integration key
 * @param configSettingsName - The name of the config settings scope
 * @returns A ZIS::Flow resource object
 */
export function createFlowResource(
  flowResourceKey: string,
  integrationKey: string,
  configSettingsName: string,
): ZISFlow {
  return {
    type: 'ZIS::Flow',
    properties: {
      name: flowResourceKey,
      definition: {
        StartAt: '001.ZIS.LoadConfig',
        States: {
          '001.ZIS.LoadConfig': {
            ActionName: 'zis:common:action:LoadConfig',
            Comment: 'Load ZIS settings from config',
            Next: '002.Zendesk.UpdateTicket',
            Parameters: {
              scope: configSettingsName,
            },
            ResultPath: '$.config',
            Type: 'Action',
          },
          '002.Zendesk.UpdateTicket': {
            ActionName: `zis:${integrationKey}:action:Zendesk.UpdateTicket`,
            Comment: 'Update zendesk ticket',
            Next: 'Debug.PostToWebhook',
            Parameters: {
              'ticket_id.$': '$.input.ticket_event.ticket.id',
            },
            ResultPath: '$.api_response_ticket_update',
            Type: 'Action',
          },
          'Debug.PostToWebhook': {
            ActionName: `zis:${integrationKey}:action:Debug.PostToWebhook`,
            Comment: 'Post data external webhook',
            Next: '003.End',
            Parameters: {
              'data.$': '$',
              'endpoint.$': '$.config.debug_webhook_endpoint',
            },
            Type: 'Action',
          },
          '003.End': {
            Comment: 'End of the workflow',
            Type: 'Succeed',
            Message: 'Workflow finished successfully.',
          },
        },
      },
    },
  };
}

/**
 * Creates a new workflow with the specified parameters
 * @param name - The name of the workflow
 * @param description - Description of the workflow
 * @param jobspecName - Name of the JobSpec resource
 * @param eventSource - Event source for the JobSpec
 * @param eventType - Event type for the JobSpec
 * @returns A new Workflow object with a basic two-node flow (Start -> End)
 */
export function createNewWorkflow(
  name: string,
  description: string,
  jobspecName: string,
  eventSource: string,
  eventType: string,
): Workflow {
  const integrationKey = name.trim().toLowerCase().replace(/\s+/g, '-');
  const flowResourceKey = `${jobspecName}_flow`;
  const fullFlowName = `zis:${integrationKey}:flow:${flowResourceKey}`;
  const configSettingsName = `${integrationKey}_settings`;

  return {
    name: integrationKey,
    description: description,
    zis_template_version: '2019-10-14',
    resources: {
      [jobspecName]: {
        type: 'ZIS::JobSpec',
        properties: {
          name: jobspecName,
          event_source: eventSource,
          event_type: eventType,
          flow_name: fullFlowName,
        },
      },
      [flowResourceKey]: createFlowResource(flowResourceKey, integrationKey, configSettingsName),
      'Zendesk.UpdateTicket': {
        type: 'ZIS::Action::Http',
        properties: {
          definition: {
            connectionName: 'zendesk',
            headers: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            method: 'PUT',
            path: '/api/v2/tickets/{{$.ticket_id}}.json',
            requestBody: {
              ticket: {
                comment: {
                  body: 'Comment from New ZIS workflow.',
                  public: false,
                },
              },
            },
          },
          name: 'Zendesk.UpdateTicket',
        },
      },
      'Debug.PostToWebhook': {
        type: 'ZIS::Action::Http',
        properties: {
          definition: {
            method: 'POST',
            requestBody: {
              data: '{{$.data}}',
            },
            url: '{{$.endpoint}}',
          },
          name: 'Debug.PostToWebhook',
        },
      },
    },
  };
}
