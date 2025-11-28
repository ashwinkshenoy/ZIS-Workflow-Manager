'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Import,
  Workflow as WorkflowIcon,
  SlidersHorizontal,
  RefreshCw,
  Settings,
  Loader2,
  Cog,
  Save,
  Pencil,
  Plus,
  Info,
  Trash2,
} from 'lucide-react';
import type { Integration, Workflow as WorkflowType, Bundle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ImportDialog } from '@/components/workflow/import-dialog';
import { ExportDialog } from '@/components/workflow/export-dialog';
import { AboutDialog } from './about-dialog';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ZDClient from '@/lib/ZDClient';
import { useIntegration } from '@/context/integration-context';

type AppHeaderProps = {
  workflow: WorkflowType | null;
  onWorkflowUpdate: (workflow: WorkflowType) => void;
  onWorkflowReset: () => void;
  onNewFlow: () => void;
  onDeleteFlow: () => void;
  flowName: string | null;
  onManageActions: () => void;
  onManageConfigs: () => void;
  onManageSettings: () => void;
  availableFlows: string[];
  selectedFlow: string | null;
  onFlowChange: (flowName: string) => void;
};

export function AppHeader({
  workflow,
  onWorkflowUpdate,
  onWorkflowReset,
  onNewFlow,
  onDeleteFlow,
  flowName,
  onManageActions,
  onManageConfigs,
  onManageSettings,
  availableFlows,
  selectedFlow,
  onFlowChange,
}: AppHeaderProps) {
  const [isImportOpen, setImportOpen] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const showFlowSelector = availableFlows.length > 1;
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isBundleSaving, setIsBundleSaving] = useState(false);
  const {
    selectedIntegration,
    setSelectedIntegration,
    setSelectedIntegrationObject,
    allIntegrations,
    setAllIntegrations,
  } = useIntegration();

  const { toast } = useToast();

  useEffect(() => {
    async function fetchIntegrations() {
      setIsLoading(true);
      try {
        const response = await ZDClient.getIntegrations();
        setAllIntegrations(response.integrations);
      } catch (error) {
        if (error instanceof Error) {
          toast({
            variant: 'destructive',
            title: 'Failed to load integrations or no integrations found.',
            description: error.message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchIntegrations();
  }, [toast]);

  /**
   * Resets the current workflow and selected integration
   */
  const resetFlow = () => {
    setSelectedIntegration(null);
    setSelectedIntegrationObject(null);
    onWorkflowReset();
  };

  /**
   * Handles integration selection change
   * @param integrationName
   */
  const handleIntegrationChange = async (integrationName: string) => {
    if (!integrationName) return;
    setIsSwitching(true);
    setSelectedIntegration(integrationName);
    // Set the selected integration object
    const selectedIntegrationObj = allIntegrations.find((integration) => integration.name === integrationName) || null;
    setSelectedIntegrationObject(selectedIntegrationObj);

    try {
      // Step 1: Fetch bundles for the integration to get the UUID
      const bundlesResponse = await ZDClient.getBundleUUID(integrationName);

      const latestBundle: Bundle | undefined = bundlesResponse.bundles?.[0];

      if (!latestBundle || !latestBundle.uuid) {
        throw new Error('No bundle UUID found for this integration.');
      }
      const bundleUuid = latestBundle.uuid;

      // Step 2: Fetch the specific bundle using the UUID
      const bundleResponse = await ZDClient.getBundle(integrationName, bundleUuid);

      // The workflow is inside the 'manifest.resources' property of the bundle data
      const newWorkflow = bundleResponse as WorkflowType;

      if (!newWorkflow || !newWorkflow.resources) {
        throw new Error('Invalid workflow format in the fetched bundle.');
      }

      onWorkflowUpdate(newWorkflow);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load integration',
          description: error.message,
        });
      }
      onWorkflowReset();
    } finally {
      setIsSwitching(false);
    }
  };

  /**
   * Saves the current zis as a bundle
   */
  const saveBundle = async () => {
    if (!workflow || !selectedIntegration) return;
    setIsBundleSaving(true);

    try {
      await ZDClient.saveBundle(selectedIntegration, workflow);
      toast({
        title: 'Saved',
        description: `Successfully saved ZIS: "${selectedIntegration}".`,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to save bundle',
          description: error.message,
        });
      }
    } finally {
      setIsBundleSaving(false);
    }
  };

  return (
    <>
      <header className='flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6'>
        {/* Left Side */}
        <div className='flex items-center'>
          {/* Integration Selector */}
          <div className='w-72'>
            <Select
              onValueChange={handleIntegrationChange}
              disabled={isLoading || isSwitching}
              value={selectedIntegration || ''}>
              <SelectTrigger id='integration-select'>
                <SelectValue placeholder={isLoading ? 'Loading integrations...' : 'Select an integration'} />
              </SelectTrigger>
              <SelectContent>
                {allIntegrations.map((integration) => (
                  <SelectItem key={integration.name} value={integration.name}>
                    {integration.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSwitching && <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin' />}
          </div>

          {/* If multiple flows are available, show the flow selector */}
          {showFlowSelector && (
            <div className='w-60 relative ml-3'>
              <Select onValueChange={onFlowChange} value={selectedFlow || ''}>
                <SelectTrigger id='flow-select'>
                  <SelectValue placeholder={'Select a flow'} />
                </SelectTrigger>
                <SelectContent>
                  {availableFlows.map((flow) => (
                    <SelectItem key={flow} value={flow}>
                      {flow.replace(/_flow$/, '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={saveBundle} disabled={isBundleSaving || !workflow}>
            {isBundleSaving ? (
              <Loader2 className='mr-1 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-1 h-4 w-4' onClick={saveBundle} />
            )}
            {isBundleSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button variant='outline' size='sm' onClick={onManageActions} disabled={!workflow}>
            <SlidersHorizontal className='mr-1 h-4 w-4' />
            Action
          </Button>

          <Button variant='outline' size='sm' onClick={onManageConfigs} disabled={selectedIntegration === null}>
            <Cog className='mr-1 h-4 w-4' />
            Configs
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <Settings className='h-4 w-4' />
                <span className='sr-only'>Settings</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              {workflow && (
                <>
                  <DropdownMenuItem onClick={onNewFlow}>
                    <Plus className='mr-2 h-4 w-4' />
                    <span>Add New Flow</span>
                  </DropdownMenuItem>
                </>
              )}

              {availableFlows.length > 1 && workflow && (
                <>
                  <DropdownMenuItem onClick={onDeleteFlow} className='text-destructive focus:text-destructive'>
                    <Trash2 className='mr-2 h-4 w-4' />
                    <span>Delete Selected Flow</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={() => onManageSettings()} disabled={!workflow}>
                <Pencil className='mr-2 h-4 w-4' />
                <span>Modify Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <Import className='mr-2 h-4 w-4' />
                <span>Import</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setExportOpen(true)} disabled={!workflow}>
                <Download className='mr-2 h-4 w-4' />
                <span>Export</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={resetFlow} className='text-destructive focus:text-destructive'>
                <RefreshCw className='mr-2 h-4 w-4' />
                <span>Restart Canvas</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                <Info className='mr-2 h-4 w-4' />
                <span>About</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <ImportDialog isOpen={isImportOpen} onClose={() => setImportOpen(false)} onImport={onWorkflowUpdate} />
      <ExportDialog isOpen={isExportOpen} onClose={() => setExportOpen(false)} workflow={workflow} />
      <AboutDialog isOpen={isAboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
