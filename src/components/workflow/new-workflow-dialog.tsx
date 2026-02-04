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
import { GripVertical, Loader2, Zap, Shapes, SquareArrowOutUpRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ZDClient from '@/lib/ZDClient';
import { createNewWorkflow } from '@/lib/workflow-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIntegration } from '@/context/integration-context';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EVENT_TYPES } from '@/lib/event-types';

export type NewWorkflowData = {
  name: string;
  description: string;
  jobspecName: string;
  eventSource: string;
  eventType: string;
};

type NewWorkflowDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: NewWorkflowData) => void;
};

export function NewWorkflowDialog({ isOpen, onClose, onCreate }: NewWorkflowDialogProps) {
  const { selectedIntegrationObject, setSelectedIntegration, setIsPlayground } = useIntegration();
  const [name, setName] = useState(selectedIntegrationObject?.name || '');
  const [description, setDescription] = useState(selectedIntegrationObject?.description || '');
  const [jobspecName, setJobspecName] = useState('');
  const [eventSource, setEventSource] = useState('support');
  const [eventType, setEventType] = useState('');
  const [eventCategory, setEventCategory] = useState<
    'ticket' | 'user' | 'organization' | 'customobject' | 'activity' | 'custom' | ''
  >('');
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
    const isSheetOpen = isOpen || showInstallationDetails;
    if (isSheetOpen) {
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
  }, [isOpen, showInstallationDetails, handleMouseMove, handleMouseUp]);

  /**
   * Show installation details if returning from OAuth flow or if closed while loading
   */
  useEffect(() => {
    const loadAppParams = async () => {
      const appParams = await ZDClient.appParams();

      const token = appParams?.verification_token;
      const integrationName = appParams?.name;

      if (!token || !integrationName) return;
      const storedData = localStorage.getItem(integrationName);
      if (!storedData) return;

      let parsedData = JSON.parse(storedData);
      parsedData = { ...parsedData, verification_token: token };

      if (parsedData && parsedData.isLoading) {
        setShowInstallationDetails(true);
        setInstallationDetails(parsedData);
        setSelectedIntegration(integrationName);
      }
      // parsedData.isLoading = false;
      localStorage.setItem(integrationName, JSON.stringify(parsedData));
    };

    loadAppParams();
  }, []);

  /**
   * Handle selectedIntegrationObject change
   */
  useEffect(() => {
    setName('');
    setDescription('');

    if (selectedIntegrationObject !== null) {
      setName(selectedIntegrationObject.name || '');
      setDescription(selectedIntegrationObject.description || '');
    }
  }, [selectedIntegrationObject]);

  /**
   * Handles form submission for creating a new workflow for playground without saving integration.
   */
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

    // Validate name format (lowercase letters and underscores only)
    const validNamePattern = /^[a-z0-9_]+$/;
    if (!validNamePattern.test(name)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Integration Name',
        description:
          'Integration name must contain only lowercase letters and underscores (no spaces or special characters).',
      });
      return;
    }

    // Validate jobspecName format (lowercase letters and underscores only)
    if (!validNamePattern.test(jobspecName)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Job Spec Name',
        description:
          'Job Spec name must contain only lowercase letters and underscores (no spaces or special characters).',
      });
      return;
    }

    // Set playground flag to true
    setIsPlayground(true);

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
  };

  /**
   * Closes the dialog and resets state
   */
  const closeDialog = () => {
    setShowInstallationDetails(false);
    onClose();
  };

  /**
   * Prevents the dialog from closing when clicking outside of it
   */
  const preventDialogClose = (event: any): void => {
    event.preventDefault();
  };

  /**
   * Creates a new integration with the provided details.
   * This function interacts with the ZDClient to create the integration,
   * bearer token, OAuth client, and starts the OAuth flow.
   */
  const createIntegration = async () => {
    // Basic validation
    if (!name.trim() || !description.trim() || !jobspecName.trim() || !eventSource.trim() || !eventType.trim()) {
      toast({
        variant: 'destructive',
        title: 'All fields are required',
        description: 'Please fill out all fields to create a new workflow.',
      });
      return;
    }

    // Validate name format (lowercase letters and underscores only)
    const validNamePattern = /^[a-z0-9_]+$/;
    if (!validNamePattern.test(name)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Integration Name',
        description:
          'Integration name must contain only lowercase letters and underscores (no spaces or special characters).',
      });
      return;
    }

    // Validate jobspecName format (lowercase letters and underscores only)
    if (!validNamePattern.test(jobspecName)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Job Spec Name',
        description:
          'Job Spec name must contain only lowercase letters and underscores (no spaces or special characters).',
      });
      return;
    }

    setLoadingIntegration(true);

    try {
      let createIntegrationResponse;
      if (selectedIntegrationObject === null) {
        // Call the "createIntegration" method for new integration
        createIntegrationResponse = await ZDClient.createIntegration(name, {
          description: description,
        });
      } else {
        // Regenerate integration token if existing integration is present
        const generateNewIntegrationTokenResponse = await ZDClient.generateNewIntegrationToken(
          selectedIntegrationObject.zendesk_oauth_client.id,
        );
        createIntegrationResponse = {
          ...selectedIntegrationObject,
          zendesk_oauth_client: {
            ...selectedIntegrationObject.zendesk_oauth_client,
            secret: generateNewIntegrationTokenResponse.client.secret,
          },
        };
      }

      // Call the "createBearerToken" method from ZDClient
      const createBearerTokenResponse = await ZDClient.createBearerToken({
        token: {
          client_id: createIntegrationResponse.zendesk_oauth_client.id,
          scopes: ['zis:write', 'zis:read'],
        },
      });

      const full_token = createBearerTokenResponse.token.full_token;

      // Call createOauthClient method from ZDClient
      const createOauthClientResponse = await ZDClient.createOauthClient(name, full_token, {
        client_id: createIntegrationResponse.zendesk_oauth_client.identifier,
        client_secret: createIntegrationResponse.zendesk_oauth_client.secret,
        auth_url: `https://${ZDClient.app.subdomain}.zendesk.com/oauth/authorizations/new`,
        token_url: `https://${ZDClient.app.subdomain}.zendesk.com/oauth/tokens`,
        default_scopes: 'zis:read zis:write',
      });

      // Get app name from ZDClient.app.settings and lowercase it and replace space with hyphens
      const appSettings = ZDClient.app.settings as any;
      const appName = toHyphenCase(appSettings.title) || 'zis-workflow-manager';
      const isProd = ZDClient.app.isProduction;

      // Call "startOauthFlow" method from ZDClient
      const { redirect_url: redirectURL } = await ZDClient.startOauthFlow(name, full_token, {
        allow_offline_access: true,
        name: 'zendesk',
        oauth_client_uuid: createOauthClientResponse.uuid,
        origin_oauth_redirect_url: `https://${
          ZDClient.app.subdomain
        }.zendesk.com/agent/apps/${appName}?name=${encodeURIComponent(name)}${!isProd ? '&zcli_apps=true' : ''}`,
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
        }),
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
   * Converts a string to hyphen-case
   * converts spaces and underscores to hyphens and lowercases the string.
   * converts camelCase or PascalCase to hyphen-case as well.
   * @param str
   * @returns
   */
  const toHyphenCase = (str: string) => {
    return (
      str
        // Convert camelCase or PascalCase → space before capital letters
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        // Replace spaces & underscores with hyphens
        .replace(/[\s_]+/g, '-')
        // Lowercase final result
        .toLowerCase()
    );
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
      createNewConfiguration();
      await ZDClient.saveBundle(name, newWorkflowBundle);

      onCreate({
        name,
        description,
        jobspecName,
        eventSource,
        eventType,
      });
      setShowInstallationDetails(false);
    } catch (error) {
      console.log('Create Bundle Error', error);
    } finally {
      setLoadingIntegration(false);
    }
  };

  /**
   * Creates a new configuration with default settings
   */
  const createNewConfiguration = async () => {
    const { name } = installationDetails;
    if (!name) return;
    // Add your default configuration properties here
    const payload = {
      scope: `${name}_settings`,
      config: {
        debug_webhook_endpoint: 'https://webhook.site/your-unique-endpoint',
      },
    };
    try {
      await ZDClient.createZisConfigApi(payload, name);
    } catch (err: any) {
      console.error('Failed to save configs:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'An unknown error occurred.',
        duration: 5000,
      });
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
        <div className='space-y-4 pb-6'>
          {/* Integration Details */}
          <div className='space-y-2'>
            <h4 className='font-medium text-foreground flex items-center gap-2'>Integration Details</h4>
            <div className='space-y-3 rounded-md border p-4 bg-muted/30'>
              <div className='grid gap-1'>
                <Label className='text-xs text-muted-foreground'>Name</Label>
                <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border'>{installationDetails.name}</p>
              </div>
              <div className='grid gap-1'>
                <Label className='text-xs text-muted-foreground'>Description</Label>
                <p className='text-sm bg-background px-2 py-1.5 rounded border'>{installationDetails.description}</p>
              </div>
              {/* Integration Response */}
              {installationDetails.integrationResponse && (
                <>
                  <div className='grid gap-1'>
                    <Label className='text-xs text-muted-foreground'>Client ID</Label>
                    <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                      {installationDetails.integrationResponse.zendesk_oauth_client?.id}
                    </p>
                  </div>
                  <div className='grid gap-1'>
                    <Label className='text-xs text-muted-foreground'>Identifier</Label>
                    <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                      {installationDetails.integrationResponse.zendesk_oauth_client?.identifier}
                    </p>
                  </div>
                  <div className='grid gap-1'>
                    <Label className='text-xs text-muted-foreground'>Client Secret</Label>
                    <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                      {installationDetails.integrationResponse.zendesk_oauth_client?.secret}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* JobSpec Details */}
          <div className='space-y-2'>
            <h4 className='font-medium text-foreground'>JobSpec Configuration</h4>
            <div className='space-y-3 rounded-md border p-4 bg-muted/30'>
              <div className='grid gap-1'>
                <Label className='text-xs text-muted-foreground'>JobSpec Name</Label>
                <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border'>
                  {installationDetails.jobspecName}
                </p>
              </div>
              <div className='grid gap-1'>
                <Label className='text-xs text-muted-foreground'>Event Source</Label>
                <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border'>
                  {installationDetails.eventSource}
                </p>
              </div>
              <div className='grid gap-1'>
                <Label className='text-xs text-muted-foreground'>Event Type</Label>
                <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border'>
                  {installationDetails.eventType}
                </p>
              </div>
            </div>
          </div>

          {/* OAuth Client Details */}
          {installationDetails.oauthClientResponse && (
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>OAuth Client</h4>
              <div className='space-y-3 rounded-md border p-4 bg-muted/30'>
                <div className='grid gap-1'>
                  <Label className='text-xs text-muted-foreground'>UUID</Label>
                  <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                    {installationDetails.oauthClientResponse.uuid}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bearer Token */}
          {installationDetails.bearerTokenResponse && (
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>Token</h4>
              <div className='space-y-3 rounded-md border p-4 bg-muted/30'>
                <div className='grid gap-1'>
                  <Label className='text-xs text-muted-foreground'>Full Token</Label>
                  <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                    {installationDetails.bearerTokenResponse.token?.full_token}
                  </p>
                </div>
                <div className='grid gap-1'>
                  <Label className='text-xs text-muted-foreground'>Verification Token</Label>
                  <p className='text-sm font-mono bg-background px-2 py-1.5 rounded border break-all'>
                    {installationDetails.verification_token}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <SheetFooter>
        <Button type='button' onClick={createSampleBundle} disabled={loadingIntegration}>
          {loadingIntegration ? <Loader2 className='h-4 w-4 animate-spin' /> : <ArrowRight className='h-4 w-4' />}
          {loadingIntegration ? 'Saving...' : 'Continue with bundle installation'}
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
      <Separator />
      <ScrollArea className='flex-1 -mx-6 px-6'>
        <form onSubmit={handleSubmit}>
          <div className='space-y-6 pb-6'>
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>Workflow Details</h4>
              {selectedIntegrationObject !== null && (
                <p className='text-xs text-muted-foreground mt-1 border-l-4 pl-3 border-orange-500 bg-orange-500/10 rounded-r-md  py-3'>
                  <span className='font-semibold block text-foreground'>NOTE:</span>
                  Since this Integrations already exists, a New Token will be generated and some fields are pre-filled
                  and cannot be edited.
                </p>
              )}
              <div className='space-y-4 rounded-md border p-4 bg-muted/30'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='workflow-name'>Integration Name</Label>
                  <Input
                    id='workflow-name'
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setJobspecName(e.target.value);
                    }}
                    placeholder='e.g: my_awesome_integration'
                    disabled={selectedIntegrationObject !== null}
                  />
                </div>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='workflow-description'>Description</Label>
                  <Textarea
                    id='workflow-description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='A short description of what this ZIS does.'
                    disabled={selectedIntegrationObject !== null}
                  />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>Job Spec Details</h4>
              <div className='space-y-4 rounded-md border p-4 bg-muted/30'>
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='jobspec-name'>Job Spec Name</Label>
                  <Input
                    id='jobspec-name'
                    value={jobspecName}
                    onChange={(e) => setJobspecName(e.target.value)}
                    placeholder='e.g: my_jobspec_name'
                  />
                </div>
                {/* <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-source'>Event Source</Label>
                  <Input
                    id='event-source'
                    value={eventSource}
                    onChange={(e) => setEventSource(e.target.value)}
                    placeholder='e.g., support'
                  />
                </div> */}
                <div className='grid w-full items-center gap-1.5'>
                  <Label htmlFor='event-category'>Event Category</Label>
                  <Select
                    value={eventCategory}
                    onValueChange={(
                      value: 'ticket' | 'user' | 'organization' | 'customobject' | 'activity' | 'custom',
                    ) => {
                      setEventCategory(value);
                      setEventType(''); // Reset event type when category changes
                    }}>
                    <SelectTrigger id='event-category'>
                      <SelectValue placeholder='Select event category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ticket'>Ticket</SelectItem>
                      <SelectItem value='user'>User</SelectItem>
                      <SelectItem value='organization'>Organization</SelectItem>
                      <SelectItem value='customobject'>Custom Objects</SelectItem>
                      <SelectItem value='activity'>Activity</SelectItem>
                      <SelectItem value='custom'>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {eventCategory === 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-source'>Event Source</Label>
                    <Input
                      id='event-source'
                      value={eventSource}
                      onChange={(e) => setEventSource(e.target.value)}
                      placeholder='e.g., support'
                    />
                  </div>
                )}
                {eventCategory && eventCategory !== 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-type'>Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id='event-type'>
                        <SelectValue placeholder='Select an event type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>
                            <u>
                              {eventCategory === 'ticket'
                                ? 'Ticket Events'
                                : eventCategory === 'user'
                                  ? 'User Events'
                                  : eventCategory === 'organization'
                                    ? 'Organization Events'
                                    : eventCategory === 'customobject'
                                      ? 'Custom Object Events'
                                      : 'Activity Events'}
                            </u>
                          </SelectLabel>
                          {EVENT_TYPES[eventCategory].map((event) => (
                            <SelectItem key={event.value} value={event.value}>
                              {event.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {eventCategory === 'custom' && (
                  <div className='grid w-full items-center gap-1.5'>
                    <Label htmlFor='event-type'>Event Type</Label>
                    <Input
                      id='event-type'
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder='e.g., ticket.CustomEvent'
                    />
                    <p className='text-xs text-muted-foreground'>
                      Enter a custom event type. Format: category.EventName (e.g., ticket.CustomEvent)
                    </p>
                  </div>
                )}
                <p className='text-xs text-muted-foreground !mt-2'>
                  Need help finding event types?{' '}
                  <a
                    href={`https://developer.zendesk.com/api-reference/integration-services/trigger-events/ticket-events/`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'>
                    View documentation
                    <SquareArrowOutUpRight className='h-3 w-3 ml-1 inline-block' />
                  </a>
                </p>

                <p className='text-xs text-muted-foreground !mt-2'>
                  <u>Note:</u> Webhook can be created after creating the integration, under Modify Settings.
                </p>
              </div>
            </div>
          </div>
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
      </ScrollArea>
    </>
  );

  return (
    <Sheet open={isOpen || showInstallationDetails} onOpenChange={closeDialog}>
      <SheetContent
        className='flex flex-col group'
        style={{ width: `${width}px`, maxWidth: '80vw' }}
        onPointerDownOutside={preventDialogClose}>
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 h-full w-2.5 cursor-col-resize flex items-center justify-center transition-colors z-10',
            'group-hover:bg-border/50',
            isResizing.current && 'bg-border/80',
          )}>
          <GripVertical
            className={cn(
              'h-6 w-4 text-muted-foreground/50 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              isResizing.current && 'opacity-100',
            )}
          />
        </div>
        {showInstallationDetails ? renderInstallationDetails() : renderWorkflowForm()}
      </SheetContent>
    </Sheet>
  );
}
