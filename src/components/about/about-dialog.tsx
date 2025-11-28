'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ZDClient from '@/lib/ZDClient';

type AboutDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
          <DialogDescription>
            ZIS Workflow Manager
            <br />
            Developed by Zendesk Professional Services ❤️
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-4 py-4'>
          <div>
            <h3 className='text-sm font-semibold'>Credits</h3>
            <p className='text-sm mt-1 text-muted-foreground'>Ashwin Shenoy</p>
          </div>
          <div>
            <h3 className='text-sm font-semibold'>Version</h3>
            <p className='text-sm mt-1 text-muted-foreground'>v{(ZDClient?.app.metadata as any)?.version || ''}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
