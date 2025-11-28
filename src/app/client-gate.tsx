'use client';

import { useEffect, useState } from 'react';
import ZDClient from '@/lib/ZDClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export default function ClientGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showPopupPrompt, setShowPopupPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = await ZDClient.init();
        if (client) {
          ZDClient.events.ON_APP_REGISTERED((data: any) => {
            console.log('App registered:', data);
          });
        }
        const colorScheme = await ZDClient.get('colorScheme');
        ZDClient.setAppTheme(colorScheme);

        // Check if popup blocker might be active by testing window.open
        const popupDismissed = localStorage.getItem('popupPromptDismissed');
        if (!popupDismissed) {
          setShowPopupPrompt(true);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const testPopup = () => {
    const testWindow = window.open('https://google.com', '_blank');
    if (testWindow) {
      testWindow.close();
      setShowPopupPrompt(false);
      localStorage.setItem('popupPromptDismissed', 'true');
    } else {
      alert(
        'Popup blocker detected! Please allow popups for this site in your browser settings.\n\nThis app uses popups for OAuth authentication flows.'
      );
    }
  };

  const dismissPopupPrompt = () => {
    setShowPopupPrompt(false);
    localStorage.setItem('popupPromptDismissed', 'true');
  };

  if (!ready) {
    return <></>;
  }

  return (
    <>
      {showPopupPrompt && (
        <div className='fixed top-2 right-4 z-50 max-w-md'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ExternalLink className='h-5 w-5' />
                Enable Popup Windows
              </CardTitle>
              <CardDescription>
                This app requires popup windows for OAuth authentication flows. Please ensure popups are allowed in your
                browser site settings.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex gap-2'>
              <Button size='sm' onClick={testPopup}>
                Test & Enable
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {children}
    </>
  );
}
