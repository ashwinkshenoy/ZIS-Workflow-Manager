'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ChevronLeft,
  Workflow,
  Settings,
  Zap,
  GitBranch,
  Play,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TourStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
};

type WorkflowTourProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

const tourSteps: TourStep[] = [
  {
    title: 'Create Workflow',
    icon: <Workflow className='h-6 w-6' />,
    description: 'Start by creating a new workflow for your integration',
    details: [
      'Give your workflow a unique name (use lowercase letters and underscores)',
      'Provide a clear description of what your workflow will do',
      'Define a Job Spec name that will be used to identify this workflow',
      'Configure the event source and type that will trigger this workflow',
    ],
  },
  {
    title: 'Select Integration',
    icon: <Zap className='h-6 w-6' />,
    description: 'Choose an existing integration or create a new one',
    details: [
      'Select from existing integrations in the top left dropdown',
      'Or create a new integration if none exist',
      'Integrations connect your workflow to external services',
      'You can reuse integrations across multiple workflows',
    ],
  },
  {
    title: 'Actions',
    icon: <SlidersHorizontal className='h-6 w-6' />,
    description: 'Define actions that interact with APIs',
    details: [
      'Actions are reusable HTTP calls to external APIs',
      'Configure request methods, URLs, headers, and body',
      'Use placeholders to reference dynamic data from previous steps',
      'Actions can be shared across different workflow states',
    ],
  },
  {
    title: 'Build Workflow States',
    icon: <GitBranch className='h-6 w-6' />,
    description: 'Design your workflow logic with states',
    details: [
      'Add Task states to execute actions',
      'Use Choice states for conditional branching',
      'Pass states to transform and prepare data',
      'Connect states with transitions to define the flow',
    ],
  },
  {
    title: 'Configuration',
    icon: <Settings className='h-6 w-6' />,
    description: 'Add configurations to your workflow',
    details: [
      'Define key-value pairs for reusable settings (Similar to App settings)',
      'Use configurations to manage API keys, URLs, and other constants',
      'Easily update configurations without changing the workflow logic',
      'Configurations help keep your workflows organized and maintainable',
    ],
  },
];

export function WorkflowTour({ isOpen, onClose, onComplete }: WorkflowTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('zd_workflow_tour_completed', 'true');
    } catch (_) {
      // Ignore storage errors
    }
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>{step.icon}</div>
            <div className='flex-1'>
              <DialogTitle className='text-2xl'>{step.title}</DialogTitle>
              <DialogDescription className='text-sm text-muted-foreground'>
                Step {currentStep + 1} of {tourSteps.length}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <p className='text-base font-medium'>{step.description}</p>

          <div className='space-y-3'>
            {step.details.map((detail, index) => (
              <div key={index} className='flex items-start gap-3'>
                <CheckCircle2 className='h-5 w-5 mt-0.5 text-primary flex-shrink-0' />
                <p className='text-sm text-muted-foreground'>{detail}</p>
              </div>
            ))}
          </div>

          {/* Progress indicators */}
          <div className='flex gap-2 pt-4'>
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all',
                  index === currentStep ? 'bg-primary' : index < currentStep ? 'bg-primary/50' : 'bg-muted',
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className='flex-row !justify-between gap-2'>
          <div className='flex gap-2'>
            <Button variant='ghost' onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleBack}
              disabled={isFirstStep}
              className={cn(isFirstStep && 'invisible')}>
              <ChevronLeft className='h-4 w-4' />
              Back
            </Button>
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  Get Started
                  <CheckCircle2 className='h-4 w-4' />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className='h-4 w-4' />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
