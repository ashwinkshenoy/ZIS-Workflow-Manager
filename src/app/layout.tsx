import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { IntegrationProvider } from '@/context/integration-context';
import ClientGate from './client-gate';

export const metadata: Metadata = {
  title: 'ZIS Workflow Manager',
  description: 'A visual editor for ZIS workflows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='font-body antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <ClientGate>
            <IntegrationProvider>
              {children}
              <Toaster />
            </IntegrationProvider>
          </ClientGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
