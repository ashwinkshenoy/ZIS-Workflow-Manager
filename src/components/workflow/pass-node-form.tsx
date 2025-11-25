'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ZISState } from '@/lib/types';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

type PassNodeFormProps = {
  data: ZISState;
  onChange: (updatedData: Partial<ZISState>) => void;
};

export function PassNodeForm({ data, onChange }: PassNodeFormProps) {
  const handleResultPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ResultPath: e.target.value });
  };
    
  const handleResultChange = (
    index: number,
    field: 'key' | 'value',
    newValue: string
  ) => {
    if (!data.Result) return;
    const params = { ...data.Result };
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
      onChange({ Result: newParams });
    } else {
      let finalValue: any = newValue;
      try {
        const parsed = JSON.parse(newValue);
        if (
          typeof parsed === 'object' ||
          typeof parsed === 'boolean' ||
          typeof parsed === 'number'
        ) {
          finalValue = parsed;
        }
      } catch (e) {
        // Not valid JSON, treat as string
      }
      onChange({ Result: { ...params, [oldKey]: finalValue } });
    }
  };

  const handleAddResultItem = () => {
    const newKey = `new_item_${
      data.Result ? Object.keys(data.Result).length + 1 : 1
    }`;
    onChange({
      Result: {
        ...(data.Result || {}),
        [newKey]: '',
      },
    });
  };

  const handleRemoveResultItem = (keyToRemove: string) => {
    if (!data.Result) return;
    const newParams = { ...data.Result };
    delete newParams[keyToRemove];
    onChange({ Result: newParams });
  };
  

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="result-path">ResultPath</Label>
        <Input
          id="result-path"
          value={data.ResultPath || '$.'}
          onChange={handleResultPathChange}
        />
      </div>

      {'Result' in data && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium text-base">Result</h4>
            <div className="space-y-3 rounded-md border bg-muted/20 p-4">
              {data.Result &&
                Object.keys(data.Result).map((paramKey, index) => (
                  <div
                    key={index}
                    className="relative space-y-2 rounded-lg border bg-background p-3"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => handleRemoveResultItem(paramKey)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor={`result-key-${index}`}>Key</Label>
                      <Input
                        id={`result-key-${index}`}
                        placeholder="Key"
                        value={paramKey}
                        onChange={(e) =>
                          handleResultChange(index, 'key', e.target.value)
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor={`result-value-${index}`}>Value</Label>
                      <Textarea
                        id={`result-value-${index}`}
                        placeholder="Value"
                        value={
                          typeof data.Result[paramKey] === 'string'
                            ? data.Result[paramKey]
                            : JSON.stringify(
                                data.Result[paramKey],
                                null,
                                2
                              )
                        }
                        onChange={(e) =>
                          handleResultChange(
                            index,
                            'value',
                            e.target.value
                          )
                        }
                        className="font-mono text-xs"
                        rows={1}
                      />
                    </div>
                  </div>
                ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddResultItem}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item to Result
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
