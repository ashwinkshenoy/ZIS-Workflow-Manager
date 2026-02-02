'use client';

import { Fragment, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ZISActionHttp } from '@/lib/types';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

type ActionHttpFormProps = {
  data: ZISActionHttp['properties'];
  onChange: (updatedData: ZISActionHttp['properties']) => void;
};

type EndpointType = 'path' | 'url';
type BodyType = 'json' | 'path';

export function ActionHttpForm({ data, onChange }: ActionHttpFormProps) {
  const definition = data.definition || {};

  // Local state for debounced inputs
  const [localName, setLocalName] = useState(data.name || '');
  const [localMethod, setLocalMethod] = useState(definition.method || '');
  const [localConnectionName, setLocalConnectionName] = useState(definition.connectionName || '');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalName(data.name || '');
  }, [data.name]);

  useEffect(() => {
    setLocalMethod(definition.method || '');
  }, [definition.method]);

  useEffect(() => {
    setLocalConnectionName(definition.connectionName || '');
  }, [definition.connectionName]);

  // Debounced onChange handlers
  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  const handleNameChange = (value: string) => {
    setLocalName(value);
    debouncedOnChange({ ...data, name: value });
  };

  const handleMethodChange = (value: string) => {
    setLocalMethod(value);
    debouncedOnChange({
      ...data,
      definition: { ...definition, method: value },
    });
  };

  const handleConnectionNameChange = (value: string) => {
    setLocalConnectionName(value);
    debouncedOnChange({
      ...data,
      definition: { ...definition, connectionName: value },
    });
  };

  const handleDefinitionChange = (key: string, value: any) => {
    onChange({
      ...data,
      definition: {
        ...definition,
        [key]: value,
      },
    });
  };

  // Local state for headers
  const [localHeaders, setLocalHeaders] = useState(definition.headers || []);

  useEffect(() => {
    setLocalHeaders(definition.headers || []);
  }, [definition.headers]);

  const handleHeaderChange = (index: number, key: 'key' | 'value', value: string) => {
    const newHeaders = [...localHeaders];
    newHeaders[index] = { ...newHeaders[index], [key]: value };
    setLocalHeaders(newHeaders);
    debouncedOnChange({
      ...data,
      definition: {
        ...definition,
        headers: newHeaders,
      },
    });
  };

  const handleAddHeader = () => {
    const newHeaders = [...localHeaders, { key: '', value: '' }];
    setLocalHeaders(newHeaders);
    onChange({
      ...data,
      definition: {
        ...definition,
        headers: newHeaders,
      },
    });
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...localHeaders];
    newHeaders.splice(index, 1);
    setLocalHeaders(newHeaders);
    onChange({
      ...data,
      definition: {
        ...definition,
        headers: newHeaders,
      },
    });
  };

  const handleEndpointTypeChange = (type: EndpointType) => {
    const newDefinition = { ...definition };
    const currentValue = newDefinition.path || newDefinition.url || newDefinition['path.$'];
    delete newDefinition.path;
    delete newDefinition.url;
    delete newDefinition['path.$'];
    if (type === 'path') {
      newDefinition.path = currentValue || '';
    } else {
      newDefinition.url = currentValue || '';
    }
    onChange({ ...data, definition: newDefinition });
  };

  const handleEndpointChange = (value: string) => {
    const newDefinition = { ...definition };
    if ('url' in newDefinition) {
      newDefinition.url = value;
    } else {
      delete newDefinition.path;
      delete newDefinition['path.$'];
      if (value.includes('{{')) {
        newDefinition['path.$'] = value;
      } else {
        newDefinition.path = value;
      }
    }
    debouncedOnChange({ ...data, definition: newDefinition });
  };

  const handleBodyTypeChange = (type: BodyType) => {
    const newDefinition = { ...definition };
    const currentValue = newDefinition.requestBody || newDefinition['requestBody.$'];
    delete newDefinition.requestBody;
    delete newDefinition['requestBody.$'];

    if (type === 'path') {
      // When switching to path, if the old value was an object, default to a path string. Otherwise, keep the string.
      newDefinition['requestBody.$'] = typeof currentValue === 'object' ? '$.' : currentValue || '$.';
    } else {
      // Switching to JSON
      // When switching to json, if the old value was a string, default to an empty object. Otherwise, keep the object/array.
      newDefinition.requestBody = typeof currentValue === 'string' ? {} : currentValue || {};
    }
    onChange({ ...data, definition: newDefinition });
  };

  /**
   * Handles changes to the request body
   * @param {String} value - The new request body value (either JSON string or path)
   */
  const handleBodyChange = (value: string) => {
    const newDefinition = { ...definition };
    if ('requestBody.$' in newDefinition) {
      newDefinition['requestBody.$'] = value;
      setJsonError(null);
    } else {
      try {
        newDefinition.requestBody = JSON.parse(value);
        setJsonError(null);
      } catch (e) {
        // Set error message but don't prevent the change
        setJsonError((e as Error).message || 'Invalid JSON format');
        return;
      }
    }
    onChange({ ...data, definition: newDefinition });
  };

  const endpointType: EndpointType = 'url' in definition ? 'url' : 'path';
  const endpointValue = definition.url || definition.path || definition['path.$'] || '';

  // Local state for endpoint to avoid lag
  const [localEndpoint, setLocalEndpoint] = useState(endpointValue);

  useEffect(() => {
    setLocalEndpoint(endpointValue);
  }, [endpointValue]);

  const handleLocalEndpointChange = (value: string) => {
    setLocalEndpoint(value);
    handleEndpointChange(value);
  };

  const bodyType: BodyType = 'requestBody.$' in definition ? 'path' : 'json';
  let bodyValue: string;
  if ('requestBody.$' in definition) {
    bodyValue = definition['requestBody.$'];
  } else if (definition.requestBody !== undefined) {
    bodyValue = JSON.stringify(definition.requestBody, null, 2);
  } else {
    bodyValue = '';
  }

  // Local state for body value to avoid lag
  const [localBodyValue, setLocalBodyValue] = useState(bodyValue);

  useEffect(() => {
    setLocalBodyValue(bodyValue);
  }, [bodyValue]);

  // Debounced body change handler
  const debouncedBodyChange = useDebouncedCallback(handleBodyChange, 400);

  /**
   * Handles local body value changes with immediate validation for JSON
   */
  const handleLocalBodyChange = (value: string) => {
    setLocalBodyValue(value);

    // Immediate validation for JSON type
    if (bodyType === 'json') {
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch (e) {
        setJsonError((e as Error).message || 'Invalid JSON format');
      }
    } else {
      setJsonError(null);
    }

    // Debounce the actual update
    debouncedBodyChange(value);
  };

  return (
    <div className='space-y-4'>
      <div className='grid w-full items-center gap-1.5'>
        <Label htmlFor='action-name'>Name</Label>
        <Input id='action-name' value={localName} onChange={(e) => handleNameChange(e.target.value)} />
      </div>

      <Separator />

      <h4 className='font-medium text-base pt-2'>Definition</h4>

      <div className='p-4 rounded-md border bg-muted/50 space-y-4'>
        <div className='grid w-full items-center gap-1.5'>
          <Label htmlFor='def-method'>Method</Label>
          <Input id='def-method' value={localMethod} onChange={(e) => handleMethodChange(e.target.value)} />
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label>Endpoint</Label>
            <RadioGroup
              value={endpointType}
              onValueChange={(v) => handleEndpointTypeChange(v as EndpointType)}
              className='flex items-center'>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='path' id='r-path' />
                <Label htmlFor='r-path'>Path</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='url' id='r-url' />
                <Label htmlFor='r-url'>URL</Label>
              </div>
            </RadioGroup>
          </div>
          <Input
            value={localEndpoint}
            onChange={(e) => handleLocalEndpointChange(e.target.value)}
            placeholder={endpointType === 'path' ? '/api/v2/example' : 'https://example.com/api'}
          />
        </div>

        <div className='grid w-full items-center gap-1.5'>
          <Label htmlFor='def-connection'>Connection Name</Label>
          <Input
            id='def-connection'
            value={localConnectionName}
            onChange={(e) => handleConnectionNameChange(e.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label>Headers</Label>
          {localHeaders?.map((header: { key: string; value: string }, index: number) => (
            <div key={index} className='flex items-center gap-2'>
              <Input
                placeholder='Key'
                value={header.key}
                onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
              />
              <Input
                placeholder='Value'
                value={header.value}
                onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
              />
              <Button variant='ghost' size='icon' onClick={() => handleRemoveHeader(index)}>
                <Trash2 className='h-4 w-4 text-muted-foreground' />
              </Button>
            </div>
          ))}
          <Button variant='outline' size='sm' onClick={handleAddHeader} className='w-full'>
            <Plus className='mr-2 h-4 w-4' /> Add Header
          </Button>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label>Request Body</Label>
            <RadioGroup
              value={bodyType}
              onValueChange={(v) => handleBodyTypeChange(v as BodyType)}
              className='flex items-center'>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='json' id='r-body-json' />
                <Label htmlFor='r-body-json'>JSON</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='path' id='r-body-path' />
                <Label htmlFor='r-body-path'>Path</Label>
              </div>
            </RadioGroup>
          </div>
          <Textarea
            value={localBodyValue}
            onChange={(e) => handleLocalBodyChange(e.target.value)}
            rows={5}
            className={`font-mono text-xs ${jsonError && bodyType === 'json' ? 'border-destructive ring-2 ring-destructive ring-offset-2' : ''}`}
            placeholder={bodyType === 'path' ? 'e.g., $.input_data' : '{ "key": "value" }'}
          />
          {jsonError && bodyType === 'json' && <p className='text-sm text-destructive mt-1'>{jsonError}</p>}
        </div>
      </div>
    </div>
  );
}
