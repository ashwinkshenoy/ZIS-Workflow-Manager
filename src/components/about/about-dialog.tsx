'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ZDClient from '@/lib/ZDClient';
import zisLogo from '@/images/zis_logo.png';

type AboutDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl p-0 border-0'>
        <Image src={zisLogo} alt='ZIS Logo' width={700} height={350} className='w-full h-auto rounded-t-lg' />
        <div className='px-6 pt-3 pb-6'>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
