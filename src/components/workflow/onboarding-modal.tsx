'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useIntegration } from '@/context/integration-context';

type OnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { setShowWorkflowTour } = useIntegration();

  const handleContinue = () => {
    try {
      localStorage.setItem('zd_onboarding', 'true');
    } catch (_) {
      // Ignore storage errors
    }
    onClose();

    // Show workflow tour after closing onboarding
    setTimeout(() => {
      setShowWorkflowTour(true);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md' hideCloseButton>
        <DialogHeader className='text-center space-y-3'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Zap className='h-6 w-6 text-primary' />
          </div>
          <DialogTitle className='text-2xl'>Welcome to ZIS Workflow Manager</DialogTitle>
        </DialogHeader>

        <div className='pb-4 text-sm text-muted-foreground'>
          <p className='mb-2'>Build and manage your Zendesk Integration Services workflows with ease.</p>
          <p className='mb-2'>
            This tool allows you to visually design, configure, and deploy your ZIS workflows directly from your
            browser.
          </p>
          <p>
            <u>
              <strong>Note</strong>
            </u>
            <br />
            Ensure you have enabled popups and redirections under site settings for this application to facilitate
            seamless OAuths, workflow testing and debugging.
          </p>
        </div>

        <DialogFooter className='sm:justify-center'>
          <Button size='lg' className='w-full' onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
