
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
import type { ZISChoice, ZISCondition } from '@/lib/types';
import { getCondition, conditionTypes, isSingleCondition } from '@/lib/workflow-utils';
import { ConditionForm } from './condition-form';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';

type ChoiceFormProps = {
  choice: ZISChoice;
  onChange: (updatedChoice: ZISChoice) => void;
};

export function ChoiceForm({ choice, onChange }: ChoiceFormProps) {
  
  const handleNextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...choice, Next: e.target.value });
  };
  
  const logicalOperator = choice.And ? 'And' : choice.Or ? 'Or' : 'None';
  const conditions = choice.And || choice.Or || (isSingleCondition(choice) ? [choice as ZISCondition] : []);
  
  const handleOperatorChange = (newOperator: 'And' | 'Or' | 'None') => {
    let newChoice: ZISChoice = { Next: choice.Next };
    if (newOperator === 'None') {
      // Revert to single condition
      const firstCondition = conditions[0] || { Variable: '$.', StringEquals: '' };
      newChoice = { ...newChoice, ...firstCondition };
    } else {
      newChoice[newOperator] = conditions;
    }
    onChange(newChoice);
  }

  const handleConditionChange = (index: number, updatedCondition: ZISCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updatedCondition;
    
    let newChoice: ZISChoice = { Next: choice.Next };
    if (logicalOperator !== 'None') {
        newChoice[logicalOperator] = newConditions;
    } else {
        newChoice = {...newChoice, ...newConditions[0]};
    }
    onChange(newChoice);
  }

  const handleAddCondition = () => {
    const newCondition: ZISCondition = { Variable: '$.', StringEquals: '' };
    const newConditions = [...conditions, newCondition];
    let newChoice: ZISChoice = { Next: choice.Next };
    
    if (logicalOperator === 'None') {
        // Upgrading from single to multi-condition, default to 'And'
        newChoice['And'] = newConditions;
    } else {
        newChoice[logicalOperator] = newConditions;
    }
    onChange(newChoice);
  };
  
  const handleRemoveCondition = (index: number) => {
      const newConditions = [...conditions];
      newConditions.splice(index, 1);
      
      let newChoice: ZISChoice = { Next: choice.Next };

      if (newConditions.length === 0 || (newConditions.length === 1 && logicalOperator !== 'None')) {
          // If no conditions left, or just one, revert to single condition mode
          const singleCondition = newConditions[0] || { Variable: '$.', StringEquals: '' };
          newChoice = { ...newChoice, ...singleCondition };
      }
      else if (logicalOperator !== 'None') {
          newChoice[logicalOperator] = newConditions;
      }
      
      onChange(newChoice);
  }

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="next">Next Step</Label>
        <Input
          id="next"
          value={choice.Next}
          onChange={handleNextChange}
          placeholder="e.g., 003.Next.Step"
        />
      </div>

       <Separator />
      
      {logicalOperator !== 'None' && (
        <div className="grid gap-1.5">
          <Label>Logic</Label>
          <Select value={logicalOperator} onValueChange={(v) => handleOperatorChange(v as 'And' | 'Or' | 'None')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="And">All conditions must be true (AND)</SelectItem>
              <SelectItem value="Or">Any condition can be true (OR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='space-y-4'>
        {conditions.map((cond, index) => (
            <div key={index} className="relative rounded-lg border bg-background p-4 pr-10">
                <ConditionForm 
                    condition={cond} 
                    onChange={(updated) => handleConditionChange(index, updated)}
                />
                 {conditions.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleRemoveCondition(index)}
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={handleAddCondition} className='w-full'>
          <Plus className="mr-2 h-4 w-4"/>
          Add Condition
      </Button>

    </div>
  );
}
