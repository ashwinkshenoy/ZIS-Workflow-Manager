'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIntegration } from '@/context/integration-context';
import ZDClient from '@/lib/ZDClient';

type WebhookDetailsProps = {
  selectedIntegration: string | null;
  workflow: any;
  eventSource: string;
  eventType: string;
};

export function WebhookDetails({ selectedIntegration, workflow, eventSource, eventType }: WebhookDetailsProps) {
  const { toast } = useToast();
  const { selectedIntegrationObject } = useIntegration();
  const [showWebhookDetails, setShowWebhookDetails] = useState(false);
  const [webhookDetails, setWebhookDetails] = useState<{
    path?: string;
    username?: string;
    password?: string;
    uuid?: string;
  } | null>(null);
  const [loadingWebhookDetails, setLoadingWebhookDetails] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  // Check if token exists in localStorage on component mount
  useEffect(() => {
    if (selectedIntegration) {
      const storedData = localStorage.getItem(selectedIntegration);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData.bearerTokenResponse?.token?.full_token) {
            setHasToken(true);
          }

          // Check if webhook details already exist for this event source and type
          const webhookKey = `webhookDetails_${eventSource}_${eventType}`;
          if (parsedData[webhookKey]) {
            setWebhookDetails(parsedData[webhookKey]);
            setShowWebhookDetails(true);
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
        }
      }
    }
  }, [selectedIntegration, eventSource, eventType]);

  /**
   * Generate token for the selected integration
   */
  const generateToken = async () => {
    if (!selectedIntegration || !selectedIntegrationObject) return;

    // Event source and type are required
    if (!eventSource || !eventType) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: '',
      });
      return;
    }

    setLoadingToken(true);
    try {
      // Generate new token
      const generateNewIntegrationTokenResponse = await ZDClient.generateNewIntegrationToken(
        selectedIntegrationObject.zendesk_oauth_client.id
      );

      const createIntegrationResponse = {
        ...selectedIntegrationObject,
        zendesk_oauth_client: {
          ...selectedIntegrationObject.zendesk_oauth_client,
          secret: generateNewIntegrationTokenResponse.client.secret,
        },
      };

      // Create bearer token
      const createBearerTokenResponse = await ZDClient.createBearerToken({
        token: {
          client_id: createIntegrationResponse.zendesk_oauth_client.id,
          scopes: ['zis:write', 'zis:read'],
        },
      });

      const full_token = createBearerTokenResponse.token.full_token;

      // Save updated data to localStorage

      const updatedData = {
        integrationResponse: createIntegrationResponse,
        bearerTokenResponse: createBearerTokenResponse,
      };
      localStorage.setItem(selectedIntegration, JSON.stringify(updatedData));

      setHasToken(true);
      toast({
        title: 'Token Generated',
        description: 'Bearer token has been successfully generated and saved.',
      });

      if (full_token) {
        createNewInboundWebhook();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Failed to generate token',
          description: error.message,
        });
      }
    } finally {
      setLoadingToken(false);
    }
  };

  /**
   * Create new inbound zis webhook
   */
  const createNewInboundWebhook = async () => {
    if (!workflow || !selectedIntegration) return;

    // Event source and type are required
    if (!eventSource || !eventType) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: '',
      });
      return;
    }

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
      integrationData[`webhookDetails_${eventSource}_${eventType}`] = newWebhookDetails;
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
    <Accordion type='single' collapsible className='w-full'>
      <AccordionItem value='webhook' className='border rounded-md px-4 py-2 bg-muted/30'>
        <AccordionTrigger className='py-2 hover:no-underline text-sm font-medium'>
          <h4 className='text-foreground'>Webhook Details</h4>
        </AccordionTrigger>
        <AccordionContent className='pb-2'>
          <div className=''>
            {!hasToken ? (
              <>
                <p className='text-xs text-muted-foreground mb-2 border-l-4 pl-3 border-yellow-500 bg-yellow-500/10 rounded-r-md py-3'>
                  <span className='font-semibold block text-foreground'>TOKEN REQUIRED:</span> A bearer token needs to
                  be regenerated to create webhook details within the app. Please regenerate a token first.
                </p>
                <Button type='button' variant='outline' disabled={loadingToken} onClick={generateToken}>
                  {loadingToken && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Regenerate Token & Create Webhook
                </Button>
              </>
            ) : (
              <>
                {!showWebhookDetails && (
                  <>
                    <p className='text-xs text-muted-foreground mb-2 border-l-4 pl-3 border-indigo-500 bg-indigo-500/10 rounded-r-md  py-3'>
                      <span className='font-semibold block text-foreground'>NOTE:</span>
                      Please ensure the <span className='underline'>Event Source</span> and{' '}
                      <span className='underline'>Event Type</span> above is correct as this will be used to trigger the
                      JobSpec via webhook.
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={loadingWebhookDetails}
                      onClick={createNewInboundWebhook}>
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
                        <Label htmlFor='webhook-path'>Webhook URL</Label>
                        <Input
                          id='webhook-path'
                          defaultValue={
                            webhookDetails?.path
                              ? `https://${ZDClient.app.subdomain}.zendesk.com${webhookDetails.path}`
                              : ''
                          }
                        />
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
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
