'use client';

import { Fragment } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ZISActionHttp } from '@/lib/types';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type ActionHttpFormProps = {
  data: ZISActionHttp['properties'];
  onChange: (updatedData: ZISActionHttp['properties']) => void;
};

type EndpointType = 'path' | 'url';
type BodyType = 'json' | 'path';

export function ActionHttpForm({ data, onChange }: ActionHttpFormProps) {
  const definition = data.definition || {};

  const handleDefinitionChange = (key: string, value: any) => {
    onChange({
      ...data,
      definition: {
        ...definition,
        [key]: value,
      },
    });
  };

  const handleHeaderChange = (index: number, key: 'key' | 'value', value: string) => {
    const newHeaders = [...(definition.headers || [])];
    newHeaders[index] = { ...newHeaders[index], [key]: value };
    handleDefinitionChange('headers', newHeaders);
  };

  const handleAddHeader = () => {
    const newHeaders = [...(definition.headers || []), { key: '', value: '' }];
    handleDefinitionChange('headers', newHeaders);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...(definition.headers || [])];
    newHeaders.splice(index, 1);
    handleDefinitionChange('headers', newHeaders);
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
    onChange({ ...data, definition: newDefinition });
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

  const handleBodyChange = (value: string) => {
    const newDefinition = { ...definition };
    if ('requestBody.$' in newDefinition) {
      newDefinition['requestBody.$'] = value;
    } else {
      try {
        newDefinition.requestBody = JSON.parse(value);
      } catch (e) {
        // If JSON is invalid while typing, we don't update to prevent breaking the app state
        // A better implementation would show a validation error message in the UI
        console.warn('Invalid JSON in textarea');
        return;
      }
    }
    onChange({ ...data, definition: newDefinition });
  };

  const endpointType: EndpointType = 'url' in definition ? 'url' : 'path';
  const endpointValue = definition.url || definition.path || definition['path.$'] || '';

  const bodyType: BodyType = 'requestBody.$' in definition ? 'path' : 'json';
  let bodyValue: string;
  if ('requestBody.$' in definition) {
    bodyValue = definition['requestBody.$'];
  } else if (definition.requestBody !== undefined) {
    bodyValue = JSON.stringify(definition.requestBody, null, 2);
  } else {
    bodyValue = '';
  }

  return (
    <div className='space-y-4'>
      <div className='grid w-full items-center gap-1.5'>
        <Label htmlFor='action-name'>Name</Label>
        <Input id='action-name' value={data.name || ''} onChange={(e) => onChange({ ...data, name: e.target.value })} />
      </div>

      <Separator />

      <h4 className='font-medium text-base pt-2'>Definition</h4>

      <div className='pl-4 border-l-2 space-y-4'>
        <div className='grid w-full items-center gap-1.5'>
          <Label htmlFor='def-method'>Method</Label>
          <Input
            id='def-method'
            value={definition.method || ''}
            onChange={(e) => handleDefinitionChange('method', e.target.value)}
          />
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
            value={endpointValue}
            onChange={(e) => handleEndpointChange(e.target.value)}
            placeholder={endpointType === 'path' ? '/api/v2/example' : 'https://example.com/api'}
          />
        </div>

        <div className='grid w-full items-center gap-1.5'>
          <Label htmlFor='def-connection'>Connection Name</Label>
          <Input
            id='def-connection'
            value={definition.connectionName || ''}
            onChange={(e) => handleDefinitionChange('connectionName', e.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label>Headers</Label>
          {definition.headers?.map((header: { key: string; value: string }, index: number) => (
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
            defaultValue={bodyValue}
            onBlur={(e) => handleBodyChange(e.target.value)}
            key={bodyType}
            rows={5}
            className='font-mono text-xs'
            placeholder={bodyType === 'path' ? 'e.g., $.input_data' : '{ "key": "value" }'}
          />
        </div>
      </div>
    </div>
  );
}
