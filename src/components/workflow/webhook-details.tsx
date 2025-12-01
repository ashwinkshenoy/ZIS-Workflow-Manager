'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ZDClient from '@/lib/ZDClient';

type WebhookDetailsProps = {
  selectedIntegration: string | null;
  workflow: any;
  eventSource: string;
  eventType: string;
};

export function WebhookDetails({ selectedIntegration, workflow, eventSource, eventType }: WebhookDetailsProps) {
  const { toast } = useToast();
  const [showWebhookDetails, setShowWebhookDetails] = useState(false);
  const [webhookDetails, setWebhookDetails] = useState<{
    path?: string;
    username?: string;
    password?: string;
    uuid?: string;
  } | null>(null);
  const [loadingWebhookDetails, setLoadingWebhookDetails] = useState(false);

  /**
   * Create new inbound zis webhook
   */
  const createNewInboundWebhook = async () => {
    if (!workflow || !selectedIntegration) return;

    setLoadingWebhookDetails(true);
    try {
      const payload = {
        source_system: eventSource,
        event_type: eventType,
      };
      const storedData = localStorage.getItem(selectedIntegration);
      if (!storedData) return;

      const fullToken = JSON.parse(storedData).bearerTokenResponse.token.full_token;
      const newWebhookDetails = await ZDClient.createInboundWebhook(selectedIntegration, payload, fullToken);

      setWebhookDetails(newWebhookDetails);
      setShowWebhookDetails(true);
      toast({
        title: 'Inbound Webhook Created',
        description: 'Successfully created a new inbound webhook for the JobSpec.',
      });

      // Set webhook details to localStorage
      const integrationData = JSON.parse(storedData);
      integrationData.webhookDetails = newWebhookDetails;
      localStorage.setItem(selectedIntegration, JSON.stringify(integrationData));
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to create Inbound Webhook',
          description: error.message,
        });
      }
    } finally {
      setLoadingWebhookDetails(false);
    }
  };

  return (
    <>
      <div className='rounded border p-4 bg-muted/80'>
        {!showWebhookDetails && (
          <>
            <p className='text-xs text-muted-foreground mb-2 border-l-4 pl-3 border-indigo-500 bg-indigo-500/10 rounded-r-md  py-3'>
              <span className='font-semibold block text-foreground'>NOTE:</span>
              Please ensure the <span className='underline'>Event Source</span> and{' '}
              <span className='underline'>Event Type</span> above is correct as this will be used to trigger the JobSpec
              via webhook.
            </p>
            <Button type='button' variant='outline' disabled={loadingWebhookDetails} onClick={createNewInboundWebhook}>
              {loadingWebhookDetails && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create Inbound Webhook
            </Button>
          </>
        )}

        {showWebhookDetails && (
          <>
            <p className='text-xs text-muted-foreground mb-3 border-l-4 pl-3 border-orange-500 bg-orange-500/10 rounded-r-md  py-3'>
              <span className='font-semibold block text-foreground'>NOTE:</span>
              Please store the webhook details securely as these details will NOT be shown again.
            </p>
            <div className='grid w-full items-center gap-3'>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor='webhook-path'>Webhook Path</Label>
                <Input id='webhook-path' defaultValue={webhookDetails?.path || ''} />
              </div>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor='webhook-username'>User Name</Label>
                <Input id='webhook-username' defaultValue={webhookDetails?.username || ''} />
              </div>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor='webhook-password'>Password</Label>
                <Input id='webhook-password' defaultValue={webhookDetails?.password || ''} />
              </div>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor='webhook-uuid'>UUID</Label>
                <Input id='webhook-uuid' defaultValue={webhookDetails?.uuid || ''} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
