'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ZISCondition } from '@/lib/types';
import { conditionTypes, getCondition } from '@/lib/workflow-utils';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useState } from 'react';

type ConditionFormProps = {
  condition: ZISCondition;
  onChange: (updatedCondition: ZISCondition) => void;
};

export function ConditionForm({ condition, onChange }: ConditionFormProps) {
  const [conditionType, conditionValue] = getCondition(condition);

  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(
    typeof conditionValue === 'boolean' ? String(conditionValue) : (conditionValue ?? ''),
  );

  // Debounced onChange callback
  const debouncedOnChange = useDebouncedCallback(onChange, 400);

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...condition, Variable: e.target.value });
  };

  const handleConditionTypeChange = (newType: string) => {
    // Create a new object with only 'Variable'
    const newCondition: ZISCondition = { Variable: condition.Variable };

    // Add the new condition type with a default value
    const defaultValue = newType === 'IsPresent' ? true : typeof conditionValue === 'number' ? 0 : '';
    (newCondition as any)[newType] = defaultValue;

    // Update local value
    setLocalValue(typeof defaultValue === 'boolean' ? String(defaultValue) : (defaultValue ?? ''));

    onChange(newCondition);
  };

  const handleConditionValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Update local state immediately for responsive UI
    setLocalValue(inputValue);

    const newCondition = { ...condition };
    const type = getCondition(condition)[0];
    if (type) {
      let value: string | number | boolean = inputValue;
      if (type.includes('Numeric')) {
        value = inputValue === '' ? '' : Number(inputValue);
      } else if (type.includes('Boolean')) {
        // Keep as string while typing, only convert valid boolean strings
        const lowerValue = inputValue.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'false') {
          value = lowerValue === 'true';
        } else {
          // Keep as string if not a valid boolean yet
          value = inputValue;
        }
      }
      (newCondition as any)[type] = value;
    }

    // Debounce the actual onChange callback
    debouncedOnChange(newCondition);
  };

  return (
    <div className='space-y-4'>
      <div className='grid gap-1.5'>
        <Label htmlFor='variable'>Variable Path</Label>
        <Input
          id='variable'
          value={condition.Variable || ''}
          onChange={handleVariableChange}
          placeholder='e.g., $.input.ticket.status'
        />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div className='grid gap-1.5'>
          <Label htmlFor='condition-type'>Operator</Label>
          <Select value={conditionType} onValueChange={handleConditionTypeChange}>
            <SelectTrigger id='condition-type'>
              <SelectValue placeholder='Select condition' />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(conditionTypes).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-1.5'>
          <Label htmlFor='condition-value'>Value</Label>
          <Input
            id='condition-value'
            type={conditionType?.includes('Numeric') ? 'number' : 'text'}
            value={localValue}
            onChange={handleConditionValueChange}
            disabled={conditionType === 'IsPresent'}
            placeholder='Condition value'
          />
        </div>
      </div>
    </div>
  );
}
