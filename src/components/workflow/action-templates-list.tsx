'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { actionTemplates, type ActionTemplate } from '@/lib/action-templates';

type ActionTemplatesListProps = {
  onTemplateSelect: (template: ActionTemplate) => void;
};

export function ActionTemplatesList({ onTemplateSelect }: ActionTemplatesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return actionTemplates;

    const query = searchQuery.toLowerCase();
    return actionTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ActionTemplate[]>);

  // Define category order
  const categoryOrder: Array<'Tickets' | 'Users' | 'Organizations' | 'Custom Objects' | 'Generic'> = [
    'Tickets',
    'Users',
    'Organizations',
    'Custom Objects',
    'Generic',
  ];

  return (
    <div className='pt-4 space-y-6'>
      <Separator />

      <div className='space-y-4 pb-6'>
        <div className='text-center'>
          <h3 className='text-sm font-medium'>Or start from a template</h3>
          <p className='text-xs text-muted-foreground mt-1'>Quick start with pre-configured action templates</p>
        </div>

        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search templates...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='space-y-6'>
          {categoryOrder.map((category) => {
            const templates = groupedTemplates[category];
            if (!templates || templates.length === 0) return null;

            return (
              <div key={category} className='space-y-3 bg-slate-100 dark:bg-zinc-800 p-5 rounded-xl'>
                <h4 className='text-sm font-bold uppercase tracking-wider text-foreground'>{category}</h4>

                <div className='grid grid-cols-2 gap-3'>
                  {templates.map((template) => (
                    <Card key={template.id} className='p-4 hover:bg-accent/50 transition-colors'>
                      <div className='space-y-3'>
                        <div className='space-y-1'>
                          <h4 className='font-medium text-sm leading-none'>{template.name}</h4>
                          <p className='text-xs text-muted-foreground leading-snug'>{template.description}</p>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full'
                          onClick={() => onTemplateSelect(template)}>
                          <Plus className='h-3 w-3' />
                          Use Template
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
