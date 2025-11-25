import type { Node } from 'reactflow';

export interface ZISCondition {
  Variable: string;
  StringEquals?: string;
  StringLessThan?: string;
  StringGreaterThan?: string;
  NumericEquals?: number;
  BooleanEquals?: boolean;
  IsPresent?: boolean;
  [key: string]: any;
}

export interface ZISChoice {
  Next: string;
  And?: ZISCondition[];
  Or?: ZISCondition[];
  Variable?: string; // For single condition
  [key: string]: any; // For single condition properties like StringEquals
}

export interface ZISState {
  Comment: string;
  Type: 'Action' | 'Choice' | 'Succeed' | 'Fail' | 'Pass' | 'Wait';
  Next?: string;
  Default?: string;
  Choices?: ZISChoice[];
  [key: string]: any;
}

export interface ZISFlowDefinition {
  StartAt: string;
  States: Record<string, ZISState>;
}

export interface ZISFlow {
  type: 'ZIS::Flow';
  properties: {
    name: string;
    definition: ZISFlowDefinition;
  };
}

export interface ZISJobSpec {
  type: 'ZIS::JobSpec';
  properties: {
    name: string;
    event_source: string;
    event_type: string;
    flow_name: string;
  };
}

export interface ZISActionHttp {
  type: 'ZIS::Action::Http';
  properties: {
    name: string;
    definition: any;
  };
}

export type ZISResource = ZISFlow | ZISJobSpec | ZISActionHttp;

export interface Workflow {
  name: string;
  description: string;
  zis_template_version: string;
  resources: Record<string, ZISResource>;
}

export type ProcessedNode = Node<ZISState>;

export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Integration {
  name: string;
  description: string;
  [key: string]: any;
}

export interface Bundle {
  uuid: string;
  created_at: string;
  zis_template_version: string;
  [key: string]: any;
}
