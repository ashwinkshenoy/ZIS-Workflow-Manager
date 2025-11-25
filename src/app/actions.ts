'use client';

import type { Integration, Workflow, Bundle } from '@/lib/types';
import { z } from 'zod';

// Basic schema validation for safety
const WorkflowSchema = z.object({
  name: z.string(),
  resources: z.object({}).passthrough(),
});

export async function importWorkflowFromJsonStringAction(jsonString: string): Promise<Workflow> {
  try {
    const workflowData = JSON.parse(jsonString);
    const validatedWorkflow = WorkflowSchema.parse(workflowData);
    return validatedWorkflow as Workflow;
  } catch (error) {
    console.error('Import Error:', error);
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid workflow format: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to import workflow: ${error.message}`);
    }
    throw new Error('An unknown error occurred during import.');
  }
}
