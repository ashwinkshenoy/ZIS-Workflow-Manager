'use client';
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  const handleContinue = useCallback(() => {
    try {
      localStorage.setItem('onboarding', 'true');
    } catch (_) {
      // Ignore storage errors; still navigate
    }
    router.replace('/');
  }, [router]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Zap className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-2xl'>Welcome to ZIS Workflow Manager</CardTitle>
          <CardDescription>Build and manage your Zendesk Integration Services workflows with ease.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-muted-foreground text-center'>
            <p>
              This tool allows you to visually design, configure, and deploy your ZIS workflows directly from your
              browser.
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Button size='lg' className='w-full' onClick={handleContinue}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
