'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Workflow } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Cog, GripVertical, Info, Loader2, Plus, Save, Trash2, QrCode, Shapes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import ZDClient from '@/lib/ZDClient';
import { create } from 'domain';
import { useIntegration } from '@/context/integration-context';

type ConfigObject = Record<string, any>;
type ValueType = 'string' | 'number' | 'boolean' | 'json';

type ConfigsSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
};

export function ConfigsSidebar({ isOpen, onClose, workflow }: ConfigsSidebarProps) {
  const [configs, setConfigs] = useState<ConfigObject | null>(null);
  const [rawJson, setRawJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(640);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState<string>('');
  const [newValueType, setNewValueType] = useState<ValueType>('string');

  const isResizing = useRef(false);
  const { toast } = useToast();
  const { selectedIntegration: integrationName } = useIntegration();

  useEffect(() => {
    if (isOpen && integrationName) {
      fetchConfigs();
    }
  }, [isOpen, integrationName]);

  /**
   * Initialises the configurations from the zis api
   */
  const fetchConfigs = async () => {
    if (!integrationName) return;
    setIsLoading(true);
    setError(null);
    setConfigs(null);
    try {
      const response = await ZDClient.getZisConfigApi(integrationName);
      const configData = response?.configs?.[0]?.config;
      if (configData) {
        setConfigs(configData);
        setRawJson(JSON.stringify(configData, null, 2));
        setIsJsonValid(true);
      }
    } catch (err: any) {
      console.log('Failed to fetch configs:', err);
      setError(`Failed to fetch configs: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleConfigChange = (key: string, value: any) => {
    setConfigs((prev) => {
      const newConfigs = prev ? { ...prev, [key]: value } : null;
      if (newConfigs) {
        setRawJson(JSON.stringify(newConfigs, null, 2));
      }
      return newConfigs;
    });
  };

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const jsonString = e.target.value;
    setRawJson(jsonString);
    try {
      const parsed = JSON.parse(jsonString);
      setConfigs(parsed);
      setIsJsonValid(true);
    } catch {
      setIsJsonValid(false);
    }
  };

  const handleAddProperty = () => {
    if (!newKey.trim()) {
      toast({
        variant: 'destructive',
        title: 'Key is required',
        description: 'Please provide a key for the new property.',
      });
      return;
    }
    if (configs && newKey in configs) {
      toast({
        variant: 'destructive',
        title: 'Key already exists',
        description: 'Please provide a unique key for the new property.',
      });
      return;
    }

    let parsedValue: any;
    try {
      switch (newValueType) {
        case 'number':
          parsedValue = parseFloat(newValue);
          if (isNaN(parsedValue)) throw new Error('Invalid number');
          break;
        case 'boolean':
          parsedValue = newValue === 'true';
          break;
        case 'json':
          if (newValue === '') {
            // Allow empty JSON to be parsed as an empty object
            parsedValue = {};
            break;
          }
          parsedValue = JSON.parse(newValue);
          break;
        case 'string':
        default:
          parsedValue = newValue;
          break;
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Invalid Value',
        description: `The value could not be parsed as a ${newValueType}.`,
      });
      return;
    }

    setConfigs((prev) => {
      const newConfigs = prev ? { ...prev, [newKey]: parsedValue } : { [newKey]: parsedValue };
      setRawJson(JSON.stringify(newConfigs, null, 2));
      return newConfigs;
    });

    setNewKey('');
    setNewValue('');
    setNewValueType('string');
  };

  const handleRemoveProperty = (keyToRemove: string) => {
    setConfigs((prev) => {
      if (!prev) return null;
      const newConfigs = { ...prev };
      delete newConfigs[keyToRemove];
      setRawJson(JSON.stringify(newConfigs, null, 2));
      return newConfigs;
    });
  };

  /**
   * Saves the current configurations back to the zis api
   */
  const handleSave = async () => {
    if (!isJsonValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid JSON',
        description: 'Cannot save, the raw JSON is not correctly formatted.',
      });
      return;
    }
    if (!configs || !integrationName) return;
    setIsSaving(true);
    try {
      await ZDClient.updateZisConfigApi({ config: configs }, integrationName);
      onClose();
    } catch (err: any) {
      console.error('Failed to save configs:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'An unknown error occurred.',
        duration: 8000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Creates a new configuration with default settings
   */
  const createNewConfiguration = async () => {
    if (!integrationName) return;
    setIsSaving(true);
    // Add your default configuration properties here
    const payload = {
      scope: `${integrationName}_settings`,
      config: {
        debug_webhook_endpoint: 'https://webhook.site/your-unique-endpoint',
      },
    };
    try {
      await ZDClient.createZisConfigApi(payload, integrationName);
      await fetchConfigs();
    } catch (err: any) {
      console.error('Failed to save configs:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || 'An unknown error occurred.',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (key: string, value: any) => {
    const onValueChange = (newValue: any) => handleConfigChange(key, newValue);

    // Render switch for Boolean
    if (typeof value === 'boolean') {
      return (
        <div className='flex items-center space-x-2 h-10'>
          <Switch id={key} checked={value} onCheckedChange={(checked) => onValueChange(checked)} />
          <Label htmlFor={key}>{value ? 'True' : 'False'}</Label>
        </div>
      );
    }

    // Render textarea for JSON objects/arrays
    if (typeof value === 'object' && value !== null) {
      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            // This allows typing but doesn't parse until blur
            // It's a compromise to avoid losing cursor position
            // The actual update happens onBlur
          }}
          onBlur={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onValueChange(parsed);
            } catch (err) {
              toast({
                variant: 'destructive',
                title: `Invalid JSON for ${key}`,
                description: 'The value was not updated. Please correct the JSON format.',
              });
              // Revert to last valid state
              if (configs) {
                setRawJson(JSON.stringify(configs, null, 2));
              }
            }
          }}
          rows={5}
          className='font-mono text-xs'
        />
      );
    }

    return <Input value={String(value)} onChange={(e) => onValueChange(e.target.value)} className='text-sm' />;
  };

  const renderNewValueInput = () => {
    switch (newValueType) {
      case 'boolean':
        return (
          <div className='flex items-center space-x-2 h-10'>
            <Switch
              id='new-value-boolean'
              checked={newValue === 'true'}
              onCheckedChange={(checked) => setNewValue(String(checked))}
            />
            <Label htmlFor='new-value-boolean'>{newValue === 'true' ? 'True' : 'False'}</Label>
          </div>
        );
      case 'json':
        return (
          <Textarea
            id='new-value-json'
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder='e.g., { "foo": "bar" } or [1, 2, 3]'
            className='font-mono text-xs'
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            id='new-value-number'
            type='number'
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder='e.g., 123.45'
          />
        );
      case 'string':
      default:
        return (
          <Input
            id='new-value-string'
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder='e.g., some_value'
          />
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
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
        <SheetHeader className='pr-8'>
          <SheetTitle className='flex items-center gap-3'>
            <Cog className='h-6 w-6' />
            Manage Configuration
          </SheetTitle>
          <SheetDescription>View and edit the settings for the "{integrationName}" integration.</SheetDescription>
        </SheetHeader>

        <ScrollArea className='flex-1 -mx-6 px-6'>
          <div className='space-y-6 py-6'>
            {isLoading && (
              <div className='flex items-center justify-center py-20'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            )}
            {error && (
              <Alert variant='default'>
                <Info className='h-4 w-4' />
                <div className='mt-1'>
                  <AlertTitle>No Configuration Found</AlertTitle>
                  <Button
                    className='mt-2'
                    size='sm'
                    variant='outline'
                    onClick={createNewConfiguration}
                    disabled={isSaving}>
                    {isSaving ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : <Shapes className='mr-1 h-4 w-4' />}
                    Create new configuration
                  </Button>
                </div>
              </Alert>
            )}
            {configs && (
              <div className='space-y-4'>
                {Object.entries(configs).map(([key, value]) => (
                  <div key={key} className='grid w-full items-start gap-1.5 relative group/item'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-0 right-0 h-6 w-6 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity'
                      onClick={() => handleRemoveProperty(key)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                    <Label htmlFor={key} className='text-base font-medium capitalize'>
                      {key.replace(/_/g, ' ')}
                    </Label>
                    {renderField(key, value)}
                  </div>
                ))}

                <Separator className='!my-8' />

                <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                  <h4 className='font-medium text-base'>Add New Property</h4>
                  <div className='space-y-4'>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor='new-value-type'>Type</Label>
                      <Select
                        value={newValueType}
                        onValueChange={(v: ValueType) => {
                          setNewValueType(v);
                          setNewValue('');
                        }}>
                        <SelectTrigger id='new-value-type' className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='string'>String</SelectItem>
                          <SelectItem value='number'>Number</SelectItem>
                          <SelectItem value='boolean'>Boolean</SelectItem>
                          <SelectItem value='json'>JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor='new-key'>Property Name</Label>
                      <Input
                        id='new-key'
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder='new_config_key'
                      />
                    </div>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor='new-value'>Property Value</Label>
                      {renderNewValueInput()}
                    </div>
                  </div>
                  <Button onClick={handleAddProperty} size='sm' className='w-full'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add Property
                  </Button>
                </div>

                <Separator />

                <Accordion type='single' collapsible className='w-full'>
                  <AccordionItem value='raw-properties'>
                    <AccordionTrigger>Raw Properties (JSON)</AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={rawJson}
                        onChange={handleRawJsonChange}
                        rows={15}
                        className={cn(
                          'font-mono text-xs',
                          !isJsonValid && 'border-destructive ring-2 ring-destructive ring-offset-2'
                        )}
                        placeholder='Enter valid JSON...'
                      />
                      {!isJsonValid && <p className='mt-2 text-sm text-destructive'>Invalid JSON format.</p>}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </ScrollArea>

        {!error && (
          <SheetFooter>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !configs || !isJsonValid}>
              {isSaving ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : <Save className='mr-1 h-4 w-4' />}
              Save Changes
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
