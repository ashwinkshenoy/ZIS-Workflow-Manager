import {
  Bolt,
  CheckCircle,
  FileCog,
  GitFork,
  Workflow as WorkflowIcon,
  HelpCircle,
  XCircle,
  Network,
  MoveRight,
  Timer,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { FC } from 'react';

export const nodeIcons: Record<string, FC<LucideProps>> = {
  Action: Bolt,
  Choice: GitFork,
  Succeed: CheckCircle,
  Fail: XCircle,
  'ZIS::Flow': Network,
  'ZIS::JobSpec': FileCog,
  Pass: MoveRight,
  Wait: Timer,
  Default: HelpCircle,
};

export const getIconForNodeType = (type: string): FC<LucideProps> => {
  return nodeIcons[type] || nodeIcons['Default'];
};
