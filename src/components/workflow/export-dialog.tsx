'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Workflow } from '@/lib/types';
import { Download, FileJson } from 'lucide-react';
import { useIntegration } from '@/context/integration-context';
import { useToast } from '@/hooks/use-toast';
import postmanCollectionTemplate from '@/lib/[COLL]-ZIS--PROD-SDBX---CustomerName---ProjectName-.postman_collection.json';
import postmanEnvironmentTemplate from '@/lib/[ENV]-ZIS--PROD-SDBX---CustomerName---ProjectName-.postman_environment.json';
import ZDClient from '@/lib/ZDClient';

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
};

export function ExportDialog({ isOpen, onClose, workflow }: ExportDialogProps) {
  const { selectedIntegration, integrationConfig } = useIntegration();
  const { toast } = useToast();

  if (!workflow) {
    return null;
  }

  const jsonString = JSON.stringify(workflow, null, 2);

  const handleDownload = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${workflow.name || 'workflow'}.json`;
    link.click();
    onClose();
  };

  const handlePostmanExport = () => {
    if (!selectedIntegration) {
      toast({
        variant: 'destructive',
        title: 'No Integration Selected',
        description: 'Please select an integration before exporting as Postman collection.',
      });
      return;
    }

    // Get data from localStorage
    const storedData = localStorage.getItem(selectedIntegration);
    if (!storedData) {
      toast({
        variant: 'destructive',
        title: 'Integration Data Not Found',
        description: 'Could not find integration data in localStorage. Please create or select a valid integration.',
      });
      return;
    }

    let integrationData;
    try {
      integrationData = JSON.parse(storedData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Invalid Integration Data',
        description: 'Failed to parse integration data from localStorage.',
      });
      return;
    }

    // Extract required values
    const clientId = integrationData.integrationResponse?.zendesk_oauth_client?.id;
    const clientIdentifier = integrationData.integrationResponse?.zendesk_oauth_client?.identifier;
    const bearerToken = integrationData.bearerTokenResponse?.token?.full_token;
    const oauthClientUuid = integrationData.oauthClientResponse?.uuid;
    const verificationToken = integrationData.oauthRedirectURL?.split('verification_token=')?.[1] || '';
    const subdomain = ZDClient.app.subdomain || '';

    if (!clientId || !clientIdentifier || !bearerToken || !oauthClientUuid) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Data',
        description: 'Integration data is incomplete. Please ensure all required fields are populated.',
      });
      return;
    }

    // Find the first jobspec in the workflow
    const jobspecEntry = Object.entries(workflow.resources).find(([, resource]) => resource.type === 'ZIS::JobSpec');

    if (!jobspecEntry) {
      toast({
        variant: 'destructive',
        title: 'No JobSpec Found',
        description: 'No JobSpec found in the workflow.',
      });
      return;
    }

    const [jobspecName, jobspecResource] = jobspecEntry;

    // Type guard to ensure we have a JobSpec
    if (!('event_source' in jobspecResource.properties && 'event_type' in jobspecResource.properties)) {
      toast({
        variant: 'destructive',
        title: 'Invalid JobSpec',
        description: 'JobSpec is missing required properties.',
      });
      return;
    }

    const eventSource = jobspecResource.properties.event_source || '';
    const eventType = jobspecResource.properties.event_type || '';

    // Process collection template
    let collectionJson = JSON.stringify(postmanCollectionTemplate, null, 2);

    // Replace placeholders in collection
    collectionJson = collectionJson.replace(/jobspec_<name>/g, `jobspec_${selectedIntegration}`);
    collectionJson = collectionJson.replace(/{{jobspec_<name>_event_source}}/g, eventSource);
    collectionJson = collectionJson.replace(/{{jobspec_<name>_event_type}}/g, eventType);
    collectionJson = collectionJson.replace(/webhook_<name>/g, `webhook_${selectedIntegration}`);

    // Process environment template
    let environmentJson = JSON.stringify(postmanEnvironmentTemplate, null, 2);

    // Replace placeholders in environment
    environmentJson = environmentJson.replace(/webhook_<name>/g, `webhook_${selectedIntegration}`);

    // Parse and update environment values
    const environmentData = JSON.parse(environmentJson);
    environmentData.values = environmentData.values.map((item: any) => {
      if (item.key === 'client_identifier') {
        return { ...item, value: clientIdentifier };
      }
      if (item.key === 'bearer_token') {
        return { ...item, value: bearerToken };
      }
      if (item.key === 'oauth_zendesk_verification_token') {
        return { ...item, value: verificationToken };
      }
      return item;
    });

    // Update collection variables
    const collectionData = JSON.parse(collectionJson);
    collectionData.variable = collectionData.variable.map((item: any) => {
      if (item.key === 'client_id') {
        return { ...item, value: clientId };
      }
      if (item.key === 'oauth_zendesk_client_uuid') {
        return { ...item, value: oauthClientUuid };
      }
      if (item.key === `jobspec_${selectedIntegration}`) {
        return { ...item, value: jobspecName };
      }
      if (item.key === `jobspec_${selectedIntegration}_event_source`) {
        return { ...item, value: eventSource };
      }
      if (item.key === `jobspec_${selectedIntegration}_event_type`) {
        return { ...item, value: eventType };
      }
      if (item.key === 'zis_subdomain') {
        return { ...item, value: subdomain };
      }
      if (item.key === 'zis_integration_key') {
        return { ...item, value: selectedIntegration };
      }
      if (item.key === 'zis_description') {
        return { ...item, value: workflow.description || '' };
      }
      return item;
    });

    // Update bundle body in the "8. Bundle" -> "Bundle" request
    // Find the bundle request and replace its body with the actual workflow
    const bundleManagementItem = collectionData.item.find((item: any) => item.name === 'Bundle Management');
    if (bundleManagementItem) {
      const bundleItem = bundleManagementItem.item.find((item: any) => item.name === '8. Bundle');
      if (bundleItem) {
        const bundleRequest = bundleItem.item.find((item: any) => item.name === 'Bundle');
        if (bundleRequest?.request?.body) {
          // Create the bundle body from the workflow
          const bundleBody = {
            description: workflow.description || '',
            name: workflow.name,
            zis_template_version: workflow.zis_template_version || '2019-10-14',
            resources: workflow.resources,
          };

          // Update the request body with the actual workflow data
          bundleRequest.request.body.raw = JSON.stringify(bundleBody, null, 4);
        }
      }
    }

    // Update config body in the "ZIS Config" requests if integrationConfig exists
    if (integrationConfig && Object.keys(integrationConfig).length > 0) {
      const zisConfigItem = collectionData.item.find((item: any) => item.name === 'ZIS Config');
      if (zisConfigItem?.item) {
        // Update all config-related requests
        zisConfigItem.item.forEach((configRequest: any) => {
          if (configRequest?.request?.body?.raw) {
            try {
              const bodyData = JSON.parse(configRequest.request.body.raw);
              if (bodyData.config !== undefined) {
                // Replace the config value with actual integrationConfig
                bodyData.config = integrationConfig;
                configRequest.request.body.raw = JSON.stringify(bodyData, null, 4);
              }
            } catch (e) {
              // If parsing fails, skip this request
              console.warn('Failed to parse config request body:', e);
            }
          }
        });
      }
    } // Update collection name
    collectionData.info.name = `[COLL]-ZIS-${selectedIntegration}`;

    // Update environment name
    environmentData.name = `[ENV]-ZIS-${selectedIntegration}`;

    // Download collection
    const collectionDataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(collectionData, null, 2))}`;
    const collectionLink = document.createElement('a');
    collectionLink.href = collectionDataStr;
    collectionLink.download = `ZIS_${selectedIntegration}_collection.json`;
    collectionLink.click();

    // Download environment
    setTimeout(() => {
      const environmentDataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(environmentData, null, 2))}`;
      const environmentLink = document.createElement('a');
      environmentLink.href = environmentDataStr;
      environmentLink.download = `ZIS_${selectedIntegration}_environment.json`;
      environmentLink.click();

      toast({
        title: 'Postman Collection Exported',
        description: 'Collection and environment files have been downloaded.',
      });

      onClose();
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Export Workflow</DialogTitle>
          <DialogDescription>Review the workflow JSON below. Click export to download the file.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid w-full gap-1.5'>
            <Label htmlFor='json'>ZIS JSON</Label>
            <Textarea id='json' value={jsonString} readOnly className='min-h-[350px] max-h-[60vh] font-mono text-xs' />
          </div>
          <div className='text-foreground text-xs'>
            <span className='font-bold'>Note:</span>
            <ul className='list-disc pl-4'>
              <li>"Export as Postman collection" is currently in beta.</li>
              <li>
                Kindly add the "email" in collection variable and generate "API Token" from zendesk admin and add the
                token in environment variable token. Needs to be generated when running from postman.
              </li>
              <li>
                Please review the exported Postman collection and environment files to ensure all data is correctly
                populated.
              </li>
              <li>Make sure to test the Postman requests in a safe environment before using them in production.</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button type='button' variant='outline' onClick={handlePostmanExport}>
            <FileJson className='mr-2 h-4 w-4' />
            Export as Postman Collection
          </Button>
          <Button type='button' onClick={handleDownload}>
            <Download className='mr-2 h-4 w-4' />
            Export Bundle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
