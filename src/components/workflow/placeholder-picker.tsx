'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';

type PlaceholderPickerProps = {
  placeholders: string[];
  onSelect: (placeholder: string) => void;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
};

export function PlaceholderPicker({
  placeholders,
  onSelect,
  buttonSize = 'sm',
  disabled = false,
}: PlaceholderPickerProps) {
  if (placeholders.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size={buttonSize} disabled={disabled} className='p-3 h-[35px]'>
          <Plus className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='max-h-[300px] overflow-y-auto'>
        {placeholders.map((placeholder) => (
          <DropdownMenuItem
            key={placeholder}
            onSelect={() => onSelect(placeholder)}
            className='font-mono text-xs cursor-pointer'>
            {placeholder}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
