
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ZISCondition } from '@/lib/types';
import { conditionTypes, getCondition } from '@/lib/workflow-utils';

type ConditionFormProps = {
  condition: ZISCondition;
  onChange: (updatedCondition: ZISCondition) => void;
};


export function ConditionForm({ condition, onChange }: ConditionFormProps) {
  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...condition, Variable: e.target.value });
  };
  
  const [conditionType, conditionValue] = getCondition(condition);

  const handleConditionTypeChange = (newType: string) => {
    // Create a new object with only 'Variable'
    const newCondition: ZISCondition = { Variable: condition.Variable };
    
    // Add the new condition type with a default value
    const defaultValue = newType === 'IsPresent' ? true : (typeof conditionValue === 'number' ? 0 : '');
    (newCondition as any)[newType] = defaultValue;

    onChange(newCondition);
  };
  
  const handleConditionValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCondition = {...condition};
    const type = getCondition(condition)[0];
    if (type) {
        let value: string | number | boolean = e.target.value;
        if (type.includes('Numeric')) {
            value = Number(e.target.value);
        } else if (type.includes('Boolean')) {
            value = e.target.value.toLowerCase() === 'true';
        }
       (newCondition as any)[type] = value;
    }
    onChange(newCondition);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="variable">Variable Path</Label>
        <Input
          id="variable"
          value={condition.Variable || ''}
          onChange={handleVariableChange}
          placeholder="e.g., $.input.ticket.status"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="condition-type">Operator</Label>
          <Select value={conditionType} onValueChange={handleConditionTypeChange}>
            <SelectTrigger id="condition-type">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {conditionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="condition-value">Value</Label>
           <Input
            id="condition-value"
            value={conditionValue}
            onChange={handleConditionValueChange}
            disabled={conditionType === 'IsPresent'}
            placeholder="Condition value"
          />
        </div>
      </div>
    </div>
  );
}
