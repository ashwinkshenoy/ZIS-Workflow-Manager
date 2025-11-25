'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Workflow } from '@/lib/types';
import { importWorkflowFromJsonStringAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type ImportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (workflow: Workflow) => void;
};

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [json, setJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsLoading(true);
    try {
      if (!json) {
        toast({
          variant: 'destructive',
          title: 'JSON is required',
          description: 'Please paste a valid workflow JSON definition.',
        });
        setIsLoading(false);
        return;
      }
      const importedWorkflow = await importWorkflowFromJsonStringAction(json);
      onImport(importedWorkflow);
      toast({
        title: 'Import Successful',
        description: `Workflow "${importedWorkflow.name}" has been loaded.`,
      });
      onClose();
      setJson('');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleImport();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Import Workflow from JSON</DialogTitle>
          <DialogDescription>Paste the raw JSON of a workflow definition to load it onto the canvas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid w-full gap-1.5'>
              <Label htmlFor='json'>Workflow JSON</Label>
              <Textarea
                id='json'
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder='{ "name": "my-workflow", "resources": {...} }'
                className='min-h-[250px] font-mono text-xs'
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isLoading ? 'Importing...' : 'Import Workflow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
