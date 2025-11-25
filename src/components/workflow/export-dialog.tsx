'use client';

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
import { Download } from 'lucide-react';

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
};

export function ExportDialog({ isOpen, onClose, workflow }: ExportDialogProps) {
  if (!workflow) {
    return null;
  }

  const jsonString = JSON.stringify(workflow, null, 2);

  const handleDownload = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${workflow.name || 'workflow'}.json`;
    link.click();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Export Workflow</DialogTitle>
          <DialogDescription>Review the workflow JSON below. Click export to download the file.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid w-full gap-1.5'>
            <Label htmlFor='json'>ZIS JSON</Label>
            <Textarea id='json' value={jsonString} readOnly className='min-h-[350px] max-h-[60vh] font-mono text-xs' />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button type='button' onClick={handleDownload}>
            <Download className='mr-2 h-4 w-4' />
            Export & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
