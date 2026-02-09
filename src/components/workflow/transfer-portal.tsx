'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Radio, Send, Wifi, Download, Check } from 'lucide-react';
import type { Workflow } from '@/lib/types';
import { useIntegration } from '@/context/integration-context';
import { useToast } from '@/hooks/use-toast';
import ZDClient from '@/lib/ZDClient';

// Helper function to replace integration names recursively in any object
function replaceIntegrationNameInObject(obj: any, oldName: string, newName: string): any {
  if (!oldName || !newName) return obj;

  const jsonStr = JSON.stringify(obj);
  const replacedStr = jsonStr.replace(new RegExp(oldName, 'g'), newName);
  return JSON.parse(replacedStr);
}

// Helper function to replace integration names within state objects
function replaceIntegrationNamesInState(state: any, oldName: string, newName: string) {
  if (!state || typeof state !== 'object' || !oldName) return;

  // Recursively search and replace in all string values
  const replaceInObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Replace all occurrences of the old integration name with new one
      return obj.replace(new RegExp(oldName, 'g'), newName);
    }
    if (Array.isArray(obj)) {
      return obj.map(replaceInObject);
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = replaceInObject(obj[key]);
      }
      return result;
    }
    return obj;
  };

  const newState = replaceInObject(state);
  Object.assign(state, newState);
}

type TransferPortalProps = {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
  onWorkflowUpdate: (workflow: Workflow) => void;
};

