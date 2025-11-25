'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ZISState, type ZISResource } from '@/lib/types';
import { Fragment } from 'react';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type ActionNodeFormProps = {
  data: ZISState;
  actions: Record<string, ZISResource>;
  onChange: (updatedData: Partial<ZISState>) => void;
};

export function ActionNodeForm({ data, actions, onChange }: ActionNodeFormProps) {
  const handleParameterChange = (index: number, field: 'key' | 'value', newValue: string) => {
    if (!data.Parameters) return;
    const params = { ...data.Parameters };
    const keys = Object.keys(params);
    const oldKey = keys[index];
    const oldValue = params[oldKey];

    if (field === 'key') {
      const newParams: { [key: string]: any } = {};
      keys.forEach((key, i) => {
        if (i === index) {
          newParams[newValue] = oldValue;
        } else {
          newParams[key] = params[key];
        }
      });
      onChange({ Parameters: newParams });
    } else {
      let finalValue: any = newValue;
      try {
        const parsed = JSON.parse(newValue);
        if (typeof parsed === 'object' || typeof parsed === 'boolean' || typeof parsed === 'number') {
          finalValue = parsed;
        }
      } catch (e) {
        // Not valid JSON, treat as string
      }
      onChange({ Parameters: { ...params, [oldKey]: finalValue } });
    }
  };

  const handleAddParameter = () => {
    const newKey = `new_param_${data.Parameters ? Object.keys(data.Parameters).length + 1 : 1}`;
    onChange({
      Parameters: {
        ...(data.Parameters || {}),
        [newKey]: '',
      },
    });
  };

  const handleRemoveParameter = (keyToRemove: string) => {
    if (!data.Parameters) return;
    const newParams = { ...data.Parameters };
    delete newParams[keyToRemove];
    onChange({ Parameters: newParams });
  };

  const handleActionNameChange = (selectedActionKey: string) => {
    let newActionName = '';
    const updatedState: Partial<ZISState> = {
      // Ensure parameters is at least an empty object for actions
      Parameters: {},
    };

    if (selectedActionKey.startsWith('zis:common:')) {
      newActionName = selectedActionKey;
      if (selectedActionKey === 'zis:common:transform:Jq') {
        updatedState.Parameters = {
          expr: '',
          'data.$': '$',
        };
      } else if (selectedActionKey === 'zis:common:action:LoadConfig') {
        updatedState.Parameters = {
          scope: '',
        };
      }
    } else {
      newActionName = `zis:{{zis_integration_key}}:action:${selectedActionKey}`;
      updatedState.Parameters = {}; // Clear parameters for custom actions
    }
    updatedState.ActionName = newActionName;
    onChange(updatedState);
  };

  const handleCatchChange = (index: number, field: 'ErrorEquals' | 'ResultPath' | 'Next', value: string) => {
    if (!data.Catch) return;
    const newCatch = [...data.Catch];
    const catchBlock = { ...newCatch[index] };

    if (field === 'ErrorEquals') {
      // ErrorEquals is an array of strings, we'll store it as a newline-separated string in the textarea
      catchBlock.ErrorEquals = value.split('\n').filter((s) => s.trim() !== '');
    } else {
      (catchBlock as any)[field] = value;
    }

    newCatch[index] = catchBlock;
    onChange({ Catch: newCatch });
  };

  const handleAddCatch = () => {
    const newCatchBlock = {
      ErrorEquals: ['States.ALL'],
      ResultPath: '$.error',
      Next: '',
    };
    const newCatchArray = [...(data.Catch || []), newCatchBlock];
    onChange({ Catch: newCatchArray });
  };

  const handleRemoveCatch = (index: number) => {
    if (!data.Catch) return;
    const newCatch = [...data.Catch];
    newCatch.splice(index, 1);
    onChange({ Catch: newCatch });
  };

  const actionNameKey = data.ActionName?.startsWith('zis:common:')
    ? data.ActionName
    : data.ActionName?.split(':').pop() || '';

  return (
    <div className='space-y-4'>
      <div className='grid w-full items-center gap-1.5'>
        <Label htmlFor='action-name'>ActionName</Label>
        <Select value={actionNameKey} onValueChange={handleActionNameChange}>
          <SelectTrigger id='action-name'>
            <SelectValue placeholder='Select an action' />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(actions).map((actionKey) => (
              <SelectItem key={actionKey} value={actionKey}>
                {actionKey}
              </SelectItem>
            ))}
            <SelectItem value='zis:common:transform:Jq'>zis:common:transform:Jq</SelectItem>
            <SelectItem value='zis:common:action:LoadConfig'>zis:common:action:LoadConfig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {'Parameters' in data && (
        <>
          <Separator />
          <div className='space-y-2'>
            <h4 className='font-medium text-base'>Parameters</h4>
            <div className='space-y-3 rounded-md border bg-muted/20 p-4'>
              {data.Parameters &&
                Object.keys(data.Parameters).map((paramKey, index) => (
                  <div key={index} className='relative space-y-2 rounded-lg border bg-background p-3'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-1 right-1 h-7 w-7'
                      onClick={() => handleRemoveParameter(paramKey)}>
                      <Trash2 className='h-4 w-4 text-muted-foreground' />
                    </Button>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor={`param-key-${index}`}>Key</Label>
                      <Input
                        id={`param-key-${index}`}
                        placeholder='Key'
                        value={paramKey}
                        onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                        className='font-mono text-xs'
                      />
                    </div>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor={`param-value-${index}`}>Value</Label>
                      <Textarea
                        id={`param-value-${index}`}
                        placeholder='Value'
                        value={
                          typeof data.Parameters[paramKey] === 'string'
                            ? data.Parameters[paramKey]
                            : JSON.stringify(data.Parameters[paramKey], null, 2)
                        }
                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                        className='font-mono text-xs'
                        rows={1}
                      />
                    </div>
                  </div>
                ))}
              <Button variant='outline' size='sm' onClick={handleAddParameter} className='w-full'>
                <Plus className='mr-2 h-4 w-4' /> Add Parameter
              </Button>
            </div>
          </div>
        </>
      )}

      <div className='grid w-full items-center gap-1.5'>
        <Label htmlFor='result-path'>ResultPath</Label>
        <Input
          id='result-path'
          value={data.ResultPath || ''}
          onChange={(e) => onChange({ ResultPath: e.target.value })}
          placeholder='e.g., $.action_result'
        />
      </div>

      <Separator />
      <div className='space-y-2'>
        <h4 className='font-medium text-base'>Error Handling (Catch)</h4>
        <div className='space-y-3 rounded-md border bg-muted/20 p-4'>
          {data.Catch?.map((catchBlock, index) => (
            <div key={index} className='relative space-y-3 rounded-lg border bg-background p-4'>
              <Button
                variant='ghost'
                size='icon'
                className='absolute top-1 right-1 h-7 w-7'
                onClick={() => handleRemoveCatch(index)}>
                <Trash2 className='h-4 w-4 text-muted-foreground' />
              </Button>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor={`catch-error-equals-${index}`}>ErrorEquals</Label>
                <Textarea
                  id={`catch-error-equals-${index}`}
                  value={catchBlock.ErrorEquals?.join('\n') || ''}
                  onChange={(e) => handleCatchChange(index, 'ErrorEquals', e.target.value)}
                  placeholder='States.ALL'
                  className='font-mono text-xs'
                  rows={2}
                />
              </div>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor={`catch-result-path-${index}`}>ResultPath</Label>
                <Input
                  id={`catch-result-path-${index}`}
                  value={catchBlock.ResultPath || ''}
                  onChange={(e) => handleCatchChange(index, 'ResultPath', e.target.value)}
                  placeholder='e.g., $.error_output'
                />
              </div>
              <div className='grid w-full items-center gap-1.5'>
                <Label htmlFor={`catch-next-${index}`}>Next Step</Label>
                <Input
                  id={`catch-next-${index}`}
                  value={catchBlock.Next || ''}
                  onChange={(e) => handleCatchChange(index, 'Next', e.target.value)}
                  placeholder='e.g., E01.Handle.Error'
                />
              </div>
            </div>
          ))}
          <Button variant='outline' size='sm' onClick={handleAddCatch} className='w-full'>
            <Plus className='mr-2 h-4 w-4' /> Add Catch Block
          </Button>
        </div>
      </div>
    </div>
  );
}
