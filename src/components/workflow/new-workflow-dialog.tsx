'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { GripVertical, Loader2, Zap, Shapes, SquareArrowOutUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ZDClient from '@/lib/ZDClient';
import { createNewWorkflow } from '@/lib/workflow-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type NewWorkflowData = {
  name: string;
  description: string;
  jobspecName: string;
  eventSource: string;
  eventType: string;
};

type NewWorkflowDialogProps = {
  isOpen: boolean;
  isClientInitialized: boolean;
  onClose: () => void;
  onCreate: (data: NewWorkflowData) => void;
};

export function NewWorkflowDialog({ isOpen, isClientInitialized, onClose, onCreate }: NewWorkflowDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobspecName, setJobspecName] = useState('');
  const [eventSource, setEventSource] = useState('');
  const [eventType, setEventType] = useState('');
  const [loadingIntegration, setLoadingIntegration] = useState(false);
  const [showInstallationDetails, setShowInstallationDetails] = useState(false);
  const [installationDetails, setInstallationDetails] = useState<any>({});
  const [width, setWidth] = useState(640);

  const isResizing = useRef(false);
  const { toast } = useToast();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.cursor = 'auto';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 400 && newWidth < 1200) {
        setWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, handleMouseMove, handleMouseUp]);

  /**
   * Show installation details if returning from OAuth flow
   */
  useEffect(() => {
    if (!isClientInitialized) return;

    const loadAppParams = async () => {
      console.log('here: new-workflow-dialog');

      const appParams = await ZDClient.appParams();
      console.log('appParams:', appParams);

      const token = appParams?.verification_token;
      const integrationName = appParams?.name;
      console.log('token:', token, 'integrationName:', integrationName);

      if (!token || !integrationName) return;
      const storedData = localStorage.getItem(integrationName);
      if (!storedData) return;

      const parsedData = JSON.parse(storedData);
      if (parsedData && parsedData.isLoading) {
        parsedData.isLoading = false;
        setShowInstallationDetails(true);
        setInstallationDetails(parsedData);
      }
    };

    loadAppParams();
  }, [isClientInitialized == true]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !jobspecName.trim() || !eventSource.trim() || !eventType.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: 'Please fill out all fields to create a new workflow.',
      });
      return;
    }

    onCreate({
      name,
      description,
      jobspecName,
      eventSource,
      eventType,
    });

    // Reset form
    setName('');
    setDescription('');
    setJobspecName('');
    setEventSource('');
    setEventType('');
  };

  /**
   * Closes the dialog and resets state
   */
  const closeDialog = () => {
    setShowInstallationDetails(false);
    onClose();
  };

  /**
   * Creates a new integration with the provided details.
   * This function interacts with the ZDClient to create the integration,
   * bearer token, OAuth client, and starts the OAuth flow.
   */
  const createIntegration = async () => {
    console.log('Creating simple integration...');

    // Basic validation
    if (!name.trim() || !description.trim() || !jobspecName.trim() || !eventSource.trim() || !eventType.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: 'Please fill out all fields to create a new workflow.',
      });
      return;
    }

    setLoadingIntegration(true);

    try {
      // Call the "createIntegration" method from ZDClient
      const createIntegrationResponse = await ZDClient.createIntegration(name, {
        description: description,
      });

      // Call the "createBearerToken" method from ZDClient
      const createBearerTokenResponse = await ZDClient.createBearerToken({
        token: {
          client_id: createIntegrationResponse.zendesk_oauth_client.id,
          scopes: ['zis:write', 'zis:read'],
        },
      });

      // const full_token = 'ad67e3d80998ba7e536359fbc2b3b0d25b7a6f805cdf36a66a7eb077b0111eec';
      const full_token = createBearerTokenResponse.token.full_token;

      // Call createOauthClient method from ZDClient
      const createOauthClientResponse = await ZDClient.createOauthClient(name, full_token, {
        client_id: createIntegrationResponse.zendesk_oauth_client.identifier,
        client_secret: createIntegrationResponse.zendesk_oauth_client.secret,
        auth_url: `https://${ZDClient.app.subdomain}.zendesk.com/oauth/authorizations/new`,
        token_url: `https://${ZDClient.app.subdomain}.zendesk.com/oauth/tokens`,
        default_scopes: 'zis:read zis:write',
      });

      // Call "startOauthFlow" method from ZDClient
      const { redirect_url: redirectURL } = await ZDClient.startOauthFlow(name, full_token, {
        allow_offline_access: true,
        name: 'zendesk',
        oauth_client_uuid: createOauthClientResponse.uuid,
        origin_oauth_redirect_url: `https://${
          ZDClient.app.subdomain
        }.zendesk.com/agent/apps/zis-workflow-manager?zcli_apps=true&name=${encodeURIComponent(name)}`,
        permission_scopes: 'read write zis:read zis:write',
        oauth_url_subdomain: ZDClient.app.subdomain,
      });

      const authWindow = window.open(redirectURL, '_blank');

      // Save data to localstorage
      localStorage.setItem(
        name,
        JSON.stringify({
          name,
          description,
          jobspecName,
          eventSource,
          eventType,
          integrationResponse: createIntegrationResponse,
          bearerTokenResponse: createBearerTokenResponse,
          oauthClientResponse: createOauthClientResponse,
          oauthRedirectURL: redirectURL,
          isLoading: true,
        })
      );
    } catch (error: any) {
      console.error('Error creating integration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error?.responseJSON?.errors?.[0].detail ||
          error?.error ||
          'An error occurred while creating the integration.',
      });
    } finally {
      setLoadingIntegration(false);
    }
  };

  /**
   * Creates a sample workflow bundle after integration installation
   */
  const createSampleBundle = async () => {
    setLoadingIntegration(true);
    const { name, description, jobspecName, eventSource, eventType } = installationDetails;
    try {
      console.log('Creating sample bundle...');
      const newWorkflowBundle = createNewWorkflow(name, description, jobspecName, eventSource, eventType);
      // Call createSampleWorkflowBundle from ZDClient
      await ZDClient.saveBundle(name, newWorkflowBundle);

      setShowInstallationDetails(false);
      onCreate({
        name,
        description,
        jobspecName,
        eventSource,
        eventType,
      });
    } catch (error) {
      console.log('Create Sample Bundle Error', error);
    } finally {
      setLoadingIntegration(false);
    }
  };

  /**
   * Renders the installation details after successful integration setup.
   */
  const renderInstallationDetails = () => (
    <>
      <SheetHeader className='pr-8'>
        <SheetTitle className='flex items-center gap-3'>
          <Zap className='h-6 w-6' />
          Integration {name} Installed Successfully!
        </SheetTitle>
        <SheetDescription>Save the below details safely for future use.</SheetDescription>
      </SheetHeader>
      <Separator />
      <ScrollArea className='flex-1 -mx-6 px-6'>
        <div className='space-y-4 py-6'>
          <div className='space-y-2 rounded-md border p-4'>
            <pre className='max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs font-mono'>
              {JSON.stringify(installationDetails, null, 2)}
            </pre>
          </div>
        </div>
      </ScrollArea>
      <SheetFooter>
        <Button type='button' onClick={createSampleBundle} disabled={loadingIntegration}>
          {loadingIntegration ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
          {loadingIntegration ? 'Saving...' : 'Continue'}
        </Button>
      </SheetFooter>
    </>
  );

  /**
   * Renders form for creating workflow
   */
  const renderWorkflowForm = () => (
    <>
      <SheetHeader className='pr-8'>
        <SheetTitle className='flex items-center gap-3'>
          <Zap className='h-6 w-6' />
          Create New Workflow
        </SheetTitle>
        <SheetDescription>Define your new workflow and its triggering JobSpec.</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit}>
        <Separator />
        <ScrollArea className='flex-1 -mx-6 px-6'>
          <div className='space-y-6 py-6'>
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>Workflow Details</h4>
              <div className='space-y-4 rounded-md border p-4'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='workflow-name'>Integration Name</Label>
                  <Input
                    id='workflow-name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., my-awesome-integration'
                    autoFocus
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='workflow-description'>Description</Label>
                  <Textarea
                    id='workflow-description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='A short description of what this ZIS does.'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>JobSpec Details</h4>
              <div className='space-y-4 rounded-md border p-4'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='jobspec-name'>JobSpec Name</Label>
                  <Input
                    id='jobspec-name'
                    value={jobspecName}
                    onChange={(e) => setJobspecName(e.target.value)}
                    placeholder='e.g., my_jobspec_name'
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-source'>Event Source</Label>
                  <Input
                    id='event-source'
                    value={eventSource}
                    onChange={(e) => setEventSource(e.target.value)}
                    placeholder='e.g., support'
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-type'>Event Type</Label>
                  <Input
                    id='event-type'
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder='e.g., ticket.TagsChanged'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Need help finding event types?{' '}
                    <a
                      href='https://developer.zendesk.com/api-reference/integration-services/trigger-events/ticket-events/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:underline'>
                      View documentation
                      <SquareArrowOutUpRight className='h-3 w-3 ml-1 inline-block' />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className='px-2 py-4 flex justify-between space-x-2 flex-wrap gap-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type='submit' disabled={loadingIntegration}>
                  <Shapes className='!h-5 !w-5' />
                  Create Playground Workflow
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom'>
                <p>No integration will be created. Only for playing around with ZIS locally.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className='flex space-x-2'>
            <Button type='button' variant='link' onClick={onClose} disabled={loadingIntegration}>
              Cancel
            </Button>

            <Button type='button' variant='outline' onClick={createIntegration} disabled={loadingIntegration}>
              {loadingIntegration ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
              {loadingIntegration ? 'Creating Integration...' : 'Create Integration'}
            </Button>
          </div>
        </div>
      </form>
    </>
  );

  return (
    <Sheet open={isOpen || showInstallationDetails} onOpenChange={closeDialog}>
      <SheetContent className='flex flex-col group' style={{ width: `${width}px`, maxWidth: '80vw' }}>
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 h-full w-2.5 cursor-col-resize flex items-center justify-center transition-colors z-10',
            'group-hover:bg-border/50',
            isResizing.current && 'bg-border/80'
          )}>
          <GripVertical
            className={cn(
              'h-6 w-4 text-muted-foreground/50 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              isResizing.current && 'opacity-100'
            )}
          />
        </div>
        {showInstallationDetails ? renderInstallationDetails() : renderWorkflowForm()}
      </SheetContent>
    </Sheet>
  );
}