export function TransferPortal({ isOpen, onClose, workflow, onWorkflowUpdate }: TransferPortalProps) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isTransferComplete, setIsTransferComplete] = useState(false);
  const [receivedData, setReceivedData] = useState<string>('');
  const [updatedWorkflow, setUpdatedWorkflow] = useState<Workflow | null>(null);
  const [receivedConfig, setReceivedConfig] = useState<Record<string, any> | null>(null);
  const { selectedIntegrationObject, integrationConfig, setIntegrationConfig, selectedIntegration } = useIntegration();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Clear received data when dialog closes
      setReceivedData('');
      setUpdatedWorkflow(null);
      setReceivedConfig(null);
      return;
    }

    // Create broadcast channel
    const channel = new BroadcastChannel('transfer-portal-channel');
    channelRef.current = channel;

    // Listen for messages from other tabs
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'transfer-zis' && event.data.data) {
        const receivedWorkflow = event.data.data.workflow;
        const receivedConfigData = event.data.data.config;

        if (workflow && receivedWorkflow && receivedWorkflow.resources && selectedIntegrationObject) {
          const currentResources = workflow.resources;
          const receivedResources = receivedWorkflow.resources;

          // Extract the integration name from received resources to replace with current integration
          let receivedIntegrationName = '';

          // Try to extract from ActionName first
          Object.values(receivedResources).forEach((resource: any) => {
            if (resource.properties?.ActionName) {
              const matches = resource.properties.ActionName.match(/zis:([^:]+):/);
              if (matches) {
                receivedIntegrationName = matches[1];
              }
            }
          });

          // If not found in ActionName, try to extract from the entire resource string
          if (!receivedIntegrationName) {
            const resourcesStr = JSON.stringify(receivedResources);
            const matches = resourcesStr.match(/zis:([^:]+):/);
            if (matches) {
              receivedIntegrationName = matches[1];
            }
          }

          // Find the flow resource (ends with _flow)
          const flowKey = Object.keys(currentResources).find((key) => key.endsWith('_flow'));
          const receivedFlowKey = Object.keys(receivedResources).find((key) => key.endsWith('_flow'));

          // Find the JobSpec resource (the name without _flow)
          const jobSpecKey = Object.keys(currentResources).find(
            (key) => !key.endsWith('_flow') && currentResources[key].type === 'ZIS::JobSpec',
          );

          const updatedResources: Record<string, any> = {};

          // Copy all received resources except the flow and jobspec, replacing integration name
          Object.keys(receivedResources).forEach((key) => {
            if (!key.endsWith('_flow') && receivedResources[key].type !== 'ZIS::JobSpec') {
              const resource = JSON.parse(JSON.stringify(receivedResources[key]));

              // Replace integration name in ActionName if present
              if (resource.properties?.ActionName && receivedIntegrationName) {
                resource.properties.ActionName = resource.properties.ActionName.replace(
                  new RegExp(`zis:${receivedIntegrationName}:`, 'g'),
                  `zis:${selectedIntegrationObject.name}:`,
                );
              }

              updatedResources[key] = resource;
            }
          });

          // Keep the current JobSpec with its name
          if (jobSpecKey && currentResources[jobSpecKey]) {
            updatedResources[jobSpecKey] = currentResources[jobSpecKey];
          }

          // Keep the current flow but replace its definition with received definition
          if (flowKey && currentResources[flowKey] && receivedFlowKey && receivedResources[receivedFlowKey]) {
            let receivedDefinition = JSON.parse(
              JSON.stringify(receivedResources[receivedFlowKey].properties.definition),
            );

            // Replace integration name in the entire definition (including scope and all states)
            receivedDefinition = replaceIntegrationNameInObject(
              receivedDefinition,
              receivedIntegrationName,
              selectedIntegrationObject.name,
            );

            updatedResources[flowKey] = {
              ...currentResources[flowKey],
              properties: {
                ...currentResources[flowKey].properties,
                definition: receivedDefinition,
              },
            };
          }

          // Also replace in config data
          if (receivedConfigData && receivedIntegrationName && selectedIntegrationObject.name) {
            console.log('Replacing in config...');
            const updatedConfig = replaceIntegrationNameInObject(
              receivedConfigData,
              receivedIntegrationName,
              selectedIntegrationObject.name,
            );
            setReceivedConfig(updatedConfig);
          } else {
            setReceivedConfig(receivedConfigData);
          }

          const newUpdatedWorkflow = {
            ...workflow,
            resources: updatedResources,
          };

          setUpdatedWorkflow(newUpdatedWorkflow);
          const formattedData = JSON.stringify(newUpdatedWorkflow, null, 2);
          setReceivedData(formattedData);
        } else {
          console.log(
            'Condition failed - workflow:',
            !!workflow,
            'receivedWorkflow:',
            !!receivedWorkflow,
            'resources:',
            !!receivedWorkflow?.resources,
            'selectedIntegrationObject:',
            !!selectedIntegrationObject,
          );
        }
      }
    };

    channel.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [isOpen]);

  const handleTransfer = () => {
    if (channelRef.current) {
      const payload = {
        type: 'transfer-zis',
        timestamp: Date.now(),
        data: {
          workflow,
          config: integrationConfig,
        },
      };
      channelRef.current.postMessage(payload);
      setIsTransferComplete(true);
      setTimeout(() => {
        setIsTransferComplete(false);
      }, 5000);
    }
  };

  const handleConfirmInstall = async () => {
    if (!updatedWorkflow || !selectedIntegration) return;

    try {
      // Update workflow
      onWorkflowUpdate(updatedWorkflow);

      // Update configuration if received
      if (receivedConfig) {
        const payload = {
          scope: `${selectedIntegration}_settings`,
          config: receivedConfig,
        };
        await ZDClient.updateZisConfigApi(payload, selectedIntegration);
        setIntegrationConfig(receivedConfig);
      }

      toast({
        title: 'Installation Successful',
        description: 'Configuration has been updated. Confirm workflow and "Save" to see the changes in action.',
      });

      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Installation Failed',
        description: error.message || 'Failed to update configuration.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-primary/10'>
              <Radio className='h-5 w-5 text-primary' />
            </div>
            <div>
              <DialogTitle>Transfer Portal</DialogTitle>
              <DialogDescription>Cross-tab ZIS Migration</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4'>
          {!receivedData && (
            <>
              <Card className='p-4 border-dashed'>
                <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-md bg-blue-500/10'>
                    <Wifi className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-sm font-medium mb-1'>How it works</h4>
                    <ul className='list-disc list-inside text-sm text-muted-foreground'>
                      <li>Open this app in second browser tab.</li>
                      <li>Make sure you have an Active Integration created/selected in both tabs.</li>
                      <li>Click "Transfer" button in one tab to transfer the ZIS bundle and Configuration.</li>
                      <li>Second tab with the Transfer Portal open will receive the ZIS data.</li>
                      <li>Review received Workflow and Configs, then click "Confirm Install" to apply.</li>
                      <li>Click "Save" to finalize the changes.</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className='flex items-center justify-between p-4 rounded-lg border bg-card'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-md bg-green-500/10'>
                    <Send className='h-5 w-5 text-green-500' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Ready to broadcast</p>
                    <p className='text-xs text-muted-foreground'></p>
                  </div>
                </div>
                <Button
                  onClick={handleTransfer}
                  size='lg'
                  className='gap-2'
                  disabled={!selectedIntegrationObject || !workflow}>
                  <Send className='h-4 w-4' />
                  Transfer
                </Button>
              </div>
              {isTransferComplete && (
                <div className='flex justify-end items-center text-sm text-green-600 ml-4'>
                  <Check className='h-4 w-4 mr-1' />
                  <span>Transfer complete! Check the other tab.</span>
                </div>
              )}
            </>
          )}

          {receivedData && (
            <Card className='p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='p-2 rounded-md bg-purple-500/10'>
                  <Download className='h-4 w-4 text-purple-500' />
                </div>
                <div>
                  <h4 className='text-sm font-medium'>Updated Workflow</h4>
                  <p className='text-xs text-muted-foreground'>
                    Current workflow will be replaced with the following. Please verify.
                  </p>
                </div>
              </div>
              <Textarea
                value={receivedData}
                disabled
                className='font-mono text-xs h-[300px] resize-none bg-muted'
                placeholder='Waiting for data...'
              />
              <div className='flex justify-end mt-4'>
                <Button onClick={handleConfirmInstall} size='lg' className='gap-2'>
                  <Download className='h-4 w-4' />
                  Confirm Install
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
