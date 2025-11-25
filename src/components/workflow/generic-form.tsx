'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ZISState } from '@/lib/types';
import { Fragment } from 'react';

type GenericFormProps = {
  data: ZISState;
  onChange: (updatedData: Partial<ZISState>) => void;
};

// These properties are handled by other specialized form components or are internal
const excludedKeys = [
  'Type',
  'Choices',
  'Default',
  'Parameters',
  'Next',
  'ActionName',
  'Result',
  'ResultPath',
  'Catch', // Now handled by ActionNodeForm
  'isStartNode', // Internal prop for visual display
  'onNodeDelete', // Internal prop for event handling
  'id', // The node ID is handled separately
];

export function GenericForm({ data, onChange }: GenericFormProps) {
  const renderInput = (key: string, value: any) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ [key]: e.target.value });
    };

    const handleObjectChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      try {
        const parsed = JSON.parse(e.target.value);
        onChange({ [key]: parsed });
      } catch (error) {
        // If JSON is invalid, we don't update state. A more robust solution might show an error.
        console.warn('Invalid JSON:', e.target.value);
      }
    };

    if (typeof value === 'string') {
      if (key === 'Comment') {
        return <Textarea id={key} value={value} onChange={handleInputChange} rows={3} className='text-base' />;
      }
      return <Input id={key} value={value} onChange={handleInputChange} />;
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <Textarea
          id={key}
          key={key} // Add key to ensure re-render on node change
          defaultValue={JSON.stringify(value, null, 2)}
          onBlur={handleObjectChange}
          rows={5}
          className='font-mono text-xs'
        />
      );
    }

    // Fallback for other types (number, boolean, etc.) - rendered as string input
    return <Input id={key} value={String(value)} onChange={handleInputChange} />;
  };

  const filteredKeys = Object.entries(data).filter(([key]) => {
    return !excludedKeys.includes(key);
  });

  return (
    <div className='space-y-4'>
      {filteredKeys.map(([key, value]) => (
        <Fragment key={key}>
          <div className='grid w-full items-center gap-1.5'>
            <Label htmlFor={key} className='capitalize'>
              {key.replace(/([A-Z])/g, ' $1')}
            </Label>
            {renderInput(key, value)}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
